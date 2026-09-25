import { createDaoguangFilm, type DaoguangState } from '../../../films/daoguang/src/index';
import type { FilmDefinition } from '@efe/core';
import { cannonEvents } from '../../../films/daoguang/src/cinema';
import shotData from '../../../films/daoguang/preproduction/cut.json';

export const shots = shotData;
export type CutShot = typeof shots[number];
export type Route = 'A' | 'B';
export const shotAt = (time: number): CutShot => shots.find(s => time >= s.start && time < s.end) ?? shots[shots.length - 1];
export const progress = (time: number, a: number, b: number) => Math.max(0, Math.min(1, (time-a)/(b-a)));
export const smooth = (v: number) => { const x = Math.max(0,Math.min(1,v)); return x*x*(3-2*x); };
export function layerAt(time: number): string {
  const shot = shotAt(time);
  if (shot.id === 'S01' && time >= 7) return 'sea';
  if (shot.layer === 'crosscut') return time >= 106 && time < 111 ? 'sea' : 'paper';
  return shot.layer;
}
export function sourceTime(time: number): number {
  if (time >= 106 && time < 111) return 61 + (time-106);
  const s = shotAt(time);
  return s.source[0] + progress(time,s.start,s.end)*(s.source[1]-s.source[0]);
}
export function createCinemaFilm(): FilmDefinition<DaoguangState> {
  const original = createDaoguangFilm('linear').film;
  return {
    ...original, id: 'daoguang-cinema-cut', title: '奏报之外', rehearsal: [],
    sample(time,state) { original.sample(sourceTime(time),state); },
    modules: original.modules.map(factory => () => {
      const module = factory();
      return {
        ...module,
        update(time,dt,ctx) { if (layerAt(time) === 'sea') module.update?.(sourceTime(time),dt,ctx); },
        seek(request,ctx) { module.seek?.({...request,previousTime:sourceTime(request.previousTime),targetTime:sourceTime(request.targetTime)},ctx); },
      };
    }),
  };
}

export const cannonTimes = [
  ...shots.filter(s=>s.layer==='sea').flatMap(s=>cannonEvents.filter(e=>e.t>=s.source[0]&&e.t<s.source[1]).map(e=>s.start+(e.t-s.source[0])/(s.source[1]-s.source[0])*(s.end-s.start)+.14)),
  ...cannonEvents.filter(e=>e.t>=61&&e.t<66).map(e=>106+(e.t-61)+.14),
].sort((a,b)=>a-b);
