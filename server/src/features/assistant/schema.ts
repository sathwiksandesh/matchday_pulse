import { z } from "zod";

export const supportedLanguages = ["en", "es", "fr", "pt", "ar"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const assistantRequestSchema = z
  .object({
    venueId: z.string().min(1).max(64),
    question: z.string().min(1).max(400),
    language: z.enum(supportedLanguages).default("en"),
    /** Free-text mobility/accessibility note, e.g. "wheelchair", "pram". Optional, never assumed. */
    accessibilityContext: z.string().max(120).optional()
  })
  .strict();

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export interface AssistantResponse {
  answer: string;
  language: SupportedLanguage;
  venueId: string;
  groundedOnFacts: number;
}
