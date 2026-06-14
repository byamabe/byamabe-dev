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
git log --oneline --all | head -20
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

**State 0: Not started**
Signal: no product-brief.md, no CONTEXT.md, no modules.md,
no git history beyond an initial commit.
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
merged PR yet for this cycle.
Position: Loop 2, Step 8 — implementation running.

**State 11: Feature cycle — implementation done, QA not done**
Signal: a QA issue exists and is open, implementation issues
are closed, no merged PR yet or PR merged but QA issue still
open.
Position: Loop 2, Step 9 — manual QA.

**State 12: Feature cycle — QA done, modules not updated**
Signal: PR merged, QA issue closed, but modules.md last commit
predates the merged PR.
Position: Loop 2, Step 10 — run byamabe-update-modules.

**State 13: Modules updated, architecture review flagged**
Signal: modules.md updated after last merged PR, but
byamabe-update-modules output flagged improve-codebase-
architecture (check recent git commit messages for this signal
or ask the user if they recall).
Position: Loop 2, Step 11 — run improve-codebase-architecture.

**State 14: Cycle complete, ready for next feature**
Signal: modules.md updated after last merged PR, no open
issues except possibly new ones from QA or the backlog.
Position: Loop 2, Step 12 then back to Step 1 for next
feature.

## Step 4: Report to the user

Report in this format:

---
## Where you are

**Loop**: {Foundation (Loop 1) | Feature cycle (Loop 2)}
**Step**: {step number and name from workflow}
**How I know**: {two or three sentences describing the specific
signals that placed you here — what exists, what is missing,
what the git history shows}

## What to do next

**Immediate next action**: {the single most important thing
to do right now, with the exact skill invocation or action}

**What it produces**: {what artifact or outcome this step
creates}

**Then after that**: {the step that follows, briefly}

## Anything that looks off

{If any signals are inconsistent — for example, modules.md
exists but has no confirmed entries despite a pre-commit hook
being present — flag it here with a brief explanation of
what might have been skipped and how to recover.}

---

Keep the report short and direct. The user is looking for
a clear next action, not a full workflow explanation.
If the state is ambiguous between two possibilities, say so
and ask one clarifying question to resolve it.
