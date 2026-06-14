---
name: byamabe-update-modules
description: >
  Reconciles modules.md against what was actually built in the last
  implementation cycle. Explores the codebase scoped to the cycle's
  changes, compares findings against current modules.md entries, and
  proposes updates for human review and approval. Run after QA passes
  and the implementation PR is merged, before the next grill-with-docs
  session begins. Requires byamabe-dev and mattpocock/skills to be
  installed.
disable-model-invocation: false
---

## Purpose

modules.md is a living description of the system's current module
topology. It drifts from reality every time a feature cycle closes.
This skill reconciles that drift before it compounds.

Do not silently rewrite modules.md. Every proposed change must be
presented for human review and explicitly approved before being
written. The human approval step is the quality gate — it catches
what this skill missed.

## Step 1: Determine scope

Identify what changed in the last implementation cycle using the
following detection order. Tell the user which method succeeded
and what scope was inferred before proceeding to Step 2.

**Method 1: Merged PR**

Run:
```
gh pr list --state merged --limit 5 \
  --json number,title,body,mergedAt,files
```

Look for the most recently merged PR. Extract:
- The files it touched
- The issues it closes (look for "closes #N", "fixes #N" in the
  body)
- The modules those files belong to based on current modules.md

If a merged PR is found, use its file list as the scope.
Report: "Found merged PR #N: {title}. Scoping exploration to
{N} files across {modules} modules."

**Method 2: Git log since last modules.md update**

If no merged PR is found, run:
```
git log --oneline --name-only
```

Find the most recent commit that touched modules.md. Use all
files changed in commits since that commit as the scope.

Report: "No merged PR found. Scoping to commits since last
modules.md update ({commit hash}, {date}): {N} files across
{modules} modules."

**Method 3: Full codebase**

If modules.md has never been committed, explore the full codebase.

Report: "modules.md has no commit history. Treating full codebase
as in scope."

If scope is ambiguous or seems wrong, stop and ask the user to
confirm before proceeding.

## Step 2: Explore scoped modules

Use the agent tool with subagent_type=Explore scoped to the files
identified in Step 1.

For each module touched by the cycle, gather:
- What the module actually owns now, based on its current code
- What its public interface actually looks like — the surface a
  caller must know to use it
- What it explicitly does not handle — what gets passed to other
  modules or left to callers
- How it is tested — what the tests cover and at what level
- Whether any new files appeared that suggest a module boundary
  shifted or a new module emerged

Do not read every file. Read interface files, service entry points,
index files, and test files. Read internals only when the interface
does not make ownership clear.

## Step 3: Compare against modules.md

Read modules.md in full. For each module in scope, compare what
you found in Step 2 against its current entry.

Identify and categorize every discrepancy:

**Ownership drift** — the module owns something its entry does not
describe, or its entry claims ownership of something that has moved
elsewhere.

**Interface drift** — the module's actual public surface differs
from what modules.md describes. New methods added, old ones removed,
signatures changed.

**Boundary crossing** — the module is doing something that modules.md
assigns to a different module. Flag these as higher severity — they
indicate a design decision was made implicitly during implementation
that should have been explicit.

**New module** — files appeared that constitute a meaningful unit of
ownership not represented in modules.md at all.

**Removed module** — a module in modules.md no longer exists or has
been absorbed into another.

**Proposed to confirmed** — a module with status: proposed in
modules.md was actually built. Confirm it with accurate descriptions
replacing the sketch and update status to confirmed.

**Design debt** — something about the current state is worse than
what modules.md describes or implies. The module is shallower than
its entry suggests, its interface is leaking implementation details,
or its test coverage does not match what the entry claims.

## Step 4: Present proposed changes

Do not write anything to modules.md yet.

Present each discrepancy as a proposed change in this format:

---
**Module**: {module name}
**Change type**: {ownership drift | interface drift | boundary
crossing | new module | removed module | proposed to confirmed |
design debt}
**Severity**: {high | medium | low}
**Current entry says**: {relevant excerpt from modules.md}
**Reality is**: {what the code actually shows}
**Proposed update**: {exact text to replace the current entry with,
or new entry to add}
**Uncertainty**: {anything this skill is not confident about and
why — leave blank if confident}
---

After presenting all proposed changes, show a summary:
- N changes proposed
- N boundary crossings flagged (if any — these warrant immediate
  attention before the next cycle)
- N items with uncertainty flagged

Then ask: "Do you want to approve all, approve selectively, or
discuss any of these before I write them?"

## Step 5: Write approved changes

Write only the changes explicitly approved by the user. Update
modules.md in place — rewrite affected entries, do not append.

After writing, commit modules.md with a message in this format:
```
docs: update modules.md after {PR title or cycle description}

Changes: {one line per change type and module}
```

## Step 6: Flag for improve-codebase-architecture

After committing, review the changes written and identify any that
suggest improve-codebase-architecture from mattpocock/skills should
be run before the next feature cycle begins:

- Any boundary crossing, even if resolved in modules.md
- Any design debt entry added
- Any new module that appeared without having been planned in
  grill-ax or a PRD module sketch
- Any module whose interface grew significantly in ways that suggest
  it may be accumulating scope

If any of these are present, tell the user:
"The following changes suggest running /improve-codebase-architecture
before the next feature cycle: {list with brief reason for each}."

If none are present, tell the user:
"No architectural concerns flagged. modules.md is current.
Ready for the next /grill-with-docs session."

## Evaluation guidance

This skill can miss things. Common failure modes to watch for
during human review in Step 4:

- **Scope too narrow**: the cycle touched a module indirectly
  through a shared dependency that did not appear in the PR diff
- **Interface description too surface-level**: the skill described
  the type signatures but missed an important invariant or error
  mode that callers need to know
- **Boundary crossing not detected**: the module is doing something
  that belongs elsewhere but the skill accepted it as intentional
- **Design debt not flagged**: the module got shallower during the
  cycle but the skill described it as-is without noting the
  regression

If you catch any of these during review, note what the skill
missed. Patterns in what it misses are the signal for improving
this skill's Step 2 exploration instructions or Step 3 comparison
criteria. Record these observations in the skill/prompt review
step at the end of the cycle.
