import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantPage } from "../src/features/assistant/AssistantPage";
import * as apiModule from "../src/lib/api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AssistantPage", () => {
  it("submits a typed question and renders the grounded answer", async () => {
    vi.spyOn(apiModule.api, "listVenues").mockResolvedValue({
      venues: [{ id: "azteca", name: "Estadio Azteca", city: "Mexico City", country: "Mexico", capacity: 87523 }]
    });
    vi.spyOn(apiModule.api, "askAssistant").mockResolvedValue({
      answer: "Gate 4 serves section 205, step-free.",
      language: "en",
      venueId: "azteca",
      groundedOnFacts: 12
    });

    render(<AssistantPage />);
    const user = userEvent.setup();

    const textarea = await screen.findByLabelText(/your question/i);
    await user.type(textarea, "Which gate serves section 205?");
    await user.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => expect(screen.getByText(/gate 4 serves section 205/i)).toBeInTheDocument());
    expect(apiModule.api.askAssistant).toHaveBeenCalledWith(
      expect.objectContaining({ venueId: "azteca", question: "Which gate serves section 205?" })
    );
  });

  it("submits via a quick-action chip without requiring manual typing", async () => {
    vi.spyOn(apiModule.api, "listVenues").mockResolvedValue({ venues: [] });
    vi.spyOn(apiModule.api, "askAssistant").mockResolvedValue({
      answer: "Nearest accessible restroom is by Gate 6.",
      language: "en",
      venueId: "azteca",
      groundedOnFacts: 5
    });

    render(<AssistantPage />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /nearest accessible restroom/i }));

    await waitFor(() => expect(screen.getByText(/nearest accessible restroom is by gate 6/i)).toBeInTheDocument());
  });

  it("passes accessibilityContext through when provided", async () => {
    vi.spyOn(apiModule.api, "listVenues").mockResolvedValue({ venues: [] });
    const askSpy = vi.spyOn(apiModule.api, "askAssistant").mockResolvedValue({
      answer: "Use the step-free route via Gate 6.",
      language: "en",
      venueId: "azteca",
      groundedOnFacts: 3
    });

    render(<AssistantPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/accessibility or mobility note/i), "wheelchair");
    await user.type(screen.getByLabelText(/your question/i), "How do I reach my seat?");
    await user.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => expect(askSpy).toHaveBeenCalledWith(expect.objectContaining({ accessibilityContext: "wheelchair" })));
  });

  it("renders a sanitized error state when the request fails", async () => {
    vi.spyOn(apiModule.api, "listVenues").mockResolvedValue({ venues: [] });
    vi.spyOn(apiModule.api, "askAssistant").mockRejectedValue(
      new apiModule.ApiError(502, { code: "UPSTREAM_ERROR", message: "The AI assistant is temporarily unavailable." })
    );

    render(<AssistantPage />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/your question/i), "hello");
    await user.click(screen.getByRole("button", { name: /^ask$/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/temporarily unavailable/i));
  });
});
