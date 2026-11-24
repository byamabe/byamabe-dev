#!/usr/bin/env bash
# Deterministic layer of byamabe-review-modules.
# Usage: review-structure.sh <project-root> [--out <file.json>]
# Exit 0: report printed. Exit 2: modules.md map unusable. Exit 1: script failure.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"

command -v node >/dev/null || { echo "review-structure: node is required" >&2; exit 1; }

# Install pinned dependencies once, and again whenever the lockfile changes.
stamp="$here/node_modules/.lock-hash"
want="$(shasum -a 256 "$here/package-lock.json" 2>/dev/null || sha256sum "$here/package-lock.json")"
want="${want%% *}"
if [[ ! -f "$stamp" || "$(cat "$stamp")" != "$want" ]]; then
  echo "review-structure: installing pinned dependencies (one time)..." >&2
  (cd "$here" && npm ci --silent --no-audit --no-fund >&2)
  echo "$want" > "$stamp"
fi

exec node "$here/review-structure.mjs" "$@"
