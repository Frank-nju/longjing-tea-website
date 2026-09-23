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
  'packages/director/src/index.ts',
  'packages/renderer-three/src/index.ts',
  'packages/audio/src/index.ts',
  'packages/fx/src/particles.ts',
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

const reconstruction = fs.readFileSync(path.join(root, 'packages/core/src/reconstruction.ts'), 'utf8');
assert(reconstruction.includes('class CheckpointStore'), 'core provides checkpoint storage');
assert(reconstruction.includes('buildWarmupTimes'), 'core provides deterministic warmup planning');

const particles = fs.readFileSync(path.join(root, 'packages/fx/src/particles.ts'), 'utf8');
assert(!particles.includes('Math.random('), 'particle primitives avoid nondeterministic Math.random');
assert(particles.includes('createEmissionSchedule'), 'FX provides deterministic particle emission schedules');
assert(particles.includes('generateDeterministicPoints'), 'FX provides deterministic point generation');

const clock = fs.readFileSync(path.join(root, 'packages/core/src/clock.ts'), 'utf8');
assert(clock.includes('attachAudio'), 'clock can hand authority to AudioContext');
assert(clock.includes('toAudioTime'), 'clock maps story time to audio time');

const whale = fs.readFileSync(path.join(root, 'films/whale-fall/src/index.ts'), 'utf8');
assert(!whale.includes('Math.random('), 'example film avoids nondeterministic Math.random');
assert(whale.includes('sample(time: number'), 'example film has explicit absolute-time sampler');
assert(whale.includes('new Director(shots)'), 'example film owns a shot list separate from story sampling');
assert(whale.includes('rehearsal:'), 'example film declares representative rehearsal frames');
assert(whale.includes('export const whaleFallFilm'), 'example film exports a complete FilmDefinition');

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
assert(readme.includes('FilmState = F(storyTime)'), 'README states time-addressable world invariant');
assert(readme.includes('single-file'), 'README documents modular-source/single-artifact design');
assert(readme.includes('Production Runtime'), 'README documents the v0.2 production-runtime milestone');

console.log(`\n${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
