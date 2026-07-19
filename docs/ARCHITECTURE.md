# Architecture

## Overview

MatchDay Pulse is a feature-folder monorepo (npm workspaces): a TypeScript/
Express API and a TypeScript/React client, deployable as two processes in
development or as a single container in production (`Dockerfile`).

```
matchday-pulse/
├── server/                     Node 22 · Express 4 · TypeScript (strict)
│   └── src/
│       ├── config/             zod-validated environment (fail-fast at boot)
│       ├── lib/                 logger · ttl-cache · app-error · llm/ (provider abstraction)
│       ├── middleware/          error-handler · validate(zod) · rate-limit · security · static-client
│       └── features/
│           ├── venue/           grounding dataset + facilities API
│           ├── assistant/       multilingual grounded Q&A
│           ├── operations/      live snapshot, telemetry sim, crowd classification, AI briefing
│           └── volunteer/       structured-output dispatch/triage copilot
├── client/                      React 19 · TypeScript · Vite
│   └── src/
│       ├── components/          AppLayout · ErrorBoundary · StatusMessage
│       ├── lib/api.ts           typed fetch client, one error envelope
│       └── features/
│           ├── home/            landing page ("find your gate")
│           ├── assistant/
│           ├── operations/
│           └── volunteer/
├── docs/                        this file + decisions.md
└── Dockerfile                   multi-stage build → one image, one process
```

## Request lifecycle

```
Fan / organizer / volunteer
        │  question / snapshot poll / dispatch report
        ▼
  React client (Vite, route-level code splitting)
        │  fetch /api/*
        ▼
  Express app (helmet, CORS, rate limits, zod validation)
        │
        ├─ venue/assistant/operations/volunteer route
        │        │
        │        ▼
        │   feature service (pure logic where possible)
        │        │
        │        ▼
        │   ResilientLlmClient (cache → timeout → 1 retry → sanitized error)
        │        │
        │        ▼
        │   LlmProvider (mock | gemini | anthropic — swappable, never touched by feature code)
        │
        ▼
  single sanitized JSON response, or one error envelope { code, message }
```

## Key design decisions

1. **Ground the model, don't trust it.** Every assistant call carries the
   venue's own facts in the prompt and is instructed to answer only from
   them (`features/assistant/prompt.ts`). Wrong wayfinding at an 80,000+ seat
   venue is worse than no answer.
2. **Deterministic logic stays out of the LLM.** Crowd status
   (comfortable/busy/critical) is computed from occupancy thresholds in
   typed, unit-tested code (`features/operations/crowd.ts`); the model only
   turns the already-computed state into prioritized recommendations
   (`features/operations/prompt.ts`). This keeps the safety-relevant
   classification testable, deterministic and reviewable independent of
   model behavior.
3. **Provider-agnostic by construction.** `lib/llm/provider.ts` defines one
   interface; `mock-provider.ts`, `gemini-provider.ts` and
   `anthropic-provider.ts` implement it. Feature code only ever calls
   `ResilientLlmClient`, never a vendor SDK. Swapping or adding a provider
   never touches a feature. The default (`LLM_PROVIDER=mock`) is a
   deterministic, zero-network implementation so the whole app — including
   CI — runs and is fully demoable without any API key.
4. **Structured output is validated, not trusted.** The volunteer dispatch
   copilot asks the model for JSON and re-parses/re-validates it against a
   zod schema before returning it; a malformed response fails closed with a
   sanitized 502 rather than forwarding unvalidated text.
5. **Fail closed and cheap.** zod validates every input at the boundary;
   every LLM-backed route sits behind a stricter rate limit than the rest of
   the API; repeated identical questions are served from a short TTL cache
   instead of re-billing the provider; every provider call has a timeout and
   one retry before surfacing a sanitized upstream error.

## Assumptions made

- **Venue dataset is static for the event.** Gates, facilities and transport
  for three host stadiums are curated in code (`features/venue/data.ts`); a
  real deployment would source them from a venue CMS.
- **Telemetry is simulated.** No live turnstile/IoT feed exists, so a
  deterministic, seeded in-memory simulator (`features/operations/telemetry.ts`)
  advances zone occupancy and incidents on each snapshot read. The read path
  (`getSnapshot`) is what a real feed would also be read through, so
  swapping the source later doesn't touch callers or the API contract.
- **In-memory state, single instance.** No database is used — appropriate
  for this scope and avoids an unneeded cloud dependency. A horizontally
  scaled deployment would move telemetry and the rate limiter to a shared
  store (Redis/Firestore); documented here rather than built, since it's
  not needed to demonstrate the product.
- **Public kiosk model — no accounts.** Both surfaces are anonymous and
  read-mostly, so no authentication is implemented (rate-limited instead);
  see `SECURITY.md` for what a production deployment would add.
- **Multi-venue, five languages.** Scope covers three of the tournament's
  host stadiums and its highest-traffic fan languages (en/es/fr/pt/ar); both
  are data, not architecture, and extend without touching routes or prompts.

## Performance

- Route-level code splitting on the client: each persona page
  (`AssistantPage`, `OperationsPage`, `VolunteerPage`) is a separate lazy
  chunk, so the initial route ships a small bundle (verify with
  `npm run build -w client`, which prints per-chunk gzip sizes).
- `compression()` on API responses; long-lived immutable cache headers on
  content-hashed client assets, `no-cache` on the HTML shell
  (`middleware/static-client.ts`).
- Module-scope LLM client reused across requests; every provider call has a
  bounded timeout and at most one retry.
- Short-lived in-memory TTL caches for repeated assistant questions and
  operations briefings (`lib/ttl-cache.ts`).

## Testing strategy

See the root `README.md` "Testing" section for counts and commands. In
short: unit tests for every pure function and class (crowd classification,
TTL cache, error mapping, env validation, prompt builders, structured-output
parsing), integration tests (supertest) covering every route and its
validation/error paths, and client tests (Testing Library) covering every
page's happy path, error path, and accessibility-relevant markup — all
running against the deterministic mock LLM provider so the suite is
hermetic and free.
