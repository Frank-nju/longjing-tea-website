import assert from 'node:assert/strict';
import test from 'node:test';
import { CheckpointStore, buildWarmupTimes } from '../src/reconstruction';

test('CheckpointStore restores nearest snapshot at or before target time', () => {
  const store = new CheckpointStore<{ value: number }>();
  store.save(0, { value: 0 });
  store.save(5, { value: 5 });
  store.save(10, { value: 10 });

  assert.deepEqual(store.nearestAtOrBefore(7), { time: 5, value: { value: 5 } });
  assert.equal(store.nearestAtOrBefore(-1), undefined);
});

test('CheckpointStore clones snapshots instead of returning live references', () => {
  const store = new CheckpointStore<{ nested: { value: number } }>();
  store.save(2, { nested: { value: 2 } });
  const snapshot = store.nearestAtOrBefore(2)!;
  snapshot.value.nested.value = 99;
  assert.equal(store.nearestAtOrBefore(2)!.value.nested.value, 2);
});

test('buildWarmupTimes creates a bounded deterministic interval before target', () => {
  const times = buildWarmupTimes(10, { window: 1, step: 0.25 });
  assert.deepEqual(times, [9, 9.25, 9.5, 9.75]);
});
