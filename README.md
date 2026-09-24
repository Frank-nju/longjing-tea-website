# Executable Film Engine

A code-first, time-addressable runtime and authoring foundation for procedural 3D films.

This repository began as an engine-extraction experiment inspired by structural analysis of a complex single-file real-time Titanic film demo. The goal is **not** to preserve Titanic-specific code; it is to generalize the reusable production ideas behind it into a maintainable film-production system that can still compile to a single shareable HTML artifact.

## Core idea

```text
FilmState = F(storyTime)
Shot      = G(storyTime, FilmState)
Frame     = Render(FilmState, Shot)
```

A film is treated as an executable, seekable world rather than a linear pile of frame-to-frame mutations.

## Production Runtime v0.2

The lower half of the pipeline is now hardened and CI-verified:

- independent lifecycle phase ordering;
- explicit reconstruction policies;
- checkpoint/history primitives;
- bounded cold-seek warmup;
- deterministic particle primitives;
- rehearsal/prewarm;
- module fallback policies;
- browser cold-seek tests;
- screenshot-regression harness;
- headless frame rendering with FilmState + camera/lens metadata.

See [`docs/production-runtime.md`](docs/production-runtime.md).

## Authoring Foundation v0.3

The upper half of the pipeline has now started.

A new `@efe/project` package makes `film.project.json` a live, mutable source of creative truth rather than passive documentation:

```text
film.project.json
       ↓
FilmProjectStore
       ├── tracks ──→ FilmState
       ├── shots ───→ Director
       ├── events ──→ Studio Timeline
       └── edits ───→ Runtime + JSON export
```

The Studio now includes:

- event markers;
- shot clips and playhead;
- numeric track keyframes;
- shot range / lens / aperture inspector;
- track-key time / value inspector;
- live FilmState readout;
- project JSON export.

Edits are not UI-only. They mutate the same Project Store sampled by the running film.

See [`docs/authoring-foundation.md`](docs/authoring-foundation.md).

## Current packages

- `@efe/core` — clock, runtime, reconstruction/checkpoint contracts, lifecycle, curves, RNG, events.
- `@efe/project` — Film Project schema types, live store, validation, structured edits and serialization.
- `@efe/director` — shot selection and camera rig evaluation.
- `@efe/renderer-three` — Three.js renderer/camera adapter and adaptive DPR.
- `@efe/audio` — Web Audio buses and seek-safe cue scheduling.
- `@efe/fx` — quality/post-FX contracts plus deterministic particle primitives.
- `@efe/film-whale-fall` — first Film Project wired through the authoring model.
- `@efe/studio` — browser preview + first authoring surface.

## Run

```bash
npm install
npm run dev
```

Verification:

```bash
npm run verify
npx playwright install chromium
npm run test:browser
```

Single-file artifact:

```bash
npm run build:single
```

Headless frame:

```bash
npm run render:frame -- --time=42 --out=artifacts/frame-42.png
```

## Production pipeline

```text
Script / Intent
      ↓
Film Project / future DSL
      ↓
Studio authoring
      ↓
time-addressable Runtime
      ↓
Director / Audio / FX / Renderer
      ↓
Preview / Headless Render / future exporters
      ↓
single HTML or structured AI-video conditioning outputs
```

## Status

v0.3 is an **Authoring Foundation**, not yet a complete NLE/DCC.

The next authoring work is curve interpolation, viewport camera manipulation, event/cue editing, undo/redo, persistent save-back and structured LLM patching. Renderer and AI-film export milestones continue in parallel.

See:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/production-runtime.md`](docs/production-runtime.md)
- [`docs/authoring-foundation.md`](docs/authoring-foundation.md)
- [`docs/titanic-mapping.md`](docs/titanic-mapping.md)
- [`docs/roadmap.md`](docs/roadmap.md)
