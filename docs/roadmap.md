# Roadmap

## Phase 0 — extraction

- [x] monorepo/workspace skeleton
- [x] absolute story clock
- [x] deterministic film sampler contract
- [x] ordered module lifecycle
- [x] service registry
- [x] director + shot abstraction
- [x] Three.js renderer adapter
- [x] adaptive DPR baseline
- [x] Web Audio buses + look-ahead cue scheduler
- [x] example `Whale Fall` film
- [x] modular build -> single HTML packager

## Phase 1 — Production Runtime v0.2

- [x] checkpoint/history API for stateful modules
- [x] bounded warm-up reconstruction contract
- [x] cold-seek browser test harness
- [x] deterministic particle primitives
- [x] rehearsal/prewarm API
- [x] per-module failure/fallback policy
- [x] browser screenshot regression harness
- [x] headless single-frame rendering + camera/state metadata
- [x] quality tier baseline
- [ ] renderer feature-capability negotiation
- [ ] committed visual baselines from a GPU-stable CI runner

## Phase 2 — cinematic renderer

- [ ] HDR render graph
- [ ] bloom
- [ ] depth of field driven by director focus/aperture
- [ ] film grain / vignette / grade
- [ ] depth texture service
- [ ] planar reflection interface
- [ ] volumetric atmosphere primitives
- [ ] motion vectors / TAA hooks

## Phase 3 — audio engine

- [ ] score event format
- [ ] sampler abstraction
- [ ] synth fallback/baking
- [ ] convolution reverb
- [ ] automation curves
- [ ] ducking and shot-aware perspective
- [ ] offline audio rendering

## Phase 4 — authoring system

- [ ] Film Project schema / JSON schema
- [ ] declarative track system
- [ ] timeline editor
- [ ] curve editor
- [ ] shot inspector
- [ ] viewport camera tools
- [ ] event/cue markers
- [ ] hot reload
- [ ] undo/redo and Git-friendly serialization

## Phase 5 — AI film compilation

- [ ] natural language -> Film DSL planner
- [ ] LLM shot revisions as structured patches
- [ ] automatic hero-frame validation
- [ ] RGB/depth/normal/object-ID exports
- [ ] camera trajectory + lens metadata export
- [ ] motion-vector/optical-flow conditioning export
- [ ] OpenUSD exporter
- [ ] OpenTimelineIO exporter
- [ ] AI-video conditioning package

## Phase 6 — second renderer / proof of abstraction

- [ ] Blender exporter or headless render backend
- [ ] Unreal/OpenUSD handoff experiment
- [ ] same film project rendered by two backends
