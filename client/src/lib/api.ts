export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers }
  });

  if (!res.ok) {
    let body: ApiErrorBody = { code: "UNKNOWN_ERROR", message: "Something went wrong." };
    try {
      body = await res.json();
    } catch {
      // Response wasn't JSON (e.g. network-level failure) — keep the fallback body.
    }
    throw new ApiError(res.status, body);
  }

  return (await res.json()) as T;
}

export interface VenueSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
}

export interface AssistantAnswer {
  answer: string;
  language: string;
  venueId: string;
  groundedOnFacts: number;
}

export interface ZoneSnapshot {
  zoneId: string;
  label: string;
  occupancy: number;
  capacity: number;
  occupancyRate: number;
  status: "comfortable" | "busy" | "critical";
}

export interface Incident {
  id: string;
  zoneId: string;
  description: string;
  severity: "low" | "medium" | "high";
  reportedAt: string;
}

export interface OperationsSnapshot {
  venueId: string;
  generatedAt: string;
  zones: ZoneSnapshot[];
  incidents: Incident[];
  sustainability: {
    wasteDivertedKg: number;
    waterRefillsCount: number;
    co2SavedKg: number;
    energyRenewablePct: number;
  };
}

export interface Briefing {
  venueId: string;
  generatedAt: string;
  recommendations: string;
}

export interface DispatchBrief {
  priority: "low" | "medium" | "high";
  translatedMessage: string;
  suggestedAction: string;
}

export const api = {
  listVenues: () => request<{ venues: VenueSummary[] }>("/venues"),

  askAssistant: (payload: { venueId: string; question: string; language: string; accessibilityContext?: string | undefined }) =>
    request<AssistantAnswer>("/assistant/ask", { method: "POST", body: JSON.stringify(payload) }),

  getSnapshot: (venueId: string) => request<OperationsSnapshot>(`/operations/snapshot?venueId=${encodeURIComponent(venueId)}`),

  generateBriefing: (venueId: string) =>
    request<Briefing>(`/operations/briefing?venueId=${encodeURIComponent(venueId)}`, { method: "POST" }),

  dispatch: (payload: { venueId: string; reporterRole: string; zoneId: string; message: string; targetLanguage: string }) =>
    request<DispatchBrief>("/volunteer/dispatch", { method: "POST", body: JSON.stringify(payload) })
};
