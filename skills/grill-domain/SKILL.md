---
name: grill-domain
description: >
  Domain modeling session. Grills the developer on the core concepts of
  the product's domain — what they mean precisely, how they relate to
  each other, and where the boundaries between them are. Produces the
  initial CONTEXT.md seeded with domain vocabulary and entity
  relationships. CONTEXT-MAP.md if bounded contexts are identified.
  Run after grill-product and before grill-ax. No technology,
  no implementation, no module design belongs here.
disable-model-invocation: true
---

Before beginning, read product-brief.md in full. The vocabulary
candidates section is your starting point — these are the terms that
surfaced during the product definition session and need to be resolved
into precise domain concepts.

There is no codebase to explore yet. Do not attempt to explore one.
There are no technology decisions to discuss. Do not raise them.
There is no module design to discuss. Do not raise it.
The subject of this session is the domain — the concepts that exist
in the world this product operates in, independent of how any software
will represent them.

Interview me relentlessly about each area below, one question at a
time, resolving dependencies between decisions before moving on. For
each question, provide your recommended answer with brief reasoning.

## Area 1: Core concepts

Work through the vocabulary candidates from product-brief.md one by
one. For each term:

- Propose a precise definition in one sentence
- Identify any terms the user might use interchangeably that should
  be avoided
- Ask whether this concept is real from the domain expert's
  perspective or whether it is an implementation artifact

Push back on implementation artifacts. If a term only makes sense
in the context of how software will handle it — not in the language
a domain expert would use when talking about their work without any
software present — it does not belong in CONTEXT.md. Defer it to
grill-ax.

Do not move on until each term has a precise agreed definition and
a clear list of aliases to avoid.

## Area 2: Relationships

Once the core concepts are defined, grill on how they relate to each
other. For each relationship:

- What is the cardinality? (one-to-one, one-to-many, many-to-many)
- Which concept owns the relationship?
- What happens to one when the other is deleted or changes state?

Use concrete scenarios to stress-test claimed relationships. If the
user says "a Student belongs to a Course", invent a scenario that
probes the edge: "What happens to the Student's progress if the
Course is unpublished? Does the Student still exist? Does their
progress still exist?"

Force precision. Vague relationships produce vague code.

## Area 3: Bounded contexts

Ask whether the domain has distinct areas that use the same word to
mean different things. This is the signal that bounded contexts exist.

For example: does "User" mean the same thing in the authentication
area as it does in the billing area? Does "Course" mean the same
thing to the student as it does to the instructor?

If the same term carries different meaning in different parts of the
domain, propose splitting the domain into bounded contexts with their
own CONTEXT.md files and a CONTEXT-MAP.md at the root.

Do not split contexts eagerly. Most small products have a single
context. Only split when a term genuinely carries conflicting meaning
that cannot be resolved by renaming — not just because different
parts of the product use a concept differently.

If bounded contexts are identified, establish:
- What is the name and scope of each context
- What terms each context owns exclusively
- How the contexts relate to each other (what flows between them
  and in which direction)

## Area 4: Lifecycle and state

For any concept that changes over time or has distinct states, grill
on its lifecycle:

- What states can it be in?
- What causes it to transition between states?
- What is the starting state and what are the terminal states?
- Are there states that are irreversible?

Do not design the state machine implementation. Just establish what
the states are and what the business rules are that govern transitions.
The implementation belongs in grill-ax.

## During the session

### Challenge implementation language

If the user describes a concept in implementation terms ("it's stored
as a JSON blob", "it's a foreign key to the users table"), redirect:
"Set aside how it will be stored for now — what is this concept in
the domain? What would a domain expert call it?"

### Challenge overloaded terms

If the user uses a term that seems to mean different things in
different sentences, surface it immediately: "You used 'account' to
mean X here and Y earlier — are these the same concept or two
different ones?"

### Use concrete scenarios

When a relationship or rule is being established, invent a specific
scenario that probes it. Abstract rules sound plausible until you
apply them to a real case and find they break.

### Update CONTEXT.md inline

When a term is resolved, write it to CONTEXT.md immediately using
the format defined in CONTEXT-FORMAT.md from mattpocock/skills
(skills/engineering/grill-with-docs/CONTEXT-FORMAT.md). Do not
batch updates. Capture terms as they are settled.

CONTEXT.md is a glossary only. No implementation details. No
schema. No module references. Only concepts that exist in the domain
independent of any software.

### Offer ADRs for domain modeling decisions

Domain modeling decisions can meet the ADR three-condition filter:
hard to reverse, surprising without context, result of a real
trade-off. Examples that qualify:

- Deciding that two things the user calls by the same name are
  actually distinct concepts with different lifecycles
- Deciding that a bounded context boundary runs through a particular
  seam rather than another
- Deciding that a concept belongs to one context rather than another
  when it could reasonably belong to either

Use the format defined in ADR-FORMAT.md from mattpocock/skills
(skills/engineering/grill-with-docs/ADR-FORMAT.md). Apply the same
three-condition filter as grill-with-docs — do not create ADRs for
obvious decisions.

## Terminal output

This is step 2 of 3 in the foundation workflow.

When all concepts are defined, relationships are established, bounded
contexts are resolved (or confirmed as unnecessary), and lifecycles
are captured, the session is complete.

At this point the following should exist:

CONTEXT.md (using CONTEXT-FORMAT.md from mattpocock/skills) with:
- All core domain concepts with precise definitions and aliases
  to avoid
- Relationships section showing how concepts relate
- Example dialogue demonstrating the language in use
- Flagged ambiguities resolved

If bounded contexts were identified, CONTEXT-MAP.md should exist
pointing to each context's CONTEXT.md.

Do not produce a PRD. Do not produce GitHub issues. Do not make
any technology recommendations.

Remind the user that the next step is grill-ax — establishing the
technical foundation that will serve this domain model.
