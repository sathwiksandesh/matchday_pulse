import { AppError } from "../../lib/app-error.js";
import type { ResilientLlmClient } from "../../lib/llm/index.js";
import { getVenue } from "../venue/data.js";
import { buildAssistantPrompt } from "./prompt.js";
import type { AssistantRequest, AssistantResponse } from "./schema.js";

export class AssistantService {
  constructor(private readonly llm: ResilientLlmClient) {}

  async ask(request: AssistantRequest): Promise<AssistantResponse> {
    const venue = getVenue(request.venueId);
    if (!venue) throw AppError.notFound(`Unknown venue: ${request.venueId}`);

    const { system, prompt, factCount } = buildAssistantPrompt(venue, request);
    const cacheKey = `assistant:${venue.id}:${request.language}:${request.accessibilityContext ?? ""}:${request.question.trim().toLowerCase()}`;

    const answer = await this.llm.generate({ system, prompt, maxOutputTokens: 300 }, cacheKey);

    return { answer: answer.trim(), language: request.language, venueId: venue.id, groundedOnFacts: factCount };
  }
}
