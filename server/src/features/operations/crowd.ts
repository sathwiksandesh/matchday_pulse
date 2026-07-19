import type { CrowdStatus, ZoneSnapshot, ZoneState } from "./types.js";

/**
 * Safety-relevant classification stays in typed, unit-tested code — never
 * delegated to the LLM. The model only turns an already-computed status into
 * prioritized human-readable recommendations (see prompt.ts). This keeps the
 * thing that matters most (is a zone dangerously full?) testable,
 * deterministic, and reviewable without depending on model behavior.
 */
export const CROWD_THRESHOLDS = {
  busy: 0.75,
  critical: 0.92
} as const;

export function classifyOccupancy(rate: number): CrowdStatus {
  if (rate >= CROWD_THRESHOLDS.critical) return "critical";
  if (rate >= CROWD_THRESHOLDS.busy) return "busy";
  return "comfortable";
}

export function toZoneSnapshot(zone: ZoneState): ZoneSnapshot {
  const occupancyRate = zone.capacity > 0 ? zone.occupancy / zone.capacity : 0;
  return { ...zone, occupancyRate, status: classifyOccupancy(occupancyRate) };
}
