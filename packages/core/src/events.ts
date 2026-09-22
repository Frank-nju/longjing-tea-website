export class EventBus<Events extends object> {
  #listeners = new Map<keyof Events, Set<(value: never) => void>>();

  on<K extends keyof Events>(event: K, listener: (value: Events[K]) => void): () => void {
    let set = this.#listeners.get(event);
    if (!set) {
      set = new Set();
      this.#listeners.set(event, set);
    }
    set.add(listener as (value: never) => void);
    return () => set?.delete(listener as (value: never) => void);
  }

  emit<K extends keyof Events>(event: K, value: Events[K]): void {
    for (const listener of this.#listeners.get(event) ?? []) listener(value as never);
  }
}
