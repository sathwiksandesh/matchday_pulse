## Summary

What does this change, and why?

## Checklist

- [ ] `bash scripts/preflight.sh` passes locally
- [ ] New/changed behavior has unit and/or integration test coverage
- [ ] No secrets, API keys, or internal error detail are logged or returned to clients
- [ ] Any new LLM call goes through `ResilientLlmClient`, not a vendor SDK directly
- [ ] Any new request body/query is validated with a `.strict()` zod schema
- [ ] UI changes keep keyboard operability, visible focus, and non-color-only status indicators
- [ ] `docs/ARCHITECTURE.md` / `docs/decisions.md` updated if this changes a design decision
