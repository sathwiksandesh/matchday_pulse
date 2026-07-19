import { StatusMessage } from "../../components/StatusMessage";
import { useAssistant } from "./useAssistant";

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "ar", label: "العربية" }
];

const quickActions = [
  "Which gate serves my section?",
  "Where is the nearest accessible restroom?",
  "How do I get here by metro?",
  "What's the fastest way to the accessible parking?"
];

export function AssistantPage(): React.JSX.Element {
  const a = useAssistant();

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem", maxWidth: 760 }}>
      <p className="gate-sign__code">Gate 1 · Fans</p>
      <h1 className="gate-sign__title" style={{ fontSize: "2.4rem" }}>
        Matchday Assistant
      </h1>
      <p style={{ color: "var(--concrete)", marginBottom: "1.5rem" }}>
        Ask about gates, accessibility, transport or sustainability. Answers are grounded in the venue&apos;s own data —
        the assistant will say so if it doesn&apos;t know something, rather than guess.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void a.ask();
        }}
      >
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr", marginBottom: "1rem" }}>
          <label>
            <span style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Venue</span>
            <select
              value={a.venueId}
              onChange={(e) => a.setVenueId(e.target.value)}
              style={selectStyle}
            >
              {a.venues.length === 0 ? (
                <option value="azteca">Estadio Azteca</option>
              ) : (
                a.venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            <span style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Language</span>
            <select value={a.language} onChange={(e) => a.setLanguage(e.target.value)} style={selectStyle}>
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label htmlFor="accessibility-context" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
          Accessibility or mobility note (optional)
        </label>
        <input
          id="accessibility-context"
          type="text"
          placeholder="e.g. wheelchair, pram, low vision"
          value={a.accessibilityContext}
          onChange={(e) => a.setAccessibilityContext(e.target.value)}
          style={{ ...inputStyle, marginBottom: "1rem" }}
        />

        <label htmlFor="question" style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
          Your question
        </label>
        <textarea
          id="question"
          value={a.question}
          onChange={(e) => a.setQuestion(e.target.value)}
          rows={3}
          maxLength={400}
          style={{ ...inputStyle, marginBottom: "0.75rem", resize: "vertical" }}
          placeholder="e.g. Where is the nearest step-free restroom?"
        />

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {quickActions.map((qa) => (
            <button
              key={qa}
              type="button"
              onClick={() => {
                a.setQuestion(qa);
                void a.ask(qa);
              }}
              style={chipStyle}
            >
              {qa}
            </button>
          ))}
        </div>

        <button type="submit" disabled={a.loading || a.question.trim().length === 0} style={submitStyle}>
          {a.loading ? "Asking…" : "Ask"}
        </button>
      </form>

      <div style={{ marginTop: "1.5rem" }} aria-live="polite">
        {a.error && <StatusMessage tone="error">{a.error}</StatusMessage>}
        {a.answer && (
          <div
            className="gate-sign"
            lang={a.answer.language}
            dir="auto"
            style={{ marginTop: "0.5rem" }}
          >
            <span className="gate-sign__code">Answer · grounded on {a.answer.groundedOnFacts} venue facts</span>
            <p style={{ marginTop: "0.5rem", fontSize: "1.05rem" }}>{a.answer.answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem",
  background: "var(--pitch-night-raised)",
  color: "var(--floodlight)",
  border: "1px solid var(--chalk-line)",
  borderRadius: "var(--radius)"
};

const inputStyle: React.CSSProperties = { ...selectStyle };

const chipStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  padding: "0.4rem 0.7rem",
  borderRadius: "999px",
  border: "1px solid var(--chalk-line)",
  background: "transparent",
  color: "var(--floodlight)",
  cursor: "pointer"
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
