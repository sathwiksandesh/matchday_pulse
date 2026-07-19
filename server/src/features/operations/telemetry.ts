import type { Incident, OperationsSnapshot, SustainabilityMetrics, ZoneState } from "./types.js";
import { toZoneSnapshot } from "./crowd.js";

/**
 * Deterministic, seeded pseudo-random telemetry generator. Stands in for a
 * real turnstile/IoT feed (see docs/ARCHITECTURE.md, "Assumptions") with an
 * in-memory store rather than a managed database — sufficient for a
 * single-instance deployment of this scope and avoids an unnecessary cloud
 * dependency. The read path (`getSnapshot`) is what a real feed would also
 * be read through, so swapping the source later doesn't touch callers.
 */
export class TelemetryStore {
  private zones: ZoneState[];
  private incidents: Incident[] = [];
  private sustainability: SustainabilityMetrics;
  private tick = 0;
  private seed: number;

  constructor(private readonly venueId: string, seed = 42) {
    this.seed = seed;
    this.zones = [
      { zoneId: "z-north", label: "North Concourse", occupancy: 3200, capacity: 4000 },
      { zoneId: "z-south", label: "South Concourse", occupancy: 2100, capacity: 4000 },
      { zoneId: "z-east", label: "East Stand Entry", occupancy: 3800, capacity: 4000 },
      { zoneId: "z-west", label: "West Stand Entry", occupancy: 1500, capacity: 4000 }
    ];
    this.sustainability = { wasteDivertedKg: 420, waterRefillsCount: 5600, co2SavedKg: 890, energyRenewablePct: 62 };
  }

  /** Linear-congruential PRNG so telemetry evolution is reproducible in tests. */
  private nextRandom(): number {
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }

  /** Advances simulated time by one step, nudging occupancy and metrics. */
  step(): void {
    this.tick += 1;
    this.zones = this.zones.map((zone) => {
      const drift = Math.floor((this.nextRandom() - 0.4) * 180);
      const occupancy = Math.min(zone.capacity, Math.max(0, zone.occupancy + drift));
      return { ...zone, occupancy };
    });

    this.sustainability = {
      wasteDivertedKg: this.sustainability.wasteDivertedKg + Math.floor(this.nextRandom() * 6),
      waterRefillsCount: this.sustainability.waterRefillsCount + Math.floor(this.nextRandom() * 40),
      co2SavedKg: this.sustainability.co2SavedKg + Math.floor(this.nextRandom() * 4),
      energyRenewablePct: Math.min(100, Math.round(this.sustainability.energyRenewablePct + (this.nextRandom() - 0.5)))
    };

    const criticalZone = this.zones.find((z) => z.occupancy / z.capacity >= 0.92);
    if (criticalZone && this.tick % 5 === 0) {
      this.incidents.push({
        id: `inc-${this.tick}`,
        zoneId: criticalZone.zoneId,
        description: `Queue buildup reported near ${criticalZone.label}`,
        severity: "medium",
        reportedAt: new Date().toISOString()
      });
    }
    // Keep the incident log bounded.
    this.incidents = this.incidents.slice(-10);
  }

  getSnapshot(): OperationsSnapshot {
    return {
      venueId: this.venueId,
      generatedAt: new Date().toISOString(),
      zones: this.zones.map(toZoneSnapshot),
      incidents: this.incidents,
      sustainability: this.sustainability
    };
  }
}

const stores = new Map<string, TelemetryStore>();

export function getTelemetryStore(venueId: string): TelemetryStore {
  let store = stores.get(venueId);
  if (!store) {
    store = new TelemetryStore(venueId);
    stores.set(venueId, store);
  }
  return store;
}
