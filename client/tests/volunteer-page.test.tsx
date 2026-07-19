import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VolunteerPage } from "../src/features/volunteer/VolunteerPage";
import * as apiModule from "../src/lib/api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("VolunteerPage", () => {
  it("submits a report and renders the structured dispatch brief", async () => {
    const dispatchSpy = vi.spyOn(apiModule.api, "dispatch").mockResolvedValue({
      priority: "high",
      translatedMessage: "Medical assistance needed at the east gate.",
      suggestedAction: "Dispatch the nearest medic immediately."
    });

    render(<VolunteerPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/report/i), "medical emergency at east gate");
    await user.click(screen.getByRole("button", { name: /send to dispatch/i }));

    await waitFor(() => expect(screen.getByText(/high priority/i)).toBeInTheDocument());
    expect(screen.getByText(/dispatch the nearest medic immediately/i)).toBeInTheDocument();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ reporterRole: "steward" }));
  });

  it("renders a sanitized error state on failure", async () => {
    vi.spyOn(apiModule.api, "dispatch").mockRejectedValue(new apiModule.ApiError(429, { code: "RATE_LIMITED", message: "Too many AI requests." }));
    render(<VolunteerPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/report/i), "test message");
    await user.click(screen.getByRole("button", { name: /send to dispatch/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/too many ai requests/i));
  });

  it("disables the submit button while an empty report is present", () => {
    render(<VolunteerPage />);
    expect(screen.getByRole("button", { name: /send to dispatch/i })).toBeDisabled();
  });
});
