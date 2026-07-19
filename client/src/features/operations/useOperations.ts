import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type Briefing, type OperationsSnapshot } from "../../lib/api";

const POLL_INTERVAL_MS = 8000;

export interface UseOperationsResult {
  venueId: string;
  setVenueId: (id: string) => void;
  snapshot: OperationsSnapshot | null;
  snapshotError: string | null;
  briefing: Briefing | null;
  briefingLoading: boolean;
  briefingError: string | null;
  generateBriefing: () => Promise<void>;
}

export function useOperations(): UseOperationsResult {
  const [venueId, setVenueId] = useState("azteca");
  const [snapshot, setSnapshot] = useState<OperationsSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function poll(): Promise<void> {
      try {
        const result = await api.getSnapshot(venueId);
        if (!cancelled) {
          setSnapshot(result);
          setSnapshotError(null);
        }
      } catch (err) {
        if (!cancelled) setSnapshotError(err instanceof ApiError ? err.body.message : "Live snapshot unavailable.");
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [venueId]);

  const generateBriefing = useCallback(async () => {
    if (inFlight.current) return; // guard against double-clicks re-billing the LLM call
    inFlight.current = true;
    setBriefingLoading(true);
    setBriefingError(null);
    try {
      const result = await api.generateBriefing(venueId);
      setBriefing(result);
    } catch (err) {
      setBriefingError(err instanceof ApiError ? err.body.message : "Could not generate a briefing right now.");
    } finally {
      setBriefingLoading(false);
      inFlight.current = false;
    }
  }, [venueId]);

  return { venueId, setVenueId, snapshot, snapshotError, briefing, briefingLoading, briefingError, generateBriefing };
}
