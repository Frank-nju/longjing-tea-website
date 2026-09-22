# Architecture

## 1. Design invariant

The engine treats a film as a time-addressable executable world.

```text
FilmState(t) = Project.sample(t)
Camera(t)    = Director.evaluate(t, FilmState(t))
Audio(t)     = Scheduler(project cues, t)
Frame(t)     = Renderer(FilmState(t), Camera(t))
```

The central requirement is **seek correctness**. A cold render at `t = 52.0` should converge to the same visible state as playing continuously from `t = 0` to `t = 52.0`.

Time-pure modules satisfy this naturally. Stateful modules must explicitly support reconstruction through one of:

1. analytic state from absolute time;
2. deterministic snapshots;
3. precomputed history textures/caches;
4. bounded warm-up from a known checkpoint.

## 2. Layers

### Film project
Owns creative facts: story events, world entities, shot list, score/cues, authored curves, film-specific procedural geometry.

### Core runtime
Owns master story time, seek/play/pause, module lifecycle, services, deterministic utilities, and absolute-time evaluation.

### Director
Owns how the world is photographed. It must not own story truth. The same world can therefore be re-directed without rewriting simulation/state.

### Renderer adapters
Own backend-specific scene/camera/render implementation. Three.js is the first backend, not the engine definition.

### Audio
Owns sample-accurate scheduling, buses, cue epochs, mixing, and future score/sampler/synthesis systems.

### FX
Owns reusable render passes and quality policy. It should consume director metadata such as focus distance/aperture rather than embedding shot logic.

### Authoring layer (planned)
Timeline, curve editor, shot inspector, viewport, film DSL, natural-language editing, and export tools.

## 3. Why multi-file source + single-file distribution

Development and distribution have different optimization targets.

Source should maximize:

- maintainability;
- testability;
- package reuse;
- editor tooling;
- multiple films/backends.

Distribution may maximize:

- portability;
- reproducibility;
- one-click sharing;
- benchmark/showcase simplicity.

Therefore the project deliberately supports:

```text
modular monorepo source
        ↓ build
static browser bundle
        ↓ package
single HTML artifact
```

## 4. Service boundaries

Packages communicate through explicit services stored in the runtime registry. Film modules can depend on capabilities (`renderer-three`, `audio`) without importing an application singleton.

This is the first extraction step away from a global `TT` namespace while preserving the original demo's clear module ownership.

## 5. Future Film DSL

The long-term authoring format should be more declarative than direct JavaScript:

```yaml
film:
  duration: 80

events:
  abyss: 42
  floor: 63.5

shots:
  - id: abyss-wide
    range: [44, 58]
    camera:
      lens: 40mm
      subject: whale
      motion: orbit

tracks:
  whale.depth:
    - [10, 0]
    - [42, 540]
    - [64, 895]
```

JavaScript/TypeScript remains available for procedural systems, but ordinary directing should become data-first so humans, tools, and LLM agents can all edit the same project representation.
