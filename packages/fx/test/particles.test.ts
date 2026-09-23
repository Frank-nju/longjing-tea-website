import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmissionSchedule,
  generateDeterministicPoints,
  particleAlive,
  particleLife01,
} from '../src/particles';

test('deterministic particle schedule is stable for the same seed', () => {
  const options = { count: 8, startTime: 1, endTime: 4, lifetime: [1, 3] as const, seed: 'spray' };
  assert.deepEqual(createEmissionSchedule(options), createEmissionSchedule(options));
});

test('particle lifetime helpers depend only on absolute story time', () => {
  const particle = { id: 0, birthTime: 5, lifetime: 4, seed: 1 };
  assert.equal(particleAlive(particle, 4.99), false);
  assert.equal(particleAlive(particle, 7), true);
  assert.equal(particleLife01(particle, 7), 0.5);
});

test('deterministic point generation reproduces identical geometry', () => {
  const sample = (rng: () => number) => [rng(), rng(), rng()] as const;
  const a = generateDeterministicPoints(16, 'snow', sample);
  const b = generateDeterministicPoints(16, 'snow', sample);
  assert.deepEqual([...a], [...b]);
});
