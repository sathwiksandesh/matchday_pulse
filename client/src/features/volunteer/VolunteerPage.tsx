import { useCallback, useState } from "react";
import { StatusMessage } from "../../components/StatusMessage";
import { api, ApiError, type DispatchBrief } from "../../lib/api";

const roles = ["volunteer", "steward", "medic", "transport_marshal"] as const;
const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" }
];

const priorityLabel: Record<DispatchBrief["priority"], string> = { low: "Low", medium: "Medium", high: "High" };

export function VolunteerPage(): React.JSX.Element {
  const [zoneId, setZoneId] = useState("z-east");
  const [reporterRole, setReporterRole] = useState<(typeof roles)[number]>("steward");
  const [message, setMessage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [brief, setBrief] = useState<DispatchBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.dispatch({ venueId: "azteca", reporterRole, zoneId, message: message.trim(), targetLanguage });
      setBrief(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "The dispatch copilot is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, [message, reporterRole, zoneId, targetLanguage, loading]);

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem", maxWidth: 760 }}>
      <p className="gate-sign__code">Gate 3 · Staff</p>
      <h1 className="gate-sign__title" style={{ fontSize: "2.4rem" }}>
        Volunteer Dispatch Copilot
      </h1>
      <p style={{ color: "var(--concrete)", marginBottom: "1.5rem" }}>
        Turn a short radio-style report into a translated, prioritized brief a dispatcher can act on. Priority is a
        suggestion for a human dispatcher, not an automated decision.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr 1fr", marginBottom: "1rem" }}>
          <label>
            <span style={labelStyle}>Your role</span>
            <select value={reporterRole} onChange={(e) => setReporterRole(e.target.value as typeof reporterRole)} style={selectStyle}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span style={labelStyle}>Zone</span>
            <input value={zoneId} onChange={(e) => setZoneId(e.target.value)} style={selectStyle} />
          </label>
          <label>
            <span style={labelStyle}>Translate to</span>
            <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} style={selectStyle}>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label htmlFor="dispatch-message" style={labelStyle}>
          Report
        </label>
        <textarea
          id="dispatch-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="e.g. Large queue building at east entry, need extra stewards"
          style={{ ...selectStyle, marginBottom: "1rem", resize: "vertical" }}
        />

        <button type="submit" disabled={loading || !message.trim()} style={submitStyle}>
          {loading ? "Triaging…" : "Send to dispatch"}
        </button>
      </form>

      <div style={{ marginTop: "1.5rem" }} aria-live="polite">
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
        {brief && (
          <div className="gate-sign">
            <span className={`status-tag status-tag--${brief.priority === "high" ? "critical" : brief.priority === "medium" ? "busy" : "comfortable"}`}>
              <span className="status-tag__dot" aria-hidden="true" />
              {priorityLabel[brief.priority]} priority
            </span>
            <p style={{ marginTop: "0.75rem" }}>
              <strong>Translated:</strong> {brief.translatedMessage}
            </p>
            <p>
              <strong>Suggested action:</strong> {brief.suggestedAction}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" };

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem",
  background: "var(--pitch-night-raised)",
  color: "var(--floodlight)",
  border: "1px solid var(--chalk-line)",
  borderRadius: "var(--radius)"
};

const submitStyle: React.CSSProperties = {
  padding: "0.7rem 1.4rem",
  background: "var(--turf)",
  color: "var(--pitch-night)",
  fontWeight: 700,
  border: "none",
  borderRadius: "var(--radius)",
  cursor: "pointer"
};
