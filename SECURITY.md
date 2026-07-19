# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to **security@matchday-pulse.example**
(also published at `/.well-known/security.txt`, RFC 9116) rather than opening
a public issue. Include steps to reproduce and the impact you'd expect. We
aim to acknowledge reports within 3 business days.

## Threat model

MatchDay Pulse is a public, unauthenticated kiosk-style application: the fan
assistant and volunteer copilot are read/write against our own systems only
(never against a fan's personal data), and the operations board is read-only
telemetry. Given that, the priorities are:

1. **The app must never be tricked into leaking internal state.** All errors
   go through one handler that returns `{ code, message }` only — no stack
   traces, no upstream provider payloads, no file paths (`middleware/error-handler.ts`).
2. **Untrusted input must never reach the LLM provider unvalidated, and
   LLM output must never reach the client unvalidated.** Every request body
   is parsed by a `.strict()` zod schema (unknown keys rejected) before any
   handler runs. The one place we ask the model for structured JSON (the
   volunteer dispatch copilot), the response is parsed defensively and
   re-validated against a schema before it's returned — a malformed or
   unexpected model response fails closed with a 502, never forwarded
   as-is (`features/volunteer/service.ts`).
3. **No secret ever reaches the client or the repo.** `GEMINI_API_KEY` /
   `ANTHROPIC_API_KEY` are read from environment variables only, are never
   logged, and the client never calls the LLM provider directly — it only
   talks to our own `/api` routes.
4. **Abuse of the paid AI endpoints must be bounded.** `POST /api/assistant/ask`,
   `POST /api/operations/briefing` and `POST /api/volunteer/dispatch` sit
   behind a stricter rate limit than the rest of the API, and repeated
   identical requests are served from a short-lived cache instead of
   re-billing the provider (`lib/llm/index.ts`).
5. **A misconfigured deployment should fail to start, not start unsafely.**
   All environment variables are validated by zod at boot; selecting a real
   LLM provider without its key throws before the server binds a port
   (`config/env.ts`).

## Controls in place

- **Secrets**: environment variables only; `.env` is gitignored; `.env.example`
  documents every variable without real values.
- **Input validation**: strict zod schemas at every HTTP boundary; unknown
  keys rejected; string length caps on every free-text field.
- **HTTP hardening**: Helmet with a restrictive Content-Security-Policy
  (`default-src 'self'`, no inline scripts), an explicit CORS origin, and a
  100 kB JSON body limit.
- **Rate limiting**: a general limiter on the whole API and a stricter one on
  the three LLM-backed routes.
- **Error hygiene**: a single error-handling middleware sanitizes every
  response body; full detail is logged server-side only via structured
  (Pino) logs.
- **Output handling**: LLM output is treated as untrusted text. The
  assistant's free-text answer is rendered as plain text (React escapes it
  by default — never `dangerouslySetInnerHTML`); the dispatch copilot's
  JSON output is schema-validated before use.
- **Supply chain**: `npm audit --omit=dev --audit-level=high` runs in CI on
  every push; Dependabot opens grouped weekly update PRs; the lockfile is
  committed.
- **Static analysis**: GitHub CodeQL scans on every push and pull request.
- **Least privilege**: CI workflows request only `contents: read` (plus
  `security-events: write` for CodeQL's own analyze step).
- **Coordinated disclosure**: `/.well-known/security.txt` per RFC 9116.

## Known limitations (by design, for this scope)

- No authentication: both surfaces are anonymous, read-mostly kiosks. A
  production deployment would put the operations board behind staff SSO.
- Telemetry is simulated in-memory, not a real turnstile/IoT feed — see
  `docs/ARCHITECTURE.md`.
- Rate limiting is per-process (in-memory), not shared across horizontally
  scaled instances; acceptable at this scope, documented as a scaling
  follow-up.
