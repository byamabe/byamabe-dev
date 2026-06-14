# byamabe-dev

Development workflow skills for Claude Code. These skills extend and
complement mattpocock/skills with a greenfield foundation workflow
and a living module topology system.

## Dependencies

These skills depend on mattpocock/skills being installed in the same
Claude instance. Install that first:

```
npx skills@latest add mattpocock/skills
```

Make sure you select and run `/setup-matt-pocock-skills` in your
project before using any skills from this repo.

## Installation

Once this repo is published to the skills registry:

```
npx skills@latest add byamabe/byamabe-dev
```

Until then, clone this repo and copy or symlink the `skills/`
directory into your project's `.claude/skills/` directory manually:

```
git clone https://github.com/byamabe/byamabe-dev
cp -r byamabe-dev/skills/* your-project/.claude/skills/
```

## What this repo adds

Pocock's skills handle feature-level work well: grilling sessions,
PRDs, issue breakdowns, TDD implementation, architecture review.
What they do not address is the greenfield foundation — the work
that happens before the first feature exists — or a living module
topology document that persists across feature cycles.

This repo fills those gaps with three things:

**A greenfield foundation workflow** — three sequential grilling
sessions that establish the product definition, domain model, and
technical foundation before any feature work begins. Each session
produces a standing document that all subsequent feature work
references.

**modules.md** — a living description of how the system decomposes
into modules. Updated in place after each implementation cycle.
Distinct from PRDs (disposable, per-feature) and ADRs (append-only,
per-decision). The document that tells a stateless agent where things
live and what each piece owns.

**A reconciliation skill** — byamabe-update-modules compares
modules.md against what was actually built after each cycle closes,
proposes changes for human review, and flags when improve-codebase-
architecture should be run before the next cycle begins.

## Skills

### Navigation

**`/byamabe-next`**
Workflow navigator. Run this any time you are unsure what step
comes next. Reads the current state of the project — standing
documents, git history, open issues, merged PRs — and tells you
exactly where you are and what to do next. Safe to run at any
point, makes no changes.

### Greenfield foundation (run once, in order)

**`/grill-product`**
Product definition session. Grills on who the product is for, what
problems it solves, what capability areas it must cover, and what
is explicitly out of scope. No technology. No implementation.
Produces: product-brief.md

**`/grill-domain`**
Domain modeling session. Grills on core concepts, their precise
definitions, relationships between them, bounded contexts if needed,
and lifecycle/state rules. Produces: CONTEXT.md (domain vocabulary),
ADRs for hard domain modeling decisions.

**`/grill-ax`**
Agent experience foundation session. Grills on technology choices,
feedback loops, testing strategy, and initial module shape. All
decisions anchored to product-brief.md and CONTEXT.md — technology
answers to the product and domain, not the other way around.
Produces: technical ADRs, structural additions to CONTEXT.md,
initial modules.md.

### Feature cycle support (run each cycle)

**`/byamabe-load-modules`**
Loads modules.md into context before a grilling or planning session.
Run before /grill-with-docs when working on features that may touch
module boundaries. Two invocations instead of one, but explicit
about what context is being loaded.

**`/byamabe-update-modules`**
Reconciles modules.md against what was actually built in the last
implementation cycle. Scopes exploration to the merged PR diff,
falling back to git log since the last modules.md commit. Presents
proposed changes for human review before writing anything. Flags
when improve-codebase-architecture should run before the next cycle.

## Standing documents produced

| Document | Created by | Updated by | Deleted |
|---|---|---|---|
| product-brief.md | grill-product | Human when product changes | Never |
| CONTEXT.md | grill-domain | grill-with-docs each session | Never |
| CONTEXT-MAP.md | grill-domain (if bounded contexts exist) | grill-domain on rerun | Never |
| ADRs in docs/adr/ | grill-domain, grill-ax, grill-with-docs | Never (append only) | Never |
| modules.md | grill-ax | byamabe-update-modules post-cycle | Never |

## Format documents

Each skill that produces a standing document ships a format
specification alongside its SKILL.md:

- grill-product/PRODUCT-BRIEF-FORMAT.md
- grill-ax/MODULES-FORMAT.md

CONTEXT.md and ADR formats are defined in mattpocock/skills and
are not duplicated here. Skills in this repo reference them
as external dependencies.

## Relationship to byamabe-os

byamabe-os carries personal identity, PKM, and cross-domain context.
byamabe-dev carries development workflow skills. They are independent
and can be installed together without conflict.

## Relationship to mattpocock/skills

These skills extend Pocock's workflow but do not modify his skills.
Skills here that reference CONTEXT-FORMAT.md or ADR-FORMAT.md
assume those files are present via a mattpocock/skills installation.
No files from his repo are duplicated here.
