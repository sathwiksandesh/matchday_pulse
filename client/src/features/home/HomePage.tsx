import { Link } from "react-router-dom";

const gates = [
  {
    to: "/assistant",
    code: "GATE 1 · FANS",
    title: "Matchday Assistant",
    desc: "Grounded wayfinding, accessibility routes, transport and sustainability answers in five languages."
  },
  {
    to: "/operations",
    code: "GATE 2 · CONTROL ROOM",
    title: "Operations Command",
    desc: "Live crowd density, incidents and sustainability metrics, with an on-demand AI briefing."
  },
  {
    to: "/volunteer",
    code: "GATE 3 · STAFF",
    title: "Volunteer Copilot",
    desc: "Turn a short radio report into a translated, prioritized dispatch brief for the duty team."
  }
];

export function HomePage(): React.JSX.Element {
  return (
    <div className="container" style={{ padding: "3rem 1.5rem" }}>
      <p className="gate-sign__code" style={{ fontSize: "0.9rem" }}>
        FIFA World Cup 2026 · Multi-venue
      </p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          textTransform: "uppercase",
          fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
          lineHeight: 0.95,
          margin: "0.4rem 0 1rem",
          maxWidth: "14ch"
        }}
      >
        Find your gate.
      </h1>
      <p style={{ color: "var(--concrete)", maxWidth: "60ch", fontSize: "1.05rem", marginBottom: "2.5rem" }}>
        Three copilots, one platform: a grounded assistant for fans, a live command center for organizers and venue
        staff, and a dispatch copilot for volunteers coordinating across languages on matchday.
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {gates.map((gate) => (
          <li key={gate.to}>
            <Link to={gate.to} className="gate-sign">
              <span className="gate-sign__code">{gate.code}</span>
              <h2 className="gate-sign__title">{gate.title}</h2>
              <p className="gate-sign__desc">{gate.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
