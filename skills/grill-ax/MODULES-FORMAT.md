# modules.md Format

## Purpose

modules.md is a living description of how this system decomposes into
modules. It is not a PRD, a spec, or an implementation guide. It
describes current state — what exists, what each piece owns, and what
it deliberately does not own.

It is updated in place after each major implementation cycle by
byamabe-update-modules. It is never append-only. Old descriptions
are replaced, not accumulated.

## Status values

Each module entry carries one of two status values:

**proposed** — the module was sketched in grill-ax or a PRD module
sketch. It has not yet been built. The entry describes intent, not
reality. byamabe-update-modules will confirm or revise it after the
implementation cycle closes.

**confirmed** — the module was built and reconciled against the code
by byamabe-update-modules. The entry describes reality. It should be
treated as accurate until the next implementation cycle closes.

## Structure

```
# Module Map

{One sentence describing the system and its primary purpose.}

## Modules

### {Module Name}

**Status**: proposed | confirmed
**Owns**: {What this module is responsible for. Be specific.}
**Does not own**: {What a reader might expect this module to handle
but does not. Explicit exclusions prevent scope creep and stop the
agent from expanding scope during implementation.}
**Interface**: {How the rest of the system talks to this module.
Function names, method signatures, or a description of the public
surface. Keep it brief. This should be the stable part — what
callers need to know and nothing more.}
**Tested via**: {What kind of tests cover this module and at what
level. e.g. "Integration tests through the public service interface,
no internal unit tests."}
**Known design debt**: {Anything that is currently wrong or shallow
about this module that has been deliberately deferred. Leave blank
if none.}

---

### {Next Module}

...

## Cross-cutting concerns

{Anything that does not belong to a single module — auth, logging,
error handling strategy, shared types. Describe who owns the policy
and who consumes it.}

## Deliberate gaps

{Things that are explicitly not modelled yet and why. Prevents the
agent from inventing structure to fill apparent holes.}
```

## Rules

- **Status is mandatory.** Every entry must be marked proposed or
  confirmed. An entry without a status is ambiguous and should be
  treated as proposed.
- **Describe current state, not intent.** Confirmed entries reflect
  reality. If a module does not exist yet, mark it proposed.
- **Explicit exclusions are mandatory.** Every module entry must have
  a "Does not own" section. An entry without one is incomplete.
- **Keep interface descriptions stable.** The interface section should
  describe what rarely changes. Do not list internal helpers or
  implementation details.
- **Update in place, never append.** When a module changes, rewrite
  its entry. This is not a log.
- **Flag design debt honestly.** If a module is shallower than it
  should be, say so. The agent will make better decisions with an
  honest map than a flattering one.
- **One entry per meaningful boundary.** Do not create entries for
  every file. A module is a meaningful unit of ownership, not a file.
- **Proposed entries are targets, not facts.** The agent should build
  toward them but byamabe-update-modules may revise them after seeing
  what was actually built.
