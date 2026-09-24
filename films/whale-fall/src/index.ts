import * as THREE from 'three';
import { smoothstep, type FilmDefinition, type FilmModule } from '@efe/core';
import { PROJECT_SERVICE, FilmProjectStore, type FilmProjectData, type ProjectShot } from '@efe/project';
import { Director, mixVec3, type Shot, type Vec3Tuple } from '@efe/director';
import { createThreeDirectorModule, createThreeRendererModule, THREE_SERVICE, type ThreeService } from '@efe/renderer-three';
import { createAudioModule, type AudioCue } from '@efe/audio';
import { generateDeterministicPoints } from '@efe/fx';
import projectJson from '../film.project.json';

export interface WhaleFallState {
  t: number;
  depth: number;
  whaleY: number;
  pitch: number;
  roll: number;
  light: number;
  lume: number;
  floorBlend: number;
}

export const whaleFallProjectStore = new FilmProjectStore(projectJson as unknown as FilmProjectData);
const duration = whaleFallProjectStore.snapshot().duration;

function sample(time: number, state: WhaleFallState): void {
  state.t = time;
  state.whaleY = whaleFallProjectStore.sampleTrack('whale.y', time, 0);
  state.depth = Math.max(0, -state.whaleY);
  state.pitch = whaleFallProjectStore.sampleTrack('whale.pitch', time, 0);
  state.roll = whaleFallProjectStore.sampleTrack('whale.roll', time, 0);
  state.light = whaleFallProjectStore.sampleTrack('environment.light', time, 1);
  state.lume = whaleFallProjectStore.sampleTrack('environment.bioluminescence', time, 0);
  state.floorBlend = smoothstep(60, 70, time);
}

function projectShotToShot(source: ProjectShot): Shot<WhaleFallState> {
  const camera = source.camera ?? {
    from: [0, 0, 20] as [number, number, number],
    to: [0, 0, 20] as [number, number, number],
    targetOffset: [0, 0, 0] as [number, number, number],
  };
  return {
    id: source.id,
    t0: source.range[0],
    t1: source.range[1],
    evaluate(_time, progress, state) {
      const base = mixVec3(camera.from as Vec3Tuple, camera.to as Vec3Tuple, progress);
      const position: Vec3Tuple = [base[0], base[1] + state.whaleY, base[2]];
      const target: Vec3Tuple = [
        camera.targetOffset[0],
        state.whaleY + camera.targetOffset[1],
        camera.targetOffset[2],
      ];
      return {
        position,
        target,
        focalLengthMm: source.lensMm,
        focusDistance: source.focusDistance ?? 28,
        aperture: source.aperture ?? 4,
      };
    },
  };
}

function buildShots(): Shot<WhaleFallState>[] {
  return whaleFallProjectStore.snapshot().shots.map(projectShotToShot);
}

const director = new Director(buildShots());

function projectModule(): FilmModule<WhaleFallState> {
  let unsubscribe: (() => void) | undefined;
  return {
    name: 'film-project',
    initOrder: 10,
    updateOrder: 10,
    reconstruction: { mode: 'pure' },
    init(ctx) {
      ctx.services.set(PROJECT_SERVICE, whaleFallProjectStore);
      unsubscribe = whaleFallProjectStore.subscribe(() => director.setShots(buildShots()));
    },
    dispose() {
      unsubscribe?.();
    },
  };
}

function whaleWorld(): FilmModule<WhaleFallState> {
  let whale: THREE.Group;
  let bodyMaterial: THREE.MeshStandardMaterial;
  let floor: THREE.Mesh;
  let snow: THREE.Points;
  let lume: THREE.Points;

  return {
    name: 'whale-world',
    order: 300,
    reconstruction: { mode: 'pure' },
    init(ctx) {
      const { scene } = ctx.services.require<ThreeService>(THREE_SERVICE);

      scene.fog = new THREE.FogExp2(0x04111b, 0.003);
      scene.add(new THREE.HemisphereLight(0x8bb7cc, 0x020508, 1.6));
      const sun = new THREE.DirectionalLight(0xffc28a, 3.0);
      sun.position.set(-20, 30, 16);
      scene.add(sun);

      whale = new THREE.Group();
      bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x48535b, roughness: 0.72, metalness: 0.02 });
      const bodyGeo = new THREE.SphereGeometry(1, 64, 32);
      const p = bodyGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const u = (x + 1) * 0.5;
        const taper = 0.1 + 0.9 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.8);
        p.setXYZ(i, x * 11, y * taper * 1.25 - Math.max(0, u - 0.65) * 0.32, z * taper);
      }
      bodyGeo.computeVertexNormals();
      whale.add(new THREE.Mesh(bodyGeo, bodyMaterial));

      for (const side of [-1, 1]) {
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.8, 5.5, 12), bodyMaterial);
        fin.position.set(2.6, -0.6, side * 1.05);
        fin.scale.set(1, 0.22, 1.7);
        fin.rotation.z = Math.PI / 2;
        fin.rotation.y = side * 0.28;
        whale.add(fin);
      }

      const tailMaterial = bodyMaterial.clone();
      for (const side of [-1, 1]) {
        const tail = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 8), tailMaterial);
        tail.position.set(-11.2, 0, side * 1.2);
        tail.scale.set(2.3, 0.18, 1.05);
        tail.rotation.y = side * 0.35;
        whale.add(tail);
      }
      scene.add(whale);

      const floorGeo = new THREE.PlaneGeometry(1200, 1200, 96, 96);
      const fp = floorGeo.attributes.position;
      const floorPoints = generateDeterministicPoints(fp.count, 'floor', (rng, index) => [
        fp.getX(index),
        fp.getY(index),
        (rng() - 0.5) * 9,
      ]);
      for (let i = 0; i < fp.count; i++) fp.setXYZ(i, floorPoints[i * 3], floorPoints[i * 3 + 1], floorPoints[i * 3 + 2]);
      floorGeo.computeVertexNormals();
      floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0x11171a, roughness: 1 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -905;
      scene.add(floor);

      snow = particleCloud(1400, 150, 0xd9e6eb, 'snow');
      lume = particleCloud(420, 130, 0x55e5d7, 'lume');
      scene.add(snow, lume);
    },
    update(time, _dt, ctx) {
      whale.position.set(0, ctx.state.whaleY, 0);
      whale.rotation.set(ctx.state.pitch, 0.1 * Math.sin(time * 0.08), ctx.state.roll);
      bodyMaterial.color.setRGB(
        0.18 + ctx.state.light * 0.15,
        0.22 + ctx.state.light * 0.12,
        0.26 + ctx.state.light * 0.1,
      );
      const service = ctx.services.require<ThreeService>(THREE_SERVICE);
      if (service.scene.fog instanceof THREE.FogExp2) {
        service.scene.fog.density = 0.0015 + ctx.state.depth / 900 * 0.012;
      }
      snow.position.y = ctx.state.whaleY;
      snow.rotation.y = time * 0.01;
      const lumeMaterial = lume.material as THREE.PointsMaterial;
      lumeMaterial.opacity = Math.min(0.9, ctx.state.lume * 0.75);
      lume.position.y = ctx.state.whaleY;
      floor.visible = ctx.state.depth > 500;
    },
  };
}

function particleCloud(count: number, radius: number, color: THREE.ColorRepresentation, seed: string): THREE.Points {
  const data = generateDeterministicPoints(count, seed, (rng) => {
    const r = Math.pow(rng(), 0.6) * radius;
    const a = rng() * Math.PI * 2;
    const y = (rng() - 0.5) * radius;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data, 3));
  const material = new THREE.PointsMaterial({
    color,
    size: seed === 'lume' ? 0.28 : 0.11,
    transparent: true,
    opacity: seed === 'lume' ? 0 : 0.35,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

const cues: AudioCue[] = [
  { id: 'surface-breath', time: 2.4, bus: 'ambience', trigger(engine, when) { engine.tone('ambience', when, 120, 0.35, 0.035); } },
  { id: 'submerge', time: 10.5, bus: 'sfx', trigger(engine, when) { engine.tone('sfx', when, 75, 0.7, 0.12); } },
  { id: 'abyss', time: 42, bus: 'music', trigger(engine, when) { engine.tone('music', when, 146.83, 1.8, 0.04); engine.tone('music', when + 0.04, 220, 1.7, 0.025); } },
  { id: 'floor', time: 63.5, bus: 'sfx', trigger(engine, when) { engine.tone('sfx', when, 48, 1.2, 0.16); } },
  { id: 'renewal', time: 71, bus: 'music', trigger(engine, when) { for (const [i, f] of [146.83, 185, 220, 293.66].entries()) engine.tone('music', when + i * 0.05, f, 4.2, 0.028); } },
];

export const whaleFallFilm: FilmDefinition<WhaleFallState> = {
  id: 'whale-fall',
  title: 'Whale Fall',
  duration,
  createState: () => ({ t: 0, depth: 0, whaleY: 0, pitch: 0, roll: 0, light: 1, lume: 0, floorBlend: 0 }),
  sample,
  rehearsal: [1.5, 10.5, 22, 42, 58, 64, 72, 78],
  modules: [
    projectModule,
    () => createThreeRendererModule({ background: 0x03111a, maxPixelRatio: 1.5, adaptiveResolution: true }),
    whaleWorld,
    () => createThreeDirectorModule(director),
    () => createAudioModule(cues),
  ],
};
