import { describe, expect, it, vi } from "vitest";
import { TtlCache } from "../../lib/ttl-cache.js";

describe("TtlCache", () => {
  it("returns undefined for a missing key", () => {
    const cache = new TtlCache<string>(1000);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("stores and returns a value within the TTL window", () => {
    const cache = new TtlCache<string>(1000);
    cache.set("a", "value-a");
    expect(cache.get("a")).toBe("value-a");
  });

  it("expires a value after the TTL elapses", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1000);
    cache.set("a", "value-a");
    vi.advanceTimersByTime(1001);
    expect(cache.get("a")).toBeUndefined();
    vi.useRealTimers();
  });

  it("evicts the oldest entry once maxEntries is reached", () => {
    const cache = new TtlCache<number>(60_000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("clear() empties the cache", () => {
    const cache = new TtlCache<number>(60_000);
    cache.set("a", 1);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
