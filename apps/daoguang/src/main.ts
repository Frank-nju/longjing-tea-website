import './style.css';
import { FilmRuntime } from '@efe/core';
import { createDaoguangFilm, type DaoguangState, type Decision, type FilmMode } from '../../../films/daoguang/src/index';
import { chapters } from '../../../films/daoguang/src/story';

const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const intro = document.querySelector<HTMLDivElement>('#introScreen')!;
const gate = document.querySelector<HTMLDivElement>('#decisionGate')!;
const playButton = document.querySelector<HTMLButtonElement>('#playButton')!;
const restartButton = document.querySelector<HTMLButtonElement>('#restartButton')!;
const replayOther = document.querySelector<HTMLButtonElement>('#replayOther')!;
const scrub = document.querySelector<HTMLInputElement>('#scrub')!;
const clockLabel = document.querySelector<HTMLSpanElement>('#clockLabel')!;
const modeLabel = document.querySelector<HTMLSpanElement>('#modeLabel')!;
const beatKicker = document.querySelector<HTMLSpanElement>('#beatKicker')!;
const beatTitle = document.querySelector<HTMLHeadingElement>('#beatTitle')!;
const beatBody = document.querySelector<HTMLParagraphElement>('#beatBody')!;
const kindLabel = document.querySelector<HTMLSpanElement>('#kindLabel')!;
const sceneIndex = document.querySelector<HTMLSpanElement>('#sceneIndex')!;
const sceneStatus = document.querySelector<HTMLSpanElement>('#sceneStatus')!;
const modeChip = document.querySelector<HTMLDivElement>('#modeChip')!;
const soundButton = document.querySelector<HTMLButtonElement>('#soundButton')!;
const chapterNav = document.querySelector<HTMLElement>('#chapterNav')!;
const markers = document.querySelector<HTMLDivElement>('#chapterMarkers')!;

const configured = createDaoguangFilm();
const runtime = new FilmRuntime<DaoguangState>(configured.film, canvas);
(window as Window & { __DAOGUANG_RUNTIME__?: FilmRuntime<DaoguangState> }).__DAOGUANG_RUNTIME__ = runtime;

const cues = [
  { time: 17, tone: 155, duration: 0.65 },
  { time: 66, tone: 68, duration: 1.1 },
  { time: 96, tone: 240, duration: 0.42 },
  { time: 135, tone: 118, duration: 0.7 },
  { time: 176, tone: 78, duration: 0.9 },
  { time: 211, tone: 92, duration: 0.7 },
  { time: 239, tone: 190, duration: 0.5 },
];

class Soundscape {
  #context: AudioContext | null = null;
  #master: GainNode | null = null;
  #ambience: GainNode | null = null;
  #noiseBuffer: AudioBuffer | null = null;
  #loop: AudioBufferSourceNode | null = null;
  #active = new Set<AudioScheduledSourceNode>();
  #lastTime = 0;
  #nextCue = 0;
  #muted = false;

  async enable(): Promise<void> {
    if (!this.#context) {
      this.#context = new AudioContext({ latencyHint: 'playback' });
      this.#master = this.#context.createGain();
      this.#master.gain.value = this.#muted ? 0 : 0.72;
      this.#master.connect(this.#context.destination);
      this.#ambience = this.#context.createGain();
      this.#ambience.gain.value = 0;
      this.#ambience.connect(this.#master);
      const length = this.#context.sampleRate * 3;
      this.#noiseBuffer = this.#context.createBuffer(1, length, this.#context.sampleRate);
      const channel = this.#noiseBuffer.getChannelData(0);
      let seed = 1840;
      for (let i = 0; i < length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        channel[i] = ((seed / 4294967296) * 2 - 1) * 0.32;
      }
    }
    await this.#context.resume();
  }

  setMuted(muted: boolean): void {
    this.#muted = muted;
    if (this.#master && this.#context) this.#master.gain.setTargetAtTime(muted ? 0 : 0.72, this.#context.currentTime, 0.04);
  }

  reset(time: number): void {
    this.#stopSources();
    this.#lastTime = time;
    this.#nextCue = cues.findIndex((cue) => cue.time >= time);
    if (this.#nextCue < 0) this.#nextCue = cues.length;
  }

  sync(time: number, playing: boolean, scene: string): void {
    if (!this.#context || this.#context.state !== 'running') {
      this.#lastTime = time;
      return;
    }
    if (!playing) {
      this.#stopSources();
      this.#lastTime = time;
      return;
    }
    if (!this.#loop && this.#noiseBuffer && this.#ambience) {
      const source = this.#context.createBufferSource();
      const filter = this.#context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = scene === 'court' || scene === 'treaty' ? 360 : 780;
      source.buffer = this.#noiseBuffer;
      source.loop = true;
      source.connect(filter).connect(this.#ambience);
      source.start();
      this.#loop = source;
    }
    const levels: Record<string, number> = { coast: 0.19, dinghai: 0.2, map: 0.08, court: 0.055, branch: 0.11, constraints: 0.16, yangtze: 0.2, treaty: 0.06, reflection: 0.1 };
    this.#ambience?.gain.setTargetAtTime(levels[scene] ?? 0.1, this.#context.currentTime, 0.45);
    if (time < this.#lastTime - 0.08 || time - this.#lastTime > 2) {
      this.#stopEffects();
      this.#nextCue = cues.findIndex((cue) => cue.time >= time);
      if (this.#nextCue < 0) this.#nextCue = cues.length;
      this.#lastTime = time;
      return;
    }
    while (this.#nextCue < cues.length && cues[this.#nextCue].time <= time + 0.02) {
      const cue = cues[this.#nextCue++];
      if (cue.time >= this.#lastTime - 0.02) this.#playCue(cue.tone, cue.duration);
    }
    this.#lastTime = time;
  }

  #playCue(frequency: number, duration: number): void {
    if (!this.#context || !this.#master || !this.#noiseBuffer) return;
    const now = this.#context.currentTime;
    const oscillator = this.#context.createOscillator();
    const envelope = this.#context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(34, frequency * 0.72), now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.11, now + 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope).connect(this.#master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
    this.#active.add(oscillator);
    oscillator.onended = () => this.#active.delete(oscillator);

    if (frequency > 130) {
      const source = this.#context.createBufferSource();
      const filter = this.#context.createBiquadFilter();
      const noiseGain = this.#context.createGain();
      source.buffer = this.#noiseBuffer;
      filter.type = 'bandpass';
      filter.frequency.value = frequency > 200 ? 1500 : 680;
      filter.Q.value = 0.6;
      noiseGain.gain.setValueAtTime(0.04, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      source.connect(filter).connect(noiseGain).connect(this.#master);
      source.start(now);
      source.stop(now + 0.28);
      this.#active.add(source);
      source.onended = () => this.#active.delete(source);
    }
  }

  #stopEffects(): void {
    for (const source of this.#active) {
      try { source.stop(); } catch { /* already ended */ }
    }
    this.#active.clear();
  }

  #stopSources(): void {
    this.#stopEffects();
    if (this.#loop) {
      try { this.#loop.stop(); } catch { /* already ended */ }
      this.#loop = null;
    }
    this.#ambience?.gain.setTargetAtTime(0, this.#context?.currentTime ?? 0, 0.04);
  }
}

const sound = new Soundscape();
let started = false;
let gateShown = false;
let mute = false;
let lastBeat = -1;
let currentMode: FilmMode = 'linear';

function format(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function branchBeat(time: number, route: DaoguangState['route']) {
  if (time < 135 || time >= 176) return runtime.state.beat;
  if (route === 'A') return { kicker: '模拟路线 A / 抚 · 课堂模拟', title: '先争取喘息', body: '拟命琦善赴粤交涉，试图以谈判换取缓冲时间。', kind: 'simulation' as const, time: 135 };
  if (route === 'B') return { kicker: '模拟路线 B / 剿 · 课堂模拟', title: '调兵反攻', body: '拟命奕经统兵反攻浙东，调度与补给压力随之增加。', kind: 'simulation' as const, time: 135 };
  return { kicker: '课堂情境模拟', title: '请选择一份拟旨', body: '这两段是教学用的假设路线，随后会回到真实战局。', kind: 'simulation' as const, time: 135 };
}

function renderChapters(): void {
  chapterNav.replaceChildren();
  markers.replaceChildren();
  chapters.forEach((chapter, index) => {
    const button = document.createElement('button');
    button.className = 'chapter-button';
    button.dataset.index = String(index);
    button.innerHTML = `<small>${chapter.label}</small>${chapter.id}`;
    button.addEventListener('click', () => {
      runtime.pause();
      runtime.seek(chapter.start);
      if (started) runtime.play();
      gateShown = false;
      gate.classList.add('hidden');
    });
    chapterNav.append(button);
    if (index > 0) {
      const marker = document.createElement('i');
      marker.className = 'chapter-marker';
      marker.style.left = `${chapter.start / runtime.duration * 100}%`;
      markers.append(marker);
    }
  });
}

function selectRoute(route: Decision): void {
  configured.setDecision(route);
  gateShown = true;
  gate.classList.add('hidden');
  sound.reset(135);
  runtime.seek(135);
  runtime.play();
  playButton.textContent = 'Ⅱ';
  modeLabel.textContent = `互动路线 ${route} / 课堂模拟`;
}

function begin(mode: FilmMode): void {
  currentMode = mode;
  configured.setMode(mode);
  configured.setDecision(null);
  started = true;
  gateShown = false;
  intro.classList.add('hidden');
  modeChip.classList.remove('hidden');
  modeChip.textContent = mode === 'linear' ? '线性正片 / 史实编排' : '互动版 / 决策为课堂模拟';
  modeLabel.textContent = mode === 'linear' ? '线性正片' : '互动版';
  runtime.seek(0);
  runtime.play();
  void sound.enable();
  sound.reset(0);
  playButton.textContent = 'Ⅱ';
}

function refresh(time: number): void {
  const state = runtime.state;
  const beat = branchBeat(time, state.route);
  scrub.value = String(time);
  scrub.style.setProperty('--played', `${time / runtime.duration * 100}%`);
  clockLabel.textContent = format(time);
  sceneIndex.textContent = `${String(chapters.findIndex((chapter) => chapter.id === state.chapter) + 1).padStart(2, '0')} / 04`;
  sceneStatus.textContent = state.scene === 'map' ? '路线示意' : state.scene === 'branch' ? '课堂模拟场景' : '历史可视化';
  const route = configured.getDecision();
  modeChip.textContent = currentMode === 'linear' ? '线性正片 / 史实编排' : route ? `互动路线 ${route} / 课堂模拟` : '互动版 / 决策为课堂模拟';
  if (beat.time !== lastBeat || beatTitle.textContent !== beat.title) {
    lastBeat = beat.time;
    beatKicker.textContent = beat.kicker;
    beatTitle.textContent = beat.title;
    beatBody.textContent = beat.body;
    kindLabel.textContent = beat.kind === 'history' ? '史实' : beat.kind === 'analysis' ? '解释' : '模拟';
    kindLabel.className = `kind-label ${beat.kind}`;
  }
  document.querySelectorAll<HTMLButtonElement>('.chapter-button').forEach((button, index) => {
    button.classList.toggle('active', index === chapters.findIndex((chapter) => chapter.id === state.chapter));
  });
  const playing = runtime.clock.playing;
  playButton.textContent = playing ? 'Ⅱ' : '▶';
  sound.sync(time, playing, state.scene);
  if (currentMode === 'interactive' && time >= 135 && time < 176 && !configured.getDecision() && !gateShown) {
    gateShown = true;
    runtime.pause();
    runtime.seek(135);
    gate.classList.remove('hidden');
    playButton.textContent = '▶';
  }
  replayOther.classList.toggle('hidden', !(currentMode === 'interactive' && configured.getDecision() && time >= 176 && time < 211));
}

document.querySelector<HTMLButtonElement>('#startLinear')!.addEventListener('click', () => begin('linear'));
document.querySelector<HTMLButtonElement>('#startInteractive')!.addEventListener('click', () => begin('interactive'));
document.querySelectorAll<HTMLButtonElement>('[data-route]').forEach((button) => {
  button.addEventListener('click', () => selectRoute(button.dataset.route as Decision));
});
playButton.addEventListener('click', () => {
  if (!started) return;
  if (runtime.clock.playing) runtime.pause();
  else {
    if (runtime.now() >= runtime.duration) runtime.seek(0);
    runtime.play();
    void sound.enable();
  }
  refresh(runtime.now());
});
restartButton.addEventListener('click', () => {
  if (!started) return;
  gateShown = false;
  gate.classList.add('hidden');
  sound.reset(0);
  runtime.seek(0);
  runtime.play();
});
replayOther.addEventListener('click', () => {
  const other: Decision = configured.getDecision() === 'A' ? 'B' : 'A';
  configured.setDecision(other);
  sound.reset(135);
  runtime.seek(135);
  runtime.play();
});
scrub.addEventListener('input', () => {
  runtime.pause();
  sound.reset(Number(scrub.value));
  gateShown = false;
  gate.classList.add('hidden');
  runtime.seek(Number(scrub.value));
  if (started && currentMode === 'interactive' && Number(scrub.value) >= 135 && Number(scrub.value) < 176 && !configured.getDecision()) {
    gateShown = true;
    runtime.seek(135);
    gate.classList.remove('hidden');
  }
});
soundButton.addEventListener('click', () => {
  mute = !mute;
  sound.setMuted(mute);
  soundButton.textContent = mute ? '声音：关' : '声音：开';
  soundButton.setAttribute('aria-label', mute ? '开启声音' : '静音');
});
document.querySelector<HTMLButtonElement>('#sourcesToggle')!.addEventListener('click', () => document.querySelector('#sourcesPanel')!.classList.remove('hidden'));
document.querySelector<HTMLButtonElement>('#sourcesClose')!.addEventListener('click', () => document.querySelector('#sourcesPanel')!.classList.add('hidden'));
document.querySelector<HTMLAnchorElement>('#homeLink')!.addEventListener('click', (event) => {
  event.preventDefault();
  runtime.pause();
  gate.classList.add('hidden');
  intro.classList.remove('hidden');
  started = false;
});
document.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement && (event.target as HTMLButtonElement).dataset.route) return;
  if (event.code === 'Space') { event.preventDefault(); playButton.click(); }
  else if (event.key === 'ArrowRight') { runtime.pause(); sound.reset(runtime.now() + 5); runtime.seek(runtime.now() + 5); }
  else if (event.key === 'ArrowLeft') { runtime.pause(); sound.reset(runtime.now() - 5); runtime.seek(runtime.now() - 5); }
  else if (event.key.toLowerCase() === 'm') soundButton.click();
});

renderChapters();
await runtime.init();
runtime.startLoop();
runtime.events.on('frame', refresh);
runtime.events.on('pause', (time) => sound.reset(time));
runtime.events.on('seek', (time) => sound.reset(time));
runtime.events.on('end', () => { playButton.textContent = '↻'; refresh(runtime.duration); });
