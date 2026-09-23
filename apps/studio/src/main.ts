import './style.css';
import { FilmRuntime } from '@efe/core';
import { AUDIO_SERVICE, type AudioEngine } from '@efe/audio';
import { whaleFallFilm } from '@efe/film-whale-fall';

const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const scrub = document.querySelector<HTMLInputElement>('#scrub')!;
const time = document.querySelector<HTMLOutputElement>('#time')!;

const runtime = new FilmRuntime(whaleFallFilm, canvas);
await runtime.init();
runtime.startLoop();

(window as typeof window & { __EFE_RUNTIME__?: FilmRuntime<any> }).__EFE_RUNTIME__ = runtime;

function format(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

runtime.events.on('frame', (t) => {
  if (!scrub.matches(':active')) scrub.value = String(t);
  time.value = `${format(t)} / ${format(runtime.duration)}`;
  play.textContent = runtime.clock.playing ? 'Pause' : 'Play';
});

runtime.events.on('moduleError', (event) => {
  console.error(`[EFE] module failure: ${event.module} during ${event.phase} (${event.policy})`, event.error);
});

play.addEventListener('click', async () => {
  const audio = runtime.services.get<AudioEngine>(AUDIO_SERVICE);
  await audio?.resume();
  if (audio) runtime.clock.attachAudio(audio.context);
  if (runtime.clock.playing) runtime.pause();
  else {
    if (runtime.now() >= runtime.duration - 0.01) runtime.seek(0);
    runtime.play();
  }
});

scrub.addEventListener('input', () => runtime.seek(Number(scrub.value)));
window.addEventListener('resize', () => runtime.resize());
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    play.click();
  }
});
