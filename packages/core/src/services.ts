import type { FilmServices } from './types';

export class ServiceRegistry implements FilmServices {
  #values = new Map<string, unknown>();

  get<T>(key: string): T | undefined {
    return this.#values.get(key) as T | undefined;
  }

  require<T>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) throw new Error(`Missing film service: ${key}`);
    return value;
  }

  set<T>(key: string, value: T): void {
    this.#values.set(key, value);
  }

  has(key: string): boolean {
    return this.#values.has(key);
  }
}
