import { StoryClock } from './clock';
import { EventBus } from './events';
import { orderModules } from './lifecycle';
import { buildWarmupTimes } from './reconstruction';
import { ServiceRegistry } from './services';
import type {
  FilmContext,
  FilmDefinition,
  FilmModule,
  FilmRuntimeLike,
  ModuleFailurePolicy,
  SeekRequest,
} from './types';

export type ModuleFailurePhase = 'init' | 'seek' | 'warmup' | 'prewarm' | 'update' | 'resize' | 'dispose';

export interface ModuleFailureEvent {
  module: string;
  phase: ModuleFailurePhase;
  policy: ModuleFailurePolicy;
  error: unknown;
}

interface RuntimeEvents {
  play: number;
  pause: number;
  seek: number;
  ready: undefined;
  end: number;
  frame: number;
  moduleError: ModuleFailureEvent;
}

interface ReconstructionOptions {
  cold: boolean;
  previousTime: number;
  emitFrame: boolean;
}

export class FilmRuntime<S extends object> implements FilmRuntimeLike<S> {
  readonly clock = new StoryClock();
  readonly events = new EventBus<RuntimeEvents>();
  readonly services = new ServiceRegistry();
  readonly state: S;
  readonly duration: number;
  readonly modules: FilmModule<S>[];
  readonly context: FilmContext<S>;

  #initModules: FilmModule<S>[];
  #updateModules: FilmModule<S>[];
  #resizeModules: FilmModule<S>[];

  #definition: FilmDefinition<S>;
  #lastTime = 0;
  #raf = 0;
  #ready = false;
  #disabledModules = new Set<FilmModule<S>>();

  constructor(definition: FilmDefinition<S>, canvas: HTMLCanvasElement) {
    this.#definition = definition;
    this.duration = definition.duration;
    this.state = definition.createState();
    this.modules = definition.modules.map((factory) => factory());
    this.#initModules = orderModules(this.modules, 'init');
    this.#updateModules = orderModules(this.modules, 'update');
    this.#resizeModules = orderModules(this.modules, 'resize');
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
    this.#sample(0);
    for (const module of this.#initModules) {
      await this.#invokeAsync(module, 'init', () => module.init?.(this.context));
    }
    this.resize();
    if (this.#definition.rehearsal?.length) {
      await this.rehearse(this.#definition.rehearsal);
    }
    this.#ready = true;
    this.#reconstruct(0, 0, { cold: true, previousTime: 0, emitFrame: true });
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
    const value = this.#clampTime(time);
    const previousTime = this.#lastTime;
    this.clock.seek(value);
    this.#reconstruct(value, 0, { cold: true, previousTime, emitFrame: true });
    this.#lastTime = value;
    this.events.emit('seek', value);
  }

  async rehearse(times: readonly number[] = this.#definition.rehearsal ?? []): Promise<void> {
    const points = [...new Set(times.map((time) => this.#clampTime(time)))].sort((a, b) => a - b);
    if (!points.length) return;

    const restoreTime = this.#clampTime(this.now());
    const wasPlaying = this.clock.playing;
    if (wasPlaying) this.clock.pause();

    let previousTime = restoreTime;
    for (const time of points) {
      this.#reconstruct(time, 0, { cold: true, previousTime, emitFrame: false });
      for (const module of this.#updateModules) {
        await this.#invokeAsync(module, 'prewarm', () => module.prewarm?.(time, this.context));
      }
      previousTime = time;
    }

    this.#reconstruct(restoreTime, 0, { cold: true, previousTime, emitFrame: false });
    this.clock.seek(restoreTime);
    this.#lastTime = restoreTime;
    if (wasPlaying) this.clock.play(restoreTime);
  }

  evaluateAt(time: number, dt = 0): void {
    this.#sample(time);
    for (const module of this.#updateModules) {
      this.#invoke(module, 'update', () => module.update?.(time, dt, this.context));
    }
    this.events.emit('frame', time);
  }

  resize(width = window.innerWidth, height = window.innerHeight): void {
    this.context.width = Math.max(1, width);
    this.context.height = Math.max(1, height);
    for (const module of this.#resizeModules) {
      this.#invoke(module, 'resize', () => module.resize?.(this.context.width, this.context.height, this.context));
    }
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
    for (const module of [...this.#initModules].reverse()) {
      this.#invoke(module, 'dispose', () => module.dispose?.(this.context));
    }
  }

  #reconstruct(time: number, dt: number, options: ReconstructionOptions): void {
    if (options.cold) {
      const request: SeekRequest = {
        previousTime: options.previousTime,
        targetTime: time,
        cold: true,
      };

      for (const module of this.#updateModules) {
        this.#invoke(module, 'seek', () => module.seek?.(request, this.context));
      }

      for (const module of this.#updateModules) {
        const policy = module.reconstruction;
        if (policy?.mode !== 'warmup' || !module.update || this.#disabledModules.has(module)) continue;

        const times = buildWarmupTimes(time, {
          window: policy.window,
          step: policy.step,
        });
        let previous = times[0] ?? Math.max(0, time - policy.window);
        for (const warmTime of times) {
          this.#sample(warmTime);
          const warmDt = Math.max(0, warmTime - previous);
          this.#invoke(module, 'warmup', () => module.update?.(warmTime, warmDt, this.context));
          previous = warmTime;
        }
      }
    }

    this.#sample(time);
    for (const module of this.#updateModules) {
      this.#invoke(module, 'update', () => module.update?.(time, dt, this.context));
    }
    if (options.emitFrame) this.events.emit('frame', time);
  }

  #sample(time: number): void {
    const sampled = this.#definition.sample(time, this.state);
    if (sampled && sampled !== this.state) Object.assign(this.state, sampled);
  }

  #clampTime(time: number): number {
    return Math.max(0, Math.min(time, this.duration));
  }

  #invoke(module: FilmModule<S>, phase: ModuleFailurePhase, fn: () => void): void {
    if (this.#disabledModules.has(module)) return;
    try {
      fn();
    } catch (error) {
      this.#handleFailure(module, phase, error);
    }
  }

  async #invokeAsync(
    module: FilmModule<S>,
    phase: ModuleFailurePhase,
    fn: () => void | Promise<void> | undefined,
  ): Promise<void> {
    if (this.#disabledModules.has(module)) return;
    try {
      await fn();
    } catch (error) {
      this.#handleFailure(module, phase, error);
    }
  }

  #handleFailure(module: FilmModule<S>, phase: ModuleFailurePhase, error: unknown): void {
    const policy = module.failurePolicy ?? 'throw';
    this.events.emit('moduleError', { module: module.name, phase, policy, error });
    if (policy === 'disable') this.#disabledModules.add(module);
    if (policy === 'throw') throw error;
  }
}
