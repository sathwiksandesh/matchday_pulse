import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperationsPage } from "../src/features/operations/OperationsPage";
import * as apiModule from "../src/lib/api";

const baseSnapshot: apiModule.OperationsSnapshot = {
  venueId: "azteca",
  generatedAt: new Date().toISOString(),
  zones: [
    { zoneId: "z-north", label: "North Concourse", occupancy: 3800, capacity: 4000, occupancyRate: 0.95, status: "critical" },
    { zoneId: "z-south", label: "South Concourse", occupancy: 1000, capacity: 4000, occupancyRate: 0.25, status: "comfortable" }
  ],
  incidents: [{ id: "inc-1", zoneId: "z-north", description: "Queue buildup near North Concourse", severity: "medium", reportedAt: new Date().toISOString() }],
  sustainability: { wasteDivertedKg: 420, waterRefillsCount: 5600, co2SavedKg: 890, energyRenewablePct: 62 }
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("OperationsPage", () => {
  it("renders zone density with accessible meters and status text", async () => {
    vi.spyOn(apiModule.api, "getSnapshot").mockResolvedValue(baseSnapshot);
    render(<OperationsPage />);

    await waitFor(() => expect(screen.getByText("North Concourse")).toBeInTheDocument());
    expect(screen.getByText(/critical · 95%/i)).toBeInTheDocument();
    const meters = document.querySelectorAll("meter");
    expect(meters.length).toBe(2);
  });

  it("shows the sanitized error state when the snapshot fails to load", async () => {
    vi.spyOn(apiModule.api, "getSnapshot").mockRejectedValue(new apiModule.ApiError(500, { code: "INTERNAL_ERROR", message: "Live snapshot unavailable." }));
    render(<OperationsPage />);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/live snapshot unavailable/i));
  });

  it("generates an AI briefing on demand and guards against double-submission", async () => {
    vi.spyOn(apiModule.api, "getSnapshot").mockResolvedValue(baseSnapshot);
    let resolveBriefing: (value: apiModule.Briefing) => void = () => {};
    const briefingSpy = vi.spyOn(apiModule.api, "generateBriefing").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBriefing = resolve;
        })
    );

    render(<OperationsPage />);
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getByText("North Concourse")).toBeInTheDocument());

    const button = screen.getByRole("button", { name: /generate ai briefing/i });
    // Fire both clicks while the first call is still in-flight (unresolved promise).
    await user.click(button);
    await user.click(button);
    expect(briefingSpy).toHaveBeenCalledTimes(1);

    resolveBriefing({ venueId: "azteca", generatedAt: new Date().toISOString(), recommendations: "1. Redirect fans away from North Concourse." });
    await waitFor(() => expect(screen.getByText(/redirect fans away/i)).toBeInTheDocument());
    expect(briefingSpy).toHaveBeenCalledTimes(1);
  });
});
