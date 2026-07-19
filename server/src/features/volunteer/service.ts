import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import type { ResilientLlmClient } from "../../lib/llm/index.js";
import { buildDispatchPrompt } from "./prompt.js";
import type { DispatchBrief, DispatchRequest } from "./schema.js";

const briefSchema = z
  .object({
    priority: z.enum(["low", "medium", "high"]),
    translatedMessage: z.string().min(1).max(1000),
    suggestedAction: z.string().min(1).max(500)
  })
  .strict();

export class VolunteerCopilotService {
  constructor(private readonly llm: ResilientLlmClient) {}

  async triage(request: DispatchRequest): Promise<DispatchBrief> {
    const { system, prompt } = buildDispatchPrompt(request);
    const raw = await this.llm.generate({ system, prompt, maxOutputTokens: 300 });
    return parseBrief(raw);
  }
}

/**
 * The model is asked for strict JSON, but LLM output is never trusted
 * blindly: we strip common wrapping (code fences) and validate against a
 * zod schema. A malformed response fails closed with a clean 502 rather
 * than forwarding unvalidated model output — or worse, silently swallowing
 * a parse error — to the client.
 */
function parseBrief(raw: string): DispatchBrief {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let candidate: unknown;
  try {
    candidate = JSON.parse(cleaned);
  } catch {
    throw AppError.upstream("The dispatch copilot returned an unreadable response. Please retry.");
  }
  const parsed = briefSchema.safeParse(candidate);
  if (!parsed.success) {
    throw AppError.upstream("The dispatch copilot returned an invalid response. Please retry.");
  }
  return parsed.data;
}

export { parseBrief };
