import type { FilmModule } from '@efe/core';

export interface AudioCue {
  id: string;
  time: number;
  duration?: number;
  bus?: 'music' | 'sfx' | 'ambience';
  trigger(engine: AudioEngine, when: number, offset: number): void;
}

export const AUDIO_SERVICE = 'audio';

export class AudioEngine {
  readonly context: AudioContext;
  readonly master: GainNode;
  readonly buses: Record<'music' | 'sfx' | 'ambience', GainNode>;
  epoch = 0;

  constructor(context = new AudioContext({ latencyHint: 'playback' })) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(context.destination);
    this.buses = {
      music: context.createGain(),
      sfx: context.createGain(),
      ambience: context.createGain(),
    };
    this.buses.music.gain.value = 0.7;
    this.buses.sfx.gain.value = 0.8;
    this.buses.ambience.gain.value = 0.45;
    for (const bus of Object.values(this.buses)) bus.connect(this.master);
  }

  async resume(): Promise<void> {
    if (this.context.state !== 'running') await this.context.resume();
  }

  resetEpoch(): void {
    this.epoch++;
  }

  tone(bus: keyof AudioEngine['buses'], when: number, frequency: number, duration = 0.1, gain = 0.1): void {
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.frequency.value = frequency;
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), when + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(amp);
    amp.connect(this.buses[bus]);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }
}

export function createAudioModule<S extends object>(cues: AudioCue[], lookAhead = 0.8): FilmModule<S> & { start(): Promise<void> } {
  let engine: AudioEngine | null = null;
  let nextIndex = 0;
  let lastTime = 0;

  const api: FilmModule<S> & { start(): Promise<void> } = {
    name: 'audio',
    order: 50,
    init(ctx) {
      engine = new AudioEngine();
      ctx.services.set(AUDIO_SERVICE, engine);
      ctx.runtime.pause();
    },
    async start() {
      if (!engine) return;
      await engine.resume();
    },
    update(time, _dt, ctx) {
      if (!engine || engine.context.state !== 'running') return;
      if (time < lastTime - 0.05 || Math.abs(time - lastTime) > 2) {
        engine.resetEpoch();
        nextIndex = Math.max(0, cues.findIndex((cue) => cue.time >= time));
        if (nextIndex < 0) nextIndex = cues.length;
      }
      lastTime = time;
      const horizon = Math.min(ctx.runtime.duration, time + lookAhead);
      while (nextIndex < cues.length && cues[nextIndex].time <= horizon) {
        const cue = cues[nextIndex++];
        if (cue.time < time - 0.1) continue;
        const when = engine.context.currentTime + Math.max(0, cue.time - time);
        cue.trigger(engine, when, 0);
      }
    },
  };
  return api;
}
