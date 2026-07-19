import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors in any subtree so one broken page (e.g. the
 * operations dashboard failing to render a malformed snapshot) never blanks
 * the whole app for a fan mid-match.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error", error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert" className="container" style={{ padding: "3rem 1.5rem" }}>
          <p className="gate-sign__code">Error</p>
          <h1 className="gate-sign__title">Something went wrong on this page</h1>
          <p style={{ color: "var(--concrete)" }}>Reload the page to try again. If this keeps happening, tell a steward.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
