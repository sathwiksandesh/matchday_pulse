# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] — 2026-07-19

### Added
- Fan Matchday Assistant: grounded, multilingual (en/es/fr/pt/ar) wayfinding,
  accessibility, transport and sustainability Q&A across three World Cup
  2026 host venues.
- Operations Command Center: live per-zone crowd density (deterministic
  comfortable/busy/critical classification), incident feed, sustainability
  metrics, and an on-demand AI operations briefing.
- Volunteer Dispatch Copilot: translates and triages short radio-style
  reports into a structured, human-reviewed dispatch brief.
- Provider-agnostic LLM abstraction (`mock` / `gemini` / `anthropic`) with a
  deterministic offline default so the app runs and is fully testable
  without any API key.
- Full test suite: unit + integration tests on the server (Vitest +
  Supertest), unit + component tests on the client (Vitest + Testing
  Library), both enforced by coverage thresholds in CI.
- Security hardening: Helmet CSP, CORS allowlist, layered rate limiting,
  strict zod validation at every boundary, sanitized error envelope,
  RFC 9116 `security.txt`, CodeQL + `npm audit` + Dependabot in CI.
- WCAG 2.1 AA–oriented accessible UI: semantic landmarks, skip link, live
  regions, `<meter>`-based density readouts, color-plus-text status tags,
  `dir`/`lang` on multilingual answers, `prefers-reduced-motion` support.
