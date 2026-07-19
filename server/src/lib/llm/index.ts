import { env } from "../../config/env.js";
import { AppError } from "../app-error.js";
import { logger } from "../logger.js";
import { TtlCache } from "../ttl-cache.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { GeminiProvider } from "./gemini-provider.js";
import { MockLlmProvider } from "./mock-provider.js";
import type { LlmProvider, LlmRequest } from "./provider.js";

export type { LlmProvider, LlmRequest } from "./provider.js";

function buildProvider(): LlmProvider {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return new GeminiProvider(env.GEMINI_API_KEY);
    case "anthropic":
      return new AnthropicProvider(env.ANTHROPIC_API_KEY);
    case "mock":
    default:
      return new MockLlmProvider();
  }
}

const cache = new TtlCache<string>(60_000);

/**
 * Wraps a provider with the cross-cutting policy every call needs: a short
 * cache keyed on the exact prompt (repeated fan questions shouldn't re-bill
 * or re-block), one retry on transient failure, and a sanitized upstream
 * error so provider outages surface as a clean 502 instead of a stack trace.
 */
export class ResilientLlmClient {
  constructor(private readonly provider: LlmProvider = buildProvider(), private readonly cacheStore = cache) {}

  get providerName(): string {
    return this.provider.name;
  }

  async generate(request: LlmRequest, cacheKey?: string): Promise<string> {
    if (cacheKey) {
      const cached = this.cacheStore.get(cacheKey);
      if (cached) return cached;
    }

    const attempt = async (): Promise<string> => this.provider.generate(request);

    let result: string;
    try {
      result = await attempt();
    } catch (firstError) {
      logger.warn({ err: firstError, provider: this.provider.name }, "LLM call failed, retrying once");
      try {
        result = await attempt();
      } catch (secondError) {
        logger.error({ err: secondError, provider: this.provider.name }, "LLM call failed after retry");
        throw AppError.upstream("The AI assistant is temporarily unavailable. Please try again shortly.");
      }
    }

    if (cacheKey) this.cacheStore.set(cacheKey, result);
    return result;
  }
}

export const llmClient = new ResilientLlmClient();
