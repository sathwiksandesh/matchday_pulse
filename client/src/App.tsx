import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./features/home/HomePage";

const AssistantPage = lazy(() => import("./features/assistant/AssistantPage").then((m) => ({ default: m.AssistantPage })));
const OperationsPage = lazy(() => import("./features/operations/OperationsPage").then((m) => ({ default: m.OperationsPage })));
const VolunteerPage = lazy(() => import("./features/volunteer/VolunteerPage").then((m) => ({ default: m.VolunteerPage })));

function RouteFallback(): React.JSX.Element {
  return (
    <div className="container" style={{ padding: "3rem 1.5rem" }} role="status" aria-live="polite">
      Loading…
    </div>
  );
}

export function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="operations" element={<OperationsPage />} />
            <Route path="volunteer" element={<VolunteerPage />} />
            <Route
              path="*"
              element={
                <div className="container" style={{ padding: "3rem 1.5rem" }}>
                  <h1 className="gate-sign__title">Page not found</h1>
                  <p>That gate doesn&apos;t exist. Head back to the concourse.</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
