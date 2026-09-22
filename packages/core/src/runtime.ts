import { StoryClock } from './clock';
import { EventBus } from './events';
import { ServiceRegistry } from './services';
import type { FilmContext, FilmDefinition, FilmModule, FilmRuntimeLike } from './types';

interface RuntimeEvents {
  play: number;
  pause: number;
  seek: number;
  ready: undefined;
  end: number;
  frame: number;
}

export class FilmRuntime<S extends object> implements FilmRuntimeLike<S> {
  readonly clock = new StoryClock();
  readonly events = new EventBus<RuntimeEvents>();
  readonly services = new ServiceRegistry();
  readonly state: S;
  readonly duration: number;
  readonly modules: FilmModule<S>[];
  readonly context: FilmContext<S>;

  #definition: FilmDefinition<S>;
  #lastTime = 0;
  #raf = 0;
  #ready = false;

  constructor(definition: FilmDefinition<S>, canvas: HTMLCanvasElement) {
    this.#definition = definition;
    this.duration = definition.duration;
    this.state = definition.createState();
    this.modules = definition.modules.map((factory) => factory()).sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
    this.context = {
      canvas,
      width: Math.max(1, canvas.clientWidth || window.innerWidth),
      height: Math.max(1, canvas.clientHeight || window.innerHeight),
      pixelRatio: Math.min(devicePixelRatio || 1, 2),
      state: this.state,
      services: this.services,
      runtime: this,
    };
  }

  async init(): Promise<void> {
    this.#definition.sample(0, this.state);
    for (const module of this.modules) await module.init?.(this.context);
    this.resize();
    this.#ready = true;
    this.evaluateAt(0, 0);
    this.events.emit('ready', undefined);
  }

  now(): number {
    return this.clock.now();
  }

  play(from = this.now()): void {
    this.clock.play(from);
    this.events.emit('play', from);
  }

  pause(): void {
    const time = this.now();
    this.clock.pause();
    this.events.emit('pause', time);
  }

  seek(time: number): void {
    const value = Math.max(0, Math.min(time, this.duration));
    this.clock.seek(value);
    this.#lastTime = value;
    this.evaluateAt(value, 0);
    this.events.emit('seek', value);
  }

  evaluateAt(time: number, dt = 0): void {
    const sampled = this.#definition.sample(time, this.state);
    if (sampled && sampled !== this.state) Object.assign(this.state, sampled);
    for (const module of this.modules) module.update?.(time, dt, this.context);
    this.events.emit('frame', time);
  }

  resize(width = window.innerWidth, height = window.innerHeight): void {
    this.context.width = Math.max(1, width);
    this.context.height = Math.max(1, height);
    for (const module of this.modules) module.resize?.(this.context.width, this.context.height, this.context);
  }

  startLoop(): void {
    const tick = () => {
      if (!this.#ready) return;
      const time = Math.min(this.duration, this.now());
      const dt = Math.max(0, Math.min(0.1, time - this.#lastTime));
      this.#lastTime = time;
      this.evaluateAt(time, dt);
      if (time >= this.duration && this.clock.playing) {
        this.pause();
        this.events.emit('end', time);
      }
      this.#raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(this.#raf);
    this.#raf = requestAnimationFrame(tick);
  }

  dispose(): void {
    cancelAnimationFrame(this.#raf);
    for (const module of [...this.modules].reverse()) module.dispose?.(this.context);
  }
}
