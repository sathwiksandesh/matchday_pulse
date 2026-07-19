import type { ResilientLlmClient } from "../../lib/llm/index.js";
import { buildBriefingPrompt } from "./prompt.js";
import { getTelemetryStore } from "./telemetry.js";
import type { OperationsSnapshot } from "./types.js";

export interface Briefing {
  venueId: string;
  generatedAt: string;
  recommendations: string;
}

export class OperationsService {
  constructor(private readonly llm: ResilientLlmClient) {}

  getSnapshot(venueId: string): OperationsSnapshot {
    const store = getTelemetryStore(venueId);
    store.step();
    return store.getSnapshot();
  }

  async generateBriefing(venueId: string): Promise<Briefing> {
    const snapshot = this.getSnapshot(venueId);
    const { system, prompt } = buildBriefingPrompt(snapshot);
    // Briefings are cached briefly per-venue-per-minute bucket so repeated
    // clicks don't re-bill while still reflecting genuinely new state.
    const cacheKey = `briefing:${venueId}:${Math.floor(Date.now() / 30_000)}`;
    const recommendations = await this.llm.generate({ system, prompt, maxOutputTokens: 350 }, cacheKey);
    return { venueId, generatedAt: snapshot.generatedAt, recommendations: recommendations.trim() };
  }
}
