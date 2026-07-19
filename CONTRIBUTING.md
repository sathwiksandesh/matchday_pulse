# Contributing

## Setup

```bash
npm install
cp .env.example .env
npm run dev:server   # http://localhost:8080
npm run dev:client   # http://localhost:5173
```

`LLM_PROVIDER=mock` by default, so no API key is required to run, test, or
evaluate the full app.

## Before opening a PR

```bash
bash scripts/preflight.sh
```

This runs the same lint/typecheck/test/build/audit steps as CI, for both
workspaces. All of it must pass locally before pushing.

## Conventions

- **TypeScript strict mode everywhere.** No `any` without a comment
  explaining why; prefer `unknown` + a type guard.
- **Feature-folder structure.** New functionality goes under
  `server/src/features/<name>/` or `client/src/features/<name>/`, following
  the existing `schema.ts` / `prompt.ts` / `service.ts` / `routes.ts` split
  on the server, and `use<Feature>.ts` / `<Feature>Page.tsx` on the client.
- **Every route handler is covered by an integration test**, and every
  non-trivial pure function by a unit test. See `docs/ARCHITECTURE.md` for
  the testing strategy.
- **Never call a vendor LLM SDK directly from feature code.** Add a new
  `LlmProvider` implementation under `server/src/lib/llm/` if you need a new
  model provider; features only ever depend on `ResilientLlmClient`.
- **Conventional commits** (`feat:`, `fix:`, `docs:`, `test:`, `chore:`) are
  appreciated but not enforced by tooling in this repo.

## Reporting a bug or vulnerability

Functional bugs: open an issue. Security issues: see `SECURITY.md` — please
don't file those as public issues.
