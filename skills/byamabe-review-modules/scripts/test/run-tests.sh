#!/usr/bin/env bash
# Tests for review-structure. Copies the fixture into a temp git repo,
# then checks findings, determinism, deltas and every map error path.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
script="$here/../review-structure.sh"
fail=0
check() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=1; fi; }

work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
fresh() {
  rm -rf "$work/p"; cp -r "$here/fixture" "$work/p"
  git -C "$work/p" init -q
  git -C "$work/p" add -A
  git -C "$work/p" -c user.email=t@t -c user.name=t commit -qm fixture
}
run() { set +e; out="$("$script" "$work/p" "$@" 2>"$work/err")"; code=$?; set -e; }
count() { python3 -c "import json,sys;print(len(json.load(open('$work/r.json'))['findings']['$1']))"; }

fresh; run --out "$work/r.json"
check "report produced (exit 0)"            '[[ $code -eq 0 ]]'
check "1 boundary violation (UI -> Corpus)"  '[[ $(count boundary) -eq 1 ]] && grep -q "UI → Corpus" <<<"$out"'
check "2 entry bypasses, incl. path alias"  '[[ $(count entry_bypass) -eq 2 ]] && grep -q "src/corpus/search.ts. instead of" <<<"$out"'
check "surface: rankInternal; lazy import named" '[[ $(count surface) -eq 1 ]] && grep -q "rankInternal" <<<"$out" && ! grep -qF "imports \`*\`" <<<"$out"'
check "unmapped: src/orphan.ts only"        '[[ $(count unmapped) -eq 1 ]] && grep -q "src/orphan.ts" <<<"$out"'
check "ignored test file not counted"       '! grep -q "generate.test.ts" <<<"$out"'
check "empty confirmed: Grading"            '[[ $(count empty_confirmed) -eq 1 ]]'
check "proposed not built: Analytics"       '[[ $(count proposed_not_built) -eq 1 ]]'
check "2 map consistency issues"            '[[ $(count map_consistency) -eq 2 ]]'
check "cross-module clone found"            'grep -q "Content Pipeline) ↔" <<<"$out"'
check "unresolved alias reported"          '[[ $(count unresolved) -eq 1 ]] && grep -q "~/not-there" <<<"$out"'
check ".vue file listed as not analyzed"    '[[ $(count not_analyzed) -eq 1 ]] && grep -q "Panel.vue" <<<"$out"'

cp "$work/r.json" "$work/r1.json"; run --out "$work/r.json"
check "same commit, same report"            'cmp -s "$work/r.json" "$work/r1.json"'

mkdir -p "$work/p/docs/reviews"; cp "$work/r1.json" "$work/p/docs/reviews/structure-2026-01-01.json"
printf 'export function extra(a: number) { if (a) { return 1; } return 0; }\n' > "$work/p/src/corpus/extra.ts"
run --out "$work/p/docs/reviews/structure-2026-02-01.json"
check "deltas against previous report"      'grep -q "Changes since docs/reviews/structure-2026-01-01.json" <<<"$out" && grep -qE "^\| Corpus \| \+1 \| \+1 \|" <<<"$out"'

fresh; sed -i 's#entry: src/corpus/index.ts#entry: [src/corpus/index.ts, src/corpus/search.ts]#' "$work/p/modules.md"; run --out "$work/r.json"
check "entry list accepted (1 bypass left)" '[[ $code -eq 0 && $(count entry_bypass) -eq 1 ]]'

fresh; sed -i 's#^shared: \[schema\]#tsconfig: missing/tsconfig.json\nshared: [schema]#' "$work/p/modules.md"; run
check "missing tsconfig refused (exit 2)"   '[[ $code -eq 2 ]] && grep -q "tsconfig" "$work/err"'

fresh; sed -i "s/^source_roots:/# OBSERVED DRAFT\nsource_roots:/" "$work/p/modules.md"; run
check "observed draft refused (exit 2)"     '[[ $code -eq 2 ]] && grep -q "OBSERVED DRAFT" "$work/err"'

fresh; sed -i 's#paths: \["src/ui/\*\*"\]#paths: ["src/ui/**", "src/content/generate.ts"]#' "$work/p/modules.md"; run
check "overlapping paths refused (exit 2)"  '[[ $code -eq 2 ]] && grep -q "overlap" "$work/err"'

fresh; sed -i 's/may_depend_on: \[Corpus\]/may_depend_on: [Corpse]/' "$work/p/modules.md"; run
check "unknown module name refused (exit 2)" '[[ $code -eq 2 ]] && grep -q "unknown module \"Corpse\"" "$work/err"'

fresh; python3 -c "import re,sys;p='$work/p/modules.md';t=open(p).read();open(p,'w').write(re.sub(r'\`\`\`yaml.*?\`\`\`','',t,flags=re.S))"; run
check "missing map refused (exit 2)"        '[[ $code -eq 2 ]] && grep -q "no Structure map" "$work/err"'

exit $fail
