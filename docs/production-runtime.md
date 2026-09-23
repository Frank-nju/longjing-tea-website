# Production Runtime v0.2

The v0.2 milestone hardens the original time-addressable runtime into a production-oriented reconstruction system.

## Reconstruction contract

Every module can declare one of three reconstruction modes:

- `pure`: visible state is a direct function of absolute story time.
- `manual`: the module reconstructs itself in `seek(request, ctx)`, usually by restoring a checkpoint/history cache.
- `warmup`: the runtime replays only that module over a bounded interval before the target time.

The goal is not to force every simulation into a pure function. The goal is to make hidden history explicit.

```text
cold seek to t
    ↓
module seek hooks
    ↓
checkpoint restore / reset
    ↓
bounded module warmup when requested
    ↓
FilmState = F(t)
    ↓
all modules evaluate target frame
```

## Lifecycle phase ordering

Initialization order and frame-update order are separate contracts. A renderer can initialize early to publish scene services while still updating last to present the fully-updated frame. Modules can use `initOrder`, `updateOrder`, and `resizeOrder` rather than overloading one global order for incompatible lifecycle phases.

## Checkpoints

`CheckpointStore<T>` stores deterministic snapshots and retrieves the nearest snapshot at or before a target time. Stateful modules own the actual snapshot payload and decide when to save/restore it.

## Rehearsal / prewarm

Films can declare representative times:

```ts
rehearsal: [1.5, 10.5, 22, 42, 58, 64, 72, 78]
```

During `runtime.init()`, the engine visits those states and calls module `prewarm()` hooks. Render backends can compile shader/program state before playback reaches a heavy scene for the first time.

## Failure policy

Each module can opt into:

- `throw` — fail fast (default);
- `disable` — emit `moduleError`, disable the failing module, keep the film alive;
- `continue` — emit the error and continue trying the module on later frames.

This makes graceful degradation an explicit engine contract instead of ad-hoc try/catch blocks.

## Deterministic particles

`@efe/fx` now includes renderer-neutral primitives for:

- deterministic emission schedules;
- absolute-time lifetime queries;
- deterministic point generation.

Particles can therefore be authored as `particle(t - birthTime)` rather than relying on hidden frame-to-frame RNG state.

## Validation and headless rendering

The repository now contains three validation layers:

1. `npm run test:core` — deterministic checkpoint / warmup / particle tests.
2. `npm run test:browser` — reload + cold-seek state determinism in a real browser.
3. `npm run test:visual` — Playwright screenshot regression harness for representative hero frames.

A headless single-frame renderer is also available:

```bash
npx playwright install chromium
npm run render:frame -- --time=42 --out=artifacts/abyss.png
```

It writes both the rendered PNG and a JSON sidecar containing FilmState and camera/lens metadata.

This is the first step toward the later RGB/depth/normal/object-ID conditioning export pipeline.
