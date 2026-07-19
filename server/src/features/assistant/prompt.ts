import type { Venue } from "../venue/data.js";
import type { AssistantRequest } from "./schema.js";

const languageNames: Record<AssistantRequest["language"], string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  ar: "Arabic"
};

/**
 * Builds the grounded prompt sent to the LLM provider. The model is given
 * only the venue's own facts and told explicitly not to invent anything
 * outside them — wrong wayfinding at an 80,000+ seat venue is worse than no
 * answer. Accessibility framing is added only when the fan mentions it, and
 * is never assumed on their behalf.
 */
export function buildAssistantPrompt(venue: Venue, request: AssistantRequest): { system: string; prompt: string; factCount: number } {
  const facts = [
    `Venue: ${venue.name}, ${venue.city}, ${venue.country} (capacity ${venue.capacity}).`,
    ...venue.gates.map((g) => `Gate ${g.label} serves sections ${g.servesSections.join(", ")}; step-free: ${g.stepFree ? "yes" : "no"}.`),
    ...venue.facilities.map((f) => `Facility "${f.label}" (${f.category}) is nearest ${f.nearestGate}; step-free: ${f.stepFree ? "yes" : "no"}.`),
    ...venue.transport.map((t) => `Transport option "${t.label}" (${t.mode}): ${t.details} Accessible: ${t.accessible ? "yes" : "no"}.`),
    ...venue.sustainabilityNotes.map((n) => `Sustainability: ${n}.`)
  ];

  const system = [
    "You are the official matchday assistant for a FIFA World Cup 2026 host stadium.",
    "Answer ONLY using the facts listed under VENUE FACTS. If the answer is not in those facts, say you don't have that information and suggest asking a steward — never invent a gate, route, or time.",
    `Respond in ${languageNames[request.language]} only.`,
    "Keep answers under 80 words, concrete and actionable.",
    request.accessibilityContext
      ? `The fan has indicated a mobility/accessibility need: "${request.accessibilityContext}". Prioritize step-free routes and accessible facilities/transport in your answer.`
      : "Do not assume any accessibility need unless the fan states one."
  ].join(" ");

  const prompt = `VENUE FACTS:\n${facts.join("\n")}\n\nFAN QUESTION: ${request.question}`;

  return { system, prompt, factCount: facts.length };
}
