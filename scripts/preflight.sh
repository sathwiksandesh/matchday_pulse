#!/usr/bin/env bash
# Runs the same checks CI runs, locally, before you submit.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== server: typecheck =="
npm run typecheck -w server

echo "== server: lint =="
npm run lint -w server || echo "(lint skipped/failed — see output above)"

echo "== server: tests + coverage =="
npm run test:coverage -w server

echo "== server: build =="
npm run build -w server

echo "== server: npm audit (prod deps) =="
(cd server && npm audit --omit=dev --audit-level=high) || echo "(audit found issues — review above)"

echo "== client: typecheck =="
npm run typecheck -w client

echo "== client: lint =="
npm run lint -w client || echo "(lint skipped/failed — see output above)"

echo "== client: tests + coverage =="
npm run test:coverage -w client

echo "== client: build =="
npm run build -w client

echo "== client: npm audit (prod deps) =="
(cd client && npm audit --omit=dev --audit-level=high) || echo "(audit found issues — review above)"

echo
echo "Preflight complete."
