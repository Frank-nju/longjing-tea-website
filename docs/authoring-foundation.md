# Authoring Foundation v0.3

v0.3 begins the upper half of the production pipeline: authoring.

The important change is not the appearance of a timeline UI. It is that the timeline, inspector, runtime sampler and future LLM patches now share one mutable source of creative truth: `FilmProjectStore`.

## Data path

```text
film.project.json
       ↓
FilmProjectStore
       ├── numeric tracks ──→ FilmState sampling
       ├── shots ───────────→ Director
       ├── events ──────────→ Timeline
       └── mutations ───────→ live runtime + JSON serialization
```

The Studio does not maintain a second fake editing model.

Changing a shot lens or range updates the store, rebuilds the Director shot list and immediately reevaluates the current frame. Changing a numeric keyframe changes the same track subsequently sampled by the film state.

## Current Studio controls

- event markers;
- shot clips;
- track key markers;
- playhead / scrub;
- shot range, lens and aperture editing;
- numeric track-key time/value editing;
- live FilmState inspector;
- Film Project JSON export.

This is deliberately smaller than a traditional NLE. The objective is to prove the authoring contract before investing in a richer UI.

## Next authoring work

- curve editor with interpolation modes;
- camera viewport manipulation writing back to project data;
- event/cue editing;
- undo/redo transaction history;
- hot reload and persistent save-back;
- structured patch format for LLM edits.
