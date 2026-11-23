---
name: byamabe-review-modules
description: >
  Audits the whole codebase against modules.md and reports drift:
  boundary violations, unmapped files, public surface growth, and
  modules doing work outside what they own. Deterministic checks run
  first; judgment findings are labeled. Reports only — every fix is
  the developer's decision. Run periodically, not per cycle.
disable-model-invocation: true
---

## Purpose

byamabe-update-modules reconciles modules.md one cycle at a time,
scoped to the merged PR. Drift that no single PR shows still
accumulates. This skill audits the whole codebase against the map to
catch it.

It reports. It does not fix code, and it edits modules.md only after
the developer confirms the exact change. Deciding whether the code or
the map is wrong is the developer's call.

| Skill | Reads | Writes | Scope |
|---|---|---|---|
| byamabe-load-modules | modules.md | nothing | before feature work |
| byamabe-update-modules | modules.md, PR diff | modules.md, after approval | one cycle |
| byamabe-review-modules | modules.md, whole codebase | drift report | periodic audit |

## Preconditions (stop loudly if either fails)

1. modules.md exists at the project root.
2. modules.md contains a parseable YAML block (see "Structured block"
   below).

If modules.md is missing, tell the user: greenfield projects get it
from grill-ax; brownfield projects can establish a baseline with
improve-codebase-architecture.

If the YAML block is missing, stop. An agent may draft one from the
current imports, but the draft must be labeled "observed, not
intended", and the developer edits it into the intended design before
this skill runs. Adopting observed wiring as the design would approve
existing drift.

Never fall back to an LLM-only review. A review without the
deterministic layer is a silent downgrade.

## Structured block

modules.md carries one fenced YAML block alongside the prose entries.
Module names match the prose headings:

```yaml
modules:
  - name: content-pipeline
    status: confirmed
    paths: ["src/content/**"]
    may_depend_on: [corpus, schema]
    public_exports: [generateExercise, validateExercise]
```

The prose stays authoritative for Owns, Does not own, and Interface.
The YAML is what scripts check against.

## Step 1: Read the map

Read modules.md in full: prose entries and the YAML block. Do not
explore the codebase yet. The map is the starting point.

## Step 2: Deterministic findings

Run `scripts/review-structure.sh` from this skill's folder against
the project root. If the script is missing or exits with an error,
stop and report it. Do not approximate the checks yourself.

| Finding | Method |
|---|---|
| Boundary violation | dependency-cruiser rules generated from `may_depend_on`; any import along an undeclared edge |
| Unmapped file | source file matched by no module's `paths` |
| Empty module | confirmed module whose `paths` match no files |
| Surface growth | exported symbol not listed in the module's `public_exports` |
| Module totals | aggregate cognitive complexity and duplication per module, compared with the last report in docs/reviews/ if one exists |

An empty proposed module is expected, not drift. Report it only as
"proposed, not yet built".

Record findings exactly as the script reports them. Do not
reinterpret, filter, or drop any.

## Step 3: Ownership drift (judgment)

For each confirmed module, read only:

- its Owns and Does not own sections,
- its file list and exported symbol names,
- the files the deterministic layer flagged in this module.

Then answer: does this module contain work its Does not own section
excludes, or work its Owns section doesn't cover? Does anything here
belong to a different module?

Rules:

- Every finding cites file paths (with line numbers where possible)
  and the modules.md entry it is measured against.
- Label every finding from this step **[judgment]**.
- Do not explore beyond the files listed above. If a finding needs
  more context, say what context and stop.
- Report no finding rather than a speculative one.

## Step 4: Write the report

Write `docs/reviews/drift-report-YYYY-MM-DD.md`:

1. Summary: counts by finding type.
2. Deterministic findings, grouped by type.
3. Judgment findings, each labeled **[judgment]**.
4. Module totals, with deltas against the previous report.

For every finding, give the evidence and both resolutions without
choosing between them:

> **Boundary:** content-pipeline → ui import at src/content/render.ts:12 (not in may_depend_on)
> Either: fix the code (open an issue) · Or: the design changed (edit modules.md)

## Step 5: Resolve with the developer

Go through the findings with the developer. For each one, ask: fix
the code, or update the map?

- **Fix code:** draft an issue with the evidence and the modules.md
  entry it violates. Open it only once the developer confirms.
- **Update map:** list the exact change to modules.md. The developer
  makes the edit, or confirms it before you make it. A new edge or
  export in the map is a design decision, never an inferred one.
- **Defer:** record it in the report as known drift.

Record each decision in the report. If one module keeps getting
"update map" decisions, flag it: its Owns section probably needs
rethinking, and improve-codebase-architecture may be worth running.
