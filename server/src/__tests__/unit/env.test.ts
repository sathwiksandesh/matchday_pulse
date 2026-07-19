import { describe, expect, it } from "vitest";
import { loadEnv } from "../../config/env.js";

describe("loadEnv", () => {
  it("applies defaults for a minimal valid environment", () => {
    const env = loadEnv({});
    expect(env.PORT).toBe(8080);
    expect(env.LLM_PROVIDER).toBe("mock");
    expect(env.NODE_ENV).toBe("development");
  });

  it("throws when LLM_PROVIDER=gemini is set without a key", () => {
    expect(() => loadEnv({ LLM_PROVIDER: "gemini" })).toThrow(/GEMINI_API_KEY/);
  });

  it("throws when LLM_PROVIDER=anthropic is set without a key", () => {
    expect(() => loadEnv({ LLM_PROVIDER: "anthropic" })).toThrow(/ANTHROPIC_API_KEY/);
  });

  it("accepts gemini provider when a key is present", () => {
    const env = loadEnv({ LLM_PROVIDER: "gemini", GEMINI_API_KEY: "test-key" });
    expect(env.LLM_PROVIDER).toBe("gemini");
  });

  it("rejects an invalid NODE_ENV value", () => {
    expect(() => loadEnv({ NODE_ENV: "staging" })).toThrow();
  });

  it("rejects a non-numeric PORT", () => {
    expect(() => loadEnv({ PORT: "not-a-number" })).toThrow();
  });
});
