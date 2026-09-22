export type ScalarKey = readonly [time: number, value: number];
export type VecKey = readonly [time: number, value: readonly number[]];

export function clamp(value: number, min = 0, max = 1): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(min: number, max: number, value: number): number {
  const t = clamp((value - min) / Math.max(1e-9, max - min));
  return t * t * (3 - 2 * t);
}

export function sampleScalar(keys: readonly ScalarKey[], time: number, smooth = true): number {
  if (!keys.length) return 0;
  if (time <= keys[0][0]) return keys[0][1];
  if (time >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1][0] <= time) i++;
  const [t0, v0] = keys[i];
  const [t1, v1] = keys[i + 1];
  let u = (time - t0) / Math.max(1e-9, t1 - t0);
  if (smooth) u = u * u * (3 - 2 * u);
  return lerp(v0, v1, u);
}

export function sampleVector(keys: readonly VecKey[], time: number, smooth = true): number[] {
  if (!keys.length) return [];
  if (time <= keys[0][0]) return [...keys[0][1]];
  if (time >= keys[keys.length - 1][0]) return [...keys[keys.length - 1][1]];
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1][0] <= time) i++;
  const [t0, v0] = keys[i];
  const [t1, v1] = keys[i + 1];
  let u = (time - t0) / Math.max(1e-9, t1 - t0);
  if (smooth) u = u * u * (3 - 2 * u);
  return v0.map((value, index) => lerp(value, v1[index] ?? value, u));
}
