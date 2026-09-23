import { seededRandom } from '@efe/core';

export interface ParticleLifetime {
  id: number;
  birthTime: number;
  lifetime: number;
  seed: number;
}

export interface EmissionScheduleOptions {
  count: number;
  startTime: number;
  endTime: number;
  lifetime: number | readonly [number, number];
  seed: string | number;
}

export function createEmissionSchedule(options: EmissionScheduleOptions): ParticleLifetime[] {
  const rng = seededRandom(options.seed);
  const count = Math.max(0, Math.floor(options.count));
  const span = Math.max(0, options.endTime - options.startTime);
  const lifetimeRange: readonly [number, number] = typeof options.lifetime === 'number'
    ? [options.lifetime, options.lifetime]
    : options.lifetime;

  return Array.from({ length: count }, (_, id) => {
    const u = count <= 1 ? 0 : id / (count - 1);
    const jitter = count <= 1 ? 0 : (rng() - 0.5) * span / count;
    const birthTime = Math.max(options.startTime, Math.min(options.endTime, options.startTime + u * span + jitter));
    const lifetime = lifetimeRange[0] + (lifetimeRange[1] - lifetimeRange[0]) * rng();
    return { id, birthTime, lifetime, seed: Math.floor(rng() * 0xffffffff) >>> 0 };
  });
}

export function particleAge(particle: ParticleLifetime, storyTime: number): number {
  return storyTime - particle.birthTime;
}

export function particleLife01(particle: ParticleLifetime, storyTime: number): number {
  return Math.max(0, Math.min(1, particleAge(particle, storyTime) / Math.max(1e-9, particle.lifetime)));
}

export function particleAlive(particle: ParticleLifetime, storyTime: number): boolean {
  const age = particleAge(particle, storyTime);
  return age >= 0 && age <= particle.lifetime;
}

export function generateDeterministicPoints(
  count: number,
  seed: string | number,
  sample: (rng: () => number, index: number) => readonly [number, number, number],
): Float32Array {
  const rng = seededRandom(seed);
  const data = new Float32Array(Math.max(0, Math.floor(count)) * 3);
  for (let index = 0; index < data.length / 3; index++) {
    const point = sample(rng, index);
    data[index * 3] = point[0];
    data[index * 3 + 1] = point[1];
    data[index * 3 + 2] = point[2];
  }
  return data;
}
