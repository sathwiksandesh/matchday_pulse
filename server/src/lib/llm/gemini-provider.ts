import { logger } from "../logger.js";
import { LlmTimeoutError, type LlmProvider, type LlmRequest } from "./provider.js";

const DEFAULT_TIMEOUT_MS = 8_000;
const MODEL = "gemini-2.5-flash";

/**
 * Thin adapter over `@google/genai`. The SDK is imported lazily inside
 * `generate()` so that a `mock`-only deployment (including CI) never needs
 * the dependency installed or a key present.
 */
export class GeminiProvider implements LlmProvider {
  readonly name = "gemini";

  constructor(private readonly apiKey: string, private readonly timeoutMs = DEFAULT_TIMEOUT_MS) {}

  async generate(request: LlmRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey: this.apiKey });
      const response = await client.models.generateContent({
        model: MODEL,
        contents: request.prompt,
        config: {
          systemInstruction: request.system,
          maxOutputTokens: request.maxOutputTokens ?? 600,
          temperature: 0.3
        }
      });
      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    } catch (error) {
      if (controller.signal.aborted) throw new LlmTimeoutError(this.name, this.timeoutMs);
      logger.error({ err: error }, "Gemini provider call failed");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
