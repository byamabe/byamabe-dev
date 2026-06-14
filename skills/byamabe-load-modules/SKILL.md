---
name: byamabe-load-modules
description: >
  Loads the current module map into context before a grilling or
  planning session. Read modules.md if it exists, summarize the
  current module topology, and flag any modules marked as proposed
  versus confirmed. Use before grill-with-docs when working on
  features that may touch module boundaries.
disable-model-invocation: true
---

If modules.md exists at the root of this project, read it in full.

Summarize the current module topology in three to five sentences:
what the major modules are, what each owns, and which if any are
marked as proposed rather than confirmed.

Flag any modules whose ownership boundaries are adjacent to the
feature or topic currently being discussed. If no feature has been
mentioned yet, just confirm the module map is loaded and wait.

Do not make any changes to any files. Do not start a grilling
session. This is a context loading step only.

When complete, tell the user the module map is loaded and they
can proceed with /grill-with-docs.

If modules.md does not exist, tell the user it has not been created
yet. If this is a greenfield project, it will be produced by
grill-ax. If this is a brownfield project, it can be created by
running improve-codebase-architecture from mattpocock/skills to
establish a baseline.
