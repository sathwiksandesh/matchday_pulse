import { StatusMessage } from "../../components/StatusMessage";
import { useOperations } from "./useOperations";
import { ZoneMeter } from "./ZoneMeter";

export function OperationsPage(): React.JSX.Element {
  const o = useOperations();

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      <p className="gate-sign__code">Gate 2 · Control Room</p>
      <h1 className="gate-sign__title" style={{ fontSize: "2.4rem" }}>
        Operations Command
      </h1>
      <p style={{ color: "var(--concrete)", marginBottom: "1.5rem" }}>
        Live zone density, open incidents and sustainability metrics, refreshed automatically. Crowd status is
        computed from occupancy thresholds in code — the AI only prioritizes and phrases the response.
      </p>

      {o.snapshotError && <StatusMessage tone="error">{o.snapshotError}</StatusMessage>}

      {o.snapshot && (
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1fr)" }}>
          <section aria-labelledby="zones-heading">
            <h2 id="zones-heading" style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "1.3rem" }}>
              Zone density
            </h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {o.snapshot.zones.map((zone) => (
                <ZoneMeter key={zone.zoneId} zone={zone} />
              ))}
            </ul>

            <h2 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "1.3rem" }}>Incidents</h2>
            {o.snapshot.incidents.length === 0 ? (
              <p style={{ color: "var(--concrete)" }}>No open incidents.</p>
            ) : (
              <ul>
                {o.snapshot.incidents.map((incident) => (
                  <li key={incident.id} style={{ marginBottom: "0.4rem" }}>
                    <span className={`status-tag status-tag--${incident.severity === "high" ? "critical" : incident.severity === "medium" ? "busy" : "comfortable"}`}>
                      <span className="status-tag__dot" aria-hidden="true" />
                      {incident.severity}
                    </span>{" "}
                    {incident.description}
                  </li>
                ))}
              </ul>
            )}

            <h2 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "1.3rem" }}>Sustainability</h2>
            <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontFamily: "var(--font-mono)" }}>
              <div>
                <dt style={{ color: "var(--concrete)", fontSize: "0.8rem" }}>Waste diverted</dt>
                <dd style={{ margin: 0 }}>{o.snapshot.sustainability.wasteDivertedKg} kg</dd>
              </div>
              <div>
                <dt style={{ color: "var(--concrete)", fontSize: "0.8rem" }}>Water refills</dt>
                <dd style={{ margin: 0 }}>{o.snapshot.sustainability.waterRefillsCount}</dd>
              </div>
              <div>
                <dt style={{ color: "var(--concrete)", fontSize: "0.8rem" }}>CO₂ saved</dt>
                <dd style={{ margin: 0 }}>{o.snapshot.sustainability.co2SavedKg} kg</dd>
              </div>
              <div>
                <dt style={{ color: "var(--concrete)", fontSize: "0.8rem" }}>Renewable energy</dt>
                <dd style={{ margin: 0 }}>{o.snapshot.sustainability.energyRenewablePct}%</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="briefing-heading">
            <h2 id="briefing-heading" style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "1.3rem" }}>
              AI operations briefing
            </h2>
            <button
              type="button"
              onClick={() => void o.generateBriefing()}
              disabled={o.briefingLoading}
              style={{
                padding: "0.65rem 1.2rem",
                background: "var(--signal-amber)",
                color: "var(--pitch-night)",
                fontWeight: 700,
                border: "none",
                borderRadius: "var(--radius)",
                cursor: "pointer",
                marginBottom: "1rem"
              }}
            >
              {o.briefingLoading ? "Generating…" : "Generate AI briefing"}
            </button>
            <div aria-live="polite">
              {o.briefingError && <StatusMessage tone="error">{o.briefingError}</StatusMessage>}
              {o.briefing && (
                <div className="gate-sign">
                  <span className="gate-sign__code">Recommendations</span>
                  <p style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{o.briefing.recommendations}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
