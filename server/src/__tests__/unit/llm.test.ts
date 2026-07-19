import { describe, expect, it, vi } from "vitest";
import { MockLlmProvider } from "../../lib/llm/mock-provider.js";
import { ResilientLlmClient } from "../../lib/llm/index.js";
import { AppError } from "../../lib/app-error.js";
import { TtlCache } from "../../lib/ttl-cache.js";
import type { LlmProvider } from "../../lib/llm/provider.js";

describe("MockLlmProvider", () => {
  it("returns a deterministic offline summary derived from the prompt", async () => {
    const provider = new MockLlmProvider();
    const result = await provider.generate({ system: "sys", prompt: "line one\nline two" });
    expect(result).toContain("line one");
    expect(result.startsWith("[offline-mode summary]")).toBe(true);
  });

  it("respects maxOutputTokens as a length cap", async () => {
    const provider = new MockLlmProvider();
    const result = await provider.generate({ system: "sys", prompt: "x".repeat(1000), maxOutputTokens: 20 });
    expect(result.length).toBeLessThanOrEqual(20);
  });
});

describe("ResilientLlmClient", () => {
  it("returns a cached value on the second call with the same cache key", async () => {
    const provider: LlmProvider = { name: "fake", generate: vi.fn().mockResolvedValue("answer") };
    const client = new ResilientLlmClient(provider, new TtlCache<string>(60_000));
    await client.generate({ system: "s", prompt: "p" }, "key-1");
    await client.generate({ system: "s", prompt: "p" }, "key-1");
    expect(provider.generate).toHaveBeenCalledTimes(1);
  });

  it("retries once on failure and succeeds if the retry works", async () => {
    const generate = vi.fn().mockRejectedValueOnce(new Error("flaky")).mockResolvedValueOnce("recovered");
    const provider: LlmProvider = { name: "fake", generate };
    const client = new ResilientLlmClient(provider);
    const result = await client.generate({ system: "s", prompt: "p" });
    expect(result).toBe("recovered");
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("throws a sanitized upstream AppError after two consecutive failures", async () => {
    const generate = vi.fn().mockRejectedValue(new Error("always fails"));
    const provider: LlmProvider = { name: "fake", generate };
    const client = new ResilientLlmClient(provider);
    await expect(client.generate({ system: "s", prompt: "p" })).rejects.toBeInstanceOf(AppError);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("does not use the cache when no cache key is given", async () => {
    const generate = vi.fn().mockResolvedValue("fresh");
    const provider: LlmProvider = { name: "fake", generate };
    const client = new ResilientLlmClient(provider);
    await client.generate({ system: "s", prompt: "p" });
    await client.generate({ system: "s", prompt: "p" });
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
