import './style.css';
import { Soundscape } from './soundtrack';
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

const sound = new Soundscape();
soundButton.textContent = '声音：准备中';
void sound.prepare().then(() => { soundButton.textContent = '声音：开'; }).catch(() => { soundButton.textContent = '声音：准备失败'; });
(window as unknown as { __DAOGUANG_SOUND__: Soundscape }).__DAOGUANG_SOUND__ = sound;
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

async function begin(mode: FilmMode): Promise<void> {
  currentMode = mode;
  configured.setMode(mode);
  configured.setDecision(null);
  started = true;
  gateShown = false;
  intro.classList.add('hidden');
  modeChip.classList.remove('hidden');
  modeChip.textContent = mode === 'linear' ? '线性正片 / 史实编排' : '互动版 / 决策为课堂模拟';
  modeLabel.textContent = mode === 'linear' ? '线性正片' : '互动版';
  runtime.pause();
  runtime.seek(0);
  sound.reset(0);
  playButton.textContent = '…';
  try { await sound.enable(); } catch { soundButton.textContent = '声音：不可用'; }
  if (started && runtime.now() === 0) { runtime.play(); playButton.textContent = 'Ⅱ'; }
}

function refresh(time: number): void {
  const state = runtime.state;
  const beat = branchBeat(time, state.route);
  document.querySelector('.subtitle')!.classList.toggle('chapter-opening', time-beat.time < 4);
  const fade = Math.max(time<2?1-time/2:0,time>267?(time-267)/3:0);
  (document.querySelector('.viewport') as HTMLElement).style.setProperty('--film-fade',String(fade));
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
  sound.sync(time, playing, state.scene, state.route);
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
