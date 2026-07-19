export type CrowdStatus = "comfortable" | "busy" | "critical";

export interface ZoneState {
  zoneId: string;
  label: string;
  occupancy: number;
  capacity: number;
}

export interface ZoneSnapshot extends ZoneState {
  occupancyRate: number;
  status: CrowdStatus;
}

export type IncidentSeverity = "low" | "medium" | "high";

export interface Incident {
  id: string;
  zoneId: string;
  description: string;
  severity: IncidentSeverity;
  reportedAt: string;
}

export interface SustainabilityMetrics {
  wasteDivertedKg: number;
  waterRefillsCount: number;
  co2SavedKg: number;
  energyRenewablePct: number;
}

export interface OperationsSnapshot {
  venueId: string;
  generatedAt: string;
  zones: ZoneSnapshot[];
  incidents: Incident[];
  sustainability: SustainabilityMetrics;
}
