import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", code: "G0" },
  { to: "/assistant", label: "Fan Assistant", code: "G1" },
  { to: "/operations", label: "Operations", code: "G2" },
  { to: "/volunteer", label: "Volunteer Copilot", code: "G3" }
];

export function AppLayout(): React.JSX.Element {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header style={{ borderBottom: "2px solid var(--chalk-line)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem" }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", textTransform: "uppercase" }}>
            MatchDay Pulse
          </span>
          <nav aria-label="Primary">
            <ul style={{ display: "flex", gap: "1.25rem", listStyle: "none", margin: 0, padding: 0, flexWrap: "wrap" }}>
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    style={({ isActive }) => ({
                      textDecoration: "none",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      letterSpacing: "0.06em",
                      color: isActive ? "var(--turf)" : "var(--floodlight)"
                    })}
                  >
                    <span aria-hidden="true">{item.code} · </span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer style={{ borderTop: "2px solid var(--chalk-line)", marginTop: "3rem" }}>
        <div className="container" style={{ padding: "1.5rem", color: "var(--concrete)", fontSize: "0.85rem" }}>
          MatchDay Pulse — a GenAI copilot for FIFA World Cup 2026 stadium operations and fan experience. Built for
          evaluation; venue data is illustrative.
        </div>
      </footer>
    </>
  );
}
