import type { Express } from "express";
import helmet from "helmet";
import { env } from "../config/env.js";

/**
 * HTTP hardening: a restrictive CSP (no inline scripts, no remote origins
 * beyond self), standard Helmet protections, and an RFC 9116 security.txt
 * so a researcher has a documented, safe path for disclosure instead of
 * public issue-tracker posting.
 */
export function applySecurity(app: Express): void {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"]
        }
      },
      crossOriginResourcePolicy: { policy: "same-site" }
    })
  );

  app.get("/.well-known/security.txt", (_req, res) => {
    res
      .type("text/plain")
      .send(
        [
          "Contact: mailto:security@matchday-pulse.example",
          "Expires: 2027-01-01T00:00:00.000Z",
          "Preferred-Languages: en",
          `Canonical: https://matchday-pulse.example/.well-known/security.txt`
        ].join("\n")
      );
  });

  if (env.NODE_ENV === "production") {
    // Basic body-size protection is applied at the JSON parser instead of
    // here; kept as a single source of truth in app.ts.
  }
}
