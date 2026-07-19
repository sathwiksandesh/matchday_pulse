# MatchDay Pulse — GenAI Copilot for FIFA World Cup 2026 Stadiums

A GenAI platform for the **FIFA World Cup 2026** that serves three
audiences from one codebase: fans get a grounded, multilingual matchday
assistant; organizers and venue staff get a live operations command center
with AI decision support; volunteers get a copilot that turns a short radio
report into a translated, prioritized dispatch brief.

Runs fully offline out of the box (`LLM_PROVIDER=mock`, the default) — no
API key needed to install, run, test, or evaluate every flow end to end.
Point it at Gemini or Anthropic with one environment variable when you want
real model output.

---

## Chosen vertical

**Smart Stadiums & Tournament Operations**, across three World Cup 2026 host
venues (Estadio Azteca, MetLife Stadium, BC Place), serving three personas
with one platform:

- **Fans** — a multilingual matchday assistant for navigation, accessibility,
  transport and sustainability questions (`/assistant`).
- **Organizers / venue staff** — a live operations command center with crowd
  density, incidents, sustainability metrics and AI decision support
  (`/operations`).
- **Volunteers / stewards / medics** — a dispatch copilot that translates and
  triages short field reports into a structured brief for a duty dispatcher
  (`/volunteer`).

---

## Approach and logic

1. **Ground the model, don't trust it.** Every assistant call carries the
   authoritative venue dataset (gates, sections, facilities, transport,
   accessibility routes) in its prompt and is instructed to answer only from
   it. Wrong wayfinding at an 80,000+ seat venue is worse than no answer.
2. **Deterministic logic stays out of the LLM.** Crowd status
   (comfortable/busy/critical) is computed from occupancy thresholds in
   typed, unit-tested code; the model only turns the already-computed state
   into prioritized, human-readable recommendations. Safety-relevant
   classification is testable and reviewable independent of model behavior.
3. **Provider-agnostic by construction.** Every LLM call goes through one
   `LlmProvider` interface with three implementations (`mock`, `gemini`,
   `anthropic`) selected by an environment variable — feature code never
   imports a vendor SDK directly. The default `mock` provider is
   deterministic and covers both free-text and structured-JSON output, so
   the entire app — including CI — runs and is graded without any API key.
4. **Structured output is validated, never trusted.** The one place the
   model is asked for JSON (the volunteer copilot), the response is
   defensively parsed and re-validated against a schema before use. A
   malformed model response fails closed with a sanitized error, never
   forwarded as-is.
5. **Fail closed and cheap.** Zod validates every input; errors map to one
   sanitized `{ code, message }` envelope; every LLM-backed route has its
   own stricter rate limit and a short response cache so repeated questions
   don't re-bill or re-block.

Full request lifecycle and diagrams: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
Decision-by-decision rationale: [`docs/decisions.md`](docs/decisions.md).

---

## Problem statement alignment

| # | Theme | How MatchDay Pulse delivers it | Route |
|---|---|---|---|
| R1 | **Navigation** | Assistant gives grounded wayfinding — which gate serves a section, step-free routes to any facility, across 3 venues | `/assistant` |
| R2 | **Crowd management** | Operations board shows per-zone density with comfortable/busy/critical status computed in code; AI briefing recommends prioritized actions | `/operations` |
| R3 | **Accessibility** | Accessibility-aware answers (step-free gates, elevators, sensory rooms) plus a WCAG 2.1 AA–oriented interface throughout | `/assistant` + whole app |
| R4 | **Transportation** | Assistant answers on metro, shuttle, bus, rideshare and parking, including which options are accessible | `/assistant` |
| R5 | **Sustainability** | Live sustainability meters (waste diverted, water refills, CO₂ saved, renewable energy %) plus AI sustainability notes in the briefing | `/operations` |
| R6 | **Multilingual assistance** | Assistant and volunteer copilot both answer/translate in English, Spanish, French, Portuguese and Arabic | `/assistant`, `/volunteer` |
| R7 | **Operational intelligence** | Live operational snapshot (zones, incidents, sustainability), auto-refreshing every 8s | `/operations` |
| R8 | **Real-time decision support** | "Generate AI briefing" turns the current live snapshot into a prioritized action list; the volunteer copilot turns a field report into a triaged dispatch brief in real time | `/operations`, `/volunteer` |

---

## What makes this distinct

Compared to a single-persona, single-provider fan-assistant build, this
submission adds:

- **A third persona (volunteers/staff)**, not just fans and organizers —
  the dispatch copilot is a genuinely different workflow (structured
  triage output for a human dispatcher) from the fan assistant's free-text
  grounded Q&A, deliberately kept as a separate feature (see
  [ADR-4](docs/decisions.md#adr-4-volunteer-dispatch-copilot-is-a-separate-feature-not-a-mode-of-the-fan-assistant)).
- **Multi-venue, not single-stadium** — three host venues with independent
  grounding data, proving the wayfinding pattern generalizes rather than
  being hardcoded to one building.
- **A provider-agnostic LLM layer** with a real, deterministic offline mode
  — the whole product (including the structured-output flow) is fully
  functional and testable with zero API keys, and swapping providers is a
  one-line config change, not a rewrite.
- **A design system grounded in the subject** — the "gate sign" component
  used for navigation, section headers and status tags is built from actual
  stadium wayfinding signage conventions (gate codes, bold directional
  blocks), not a generic card/gradient template.

---

## Architecture

```
matchday-pulse/
├── server/                 Node 22 · Express 4 · TypeScript (strict)
│   └── src/
│       ├── config/          zod-validated env (fail-fast at boot)
│       ├── lib/              logger · ttl-cache · app-error · llm/ (provider abstraction)
│       ├── middleware/       error-handler · validate(zod) · rate-limit · security · static-client
│       └── features/
│           ├── venue/        grounding dataset + facilities API
│           ├── assistant/    multilingual grounded Q&A
│           ├── operations/   live snapshot, telemetry sim, crowd classification, AI briefing
│           └── volunteer/    structured-output dispatch/triage copilot
├── client/                  React 19 · TypeScript · Vite · React Router 7
│   └── src/
│       ├── components/       AppLayout · ErrorBoundary · StatusMessage
│       ├── lib/api.ts        typed fetch client, one error envelope
│       └── features/         home · assistant · operations · volunteer
├── docs/                     ARCHITECTURE.md · decisions.md (ADRs)
├── scripts/preflight.sh      run the full CI check-set locally
└── Dockerfile                multi-stage build → one image, one process
```

Details, diagrams and every design decision's rationale:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/decisions.md`](docs/decisions.md).

### API

| Method + path | Purpose |
|---|---|
| `GET /api/health` | Liveness |
| `GET /api/venues` | List venues |
| `GET /api/venues/:venueId` | Venue detail (gates, facilities, transport) |
| `GET /api/venues/:venueId/facilities?category=` | Filtered facility list |
| `POST /api/assistant/ask` | Grounded, multilingual answer |
| `GET /api/operations/snapshot?venueId=` | Live zones, incidents, sustainability |
| `POST /api/operations/briefing?venueId=` | AI operations briefing |
| `POST /api/volunteer/dispatch` | Structured, translated dispatch triage |

---

## Tech stack

**Server:** Node 22 · Express 4 · TypeScript 5.8 (strict) · Zod · Helmet ·
`express-rate-limit` · Pino · Vitest · Supertest.
**Client:** React 19 · TypeScript 5.8 · Vite 7 · React Router 7 · Vitest ·
Testing Library.
**AI:** provider-agnostic (`@google/genai` for Gemini, `@anthropic-ai/sdk`
for Claude), deterministic mock provider as the default.

---

## Getting started

```bash
# 1. Install (npm workspaces)
npm install

# 2. Configure environment (mock provider works with zero changes)
cp .env.example .env

# 3. Run API (:8080) and client (:5173) in two terminals
npm run dev:server
npm run dev:client
```

Open `http://localhost:5173`. To use a real model instead of the offline
mock, set in `.env`:

```
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-key
# or
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
```

Root scripts: `build` · `lint` · `typecheck` · `test` · `test:coverage` ·
`format` · `preflight` (runs everything CI runs, locally).

### Single-container deploy

```bash
docker build -t matchday-pulse .
docker run -p 8080:8080 --env-file .env matchday-pulse
```

The image compiles both workspaces and serves the built client from the same
Express process (`STATIC_CLIENT_DIR`, wired in `server/src/middleware/static-client.ts`).

---

## Testing

```bash
npm run test:coverage
```

- **Server — 60 tests.** Unit tests for env validation, the TTL cache, the
  `AppError` type, the LLM provider factory and resilient client (cache hit,
  retry, sanitized failure), crowd/density classification, every middleware
  (validation, central error handling, static client serving), the
  assistant prompt builder, and the volunteer copilot's defensive
  structured-output parsing (valid JSON, fenced JSON, malformed JSON,
  schema-invalid JSON). Full Supertest integration tests cover every route,
  every validation rejection, 404/unknown venue handling, and the
  `/.well-known/security.txt` disclosure endpoint. All hermetic — the mock
  LLM provider means no network calls in CI.
- **Client — 21 tests.** Testing Library tests for the full assistant flow
  (typed question, quick-action chip, accessibility-context passthrough,
  error state), the operations dashboard (live render, accessible `<meter>`
  density readouts, snapshot error, briefing generation, in-flight
  double-submit guard), the volunteer copilot (submit, error, disabled
  state), lazy-loaded routing (including a 404 fallback), the error
  boundary, and the typed API client's error-envelope handling (including a
  non-JSON error response).
- **Coverage thresholds enforced in CI**: server ≥85% lines/functions/
  statements, ≥80% branches; client ≥80% lines/statements, ≥70% functions/
  branches (excludes the trivial `main.tsx`/`index.ts` entrypoints).

Run `bash scripts/preflight.sh` to run everything CI runs, locally, before
you submit or open a PR.

---

## Security

See [`SECURITY.md`](SECURITY.md) for the full threat model. Highlights:

- **Secrets** only via environment variables; `.env` is gitignored; nothing
  sensitive is ever logged or reaches the client.
- **Input validation**: strict zod schemas at every boundary — unknown keys
  rejected, every free-text field length-capped.
- **Output handling**: LLM output is treated as untrusted. Free text is
  rendered as plain text (React escapes by default, no
  `dangerouslySetInnerHTML` anywhere); the one structured-JSON response is
  re-validated against a schema before use, failing closed on a malformed
  reply.
- **HTTP hardening**: Helmet with a restrictive CSP (`default-src 'self'`,
  no inline scripts), explicit CORS origin, 100 kB body limit, layered rate
  limits (general + stricter on the three AI-backed routes).
- **Error hygiene**: one central handler returns a sanitized
  `{ code, message }` body; stack traces and provider errors are logged
  server-side only.
- **Fail-fast config**: environment variables are zod-validated at boot;
  selecting a real provider without its key throws before the server binds
  a port.
- **Supply chain**: `npm audit --omit=dev --audit-level=high` in CI on
  every push; Dependabot grouped weekly PRs; lockfiles committed.
- **Static analysis**: CodeQL scans on every push and PR.
- **Least privilege**: CI workflows request only `contents: read`.
- **Coordinated disclosure**: `/.well-known/security.txt` (RFC 9116).

---

## Performance / efficiency

- Route-level code splitting on the client — each persona page
  (`AssistantPage`, `OperationsPage`, `VolunteerPage`) ships as its own lazy
  chunk (verify with `npm run build -w client`; per-chunk gzip sizes print
  in the build output).
- `compression()` on API responses; long-lived immutable cache headers on
  content-hashed client assets, `no-cache` on the HTML shell.
- A single, module-scope resilient LLM client is reused across requests;
  every provider call has a bounded timeout and at most one retry.
- Short-lived in-memory TTL caches for repeated assistant questions and
  operations briefings, so identical questions don't re-bill or re-call the
  provider.
- No unnecessary managed-service dependencies at this scope — in-memory
  state keeps the app fast to start and cheap to run for a single-instance
  deployment (see [ADR-3](docs/decisions.md#adr-3-in-memory-state-instead-of-a-managed-database)
  for the scaling trade-off this accepts).

---

## Accessibility

Built with WCAG 2.1 AA in mind throughout:

- Semantic landmarks (`header`, `nav`, `main`, `footer`), a skip link, and
  one `h1` per route.
- Every control has a programmatic label; fully keyboard-operable with
  visible focus rings (`:focus-visible`).
- `aria-live` regions announce assistant answers, dispatch briefs and
  operations briefings as they arrive; crowd density is exposed as a native
  `<meter>` with a descriptive `aria-label`, not a plain colored div.
- Status is never color-only — every status tag pairs its color with a text
  label ("Critical · 95%", not just a red dot).
- `prefers-reduced-motion` is respected globally.
- Multilingual assistant answers carry `dir="auto"` and `lang={language}` so
  Arabic renders right-to-left and screen readers use correct phonetics.
- Errors render with `role="alert"`/`aria-live="assertive"`; informational
  status uses `role="status"`/`aria-live="polite"` — see
  `client/src/components/StatusMessage.tsx`.

---

## Evaluation map

| Evaluation area | Evidence in this repo |
|---|---|
| **Code Quality** | Strict TypeScript (`strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) on both workspaces · feature-folder architecture with a consistent `schema/prompt/service/routes` split · doc comments on every non-trivial module explaining *why*, not just *what* · `docs/ARCHITECTURE.md` + `docs/decisions.md` (ADRs) · `CONTRIBUTING.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md` |
| **Security** | `SECURITY.md` threat model · zod at every boundary, `.strict()` schemas · Helmet CSP + CORS allowlist + rate limits + body caps · sanitized single error envelope · defensive re-validation of all LLM output · fail-fast env validation · `npm audit` + CodeQL + Dependabot in CI · `security.txt` |
| **Efficiency** | Provider-agnostic LLM layer with timeout + single retry + TTL caching · route-level client code splitting · compression + cache headers · in-memory state (no unneeded managed services at this scope) — see [Performance](#performance--efficiency) |
| **Testing** | 60 server tests + 21 client tests, all hermetic (deterministic mock LLM provider, no network calls) · unit + integration coverage on the server, unit + component coverage on the client · coverage thresholds enforced in CI · `scripts/preflight.sh` reproduces CI locally — see [Testing](#testing) |
| **Accessibility** | WCAG 2.1 AA–oriented markup: landmarks, labels, keyboard operability, live regions, `<meter>`-based density, color-plus-text status, `dir`/`lang` on multilingual content, reduced-motion support — see [Accessibility](#accessibility) |
| **Problem statement alignment** | R1–R8 traceability table with a live route per requirement — see [above](#problem-statement-alignment) |

---

## Assumptions

- **Venue dataset is static for the event.** Gates, facilities and transport
  for three host venues are curated in code (`server/src/features/venue/data.ts`);
  a real deployment would source them from a venue CMS.
- **Telemetry is simulated.** No live turnstile/IoT feed exists, so a
  deterministic, seeded in-memory simulator advances zone occupancy and
  incidents on each read; the read path is what a real feed would also be
  read through.
- **Public kiosk model — no accounts.** Both fan and operations surfaces are
  anonymous (rate-limited instead of authenticated); a production
  deployment would put the operations board behind staff SSO.
- **Multi-venue, five languages.** Both are data, not architecture, and
  extend to more venues/languages without touching routes or prompts.

Full rationale for every non-obvious choice: [`docs/decisions.md`](docs/decisions.md).

---

## Reference

Built with the general shape (feature-folder monorepo, grounded prompting,
deterministic crowd classification, sanitized error envelope) informed by
review of a prior FIFA World Cup 2026 stadium-ops submission structure, then
redesigned around a distinct three-persona scope, a provider-agnostic LLM
layer, multi-venue grounding data, and a stadium-signage-derived design
system. No code was copied from that reference.

Licensed under the [MIT License](LICENSE).
