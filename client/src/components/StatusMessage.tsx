interface StatusMessageProps {
  tone: "info" | "error";
  children: React.ReactNode;
}

/**
 * A single, consistent way to surface loading/error/success text with an
 * `aria-live` region, so screen reader users hear updates (a new answer, a
 * failed request) without needing to re-navigate to the content.
 */
export function StatusMessage({ tone, children }: StatusMessageProps): React.JSX.Element {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      style={{
        color: tone === "error" ? "var(--alert-red)" : "var(--concrete)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.9rem"
      }}
    >
      {children}
    </p>
  );
}
