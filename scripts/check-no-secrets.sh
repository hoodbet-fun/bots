#!/usr/bin/env bash
# Fail if staged/tracked files look like secrets. Run before git push.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "BLOCKED: .env is tracked by git — run: git rm --cached .env"
  fail=1
fi

if git diff --cached --name-only | rg -q '^\.env($|\.)'; then
  echo "BLOCKED: .env file is staged for commit"
  fail=1
fi

if git diff --cached | rg -qi 'BOT_PRIVATE_KEY=0x[0-9a-f]{64}|GOLDSKY_API_KEY='; then
  echo "BLOCKED: diff contains private key or API key pattern"
  fail=1
fi

tracked_env="$(git ls-files | rg '\.env$' | rg -v '\.env\.example$' || true)"
if [[ -n "$tracked_env" ]]; then
  echo "BLOCKED: tracked env files (not examples):"
  echo "$tracked_env"
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "OK: no obvious secrets in git index"
