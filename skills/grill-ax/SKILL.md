---
name: grill-ax
description: >
  Agent experience foundation session. Grills the developer on the
  technical decisions that determine how well an AI agent can work in
  this codebase over time: technology choices, feedback loops, testing
  strategy, and initial module shape. Produces technical ADRs, any
  structural additions to CONTEXT.md, and the initial modules.md.
  Run after grill-product and grill-domain, before the AX PRD.
  No feature discussion belongs here.
disable-model-invocation: true
---

Before beginning, read the following in order:

1. product-brief.md — the product's capability areas constrain
   technology choices. Technology answers to the product, not the
   other way around.
2. CONTEXT.md — the domain concepts and their relationships are
   already established. Module shape should follow domain boundaries,
   not technical convenience.
3. CONTEXT-MAP.md if it exists — if the domain has bounded contexts,
   module shape should respect those context boundaries.

There is no codebase to explore yet. Do not attempt to explore one.
There are no features to discuss. Do not raise them.
The subject of this session is the technical foundation — the
decisions that will determine how navigable and maintainable this
codebase is for a stateless agent working in it cycle after cycle.

Interview me relentlessly about each area below, one question at a
time, resolving dependencies between decisions before moving on.
For each question, provide your recommended answer with brief
reasoning.

## Area 1: Technology choices

Grill on: language, runtime, framework, database, ORM, auth approach,
deployment target.

For each choice, anchor the recommendation to the product's capability
areas from product-brief.md. A choice that serves a read-heavy
analytics product is different from one that serves a transactional
system. Do not recommend a technology in the abstract — recommend it
because it serves this product's specific needs.

For each choice, surface the real alternatives and the specific
reasons for not choosing them. These become ADR candidates — the
rejections are as important as the selections.

Resolve in dependency order: runtime before framework, database
before ORM, auth approach before deployment target. Do not move
to the next choice until the current one is settled.

## Area 2: Feedback loops

Grill on: type checking setup, formatter, pre-commit hook strategy,
CI configuration.

The goal is a set of feedback loops that a stateless agent can rely
on deterministically — loops that run without human supervision and
catch regressions before they reach the main branch.

For each feedback loop, ask:
- Does this run on every commit, or only on push?
- Does it block the commit if it fails, or only report?
- How long does it take? (An agent does not care about speed, but
  a loop that takes 10 minutes per commit will burn significant
  tokens across many cycles.)

Pre-commit hooks are more valuable for agents than for humans.
A human resents being blocked by a slow hook. An agent does not.
Bias toward enforcement at commit time rather than at push time.

## Area 3: Testing strategy

Grill on: what gets tested at what level, what gets mocked versus
hit for real, what a passing CI means for this project.

Resolve this before module shape. The testing strategy constrains
where module seams should be drawn — a module boundary is only
meaningful if it is also a test boundary.

Key questions to resolve:
- Where are the integration seams? What is the minimal set of
  things that must be tested end-to-end to have confidence the
  system works?
- What is the policy on mocking? Mocking implementation details
  produces tests that pass when the system is broken. Mocking
  at real seams produces tests that fail when they should.
- What is the test database strategy? (In-memory, test container,
  shared fixture, seeded real database?)
- What makes a test good versus bad for this project? A bad test
  is one that passes when the system is broken, fails when the
  system is fine, or has to be rewritten every time an internal
  implementation detail changes.

## Area 4: Initial module shape

Grill on: what are the major load-bearing pieces of this system,
what does each own, and where are the seams between them.

The vocabulary below is consistent with improve-codebase-architecture
from mattpocock/skills (see LANGUAGE.md in that skill). If any
conflict exists between this skill and that document, LANGUAGE.md
takes precedence.

- **Module** — anything with an interface and an implementation
- **Interface** — everything a caller must know to use the module:
  types, invariants, error modes, config. Not just the type signature.
- **Implementation** — the code behind the interface
- **Depth** — how much behaviour sits behind how simple an interface.
  A deep module hides a lot behind a small surface. A shallow module
  has an interface nearly as complex as its implementation.
- **Seam** — where an interface lives; a place behaviour can be
  altered without editing the caller

For each proposed module:
- What does it own? Be specific.
- What does it explicitly not own? Naming exclusions is as
  important as naming inclusions.
- What is its interface? What would a caller need to know to use
  it, and nothing more?
- Can it be tested in isolation through that interface without
  mocking its internals?
- Is it deep? Is there meaningful leverage at the interface, or
  is the interface nearly as complex as what it hides?

Anchor proposed modules to the domain model from CONTEXT.md.
A module that does not map to a domain concept or a group of
related domain concepts is a technical artifact, not a design
decision. Push back on technically-motivated modules that have
no domain grounding.

If CONTEXT-MAP.md exists and bounded contexts were established
in grill-domain, module boundaries should respect context
boundaries. A module that spans two bounded contexts is a smell —
surface it and resolve it before accepting the module shape.

Prefer fewer, deeper modules over many shallow ones. A stateless
agent navigating a codebase of five deep modules with clear
interfaces will outperform the same agent navigating fifty shallow
files with complex interdependencies.

## During the session

### Add to CONTEXT.md for structural vocabulary only

If structural or technical terms emerge that are specific to this
project's architecture — terms that will recur in every session
and that an agent needs to understand to navigate the codebase —
add them to CONTEXT.md using CONTEXT-FORMAT.md from mattpocock/skills
(skills/engineering/grill-with-docs/CONTEXT-FORMAT.md).

Do not add general programming concepts. Do not duplicate domain
vocabulary already established in grill-domain. Only add terms
that are architectural and specific to this project.

### Offer ADRs for hard technology choices

Technology choices are the primary ADR candidates in this session.
Apply the three-condition filter strictly:

1. Hard to reverse — switching database, ORM, or auth provider
   costs weeks or months
2. Surprising without context — a future agent or developer would
   wonder why this choice was made
3. Result of a real trade-off — genuine alternatives existed and
   were rejected for specific reasons

Use ADR-FORMAT.md from mattpocock/skills
(skills/engineering/grill-with-docs/ADR-FORMAT.md). Record the
rejected alternatives — they are often more valuable than the
choice itself, because they prevent the same conversation from
recurring in every future session.

### Do not raise features

If a feature discussion surfaces, acknowledge and defer: "That's
a feature decision — it belongs in a grill-with-docs session once
the foundation is in place."

## Terminal output

This is step 3 of 3 in the foundation workflow.

When all four areas are resolved and shared understanding is reached,
produce the initial modules.md using [MODULES-FORMAT.md].

modules.md at this stage describes proposed module shapes — the
interfaces and ownership that the AX PRD will implement. All entries
should be marked status: proposed until the AX implementation cycle
closes and byamabe-update-modules reconciles them against the actual
code.

Commit CONTEXT.md updates and any ADRs before closing the session.

Remind the user that the next step is to-prd from mattpocock/skills,
scoped to the AX foundation: feedback loops, technology scaffolding,
initial module skeleton, and test harness. This is the only PRD
that is not about a user-facing feature.
