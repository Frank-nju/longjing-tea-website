import * as THREE from 'three';
import { sampleScalar, seededRandom, smoothstep, type FilmDefinition, type FilmModule } from '@efe/core';
import { Director, mixVec3, type Shot, type Vec3Tuple } from '@efe/director';
import { createThreeDirectorModule, createThreeRendererModule, THREE_SERVICE, type ThreeService } from '@efe/renderer-three';
import { createAudioModule, type AudioCue } from '@efe/audio';
import { generateDeterministicPoints } from '@efe/fx';

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

const duration = 80;
const whaleYKeys = [[0, 0], [10, 0], [18, -60], [30, -260], [42, -540], [58, -830], [64, -895], [80, -900]] as const;
const lightKeys = [[0, 1], [10, 1], [22, 0.5], [42, 0.08], [60, 0.015], [80, 0.03]] as const;
const lumeKeys = [[0, 0], [26, 0], [42, 0.4], [55, 1], [80, 0.75]] as const;

function sample(time: number, state: WhaleFallState): void {
  state.t = time;
  state.whaleY = sampleScalar(whaleYKeys, time);
  state.depth = Math.max(0, -state.whaleY);
  state.pitch = sampleScalar([[0, 0], [18, 0.06], [42, 0.18], [64, 0.03], [80, 0]], time);
  state.roll = sampleScalar([[0, 0], [28, 0.12], [50, -0.2], [64, 0.05], [80, 0]], time);
  state.light = sampleScalar(lightKeys, time);
  state.lume = sampleScalar(lumeKeys, time);
  state.floorBlend = smoothstep(60, 70, time);
}

function whaleWorld(): FilmModule<WhaleFallState> {
  let root: THREE.Group;
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
      root = new THREE.Group();
      scene.add(root);

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
      root.add(whale);

      const floorGeo = new THREE.PlaneGeometry(1200, 1200, 96, 96);
      const fp = floorGeo.attributes.position;
      const rng = seededRandom('floor');
      for (let i = 0; i < fp.count; i++) fp.setZ(i, (rng() - 0.5) * 9);
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
      bodyMaterial.color.setRGB(0.18 + ctx.state.light * 0.15, 0.22 + ctx.state.light * 0.12, 0.26 + ctx.state.light * 0.1);
      const service = ctx.services.require<ThreeService>(THREE_SERVICE);
      if (service.scene.fog instanceof THREE.FogExp2) service.scene.fog.density = 0.0015 + ctx.state.depth / 900 * 0.012;
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
  const material = new THREE.PointsMaterial({ color, size: seed === 'lume' ? 0.28 : 0.11, transparent: true, opacity: seed === 'lume' ? 0 : 0.35, depthWrite: false });
  return new THREE.Points(geometry, material);
}

const shots: Shot<WhaleFallState>[] = [
  shot('surface-wide', 0, 10.5, [-28, 7, 20], [22, 5, 9], [0, 0, 0], 42),
  shot('eye-goodbye', 10.5, 18, [8, 2.8, 6], [5, 1.8, 3.5], [5.2, -0.1, 0.65], 80),
  shot('descent-profile', 18, 34, [-26, 8, 16], [-18, 11, 24], [0, 0, 0], 52),
  shot('blue-hour', 34, 44, [20, 5, 20], [10, 7, 18], [0, -1, 0], 65),
  shot('abyss-wide', 44, 58, [-34, 16, 28], [-42, 18, 31], [0, -2, 0], 40),
  shot('floor-arrival', 58, 70, [25, 11, 22], [15, 8, 16], [0, -3, 0], 55),
  shot('after-years', 70, 80, [-18, 7, 25], [-12, 11, 30], [0, -4, 0], 70),
];

function shot(id: string, t0: number, t1: number, from: Vec3Tuple, to: Vec3Tuple, targetOffset: Vec3Tuple, focalLengthMm: number): Shot<WhaleFallState> {
  return {
    id, t0, t1,
    evaluate(_time, progress, state) {
      const base = mixVec3(from, to, progress);
      const position: Vec3Tuple = [base[0], base[1] + state.whaleY, base[2]];
      const target: Vec3Tuple = [targetOffset[0], state.whaleY + targetOffset[1], targetOffset[2]];
      return { position, target, focalLengthMm, focusDistance: 28, aperture: id === 'eye-goodbye' ? 1.8 : 4 };
    },
  };
}

const director = new Director(shots);

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
    () => createThreeRendererModule({ background: 0x03111a, maxPixelRatio: 1.5, adaptiveResolution: true }),
    whaleWorld,
    () => createThreeDirectorModule(director),
    () => createAudioModule(cues),
  ],
};
