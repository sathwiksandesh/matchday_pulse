import { describe, expect, it } from "vitest";
import { buildAssistantPrompt } from "../../features/assistant/prompt.js";
import { venues } from "../../features/venue/data.js";

const azteca = venues.find((v) => v.id === "azteca")!;

describe("buildAssistantPrompt", () => {
  it("includes every gate, facility and transport fact for the venue", () => {
    const { prompt, factCount } = buildAssistantPrompt(azteca, {
      venueId: "azteca",
      question: "Where is the nearest accessible restroom?",
      language: "en"
    });
    expect(factCount).toBeGreaterThan(azteca.gates.length);
    expect(prompt).toContain("Gate 1 (North)");
    expect(prompt).toContain(azteca.sustainabilityNotes[0]);
  });

  it("adds an accessibility instruction only when accessibilityContext is present", () => {
    const withContext = buildAssistantPrompt(azteca, {
      venueId: "azteca",
      question: "How do I get to my seat?",
      language: "en",
      accessibilityContext: "wheelchair"
    });
    const withoutContext = buildAssistantPrompt(azteca, {
      venueId: "azteca",
      question: "How do I get to my seat?",
      language: "en"
    });
    expect(withContext.system).toContain("wheelchair");
    expect(withoutContext.system).not.toContain("wheelchair");
    expect(withoutContext.system).toContain("Do not assume any accessibility need");
  });

  it("instructs the model to respond in the requested language", () => {
    const { system } = buildAssistantPrompt(azteca, { venueId: "azteca", question: "hola", language: "es" });
    expect(system).toContain("Spanish");
  });

  it("never allows the model to answer outside the supplied facts", () => {
    const { system } = buildAssistantPrompt(azteca, { venueId: "azteca", question: "x", language: "en" });
    expect(system).toMatch(/ONLY using the facts/);
  });
});
