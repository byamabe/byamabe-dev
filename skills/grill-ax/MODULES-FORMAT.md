# modules.md Format

## Purpose

modules.md is a living description of how this system decomposes into
modules. It is not a spec, a ticket, or an implementation guide. It
describes current state — what exists, what each piece owns, and what
it deliberately does not own.

It is updated in place after each major implementation cycle by
byamabe-update-modules. It is never append-only. Old descriptions
are replaced, not accumulated.

## Status values

Each module entry carries one of two status values:

**proposed** — the module was sketched in grill-ax or proposed while
writing a spec. It has not yet been built. The entry describes intent, not
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

## Structure map

{The YAML block described below.}
```

## Structure map (YAML block)

The prose says what each module owns and why. The structure map says
the same boundaries in a form scripts can check:
byamabe-review-modules generates dependency rules from it and
verifies the code against it.

modules.md contains exactly one fenced `yaml` block, under the
`## Structure map` heading:

```yaml
source_roots: [src]              # where code lives; everything else is ignored
ignore: ["**/*.test.ts", "**/*.d.ts", "src/generated/**"]
shared: [schema]                 # modules any module may depend on
modules:
  - name: Content Pipeline       # exactly matches the ### heading
    status: confirmed            # exactly matches the prose Status
    paths: ["src/content/**"]
    entry: src/content/index.ts  # optional
    may_depend_on: [Corpus]
    public_exports: [generateExercise, validateExercise]
  - name: Corpus
    status: confirmed
    paths: ["src/corpus/**"]
    may_depend_on: []
    public_exports: [searchCorpus, getPassage]
  - name: schema
    status: confirmed
    paths: ["src/schema/**"]
    may_depend_on: []
    public_exports: []           # empty means "not checked"; see below
```

### Fields

| Field | Required | Meaning |
|---|---|---|
| `source_roots` | yes | Directories that contain code. Files outside them are never "unmapped". |
| `ignore` | no | Globs excluded from every check (tests, generated code, type declarations). |
| `tsconfig` | no | tsconfig used to resolve imports. Default: the nearest `tsconfig.json`, else bundler resolution, which follows `package.json` `imports` (`#alias/*`). Point it at a generated config (such as Nuxt's `.nuxt/tsconfig.json`) only if that file exists when the review runs. |
| `shared` | no | Module names every module may depend on without listing them. Use sparingly: each entry is a boundary you've chosen not to check. |
| `name` | yes | Module name, identical to its `###` heading in the prose. |
| `status` | yes | `proposed` or `confirmed`, identical to the prose **Status**. |
| `paths` | yes | Globs, relative to the project root, for the files this module owns. A file must match at most one module. A proposed module may have paths with no files yet. |
| `entry` | no | A file, or a list of files, other modules must import this module through (a list when the module has an entry per side, such as `shared` and `server`). Imports that reach past them into internal files are reported as entry bypasses. |
| `may_depend_on` | yes | Module names this module may import from, besides `shared`. Empty list means it depends on nothing. |
| `public_exports` | yes | Symbol names other modules may import. An empty list means the surface isn't checked yet (say so in **Known design debt**). |

### Rules

- **The YAML is authoritative for what scripts check;** the prose is
  authoritative for meaning. Where they overlap they must agree:
  same module names, same statuses, and every name in
  `public_exports` appears in the module's **Interface** prose.
  byamabe-review-modules checks this and reports mismatches.
- **Every dependency edge and public export is a design decision.**
  Adding one changes the target the code is checked against. Only
  the developer adds them: grill-ax asks during the session, and
  byamabe-update-modules stops and asks before writing one. Neither
  infers them from the code.
- **Paths may be updated from the code;** edges and exports may not.
  Moving or adding files inside a module's existing ownership is
  bookkeeping, not a design change.
- **Paths don't overlap.** If two modules' globs match the same file,
  the map is ambiguous and the review stops.
- **Observed drafts are not maps.** When a block is drafted from an
  existing codebase's imports, it describes how the code is wired,
  not how it should be. Mark it with a `# OBSERVED DRAFT` comment on
  its first line. byamabe-review-modules refuses to run while that
  line is present; the developer removes it after editing the draft
  into the intended design.

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
- **Every module has a structure map entry.** A prose entry without
  one, or a YAML entry without prose, is incomplete. See "Structure
  map (YAML block)" above.
