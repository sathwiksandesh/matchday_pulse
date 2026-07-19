import { z } from "zod";
import { supportedLanguages } from "../assistant/schema.js";

/**
 * Distinct from the fan assistant: this copilot serves volunteers and venue
 * staff. It turns a short, often informal radio-style report into a
 * structured task brief (priority, location, translated message) so a
 * multilingual volunteer workforce can coordinate without a shared language.
 */
export const dispatchRequestSchema = z
  .object({
    venueId: z.string().min(1).max(64),
    reporterRole: z.enum(["volunteer", "steward", "medic", "transport_marshal"]),
    zoneId: z.string().min(1).max(64),
    message: z.string().min(1).max(300),
    targetLanguage: z.enum(supportedLanguages).default("en")
  })
  .strict();

export type DispatchRequest = z.infer<typeof dispatchRequestSchema>;

export interface DispatchBrief {
  priority: "low" | "medium" | "high";
  translatedMessage: string;
  suggestedAction: string;
}
