import type { OperationsSnapshot } from "./types.js";

/**
 * Turns an already-classified snapshot into a grounded prompt. The model
 * never classifies crowd risk itself (see crowd.ts) — it only prioritizes
 * and phrases recommendations for the state it's handed, which keeps the
 * safety-relevant decision auditable and outside the LLM's control.
 */
export function buildBriefingPrompt(snapshot: OperationsSnapshot): { system: string; prompt: string } {
  const system = [
    "You are an operations briefing assistant for a FIFA World Cup 2026 stadium command center.",
    "You are given an already-computed live snapshot: zone crowd status, open incidents, and sustainability metrics.",
    "Do not reclassify or second-guess the zone status values — treat them as ground truth.",
    "Return a short prioritized action list (max 5 bullet points) ordered by urgency: critical zones and high-severity incidents first, then sustainability notes.",
    "Be concrete: name the zone or incident and the recommended action. No preamble, no disclaimers."
  ].join(" ");

  const zoneLines = snapshot.zones
    .map((z) => `Zone ${z.label}: ${Math.round(z.occupancyRate * 100)}% occupancy, status=${z.status}.`)
    .join("\n");
  const incidentLines = snapshot.incidents.length
    ? snapshot.incidents.map((i) => `Incident ${i.id} (${i.severity}) in ${i.zoneId}: ${i.description}.`).join("\n")
    : "No open incidents.";
  const sustainabilityLine = `Sustainability: ${snapshot.sustainability.wasteDivertedKg}kg waste diverted, ${snapshot.sustainability.waterRefillsCount} refill-station uses, ${snapshot.sustainability.energyRenewablePct}% renewable energy.`;

  const prompt = `LIVE SNAPSHOT (${snapshot.generatedAt}):\n${zoneLines}\n${incidentLines}\n${sustainabilityLine}`;

  return { system, prompt };
}
