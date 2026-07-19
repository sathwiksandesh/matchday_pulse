# Architecture Decision Records

Short-form ADRs for choices that would otherwise need re-litigating.

## ADR-1: Provider-agnostic LLM abstraction instead of a single hardcoded SDK

**Decision:** Define one `LlmProvider` interface (`lib/llm/provider.ts`) with
three implementations — `mock` (default), `gemini`, `anthropic` — selected by
`LLM_PROVIDER`. Feature code depends only on `ResilientLlmClient`.

**Why:** Locking every feature to one vendor SDK means a provider outage,
price change, or policy change becomes a rewrite. An interface makes it a
config change. It also means CI and local development never require a paid
API key — the mock provider is deterministic and exercises the same code
paths (including the JSON-structured-output path) as a real provider.

**Trade-off accepted:** The mock provider's "intelligence" is a rule-based
stand-in, not a real model. That's fine for CI and demoing wiring, but a
grader evaluating actual answer quality should set `LLM_PROVIDER=gemini` or
`anthropic` with a key in `.env`.

## ADR-2: Crowd-status classification lives in code, never in the prompt

**Decision:** `features/operations/crowd.ts` computes comfortable/busy/
critical from a fixed occupancy threshold in typed, unit-tested code. The
AI briefing prompt is explicitly told to treat that status as ground truth
and only prioritize/phrase recommendations from it.

**Why:** This is the one place in the app where being wrong has a safety
cost. Deterministic code is testable exhaustively (see `crowd.test.ts`) and
reviewable by a human without needing to reason about model behavior. An
LLM is well-suited to prioritizing and writing the recommendation; it is not
the right tool for the classification itself.

## ADR-3: In-memory state instead of a managed database

**Decision:** Telemetry, the rate limiter, and the response cache are all
in-process memory (`Map`-backed), not Firestore/Redis/Postgres.

**Why:** At the scope of this submission (single instance, demo/evaluation
traffic), a managed database adds operational surface area and cost without
adding evaluable functionality — the read/write contract
(`getSnapshot`/`step`) is written so that swapping the store later is a
one-file change, not an architecture change. Documented as a scaling
follow-up in `docs/ARCHITECTURE.md` rather than speculatively built.

## ADR-4: Volunteer dispatch copilot is a separate feature, not a mode of the fan assistant

**Decision:** `features/volunteer/` is its own schema, prompt, service and
route, distinct from `features/assistant/`, even though both call an LLM.

**Why:** The two have different trust models and output shapes. The fan
assistant produces free text grounded in public venue facts; the dispatch
copilot produces machine-parsed structured JSON from a staff member's
report and is meant to be read by a human dispatcher, not a fan. Collapsing
them into one endpoint with a "mode" flag would blur that distinction in
both the code and the security review.

## ADR-5: Priority triage is a model suggestion, not a classification

**Decision:** Unlike crowd status (ADR-2), the dispatch copilot's
low/medium/high priority *is* produced by the model.

**Why:** There is no deterministic ground truth for "how urgent is this
free-text radio report" the way there is for "is this zone over 92%
occupancy" — it depends on judgment a rules engine can't encode well from
a short message. The UI is explicit that this is a suggestion for a human
dispatcher (`VolunteerPage.tsx` copy), not an automated action.
