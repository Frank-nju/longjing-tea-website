import assert from 'node:assert/strict';
import test from 'node:test';
import { orderModules } from '../src/lifecycle';
import type { FilmModule } from '../src/types';

test('module init and update order can differ without losing determinism', () => {
  const renderer: FilmModule<object> = { name: 'renderer', initOrder: 100, updateOrder: 1000 };
  const world: FilmModule<object> = { name: 'world', initOrder: 300, updateOrder: 300 };
  const director: FilmModule<object> = { name: 'director', initOrder: 700, updateOrder: 700 };
  const modules = [world, renderer, director];

  assert.deepEqual(orderModules(modules, 'init').map((module) => module.name), ['renderer', 'world', 'director']);
  assert.deepEqual(orderModules(modules, 'update').map((module) => module.name), ['world', 'director', 'renderer']);
});
