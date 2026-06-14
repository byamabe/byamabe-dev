# product-brief.md Format

## Purpose

product-brief.md is the standing definition of what this product is.
It is not a PRD, a spec, or a roadmap. It does not describe how
anything is built. It describes who the product is for, what it does
for them, what capability areas it covers, and what it explicitly
does not do.

It is updated in place when the product definition changes — not
appended to. It is never disposable. Every subsequent grilling
session, PRD, and feature decision should be checked against it.

## Structure

```
# Product Brief: {Product Name}

## Primary user

{One or two sentences describing the primary user precisely. Not a
persona — a description of the situation they are in and what they
are trying to do. Secondary users listed briefly below if they exist.}

## The problem

{Two or three sentences describing the problem the primary user
experiences. Written from their perspective, in their language.
Does not mention technology or solution.}

## What this product does

{Two or three sentences describing what the product does for the
user, expressed entirely in terms of their experience. No
implementation language. No technology references.}

## Capability areas

Must-have:
- {Capability area}: {One sentence describing what this covers and
  why it is necessary for the product to deliver its core value.}
- {Capability area}: ...

Not in v1 but likely:
- {Capability area}: {One sentence on why it is deferred rather
  than excluded.}

## Explicitly out of scope

- {Thing this product will not do, and why that boundary exists.}
- {Thing this product will not do, and why that boundary exists.}
- {Thing this product will not do, and why that boundary exists.}

## What success looks like

{One or two sentences describing what the primary user would say or
do differently if this product is delivering its value. No metrics,
no infrastructure, no dashboards.}

## Vocabulary candidates

{Terms that emerged during the product definition session that are
likely to become domain concepts. Not definitions yet — those belong
in CONTEXT.md after grill-domain. Just a list of candidate terms to
bring into the domain modeling session.}
```

## Rules

- **No implementation language.** Technology, architecture, frameworks,
  integrations — none of it belongs here. If it appears, remove it.
- **Primary user must be specific.** "Developers" is not specific.
  "Junior developers joining an unfamiliar codebase for the first
  time" is specific.
- **Capability areas are not features.** "User authentication" is a
  feature. "Managing identity and access" is a capability area.
- **Out of scope must have reasoning.** "We won't do X" without
  explaining why is not useful. "We won't do X because our primary
  user doesn't need it and it would distort the product toward a
  different audience" is useful.
- **Vocabulary candidates are not definitions.** They are a handoff
  to the domain modeling session. Do not define them here.
- **Update in place, never append.** When the product definition
  changes, rewrite the affected sections. This is not a log.
