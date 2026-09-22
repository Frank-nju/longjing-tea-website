# Titanic demo -> engine mapping

This document records the structural ideas extracted from the provided Titanic demo. It is a design mapping, not a source-code copy.

| Titanic module | Generalized engine responsibility | Current target |
|---|---|---|
| `00_core` | clock, constants, events, deterministic utilities, module lifecycle | `packages/core` |
| `10_story` | story events + pure `state = F(t)` | film project + future Film DSL |
| `20_sky` | reusable environment/world system | film module now; environment package later |
| `30_ocean` | domain-specific procedural environment | film module / future water package |
| `40_ship` | film-specific procedural asset | film project world module |
| `45_props` | film-specific world props | film project world module |
| `50_audio` | scheduler, buses, synthesis/sampling, seek epochs | `packages/audio` |
| `55_score` | score as data | film project + future score package |
| `60_fx` | particles, post stack, history-aware effects | `packages/fx` + renderer adapter |
| `70_director` | shot list, camera rig, lens/focus/aperture | `packages/director` |
| `80_ui` | playback/debug/film overlays | `apps/studio`, later `packages/ui` |
| `90_main` | bootstrap, lifecycle, renderer integration, adaptive quality | `packages/core` + renderer adapter |

## Important retained ideas

### 1. Absolute story time as authority
The most important idea is not Three.js. It is a deterministic story-time contract shared by the world, camera, UI, FX, and audio.

### 2. Director is separate from story
A story event is world truth; a shot is a presentation decision. Keeping these separate enables re-directing the same simulation.

### 3. Seek is a first-class constraint
Particles, audio, and other transient systems must define how they reconstruct when the viewer jumps directly into the middle of the film.

### 4. Performance is part of authorship
Quality tiers, adaptive DPR, prewarming, LOD, and graceful fallback belong in the runtime design, not as an afterthought.

### 5. Single-file output is a packaging target
The reference artifact demonstrates that complex cinematic software can be *distributed* as one HTML file even if its logical source is modular.
