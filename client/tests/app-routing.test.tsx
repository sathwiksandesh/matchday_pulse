import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import * as apiModule from "../src/lib/api";

describe("App routing", () => {
  it("renders the home page at /", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /find your gate/i })).toBeInTheDocument();
  });

  it("lazily renders the assistant page at /assistant", async () => {
    vi.spyOn(apiModule.api, "listVenues").mockResolvedValue({ venues: [] });
    render(
      <MemoryRouter initialEntries={["/assistant"]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByRole("heading", { name: /matchday assistant/i })).toBeInTheDocument());
  });

  it("renders a not-found message for an unknown route", () => {
    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
