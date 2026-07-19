import type { LlmProvider, LlmRequest } from "./provider.js";

/**
 * Deterministic, zero-cost, zero-network provider. This is the default
 * (`LLM_PROVIDER=mock`) so the app is fully demoable and testable without an
 * API key, and so CI never depends on an external, rate-limited network
 * call. It extracts the grounding facts already present in the prompt
 * instead of inventing anything, which mirrors the "answer only from
 * supplied context" instruction real providers are given.
 */
const URGENT_KEYWORDS = ["medical", "injury", "fire", "emergency", "collapse", "fight", "unconscious"];
const ELEVATED_KEYWORDS = ["queue", "crowd", "delay", "blocked", "lost child"];

export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";

  async generate(request: LlmRequest): Promise<string> {
    if (request.system.includes("strict JSON")) {
      return this.generateJsonBrief(request);
    }
    const summary = request.prompt
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, 3)
      .join(" ");
    return `[offline-mode summary] ${summary}`.slice(0, request.maxOutputTokens ?? 600);
  }

  /**
   * Structured-output requests (the volunteer dispatch copilot) need a
   * response that actually satisfies the caller's JSON schema, not a free
   * text summary. This keeps the mock provider usable for the full demo
   * flow, not just the free-text assistant, without a network call.
   */
  private generateJsonBrief(request: LlmRequest): string {
    const messageLine = request.prompt.split("\n").find((line) => line.startsWith("Message:"));
    const message = messageLine ? messageLine.replace("Message:", "").trim() : request.prompt;
    const lower = message.toLowerCase();

    const priority = URGENT_KEYWORDS.some((k) => lower.includes(k))
      ? "high"
      : ELEVATED_KEYWORDS.some((k) => lower.includes(k))
        ? "medium"
        : "low";

    const brief = {
      priority,
      translatedMessage: `[offline-mode translation] ${message}`,
      suggestedAction:
        priority === "high"
          ? "Dispatch the nearest medic/security team immediately and notify the duty manager."
          : priority === "medium"
            ? "Send an additional steward to the zone and monitor for escalation."
            : "Log the report; no immediate dispatch required."
    };
    return JSON.stringify(brief);
  }
}
