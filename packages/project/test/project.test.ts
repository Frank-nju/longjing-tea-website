import assert from 'node:assert/strict';
import test from 'node:test';
import { FilmProjectStore, type FilmProjectData } from '../src/index';

const project: FilmProjectData = {
  id: 'test',
  title: 'Test',
  duration: 10,
  events: { cut: 5 },
  tracks: { x: [[0, 0], [10, 10]] },
  shots: [
    { id: 'a', range: [0, 5], lensMm: 35 },
    { id: 'b', range: [5, 10], lensMm: 70 },
  ],
};

test('project tracks sample from absolute story time using engine curve semantics', () => {
  const store = new FilmProjectStore(project);
  assert.equal(store.sampleTrack('x', 2.5), 1.5625);
  assert.equal(store.sampleTrack('x', 5), 5);
});

test('shot mutations are live and serializable', () => {
  const store = new FilmProjectStore(project);
  store.updateShot('a', { lensMm: 50 });
  assert.equal(store.getShot('a')?.lensMm, 50);
  assert.equal(JSON.parse(store.toJSON()).shots[0].lensMm, 50);
});

test('track key mutations change subsequent samples', () => {
  const store = new FilmProjectStore(project);
  store.updateTrackKey('x', 1, 10, 20);
  assert.equal(store.sampleTrack('x', 5), 10);
});
