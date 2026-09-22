import { clamp, lerp } from '@efe/core';

export type Vec3Tuple = readonly [number, number, number];

export interface CameraRig {
  position: Vec3Tuple;
  target: Vec3Tuple;
  focalLengthMm: number;
  focusDistance?: number;
  aperture?: number;
  roll?: number;
  fade?: number;
}

export interface Shot<S extends object> {
  id: string;
  t0: number;
  t1: number;
  cut?: boolean;
  evaluate(time: number, progress: number, state: S): CameraRig;
}

export interface DirectedFrame {
  shotId: string;
  cut: boolean;
  rig: CameraRig;
}

export class Director<S extends object> {
  #shots: Shot<S>[];
  #lastShot = '';

  constructor(shots: Shot<S>[]) {
    this.#shots = [...shots].sort((a, b) => a.t0 - b.t0);
  }

  evaluate(time: number, state: S): DirectedFrame | null {
    const shot = this.#shots.find((candidate) => time >= candidate.t0 && time < candidate.t1) ?? this.#shots.at(-1);
    if (!shot) return null;
    const progress = clamp((time - shot.t0) / Math.max(1e-9, shot.t1 - shot.t0));
    const cut = this.#lastShot !== '' && this.#lastShot !== shot.id;
    this.#lastShot = shot.id;
    return { shotId: shot.id, cut, rig: shot.evaluate(time, progress, state) };
  }

  reset(): void {
    this.#lastShot = '';
  }
}

export function mixVec3(a: Vec3Tuple, b: Vec3Tuple, t: number): Vec3Tuple {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function focalLengthToVerticalFov(focalLengthMm: number, sensorHeightMm = 24): number {
  return 2 * Math.atan(sensorHeightMm / (2 * focalLengthMm)) * 180 / Math.PI;
}
