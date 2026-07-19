import type { DispatchRequest } from "./schema.js";

const languageNames: Record<DispatchRequest["targetLanguage"], string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  ar: "Arabic"
};

/**
 * Structured-output prompt: the model must return strict JSON matching
 * `DispatchBrief` so the client can render it without free-form parsing.
 * Priority triage stays a model suggestion, not a safety classification —
 * unlike crowd status, there's no deterministic ground truth for "how
 * urgent is this radio message", so it's appropriate for the LLM to
 * propose it, with a human dispatcher always in the loop.
 */
export function buildDispatchPrompt(request: DispatchRequest): { system: string; prompt: string } {
  const system = [
    "You triage short radio-style reports from stadium volunteers and staff during a match.",
    `Translate the message into ${languageNames[request.targetLanguage]}, preserving all specific details (numbers, locations, names of facilities).`,
    "Assess priority as low, medium, or high based on urgency and safety risk implied by the message alone.",
    "Suggest one concrete next action for a dispatcher.",
    'Respond ONLY with strict JSON: {"priority": "low"|"medium"|"high", "translatedMessage": string, "suggestedAction": string}. No markdown, no commentary.'
  ].join(" ");

  const prompt = `Reporter role: ${request.reporterRole}\nZone: ${request.zoneId}\nMessage: ${request.message}`;

  return { system, prompt };
}
