# Module Map

Fixture system for testing the review script.

## Modules

### Content Pipeline

**Status**: confirmed
**Owns**: Generating exercises.
**Does not own**: Rendering.
**Interface**: `generateExercise(q, all, mode)`, `validateExercise(x)`.

---

### Corpus

**Status**: confirmed
**Owns**: Search over passages.
**Does not own**: Ranking for display.
**Interface**: `searchCorpus(q, all)`, `getPassage(id)`.

---

### UI

**Status**: confirmed
**Owns**: Rendering.
**Does not own**: Exercise logic.
**Interface**: `render(all)`.

---

### schema

**Status**: confirmed
**Owns**: Shared types.
**Does not own**: Behaviour.
**Interface**: `Passage` type.

---

### Grading

**Status**: proposed
**Owns**: Scoring answers.
**Does not own**: Content.
**Interface**: `gradeAnswer(a)`.

---

### Analytics

**Status**: proposed
**Owns**: Usage tracking.
**Does not own**: Anything else.
**Interface**: none yet.

## Structure map

```yaml
source_roots: [src]
ignore: ["**/*.test.ts"]
shared: [schema]
modules:
  - name: Content Pipeline
    status: confirmed
    paths: ["src/content/**"]
    entry: src/content/index.ts
    may_depend_on: [Corpus]
    public_exports: [generateExercise, validateExercise]
  - name: Corpus
    status: confirmed
    paths: ["src/corpus/**"]
    entry: src/corpus/index.ts
    may_depend_on: []
    public_exports: [searchCorpus, getPassage]
  - name: UI
    status: confirmed
    paths: ["src/ui/**"]
    may_depend_on: [Content Pipeline]
    public_exports: [render]
  - name: schema
    status: confirmed
    paths: ["src/schema/**"]
    may_depend_on: []
    public_exports: []
  - name: Grading
    status: confirmed
    paths: ["src/grading/**"]
    may_depend_on: [Content Pipeline]
    public_exports: [gradeAnswer]
  - name: Analytics
    status: proposed
    paths: ["src/analytics/**"]
    may_depend_on: []
    public_exports: [trackEvent]
```
