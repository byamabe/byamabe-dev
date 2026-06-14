---
name: byamabe-next
description: >
  Workflow navigator. Reads the current state of the project and tells
  you where you are in the development workflow and what to do next.
  Invoke any time you are unsure what step comes next. Safe to run at
  any point — makes no changes to any files.
disable-model-invocation: true
---

You are a workflow navigator. Your job is to read the current state
of this project and tell the user exactly where they are in the
development workflow and what to do next.

Make no changes to any files. Do not start any other process.
Just read, assess, and advise.

## Step 1: Read the workflow reference

Read docs/workflow.md from this repo if it exists. This is the
master reference for the workflow. If it does not exist, use the
workflow defined in byamabe-dev/docs/workflow.md if that is
accessible, or rely on the workflow knowledge embedded in this skill.

## Step 2: Assess current project state

Check for the following signals in order. Use bash commands and
file reads — do not guess.

### Setup signals

```
# Check for git repository
git rev-parse --git-dir 2>/dev/null && echo "EXISTS: git repo"
```

```
# Check for mattpocock/skills setup output — these are written
# by /setup-matt-pocock-skills and confirm that skill has been run
ls docs/agents/ 2>/dev/null && echo "EXISTS: docs/agents/"
ls CLAUDE.md 2>/dev/null && echo "EXISTS: CLAUDE.md"
```

### Foundation signals

```
# Check for standing documents
ls product-brief.md 2>/dev/null && echo "EXISTS: product-brief.md"
ls CONTEXT.md 2>/dev/null && echo "EXISTS: CONTEXT.md"
ls CONTEXT-MAP.md 2>/dev/null && echo "EXISTS: CONTEXT-MAP.md"
ls modules.md 2>/dev/null && echo "EXISTS: modules.md"
ls docs/adr/ 2>/dev/null && echo "EXISTS: docs/adr/"
```

```
# Check git history for key commits
git log --oneline --all 2>/dev/null | head -20
```

```
# Check if modules.md has ever been committed
git log --oneline -- modules.md 2>/dev/null | head -5
```

```
# Check pre-commit hooks
ls .husky/pre-commit 2>/dev/null && echo "EXISTS: pre-commit hook"
```

### Feature cycle signals

```
# Check for open GitHub issues
gh issue list --state open --limit 20 --json number,title,labels \
  2>/dev/null
```

```
# Check for recently merged PRs
gh pr list --state merged --limit 5 \
  --json number,title,mergedAt 2>/dev/null
```

```
# Check for any open PRs
gh pr list --state open --limit 5 \
  --json number,title,draft 2>/dev/null
```

```
# Check if modules.md was updated after the last merged PR
git log --oneline -- modules.md 2>/dev/null | head -1
git log --oneline -1 2>/dev/null
```

```
# Check for temporary files that signal work in progress
ls plans/research*.md 2>/dev/null
ls plans/prototype*.md 2>/dev/null
```

## Step 3: Determine position in workflow

Using the signals from Step 2, determine which of the following
states the project is in. Work through them in order — the first
one that matches is the current state.

**State -1: Project not initialized**
Signal: no git repo, or git repo exists but docs/agents/ and
CLAUDE.md are both absent, indicating /setup-matt-pocock-skills
has not been run.
Position: before Loop 1 — project setup required first.

**State 0: Setup done, product not defined**
Signal: git repo exists, docs/agents/ exists, CLAUDE.md exists,
but no product-brief.md.
Position: beginning of Loop 1, Step 1.

**State 1: Product defined, domain not modeled**
Signal: product-brief.md exists, CONTEXT.md does not exist
or contains only structural/technical vocabulary with no domain
concepts.
Position: Loop 1, Step 2.

**State 2: Domain modeled, AX not done**
Signal: CONTEXT.md exists with domain vocabulary, modules.md
does not exist.
Position: Loop 1, Step 3.

**State 3: AX grilled, AX PRD not created**
Signal: modules.md exists with all entries marked "proposed",
no open GitHub issues that are infrastructure-related, no
pre-commit hook.
Position: Loop 1, Step 4.

**State 4: AX PRD created, implementation not started**
Signal: open GitHub issues exist that are infrastructure-related
(TypeScript config, test harness, pre-commit hooks, module
skeleton), no pre-commit hook yet, modules.md all proposed.
Position: Loop 1, Steps 5-6.

**State 5: AX implementation in progress**
Signal: infrastructure issues partially closed, no pre-commit
hook yet or hook exists but modules.md still all proposed.
Position: Loop 1, Step 6 in progress.

**State 6: AX implementation done, modules.md not reconciled**
Signal: pre-commit hook exists, modules.md exists but all
entries still marked "proposed", no byamabe-update-modules
commit in git log.
Position: Loop 1, Step 7 — first real modules.md update needed.

**State 7: Foundation complete, no feature cycle started**
Signal: pre-commit hook exists, modules.md has at least one
confirmed entry, no open feature issues.
Position: beginning of Loop 2, Step 1.

**State 8: Feature cycle — grilling not done**
Signal: open issues exist but no PRD issue (look for issues
with "PRD" in title or a large detailed body), no research
or prototype files.
Position: Loop 2, Steps 1-2 — load modules and grill.

**State 9: Feature cycle — PRD done, issues not broken down**
Signal: a PRD GitHub issue exists, no implementation issues
broken out from it yet.
Position: Loop 2, Steps 6-7 — module boundary review then
to-issues.

**State 10: Feature cycle — implementation in progress**
Signal: open implementation issues exist, some closed, no
merged PR yet for this cycle and no open PR yet.
Position: Loop 2, Step 8 — implementation running.
Note: if all implementation issues are now closed but no PR
has been opened, flag this prominently — see PR reminder below.

**State 10b: Feature cycle — implementation done, PR not opened**
Signal: all implementation issues closed, QA issue may or may
not exist, no open PR and no merged PR for this cycle.
Position: Loop 2, between Step 8 and Step 9 — PR must be
opened before QA begins.

**State 11: Feature cycle — PR open, QA not done**
Signal: an open PR exists for this cycle, QA issue is open.
Position: Loop 2, Step 9 — manual QA against the open PR.

**State 12: Feature cycle — QA done, PR not merged**
Signal: QA issue closed, open PR still exists.
Position: Loop 2 — merge the PR before running
byamabe-update-modules.

**State 13: Feature cycle — QA done, modules not updated**
Signal: PR merged, QA issue closed, but modules.md last commit
predates the merged PR.
Position: Loop 2, Step 10 — run byamabe-update-modules.

**State 14: Modules updated, architecture review flagged**
Signal: modules.md updated after last merged PR, but
byamabe-update-modules output flagged improve-codebase-
architecture (check recent git commit messages for this signal
or ask the user if they recall).
Position: Loop 2, Step 11 — run improve-codebase-architecture.

**State 15: Cycle complete, ready for next feature**
Signal: modules.md updated after last merged PR, no open
issues except possibly new ones from QA or the backlog.
Position: Loop 2, Step 12 then back to Step 1 for next
feature.

## Step 4: Report to the user

Use the exact report template below for each state. Do not
improvise skill names or next steps — use only the skills and
actions named here. The skill names in this document are
authoritative.

---

### State -1 report

"This project is not yet initialized. Before any workflow
steps can begin, complete the following setup in order:

1. Initialize git if you have not already:
   git init

2. Install mattpocock/skills:
   npx skills@latest add mattpocock/skills

3. Run the Pocock setup skill to configure your issue tracker,
   labels, and CLAUDE.md:
   /setup-matt-pocock-skills

4. Install byamabe-dev skills (once published):
   npx skills@latest add byamabe/byamabe-dev
   Or copy manually until then:
   cp -r /path/to/byamabe-dev/skills/\* .claude/skills/

5. Once setup is complete, run /byamabe-next again to confirm
   State 0 and get your first real workflow instruction."

---

### State 0 report

"Setup is complete. You are at the beginning of the foundation
workflow.

**Where you are**: Loop 1, Step 1 — Product definition
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /grill-product

/grill-product is a structured interview skill from byamabe-dev
that grills you on who the product is for, what problems it
solves, what capability areas it must cover, and what is
explicitly out of scope. It produces product-brief.md — the
anchor document that everything else in the workflow derives
from.

Do not write product-brief.md yourself. Do not use /to-prd
or /grill-with-docs. /grill-product is the correct skill for
this step.

**What it produces**: product-brief.md at the repo root.

**Then after that**: Run /grill-domain to establish the core
domain vocabulary in CONTEXT.md."

---

### State 1 report

"**Where you are**: Loop 1, Step 2 — Domain modeling
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /grill-domain

/grill-domain is a structured interview skill from byamabe-dev
that grills you on the core concepts of the product's domain —
what they mean precisely, how they relate to each other, and
where the boundaries between them are. It reads product-brief.md
before beginning and works from the vocabulary candidates
section to seed CONTEXT.md with precise domain definitions.

Do not use /grill-with-docs for this step. /grill-with-docs
is for feature-cycle grilling sessions, not domain modeling.
/grill-domain is the correct skill for this step.

**What it produces**: CONTEXT.md with domain vocabulary and
entity relationships. ADRs for any hard domain modeling
decisions.

**Then after that**: Run /grill-ax to establish the technical
foundation."

---

### State 2 report

"**Where you are**: Loop 1, Step 3 — Agent experience
foundation
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /grill-ax

/grill-ax is a structured interview skill from byamabe-dev
that grills you on technology choices, feedback loops, testing
strategy, and initial module shape. It reads product-brief.md
and CONTEXT.md before beginning — all technology decisions are
anchored to the product and domain established in the previous
two steps.

**What it produces**: Technical ADRs, structural additions to
CONTEXT.md, and the initial modules.md with all entries marked
as proposed.

**Then after that**: Run /to-prd scoped to the AX foundation
to create the first implementation PRD."

---

### State 3 report

"**Where you are**: Loop 1, Step 4 — AX PRD
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /to-prd

This is the only PRD that is not about a user-facing feature.
Scope it explicitly to: feedback loop setup, technology
scaffolding, initial module skeleton, and test harness. Tell
the skill this is the AX foundation PRD so it does not try
to interview you — it should synthesize directly from the
grill-ax session context.

**What it produces**: A GitHub issue containing the AX PRD.

**Then after that**: Run /to-issues to break the AX PRD into
implementation issues."

---

### State 4 report

"**Where you are**: Loop 1, Steps 5-6 — AX implementation
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /tdd or let the AFK agent
work through the open infrastructure issues.

The agent should work through: TypeScript config, test harness,
pre-commit hooks, initial module skeleton, CI setup. These
are infrastructure issues, not features — the goal is a
codebase where feedback loops are deterministically enforced
before any feature work begins.

**What it produces**: Working codebase with types, tests, and
pre-commit hooks enforced. Initial module skeleton in place.

**Then after that**: Run /byamabe-update-modules to reconcile
modules.md against what was actually built, then confirm the
foundation is complete."

---

### State 5 report

"**Where you are**: Loop 1, Step 6 in progress — AX
implementation running
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Continue working through the open
infrastructure issues. Check which issues are still open:
gh issue list --state open

If the agent has stalled, start a new session and continue
from where it left off. If you are unsure what is left, run
/byamabe-next again after completing each issue.

**What it produces**: Completed infrastructure with all AX
issues closed.

**Then after that**: Run /byamabe-update-modules once all
issues are closed and the PR is merged."

---

### State 6 report

"**Where you are**: Loop 1, Step 7 — First modules.md
reconciliation
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /byamabe-update-modules

The AX implementation is done but modules.md still contains
only proposed entries from the grill-ax session. This step
reconciles those sketches against what was actually built.

**What it produces**: modules.md with confirmed entries
reflecting the real module structure. This completes the
foundation.

**Then after that**: The foundation is complete. Run
/byamabe-next to confirm you are at State 7 and ready to
begin feature cycles."

---

### State 7 report

"**Where you are**: Beginning of Loop 2 — Foundation complete,
ready for feature cycles
**How I know**: {two sentences on what exists and what is
missing}

The foundation is complete. You have:

- product-brief.md — what the product is
- CONTEXT.md — the shared domain language
- modules.md — the current module topology (all confirmed)
- Pre-commit hooks — deterministic feedback loops enforced
- ADRs — hard decisions recorded

**Immediate next action**: Run /byamabe-load-modules then
/grill-with-docs to begin the first feature cycle.

Run /byamabe-load-modules first to load the current module
topology into context, then /grill-with-docs to begin
grilling on the first feature.

**What it produces**: Shared understanding of the first
feature, CONTEXT.md updated, any new ADRs.

**Then after that**: Run /to-prd to synthesize the grilling
session into a feature PRD."

---

### State 8 report

"**Where you are**: Loop 2, Steps 1-2 — Feature grilling
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /byamabe-load-modules then
/grill-with-docs

/byamabe-load-modules loads modules.md into context so the
grilling session is aware of existing module boundaries.
/grill-with-docs then grills on the feature one question at
a time.

**What it produces**: Shared understanding of the feature,
CONTEXT.md updated.

**Then after that**: Run /to-prd to synthesize into a PRD."

---

### State 9 report

"**Where you are**: Loop 2, Steps 6-7 — Module boundary
review then issue breakdown
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Review the PRD module sketch
against modules.md manually (10 minutes), then run /to-issues

Check: does this feature fit within existing module boundaries?
Is a new module being proposed? If so, add a draft entry to
modules.md marked status: proposed before running /to-issues.

**What it produces**: GitHub implementation issues with
blocking relationships and a QA issue with a manual QA plan.

**Then after that**: Begin implementation via /tdd or AFK
Sandcastle loop."

---

### State 10 report

"**Where you are**: Loop 2, Step 8 — Implementation in
progress
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Continue working through open
implementation issues.

Check open issues:
gh issue list --state open

When all implementation issues are closed, open a PR
immediately before starting QA:
gh pr create --title \"{feature name}\" \
 --body \"Closes #{issue numbers}\"

**What it produces**: Completed implementation, PR ready
for QA.

**Then after that**: Manual QA against the open PR."

---

### State 10b report

"All implementation issues are closed but no PR has been
opened for this cycle. Opening a PR is the required next
step — it is the boundary between implementation and QA,
and /byamabe-update-modules uses the merged PR to scope
its exploration.

**Immediate next action**: Open a PR now before starting QA:
gh pr create --title \"{feature name}\" \
 --body \"Closes #{issue numbers}\"

**Then after that**: Run manual QA against the open PR.
Merge only after QA passes."

---

### State 11 report

"**Where you are**: Loop 2, Step 9 — Manual QA
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Work through the QA issue manually.

Find the QA issue:
gh issue list --state open

Work through each item in the QA plan. File new issues for
anything that fails — those re-enter the backlog. When all
QA items pass, close the QA issue.

**What it produces**: Confirmed working feature, QA issue
closed.

**Then after that**: Merge the PR, then run
/byamabe-update-modules."

---

### State 12 report

"**Where you are**: Loop 2 — QA done, PR not yet merged
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Merge the PR
gh pr merge --merge

Do not run /byamabe-update-modules until the PR is merged —
it uses the merged PR to scope its exploration.

**Then after that**: Run /byamabe-update-modules."

---

### State 13 report

"**Where you are**: Loop 2, Step 10 — Module reconciliation
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /byamabe-update-modules

This reconciles modules.md against what was actually built
in the cycle. It will scope its exploration to the merged PR,
propose changes for your review, and flag if
/improve-codebase-architecture should run before the next
cycle.

**What it produces**: modules.md updated and committed.

**Then after that**: Run /byamabe-next to confirm the cycle
is complete or to check if architecture review is needed."

---

### State 14 report

"**Where you are**: Loop 2, Step 11 — Architecture review
flagged
**How I know**: {two sentences on what exists and what is
missing}

**Immediate next action**: Run /improve-codebase-architecture

/byamabe-update-modules flagged architectural concerns from
the last cycle. Run /improve-codebase-architecture before
starting the next feature to prevent technical debt from
compounding.

**What it produces**: Refactor RFCs as GitHub issues entering
the backlog.

**Then after that**: Run /byamabe-next to confirm you are at
State 15 and ready for the next feature cycle."

---

### State 15 report

"**Where you are**: Loop 2, Step 12 — Cycle complete
**How I know**: {two sentences on what exists and what is
missing}

The feature cycle is complete. modules.md is current, the
PR is merged, QA passed, no architecture concerns flagged.

**Immediate next action**: Review whether any skills need
updating based on what you learned in this cycle. Patterns
in what /byamabe-update-modules missed are the primary signal.

**Then after that**: Run /byamabe-load-modules then
/grill-with-docs to begin the next feature cycle."

---

### PR reminder

If the current state is 10b — all implementation issues closed
but no PR opened — make this the most prominent part of the
report. Do not bury it. Use the State 10b report above.

Keep reports short and direct. Never improvise skill names.
If the state is ambiguous between two possibilities, say so
and ask one clarifying question to resolve it.
