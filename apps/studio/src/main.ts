import './style.css';
import { FilmRuntime } from '@efe/core';
import { PROJECT_SERVICE, FilmProjectStore } from '@efe/project';
import { AUDIO_SERVICE, type AudioEngine } from '@efe/audio';
import { whaleFallFilm } from '@efe/film-whale-fall';

const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const scrub = document.querySelector<HTMLInputElement>('#scrub')!;
const time = document.querySelector<HTMLOutputElement>('#time')!;
const playhead = document.querySelector<HTMLDivElement>('#playhead')!;
const eventLane = document.querySelector<HTMLDivElement>('#eventLane')!;
const shotLane = document.querySelector<HTMLDivElement>('#shotLane')!;
const trackLane = document.querySelector<HTMLDivElement>('#trackLane')!;
const shotSelect = document.querySelector<HTMLSelectElement>('#shotSelect')!;
const shotStart = document.querySelector<HTMLInputElement>('#shotStart')!;
const shotEnd = document.querySelector<HTMLInputElement>('#shotEnd')!;
const shotLens = document.querySelector<HTMLInputElement>('#shotLens')!;
const shotAperture = document.querySelector<HTMLInputElement>('#shotAperture')!;
const trackSelect = document.querySelector<HTMLSelectElement>('#trackSelect')!;
const keySelect = document.querySelector<HTMLSelectElement>('#keySelect')!;
const keyTime = document.querySelector<HTMLInputElement>('#keyTime')!;
const keyValue = document.querySelector<HTMLInputElement>('#keyValue')!;
const stateReadout = document.querySelector<HTMLPreElement>('#stateReadout')!;
const editStatus = document.querySelector<HTMLDivElement>('#editStatus')!;
const exportProject = document.querySelector<HTMLButtonElement>('#exportProject')!;

const runtime = new FilmRuntime(whaleFallFilm, canvas);
await runtime.init();
runtime.startLoop();

(window as typeof window & { __EFE_RUNTIME__?: FilmRuntime<any> }).__EFE_RUNTIME__ = runtime;

const project = runtime.services.require<FilmProjectStore>(PROJECT_SERVICE);
scrub.max = String(project.snapshot().duration);

let selectedShotId = project.shotAt(0)?.id ?? '';
let selectedTrack = project.snapshot().tracks['whale.y'] ? 'whale.y' : Object.keys(project.snapshot().tracks)[0] ?? '';
let selectedKey = 0;

function format(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function pct(value: number): number {
  return value / project.snapshot().duration * 100;
}

function setStatus(message: string, error = false): void {
  editStatus.textContent = message;
  editStatus.classList.toggle('error', error);
}

function renderTimeline(): void {
  const data = project.snapshot();
  eventLane.replaceChildren();
  shotLane.replaceChildren();
  trackLane.replaceChildren();

  for (const [name, eventTime] of Object.entries(data.events)) {
    const marker = document.createElement('button');
    marker.className = 'event-marker';
    marker.style.left = `${pct(eventTime)}%`;
    marker.title = `${name} · ${eventTime.toFixed(2)}s`;
    marker.addEventListener('click', () => runtime.seek(eventTime));
    eventLane.append(marker);
  }

  for (const shot of data.shots) {
    const clip = document.createElement('button');
    clip.className = `timeline-shot${shot.id === selectedShotId ? ' selected' : ''}`;
    clip.style.left = `${pct(shot.range[0])}%`;
    clip.style.width = `${pct(shot.range[1] - shot.range[0])}%`;
    clip.textContent = `${shot.id} · ${shot.lensMm}mm`;
    clip.title = `${shot.id}: ${shot.range[0].toFixed(1)}–${shot.range[1].toFixed(1)}s`;
    clip.addEventListener('click', () => {
      selectedShotId = shot.id;
      refreshShotInspector();
      renderTimeline();
      runtime.seek(Math.max(shot.range[0], Math.min(runtime.now(), shot.range[1] - 0.01)));
    });
    shotLane.append(clip);
  }

  const track = data.tracks[selectedTrack] ?? [];
  track.forEach(([keyTimeValue], index) => {
    const marker = document.createElement('button');
    marker.className = `key-marker${index === selectedKey ? ' selected' : ''}`;
    marker.style.left = `${pct(keyTimeValue)}%`;
    marker.title = `${selectedTrack} key ${index} · ${keyTimeValue.toFixed(2)}s`;
    marker.addEventListener('click', () => {
      selectedKey = index;
      refreshKeyInspector();
      renderTimeline();
      runtime.seek(keyTimeValue);
    });
    trackLane.append(marker);
  });
}

function fillSelect(select: HTMLSelectElement, values: string[], selected: string): void {
  select.replaceChildren(...values.map((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    option.selected = value === selected;
    return option;
  }));
}

function refreshShotInspector(): void {
  const data = project.snapshot();
  if (!data.shots.some((shot) => shot.id === selectedShotId)) selectedShotId = data.shots[0]?.id ?? '';
  fillSelect(shotSelect, data.shots.map((shot) => shot.id), selectedShotId);
  const shot = data.shots.find((candidate) => candidate.id === selectedShotId);
  if (!shot) return;
  shotStart.value = String(shot.range[0]);
  shotEnd.value = String(shot.range[1]);
  shotLens.value = String(shot.lensMm);
  shotAperture.value = String(shot.aperture ?? 4);
}

function refreshTrackSelect(): void {
  const names = Object.keys(project.snapshot().tracks);
  if (!names.includes(selectedTrack)) selectedTrack = names[0] ?? '';
  fillSelect(trackSelect, names, selectedTrack);
}

function refreshKeyInspector(): void {
  const track = project.snapshot().tracks[selectedTrack] ?? [];
  selectedKey = Math.max(0, Math.min(selectedKey, Math.max(0, track.length - 1)));
  keySelect.replaceChildren(...track.map(([t, v], index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `#${index} · ${t.toFixed(1)}s · ${v.toFixed(2)}`;
    option.selected = index === selectedKey;
    return option;
  }));
  const key = track[selectedKey];
  if (!key) return;
  keyTime.value = String(key[0]);
  keyValue.value = String(key[1]);
}

function refreshAllInspectors(): void {
  refreshShotInspector();
  refreshTrackSelect();
  refreshKeyInspector();
}

function applyShotEdits(): void {
  try {
    project.updateShot(selectedShotId, {
      range: [Number(shotStart.value), Number(shotEnd.value)],
      lensMm: Number(shotLens.value),
      aperture: Number(shotAperture.value),
    });
    setStatus('Shot updated in the live Film Project.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
    refreshShotInspector();
  }
}

function applyKeyEdits(): void {
  try {
    const t = Number(keyTime.value);
    const value = Number(keyValue.value);
    project.updateTrackKey(selectedTrack, selectedKey, t, value);
    const track = project.snapshot().tracks[selectedTrack] ?? [];
    selectedKey = track.reduce((best, key, index) => {
      const score = Math.abs(key[0] - t) + Math.abs(key[1] - value);
      const bestKey = track[best] ?? key;
      const bestScore = Math.abs(bestKey[0] - t) + Math.abs(bestKey[1] - value);
      return score < bestScore ? index : best;
    }, 0);
    setStatus('Track key updated; FilmState will resample from the same project data.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), true);
    refreshKeyInspector();
  }
}

project.subscribe(() => {
  refreshAllInspectors();
  renderTimeline();
  runtime.seek(runtime.now());
});

runtime.events.on('frame', (t) => {
  if (!scrub.matches(':active')) scrub.value = String(t);
  time.value = `${format(t)} / ${format(runtime.duration)}`;
  play.textContent = runtime.clock.playing ? 'Pause' : 'Play';
  const leftOffset = 58;
  playhead.style.left = `calc(${leftOffset}px + (100% - ${leftOffset}px) * ${t / runtime.duration})`;
  stateReadout.textContent = JSON.stringify(runtime.state, null, 2);

  const current = project.shotAt(t);
  if (current && current.id !== selectedShotId && runtime.clock.playing) {
    selectedShotId = current.id;
    refreshShotInspector();
    renderTimeline();
  }
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
shotSelect.addEventListener('change', () => {
  selectedShotId = shotSelect.value;
  refreshShotInspector();
  renderTimeline();
});
for (const input of [shotStart, shotEnd, shotLens, shotAperture]) input.addEventListener('change', applyShotEdits);

trackSelect.addEventListener('change', () => {
  selectedTrack = trackSelect.value;
  selectedKey = 0;
  refreshKeyInspector();
  renderTimeline();
});
keySelect.addEventListener('change', () => {
  selectedKey = Number(keySelect.value);
  refreshKeyInspector();
  renderTimeline();
});
for (const input of [keyTime, keyValue]) input.addEventListener('change', applyKeyEdits);

for (const lane of [eventLane, shotLane, trackLane]) {
  lane.addEventListener('dblclick', (event) => {
    if (event.target !== lane) return;
    const rect = lane.getBoundingClientRect();
    runtime.seek((event.clientX - rect.left) / rect.width * runtime.duration);
  });
}

exportProject.addEventListener('click', () => {
  const blob = new Blob([project.toJSON(2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'film.project.json';
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus('Exported the current Film Project JSON.');
});

window.addEventListener('resize', () => runtime.resize());
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && event.target === document.body) {
    event.preventDefault();
    play.click();
  }
});

refreshAllInspectors();
renderTimeline();
runtime.seek(0);
