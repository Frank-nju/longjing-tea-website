# Executable Film Engine

A code-first, time-addressable runtime for procedural 3D films.

This repository is an engine extraction experiment inspired by structural analysis of a complex single-file real-time Titanic film demo. The goal is **not** to preserve Titanic-specific code; it is to generalize the reusable production ideas behind it into a maintainable multi-package project that can still compile down to a single shareable HTML artifact.

## Core idea

```text
FilmState = F(storyTime)
Shot      = G(storyTime, FilmState)
Frame     = Render(FilmState, Shot)
```

A film is treated as an executable, seekable world rather than a linear pile of frame-to-frame mutations. Time-pure systems can reconstruct any frame directly. Stateful systems should provide snapshots, history caches, or deterministic reconstruction.

## Current packages

- `@efe/core` — clock, runtime, module lifecycle, curves, RNG, events.
- `@efe/director` — shot selection and camera rig evaluation.
- `@efe/renderer-three` — Three.js renderer/camera adapter and adaptive DPR.
- `@efe/audio` — Web Audio buses and look-ahead cue scheduling with seek epochs.
- `@efe/fx` — reusable quality/post-FX contracts and control primitives.
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
```

Create a single-file deliverable:

```bash
npm run build:single
```

The development source remains modular; `dist/executable-film.html` is the compact distribution artifact.

## Why this architecture

The original reference demo demonstrates that a sophisticated cinematic runtime can still be distributed as one HTML file. This project keeps that deployment property while separating source concerns so the engine can support multiple films, editors, exporters, and render backends.

See:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/titanic-mapping.md`](docs/titanic-mapping.md)
- [`docs/roadmap.md`](docs/roadmap.md)

## Status

`0.1.0` is a working engine skeleton, not a production film tool. The current milestone proves:

1. deterministic story-time evaluation;
2. modular film/runtime separation;
3. data-driven shot selection;
4. browser Three.js preview;
5. seek-safe audio cue epochs;
6. modular source -> single-file distribution.

The next major step is an authoring layer: timeline editor + Film DSL + shot/curve inspector + export passes (RGB/depth/normal/object ID/motion/camera metadata).
