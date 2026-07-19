import { logger } from "../logger.js";
import { LlmTimeoutError, type LlmProvider, type LlmRequest } from "./provider.js";

const DEFAULT_TIMEOUT_MS = 8_000;
const MODEL = "claude-sonnet-4-6";

/**
 * Thin adapter over `@anthropic-ai/sdk`, lazily imported so `mock`-only
 * deployments never need the dependency or a key.
 */
export class AnthropicProvider implements LlmProvider {
  readonly name = "anthropic";

  constructor(private readonly apiKey: string, private readonly timeoutMs = DEFAULT_TIMEOUT_MS) {}

  async generate(request: LlmRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: this.apiKey });
      const response = await client.messages.create(
        {
          model: MODEL,
          max_tokens: request.maxOutputTokens ?? 600,
          system: request.system,
          messages: [{ role: "user", content: request.prompt }]
        },
        { signal: controller.signal }
      );
      const block = response.content.find((c: { type: string; text?: string }) => c.type === "text");
      if (!block || block.type !== "text" || !block.text) {
        throw new Error("Empty response from Anthropic");
      }
      return block.text;
    } catch (error) {
      if (controller.signal.aborted) throw new LlmTimeoutError(this.name, this.timeoutMs);
      logger.error({ err: error }, "Anthropic provider call failed");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
