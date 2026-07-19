import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type AssistantAnswer, type VenueSummary } from "../../lib/api";

export interface UseAssistantResult {
  venues: VenueSummary[];
  venueId: string;
  setVenueId: (id: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  accessibilityContext: string;
  setAccessibilityContext: (v: string) => void;
  question: string;
  setQuestion: (q: string) => void;
  answer: AssistantAnswer | null;
  loading: boolean;
  error: string | null;
  ask: (question?: string) => Promise<void>;
}

export function useAssistant(): UseAssistantResult {
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [venueId, setVenueId] = useState("azteca");
  const [language, setLanguage] = useState("en");
  const [accessibilityContext, setAccessibilityContext] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listVenues()
      .then((res) => setVenues(res.venues))
      .catch(() => setError("Could not load the venue list. Some features may be unavailable."));
  }, []);

  const ask = useCallback(
    async (overrideQuestion?: string) => {
      const finalQuestion = (overrideQuestion ?? question).trim();
      if (!finalQuestion || loading) return; // guard against empty submits and double-requests
      setLoading(true);
      setError(null);
      try {
        const result = await api.askAssistant({
          venueId,
          question: finalQuestion,
          language,
          accessibilityContext: accessibilityContext.trim() || undefined
        });
        setAnswer(result);
      } catch (err) {
        setError(err instanceof ApiError ? err.body.message : "The assistant is unavailable right now. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [venueId, question, language, accessibilityContext, loading]
  );

  return {
    venues,
    venueId,
    setVenueId,
    language,
    setLanguage,
    accessibilityContext,
    setAccessibilityContext,
    question,
    setQuestion,
    answer,
    loading,
    error,
    ask
  };
}
