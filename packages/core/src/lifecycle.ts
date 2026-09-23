import type { FilmModule } from './types';

export type LifecyclePhase = 'init' | 'update' | 'resize';

export function moduleOrder<S extends object>(module: FilmModule<S>, phase: LifecyclePhase): number {
  if (phase === 'init') return module.initOrder ?? module.order ?? 50;
  if (phase === 'update') return module.updateOrder ?? module.order ?? 50;
  return module.resizeOrder ?? module.initOrder ?? module.order ?? 50;
}

export function orderModules<S extends object>(modules: readonly FilmModule<S>[], phase: LifecyclePhase): FilmModule<S>[] {
  return [...modules].sort((a, b) => moduleOrder(a, phase) - moduleOrder(b, phase));
}
