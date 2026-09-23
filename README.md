# Executable Film Engine

A code-first, time-addressable runtime for procedural 3D films.

This repository is an engine extraction experiment inspired by structural analysis of a complex single-file real-time Titanic film demo. The goal is **not** to preserve Titanic-specific code; it is to generalize the reusable production ideas behind it into a maintainable multi-package project that can still compile down to a single shareable HTML artifact.

## Core idea

```text
FilmState = F(storyTime)
Shot      = G(storyTime, FilmState)
Frame     = Render(FilmState, Shot)
```

A film is treated as an executable, seekable world rather than a linear pile of frame-to-frame mutations. Time-pure systems can reconstruct any frame directly. Stateful systems must declare how they reconstruct: manual checkpoint/history restoration or bounded deterministic warm-up.

## Production Runtime v0.2

The current milestone moves the project beyond the original runtime skeleton:

- independent lifecycle phase ordering (`initOrder` / `updateOrder`) so services can initialize early and render late;
- explicit reconstruction policies for time-pure, manual and bounded-warmup modules;
- `CheckpointStore<T>` for stateful simulation snapshots;
- cold-seek hooks and browser determinism tests;
- deterministic particle emission / point-generation primitives;
- film-level rehearsal points and module prewarm hooks;
- per-module `throw | disable | continue` failure policies;
- Playwright screenshot-regression harness;
- headless frame rendering with FilmState + camera/lens JSON metadata.

See [`docs/production-runtime.md`](docs/production-runtime.md).

## Current packages

- `@efe/core` — clock, runtime, reconstruction/checkpoint contracts, module lifecycle, curves, RNG, events.
- `@efe/director` — shot selection and camera rig evaluation.
- `@efe/renderer-three` — Three.js renderer/camera adapter and adaptive DPR.
- `@efe/audio` — Web Audio buses and look-ahead cue scheduling with seek epochs.
- `@efe/fx` — quality/post-FX contracts plus deterministic particle primitives.
- `@efe/film-whale-fall` — first example film project.
- `@efe/studio` — minimal browser player/preview app.

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run build:single
```

Core/runtime verification:

```bash
npm run verify
```

Browser cold-seek verification:

```bash
npx playwright install chromium
npm run test:browser
```

Headless frame render:

```bash
npm run render:frame -- --time=42 --out=artifacts/frame-42.png
```

The development source remains modular; `dist/executable-film.html` is the compact distribution artifact.

## Why this architecture

Development and distribution have different goals. Source should be modular, testable and reusable; the final artifact may still be a single HTML file for portability and showcase simplicity.

The engine therefore separates:

```text
Film Project
    ↓
time-addressable Runtime
    ↓
Director / Audio / FX / Renderer
    ↓
Studio / headless render / future exporters
    ↓
single HTML or structured conditioning outputs
```

## Status

v0.2 is a **Production Runtime milestone**, not yet a complete film-production application.

The lower half of the pipeline is now explicit and testable:

```text
Film Project → Runtime → Preview / Headless Frame → Build → Single HTML
```

The next major milestone is the authoring half:

```text
Script / Intent
      ↓
Film DSL
      ↓
Timeline + Curve + Shot Editor
      ↓
Executable Film Project
      ↓
Runtime / Export
```

See:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/production-runtime.md`](docs/production-runtime.md)
- [`docs/titanic-mapping.md`](docs/titanic-mapping.md)
- [`docs/roadmap.md`](docs/roadmap.md)
