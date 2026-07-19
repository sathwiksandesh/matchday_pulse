import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZoneMeter } from "../../src/features/operations/ZoneMeter";

const baseZone = { zoneId: "z1", label: "North Concourse", occupancy: 900, capacity: 1000 };

describe("ZoneMeter", () => {
  it("renders a comfortable zone with the correct accessible label", () => {
    render(<ZoneMeter zone={{ ...baseZone, occupancy: 200, occupancyRate: 0.2, status: "comfortable" }} />);
    expect(screen.getByRole("meter", { name: /North Concourse occupancy: 20%, Comfortable/i })).toBeInTheDocument();
    expect(screen.getByText(/Comfortable/)).toBeInTheDocument();
  });

  it("renders a critical zone with text alongside color, not color alone", () => {
    render(<ZoneMeter zone={{ ...baseZone, occupancyRate: 0.9, status: "critical" }} />);
    expect(screen.getByText(/Critical/)).toBeInTheDocument();
  });

  it("shows the busy status label for a busy zone", () => {
    render(<ZoneMeter zone={{ ...baseZone, occupancyRate: 0.8, status: "busy" }} />);
    expect(screen.getByText(/Busy/)).toBeInTheDocument();
  });
});
