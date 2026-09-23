export interface TimedSnapshot<T> {
  time: number;
  value: T;
}

export class CheckpointStore<T> {
  #items: TimedSnapshot<T>[] = [];
  #clone: (value: T) => T;
  #maxEntries: number;

  constructor(options: { maxEntries?: number; clone?: (value: T) => T } = {}) {
    this.#maxEntries = Math.max(1, options.maxEntries ?? 64);
    this.#clone = options.clone ?? ((value) => structuredClone(value));
  }

  get size(): number {
    return this.#items.length;
  }

  save(time: number, value: T): void {
    const item = { time, value: this.#clone(value) };
    const existing = this.#items.findIndex((entry) => Math.abs(entry.time - time) < 1e-9);
    if (existing >= 0) this.#items[existing] = item;
    else {
      this.#items.push(item);
      this.#items.sort((a, b) => a.time - b.time);
    }
    if (this.#items.length > this.#maxEntries) {
      this.#items.splice(0, this.#items.length - this.#maxEntries);
    }
  }

  nearestAtOrBefore(time: number): TimedSnapshot<T> | undefined {
    for (let i = this.#items.length - 1; i >= 0; i--) {
      const item = this.#items[i];
      if (item.time <= time + 1e-9) {
        return { time: item.time, value: this.#clone(item.value) };
      }
    }
    return undefined;
  }

  clearAfter(time: number): void {
    this.#items = this.#items.filter((item) => item.time <= time + 1e-9);
  }

  clear(): void {
    this.#items = [];
  }
}

export interface WarmupRangeOptions {
  window: number;
  step?: number;
  floor?: number;
}

export function buildWarmupTimes(targetTime: number, options: WarmupRangeOptions): number[] {
  const step = Math.max(1 / 240, options.step ?? 1 / 30);
  const floor = options.floor ?? 0;
  const start = Math.max(floor, targetTime - Math.max(0, options.window));
  const times: number[] = [];
  for (let time = start; time < targetTime - 1e-9; time += step) {
    times.push(Math.min(time, targetTime));
  }
  return times;
}
