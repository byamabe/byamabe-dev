# Development Workflow

This document describes the full development workflow these skills
support. It covers both the one-time greenfield foundation loop and
the repeating feature cycle loop.

Pocock's skills are referenced where they are used. Skills from this
repo are marked [byamabe-dev]. Steps that are human-in-the-loop
process rather than skill invocations are marked [human].

---

## Prerequisites

Run once before anything else:

1. Install mattpocock/skills: `npx skills@latest add mattpocock/skills`
2. Install byamabe-dev: `npx skills@latest add byamabe/byamabe-dev`
3. Run `/setup-matt-pocock-skills` in your project

---

## Loop 1: Greenfield Foundation

Run once per project. Brownfield projects skip this loop and enter
directly at Loop 2.

### Step 1: `/grill-product` [byamabe-dev]

Input: nothing but an idea
Output: product-brief.md

Grills on: primary user, the problem they have, what the product
does for them, capability areas (must-have vs deferred), explicit
out-of-scope, and what success looks like.

No technology. No domain modeling. No implementation.

The vocabulary candidates section of product-brief.md is the seed
for the next step.

This is step 1 of 3 in the foundation workflow.

### Step 2: `/grill-domain` [byamabe-dev]

Input: product-brief.md (read before beginning)
Output: CONTEXT.md seeded with domain vocabulary, ADRs for hard
domain modeling decisions. CONTEXT-MAP.md if bounded contexts
are identified.

Grills on: precise definitions of core concepts, relationships
between them, bounded contexts if the same term means different
things in different parts of the domain, and lifecycle/state rules
for concepts that change over time.

No technology. No module design. No implementation.

This is step 2 of 3 in the foundation workflow.

### Step 3: `/grill-ax` [byamabe-dev]

Input: product-brief.md, CONTEXT.md, and CONTEXT-MAP.md if it
exists (all read before beginning)
Output: technical ADRs, structural additions to CONTEXT.md,
initial modules.md with entries marked "proposed"

Grills on four areas in order:
1. Technology choices — anchored to product capability areas
2. Feedback loops — type checking, formatter, pre-commit hooks, CI
3. Testing strategy — seams, mocking policy, test database approach
4. Initial module shape — using deep module vocabulary, anchored
   to domain concepts from CONTEXT.md and bounded context
   boundaries from CONTEXT-MAP.md if present

This is step 3 of 3 in the foundation workflow.

### Step 4: AX PRD via `/to-prd` [Pocock]

Synthesizes the grill-ax session into a PRD covering: feedback
loop setup, technology scaffolding, initial module skeleton, test
harness. The only PRD that is not about a user-facing feature.

Output: GitHub issue containing the AX PRD.

### Step 5: `/to-issues` [Pocock]

Breaks the AX PRD into vertical-slice implementation issues with
blocking relationships. These are infrastructure issues: TypeScript
config, test harness, pre-commit hooks, initial module files with
empty interfaces, CI setup.

Output: GitHub issues ready for implementation.

### Step 6: `/tdd` implementation [Pocock]

Agent works through AX issues. `/setup-pre-commit` runs here if
not already handled in the AX PRD.

Output: working codebase with feedback loops enforced, initial
module skeleton in place, passing CI.

### Step 7: modules.md first real content [human]

After AX implementation closes and the PR is merged, review
modules.md in place. Proposed entries become confirmed entries.
Module interfaces, ownership statements, and testing descriptions
are updated to reflect what was actually built rather than what
was sketched.

Time: 15-20 minutes.
Trigger: after Step 6 PR is merged.

Foundation is now complete. The repo has:
- product-brief.md — what the product is
- CONTEXT.md — the shared language
- CONTEXT-MAP.md — bounded context map (if applicable)
- modules.md — the current module topology
- ADRs — hard decisions and their rationale
- Working feedback loops — types, tests, pre-commit hooks
- Initial module skeleton — correctly shaped

---

## Loop 2: Feature Cycle

Runs for every feature. Entry point for brownfield projects.

### Step 1: `/byamabe-load-modules` [byamabe-dev]

Loads modules.md into context. Run before /grill-with-docs when
the feature may touch module boundaries.

### Step 2: `/grill-with-docs` [Pocock]

Input: CONTEXT.md, modules.md (loaded via Step 1), existing ADRs
Output: shared understanding of the feature, CONTEXT.md updated,
new ADRs if decisions meet the three-condition filter

Grills on the feature one question at a time. Challenges against
existing domain language. Cross-references with code. Surfaces
conflicts with existing module boundaries rather than making
silent assumptions.

### Step 3: Research [Pocock] (when needed)

Run when the feature requires an external service, unfamiliar
library, or architectural option that needs comparison before
committing.

Output: temporary research.md in docs/ or plans/
Lifecycle: deleted after the implementation cycle that consumes it.

### Step 4: Prototype [Pocock] (when needed)

Run when the feature has significant unknown unknowns — particularly
around UI design or a new external integration.

Output: throwaway prototype on a dev-only route.
Lifecycle: promoted into real implementation or deleted.

### Step 5: `/to-prd` [Pocock]

Synthesizes the grilling session into a PRD. Does not interview —
synthesizes. The module sketch step inside to-prd compares against
modules.md to identify which existing modules are being modified
and whether any new ones are being proposed.

Output: GitHub issue containing the PRD.

### Step 6: Module boundary review [human]

Brief checkpoint before breaking the PRD into issues.

Questions to answer:
- Does this feature fit within existing module boundaries?
- Is a new module being proposed? If so, add a draft entry to
  modules.md marked "proposed" before implementation begins.
- Are there seams that will be stressed by this feature that
  should be resolved now?

Time: 10 minutes.

### Step 7: `/to-issues` [Pocock]

Breaks the PRD into independently-grabbable vertical slice issues
with blocking relationships. Every cycle ends with a QA issue
containing a manual QA plan. Human-in-the-loop vs AFK designation
happens here.

Output: GitHub issues ready for the backlog.

### Step 8: Implementation [Pocock]

Agent picks up issues using task selection priority:
1. Critical bug fixes
2. Development infrastructure
3. Tracer bullets for new features
4. Polish and quick wins
5. Refactors

Runs through: explore → implement (red-green-refactor for backend)
→ validate via type check and tests → pre-commit hooks fire
deterministically → commit → close or comment on issue.

`/handoff` available when a secondary task surfaces mid-session
that needs its own context window.

Each issue closes with a commit. Cycle closes with a merged PR.

### Step 9: Manual QA [human]

Work through the QA issue. File new issues for anything that fails.
Failed issues re-enter the backlog.

### Step 10: `/byamabe-update-modules` [byamabe-dev]

Scopes exploration to the merged PR diff, falling back to git log
since the last modules.md commit. Compares findings against
modules.md entries for touched modules. Presents proposed changes
for human review. Flags when improve-codebase-architecture should
run before the next cycle.

Must complete before the next grill-with-docs session begins.

### Step 11: `/improve-codebase-architecture` [Pocock] (when flagged)

Run when byamabe-update-modules flags boundary crossings, design
debt, unplanned new modules, or significant interface growth.

Output: refactor RFCs as GitHub issues entering the backlog.

### Step 12: Skill and prompt review [human]

Review whether any skills need updating based on what was learned
in this cycle. Patterns in what byamabe-update-modules missed
during Step 10 are the primary signal for improving that skill.

---

## What flows forward between cycles

These documents make each cycle start with a more capable agent
than the last — not because the agent has memory, but because the
environment it enters is more precisely described:

- product-brief.md — every feature is implicitly checked against it
- CONTEXT.md — gets sharper each session as vocabulary is refined
- CONTEXT-MAP.md — bounded context boundaries stay stable
- modules.md — stays current as the topology evolves
- ADRs — prevent relitigating settled decisions
- Pre-commit hooks — deterministically enforce quality
- Commit history and closed PRs — high-value signal for future
  agent sessions, referenced by byamabe-update-modules scope
  detection

---

## Artifact lifecycle reference

| Artifact | Type | Created | Updated | Deleted |
|---|---|---|---|---|
| product-brief.md | Standing, in-place | grill-product | Human when product changes | Never |
| CONTEXT.md | Standing, in-place | grill-domain | grill-with-docs each session | Never |
| CONTEXT-MAP.md | Standing, in-place | grill-domain (if bounded contexts exist) | grill-domain on rerun | Never |
| ADRs | Append-only | grill-domain, grill-ax, grill-with-docs | Never | Never |
| modules.md | Standing, in-place | grill-ax | byamabe-update-modules post-cycle | Never |
| research.md | Temporary | Research session | Not updated | After consuming cycle |
| Prototype code | Temporary | Prototype session | During session | After promoting or abandoning |
| PRD (GitHub issue) | Disposable | to-prd | Not updated | Closed after implementation |
| Implementation issues | Disposable | to-issues | Agent comments during work | Closed after implementation |
| QA issue | Disposable | to-issues | Developer during QA | Closed after QA passes |
| Refactor RFCs | Disposable | improve-codebase-architecture | Not updated | Closed after refactor |
