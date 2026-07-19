/**
 * A minimal in-memory TTL cache. Used to avoid re-billing and re-calling the
 * LLM provider for identical questions/briefings within a short window, and
 * to keep the demo responsive without a Redis dependency.
 *
 * Not shared across processes — acceptable for a single-instance deployment
 * of this scope; documented as a scaling follow-up in docs/ARCHITECTURE.md.
 */
export class TtlCache<V> {
  private readonly store = new Map<string, { value: V; expiresAt: number }>();

  constructor(private readonly ttlMs: number, private readonly maxEntries = 500) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.store.size >= this.maxEntries) {
      // Evict the oldest entry (Map preserves insertion order) rather than
      // growing unbounded — a cheap defense against cache-based memory
      // exhaustion from a flood of unique questions.
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  get size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}
