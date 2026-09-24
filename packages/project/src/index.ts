import { sampleScalar } from '@efe/core';

export const PROJECT_SERVICE = 'film-project';

export type NumericKeyframe = [time: number, value: number];
export type NumericTrack = NumericKeyframe[];

export interface ProjectShot {
  id: string;
  range: [number, number];
  lensMm: number;
  focusDistance?: number;
  aperture?: number;
  camera?: {
    from: [number, number, number];
    to: [number, number, number];
    targetOffset: [number, number, number];
  };
}

export interface FilmProjectData {
  id: string;
  title: string;
  duration: number;
  events: Record<string, number>;
  tracks: Record<string, NumericTrack>;
  shots: ProjectShot[];
}

export type ProjectListener = (data: Readonly<FilmProjectData>) => void;

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function validateFilmProject(data: FilmProjectData): string[] {
  const errors: string[] = [];
  if (!data.id) errors.push('id is required');
  if (!data.title) errors.push('title is required');
  if (!(data.duration > 0)) errors.push('duration must be > 0');

  for (const [name, time] of Object.entries(data.events ?? {})) {
    if (!Number.isFinite(time) || time < 0 || time > data.duration) errors.push(`event ${name} is outside film duration`);
  }

  for (const [name, track] of Object.entries(data.tracks ?? {})) {
    let previous = -Infinity;
    for (const [time, value] of track) {
      if (!Number.isFinite(time) || !Number.isFinite(value)) errors.push(`track ${name} has a non-finite key`);
      if (time < previous) errors.push(`track ${name} is not sorted by time`);
      previous = time;
    }
  }

  for (const shot of data.shots ?? []) {
    if (!shot.id) errors.push('shot id is required');
    if (!(shot.range[0] >= 0 && shot.range[1] > shot.range[0] && shot.range[1] <= data.duration)) {
      errors.push(`shot ${shot.id} has invalid range`);
    }
    if (!(shot.lensMm > 0)) errors.push(`shot ${shot.id} lensMm must be > 0`);
  }
  return errors;
}

export class FilmProjectStore {
  #data: FilmProjectData;
  #listeners = new Set<ProjectListener>();

  constructor(data: FilmProjectData) {
    const errors = validateFilmProject(data);
    if (errors.length) throw new Error(`Invalid Film Project:\n${errors.join('\n')}`);
    this.#data = clone(data);
  }

  snapshot(): FilmProjectData {
    return clone(this.#data);
  }

  subscribe(listener: ProjectListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  sampleTrack(name: string, time: number, fallback = 0): number {
    const track = this.#data.tracks[name];
    if (!track?.length) return fallback;
    return sampleScalar(track, time);
  }

  shotAt(time: number): ProjectShot | undefined {
    return this.#data.shots.find((shot) => time >= shot.range[0] && time < shot.range[1]) ?? this.#data.shots.at(-1);
  }

  getShot(id: string): ProjectShot | undefined {
    const shot = this.#data.shots.find((candidate) => candidate.id === id);
    return shot ? clone(shot) : undefined;
  }

  updateShot(id: string, patch: Partial<Omit<ProjectShot, 'id'>>): void {
    const index = this.#data.shots.findIndex((candidate) => candidate.id === id);
    if (index < 0) throw new Error(`Unknown shot: ${id}`);
    const next = { ...this.#data.shots[index], ...clone(patch), id };
    const draft = this.snapshot();
    draft.shots[index] = next;
    this.#commit(draft);
  }

  updateTrackKey(trackName: string, index: number, time: number, value: number): void {
    const draft = this.snapshot();
    const track = draft.tracks[trackName];
    if (!track) throw new Error(`Unknown track: ${trackName}`);
    if (!track[index]) throw new Error(`Unknown key ${index} in track ${trackName}`);
    track[index] = [Math.max(0, Math.min(draft.duration, time)), value];
    track.sort((a, b) => a[0] - b[0]);
    this.#commit(draft);
  }

  toJSON(space = 2): string {
    return JSON.stringify(this.#data, null, space);
  }

  #commit(next: FilmProjectData): void {
    next.shots.sort((a, b) => a.range[0] - b.range[0]);
    const errors = validateFilmProject(next);
    if (errors.length) throw new Error(`Invalid project mutation:\n${errors.join('\n')}`);
    this.#data = next;
    for (const listener of this.#listeners) listener(this.#data);
  }
}
