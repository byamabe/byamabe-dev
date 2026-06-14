---
name: grill-product
description: >
  Greenfield product definition session. Grills the developer on who the
  product is for, what problems it solves, what capability areas it covers,
  and what is explicitly out of scope. Produces product-brief.md as a
  standing document. Run before grill-domain and grill-ax — no technology
  or implementation discussion belongs here. Use when starting a new product
  or when the product definition has never been formally captured.
disable-model-invocation: true
---

There is no codebase to explore yet. Do not attempt to explore one.
There are no technology decisions to discuss. Do not raise them.
The subject of this session is the product itself — who it serves,
what problems it solves, and what it does and does not do.

Interview me relentlessly about each of the five areas below, one
question at a time, resolving dependencies between decisions before
moving on. For each question, provide your recommended answer with
brief reasoning.

## Area 1: The problem

Grill on: who experiences this problem, what their situation is when
they experience it, what they currently do instead, and why that falls
short. Push for specificity — "people who need X" is not precise
enough. "Practitioners who do Y manually today and lose Z hours per
week doing it" is. Force a primary user before moving on. Secondary
users can be named but should not dilute the primary.

## Area 2: The solution

Grill on: what this product does that solves the problem, expressed
entirely in terms of the user's experience — not technology, not
implementation. What does the user do? What do they see? What changes
for them? Push back on solution language that smuggles in implementation
assumptions ("it uses AI to..." or "it integrates with..."). Those
belong in later sessions. Here we want: what job does this product do
for the user?

## Area 3: Capability areas

Grill on: what are the major areas of capability this product needs in
order to deliver the solution? These are not features — they are
clusters of related functionality that together make the product work.
A capability area is something like "managing study schedules" or
"tracking student progress" — not "a calendar widget" or "a progress
bar component."

For each capability area proposed, ask: is this necessary for the
product to deliver its core value, or is it an enhancement? Push to
separate must-have capability areas from nice-to-have ones. The
must-have list should be uncomfortably short.

## Area 4: Explicit out of scope

Grill on: what might a reasonable person expect this product to do
that it deliberately will not do? Out of scope is not a list of
deferred features — it is a statement of what this product is not.
Force at least three explicit exclusions. Vague scope is the enemy
of good design.

## Area 5: Success

Grill on: how will we know this product is working? Not metrics
infrastructure — just: what does success look like for the primary
user? What would they say or do differently if the product was
delivering its value? This should be expressible in one or two
sentences without numbers.

## During the session

Do not raise technology, architecture, domain modeling, or
implementation at any point. If the user raises them, acknowledge
and defer: "That's an important decision — it belongs in a later
session once we've settled the product definition."

Do not produce a PRD. Do not produce GitHub issues. The output of
this session is product-brief.md only.

When vocabulary specific to this product emerges — terms the user
uses to describe their users, their problems, or their capability
areas — note them. They are candidates for CONTEXT.md in the
domain modeling session that follows.

## Terminal output

This is step 1 of 3 in the foundation workflow.

When all five areas are resolved and shared understanding is reached,
produce product-brief.md using [PRODUCT-BRIEF-FORMAT.md].

Remind the user that the next step is grill-domain — establishing
the core concepts and shared language of the domain before any
technology decisions are made.
