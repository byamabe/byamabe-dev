#!/usr/bin/env bash
# Verify that every mattpocock/skills reference in this repo resolves
# at the upstream ref pinned in upstream.lock. Fails loudly on:
#   1. an upstream slash command or file path used in our docs but
#      not declared in scripts/upstream-refs.txt,
#   2. a declared skill or file missing (or deprecated) upstream,
#   3. a retired upstream name still used in our docs.
#
# Usage: scripts/check-upstream-refs.sh [path-to-upstream-checkout]
# Without a path, clones the pinned ref into a temp directory.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

refs_file="scripts/upstream-refs.txt"
repo="$(sed -n 's/^repo=//p' upstream.lock)"
ref="$(sed -n 's/^ref=//p' upstream.lock)"

# Names upstream has retired. A match in our docs is always an error.
retired_pattern='CONTEXT\.md|CONTEXT-MAP\.md|CONTEXT-FORMAT\.md|/to-prd|to-prd |/to-issues|to-issues |grill-with-docs/(CONTEXT|ADR)-FORMAT'
# Slash-prefixed tokens in our docs that are not skills.
not_skills='path'

# Tracked markdown only: installed dependencies and test fixtures are
# not documentation.
mapfile -t docs < <(git ls-files -- 'README.md' 'docs/*.md' 'skills/*.md' | grep -v '/test/fixture/')
fail=0
err() { echo "FAIL: $*"; fail=1; }

declared_skills="$(sed -n 's/^skill://p' "$refs_file" | sort -u)"
declared_files="$(sed -n 's/^file://p' "$refs_file" | sort -u)"
own_skills="$(ls skills)"

# --- 1. Coverage: every upstream reference is declared ---------------
used_skills="$(grep -rhoE '(^|[ `("])/[a-z][a-z0-9-]*[a-z0-9]([^a-z0-9-]|$)' "${docs[@]}" \
  | sed -E 's#^[ `("]?/##; s#[^a-z0-9-]$##' | sort -u)"
for name in $used_skills; do
  grep -qx "$name" <<<"$own_skills" && continue
  grep -qx "$name" <<<"$not_skills" && continue
  grep -qx "$name" <<<"$declared_skills" || err "/$name is used but not declared in $refs_file"
done

used_files="$(grep -rhoE 'skills/(engineering|productivity|misc|in-progress)/[a-z0-9-]+/[A-Za-z0-9_.-]+\.md' "${docs[@]}" | sort -u || true)"
for path in $used_files; do
  grep -qx "$path" <<<"$declared_files" || err "$path is used but not declared in $refs_file"
done

# --- 3. Retired names ---------------------------------------------------
# Lines containing "legacy" deliberately name old files (migration
# instructions) and are exempt.
if grep -rnE "$retired_pattern" "${docs[@]}" | grep -vi legacy; then
  err "retired upstream names in use (lines above)"
fi

# --- 2. Existence at the pinned ref ------------------------------------
upstream="${1:-}"
if [[ -z "$upstream" ]]; then
  upstream="$(mktemp -d)"
  trap 'rm -rf "$upstream"' EXIT
  git -c advice.detachedHead=false clone -q --depth 1 --branch "$ref" "$repo" "$upstream"
fi

for name in $declared_skills; do
  match="$(ls -d "$upstream"/skills/*/"$name" 2>/dev/null | head -1 || true)"
  if [[ -z "$match" || ! -f "$match/SKILL.md" ]]; then
    err "skill $name not found upstream at $ref"
  elif [[ "$match" == */deprecated/* ]]; then
    err "skill $name is deprecated upstream at $ref"
  fi
done

for path in $declared_files; do
  [[ -f "$upstream/$path" ]] || err "file $path not found upstream at $ref"
done

if [[ $fail -ne 0 ]]; then
  echo "Upstream reference check failed against $repo@$ref"
  exit 1
fi
echo "OK: all upstream references resolve at $repo@$ref"
