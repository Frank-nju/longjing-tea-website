export class StoryClock {
  playing = false;
  frozen: number | null = null;
  rate = 1;
  latency = 0;

  #t0 = 0;
  #perf0 = performance.now();
  #audio: AudioContext | null = null;
  #audio0 = 0;
  #mode: 'perf' | 'audio' = 'perf';

  #currentMode(): 'perf' | 'audio' {
    return this.#audio?.state === 'running' ? 'audio' : 'perf';
  }

  #raw(): number {
    if (this.#mode === 'audio' && this.#audio) {
      return this.#t0 + (this.#audio.currentTime - this.#audio0) * this.rate;
    }
    return this.#t0 + ((performance.now() - this.#perf0) / 1000) * this.rate;
  }

  #anchor(time: number): void {
    this.#t0 = time;
    this.#perf0 = performance.now();
    if (this.#audio) this.#audio0 = this.#audio.currentTime;
  }

  now(): number {
    if (this.frozen !== null) return this.frozen;
    if (!this.playing) return this.#t0;
    const mode = this.#currentMode();
    if (mode !== this.#mode) {
      const time = this.#raw();
      this.#mode = mode;
      this.#anchor(time);
    }
    return this.#raw() - (this.#mode === 'audio' ? this.latency : 0);
  }

  play(from = this.now()): void {
    this.#mode = this.#currentMode();
    this.#anchor(from);
    this.playing = true;
  }

  pause(): void {
    const time = this.now();
    this.#anchor(time);
    this.playing = false;
  }

  seek(time: number): void {
    this.#mode = this.#currentMode();
    this.#anchor(time);
    if (this.frozen !== null) this.frozen = time;
  }

  attachAudio(context: AudioContext): void {
    const time = this.now();
    this.#audio = context;
    this.#mode = this.#currentMode();
    this.#anchor(time);
    this.latency = context.outputLatency || context.baseLatency || 0;
  }

  toAudioTime(storyTime: number): number {
    if (!this.#audio) return 0;
    if (this.#mode !== 'audio' || !this.playing) {
      return this.#audio.currentTime + (storyTime - this.now());
    }
    return this.#audio0 + (storyTime - this.#t0) / this.rate;
  }
}
