import { describe, expect, it } from "vitest";
import { classifyOccupancy, CROWD_THRESHOLDS, toZoneSnapshot } from "../../features/operations/crowd.js";

describe("classifyOccupancy", () => {
  it("returns comfortable below the busy threshold", () => {
    expect(classifyOccupancy(0)).toBe("comfortable");
    expect(classifyOccupancy(CROWD_THRESHOLDS.busy - 0.01)).toBe("comfortable");
  });

  it("returns busy at and above the busy threshold, below critical", () => {
    expect(classifyOccupancy(CROWD_THRESHOLDS.busy)).toBe("busy");
    expect(classifyOccupancy(CROWD_THRESHOLDS.critical - 0.001)).toBe("busy");
  });

  it("returns critical at and above the critical threshold", () => {
    expect(classifyOccupancy(CROWD_THRESHOLDS.critical)).toBe("critical");
    expect(classifyOccupancy(1)).toBe("critical");
    expect(classifyOccupancy(1.2)).toBe("critical");
  });
});

describe("toZoneSnapshot", () => {
  it("computes occupancy rate and status from occupancy/capacity", () => {
    const snapshot = toZoneSnapshot({ zoneId: "z1", label: "Zone 1", occupancy: 950, capacity: 1000 });
    expect(snapshot.occupancyRate).toBeCloseTo(0.95);
    expect(snapshot.status).toBe("critical");
  });

  it("treats zero capacity as zero occupancy rate rather than dividing by zero", () => {
    const snapshot = toZoneSnapshot({ zoneId: "z2", label: "Zone 2", occupancy: 0, capacity: 0 });
    expect(snapshot.occupancyRate).toBe(0);
    expect(snapshot.status).toBe("comfortable");
    expect(Number.isFinite(snapshot.occupancyRate)).toBe(true);
  });
});
