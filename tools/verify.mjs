import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
let checks = 0;
let failures = 0;

function assert(condition, message) {
  checks++;
  if (!condition) {
    failures++;
    console.error(`FAIL  ${message}`);
  } else {
    console.log(`PASS  ${message}`);
  }
}

const required = [
  'packages/core/src/runtime.ts',
  'packages/core/src/clock.ts',
  'packages/core/src/reconstruction.ts',
  'packages/core/src/lifecycle.ts',
  'packages/project/src/index.ts',
  'packages/director/src/index.ts',
  'packages/renderer-three/src/index.ts',
  'packages/audio/src/index.ts',
  'packages/fx/src/particles.ts',
  'films/whale-fall/film.project.json',
  'films/whale-fall/src/index.ts',
  'apps/studio/src/main.ts',
  'tools/package-single-html.mjs',
  'tools/render-frame.mjs',
  'tests/cold-seek.spec.ts',
  'tests/visual-regression.spec.ts',
];
for (const file of required) assert(fs.existsSync(path.join(root, file)), `required file: ${file}`);

const runtime = fs.readFileSync(path.join(root, 'packages/core/src/runtime.ts'), 'utf8');
assert(runtime.includes('this.#definition.sample(time, this.state)'), 'runtime samples film state from absolute story time');
assert(runtime.includes("events.emit('seek'"), 'runtime exposes seek event');
assert(runtime.includes("orderModules(this.modules, 'init')"), 'runtime has deterministic init ordering');
assert(runtime.includes("orderModules(this.modules, 'update')"), 'runtime has independent deterministic update ordering');
assert(runtime.includes("policy?.mode !== 'warmup'"), 'runtime supports bounded warmup reconstruction');
assert(runtime.includes('module.seek?.(request'), 'runtime gives stateful modules an explicit cold-seek hook');
assert(runtime.includes("module.failurePolicy ?? 'throw'"), 'runtime has per-module failure policy');
assert(runtime.includes('async rehearse('), 'runtime exposes rehearsal/prewarm');

const project = fs.readFileSync(path.join(root, 'packages/project/src/index.ts'), 'utf8');
assert(project.includes('class FilmProjectStore'), 'authoring layer has a live FilmProjectStore');
assert(project.includes('sampleTrack('), 'Film Project owns runtime-sampled numeric tracks');
assert(project.includes('updateShot('), 'Film Project supports structured shot mutations');
assert(project.includes('updateTrackKey('), 'Film Project supports structured keyframe mutations');
assert(project.includes('toJSON('), 'Film Project mutations serialize back to JSON');

const director = fs.readFileSync(path.join(root, 'packages/director/src/index.ts'), 'utf8');
assert(director.includes('setShots('), 'Director can rebuild from edited Film Project shots');

const reconstruction = fs.readFileSync(path.join(root, 'packages/core/src/reconstruction.ts'), 'utf8');
assert(reconstruction.includes('class CheckpointStore'), 'core provides checkpoint storage');
assert(reconstruction.includes('buildWarmupTimes'), 'core provides deterministic warmup planning');

const particles = fs.readFileSync(path.join(root, 'packages/fx/src/particles.ts'), 'utf8');
assert(!particles.includes('Math.random('), 'particle primitives avoid nondeterministic Math.random');
assert(particles.includes('createEmissionSchedule'), 'FX provides deterministic particle emission schedules');
assert(particles.includes('generateDeterministicPoints'), 'FX provides deterministic point generation');

const whale = fs.readFileSync(path.join(root, 'films/whale-fall/src/index.ts'), 'utf8');
assert(whale.includes('whaleFallProjectStore.sampleTrack'), 'example FilmState samples the live Film Project');
assert(whale.includes('PROJECT_SERVICE'), 'example exposes Film Project to authoring tools');
assert(whale.includes('director.setShots(buildShots())'), 'shot edits propagate into Director');
assert(whale.includes('export const whaleFallFilm'), 'example film exports a complete FilmDefinition');

const studio = fs.readFileSync(path.join(root, 'apps/studio/src/main.ts'), 'utf8');
assert(studio.includes('project.updateShot'), 'Studio shot inspector writes to FilmProjectStore');
assert(studio.includes('project.updateTrackKey'), 'Studio key inspector writes to FilmProjectStore');
assert(studio.includes('project.toJSON'), 'Studio exports edited project data');
assert(studio.includes('renderTimeline'), 'Studio has a data-driven timeline');

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
assert(readme.includes('FilmState = F(storyTime)'), 'README states time-addressable world invariant');
assert(readme.includes('single-file'), 'README documents modular-source/single-artifact design');
assert(readme.includes('Authoring Foundation v0.3'), 'README documents the v0.3 authoring milestone');

console.log(`\n${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
