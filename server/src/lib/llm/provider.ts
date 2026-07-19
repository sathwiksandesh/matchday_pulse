/**
 * Provider-agnostic contract for generative text calls. Every feature talks
 * to this interface, never to a vendor SDK directly — swapping or adding a
 * provider (Gemini, Anthropic, a future in-house model) never touches
 * feature code, and tests run against the deterministic mock provider
 * instead of a network call.
 */
export interface LlmProvider {
  readonly name: string;
  generate(request: LlmRequest): Promise<string>;
}

export interface LlmRequest {
  /** System-level grounding instructions the model must follow. */
  system: string;
  /** The user-facing question or payload to respond to. */
  prompt: string;
  /** Upper bound on generated tokens, kept small to bound cost and latency. */
  maxOutputTokens?: number;
  /** Abort signal so slow calls can be cancelled by the caller's timeout. */
  signal?: AbortSignal;
}

export class LlmTimeoutError extends Error {
  constructor(providerName: string, timeoutMs: number) {
    super(`${providerName} call exceeded ${timeoutMs}ms timeout`);
    this.name = "LlmTimeoutError";
  }
}
