# Design principles

1. **Story time is authoritative.** Frame state must be addressable by absolute time.
2. **World truth and directing are separate.** A camera cut must never redefine simulation truth.
3. **Film projects own creative facts; engine packages own reusable mechanics.**
4. **Stateful systems must declare reconstruction semantics.** Hidden frame-history dependence is a bug.
5. **Performance behavior is deterministic enough to reason about.** Quality degradation should be explicit.
6. **Source is modular; artifacts may be aggressively packaged.** Single-file output is a distribution choice.
7. **Everything important should be inspectable.** Time, shot, camera, state, audio cues, and quality should become editor/debug surfaces.
8. **LLMs edit structured intent, not arbitrary pixels.** Long-term authoring should expose a Film DSL and typed project graph.
9. **Render backends are replaceable.** Three.js is first, not final.
10. **Previs and final-generation handoff share the same scene truth.** Export geometry/camera/depth/normal/object IDs instead of flattening everything to RGB too early.
