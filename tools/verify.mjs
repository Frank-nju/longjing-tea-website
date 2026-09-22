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
  'packages/director/src/index.ts',
  'packages/renderer-three/src/index.ts',
  'packages/audio/src/index.ts',
  'films/whale-fall/src/index.ts',
  'apps/studio/src/main.ts',
  'tools/package-single-html.mjs',
];
for (const file of required) assert(fs.existsSync(path.join(root, file)), `required file: ${file}`);

const runtime = fs.readFileSync(path.join(root, 'packages/core/src/runtime.ts'), 'utf8');
assert(runtime.includes('definition.sample(time, this.state)'), 'runtime samples film state from absolute story time');
assert(runtime.includes("events.emit('seek'"), 'runtime exposes seek event');
assert(runtime.includes('.sort((a, b) =>'), 'module lifecycle has deterministic ordering');

const clock = fs.readFileSync(path.join(root, 'packages/core/src/clock.ts'), 'utf8');
assert(clock.includes('attachAudio'), 'clock can hand authority to AudioContext');
assert(clock.includes('toAudioTime'), 'clock maps story time to audio time');

const whale = fs.readFileSync(path.join(root, 'films/whale-fall/src/index.ts'), 'utf8');
assert(!whale.includes('Math.random('), 'example film avoids nondeterministic Math.random');
assert(whale.includes('sample(time: number'), 'example film has explicit absolute-time sampler');
assert(whale.includes('new Director(shots)'), 'example film owns a shot list separate from story sampling');

const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
assert(readme.includes('FilmState = F(storyTime)'), 'README states time-addressable world invariant');
assert(readme.includes('single-file'), 'README documents modular-source/single-artifact design');

console.log(`\n${checks - failures}/${checks} checks passed.`);
process.exit(failures ? 1 : 0);
