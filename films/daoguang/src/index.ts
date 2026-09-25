import * as THREE from 'three';
import { FilmProjectStore, type FilmProjectData, PROJECT_SERVICE } from '@efe/project';
import { Director, mixVec3, type CameraRig, type Shot } from '@efe/director';
import { createThreeDirectorModule, createThreeRendererModule, THREE_SERVICE, type ThreeService } from '@efe/renderer-three';
import type { FilmDefinition, FilmModule } from '@efe/core';
import projectJson from '../film.project.json';
import { beatAt, chapterAt } from './story';
import { makeDetailedShip as makeShip, makeOcean as water, makeLandscape as terrain, makeRidge, makeSky, makeSmoke, surface, disposeSurfaces, tiledRoof, detailedFort as makeFort, furnishCourt } from './visuals';
import { cannonEvents, shipTravel, updateAction, addAction } from './cinema';

export type FilmMode = 'linear' | 'interactive';
export type Decision = 'A' | 'B';

export interface DaoguangState {
  t: number;
  chapter: string;
  shot: string;
  scene: string;
  progress: number;
  mode: FilmMode;
  decision: Decision | null;
  route: 'A' | 'B' | 'both';
  exposure: number;
  routeProgress: number;
  beat: ReturnType<typeof beatAt>;
}

export const daoguangProjectStore = new FilmProjectStore(projectJson as unknown as FilmProjectData);
const project = daoguangProjectStore.snapshot();
const sceneForShot: Record<string, string> = {
  'opium-coast': 'coast', dinghai: 'dinghai', 'dispatch-map': 'map',
  'memorial-desk': 'court', decision: 'court', 'branch-choice': 'branch',
  constraints: 'constraints', yangtze: 'yangtze', treaty: 'treaty', reflection: 'reflection',
};

function buildShots(): Shot<DaoguangState>[] {
  return daoguangProjectStore.snapshot().shots.map((source) => {
    const camera = source.camera!;
    return {
      id: source.id,
      t0: source.range[0],
      t1: source.range[1],
      evaluate(time, progress): CameraRig {
        const scene = sceneForShot[source.id.split('/')[0]] ?? 'coast';
        const ease = progress * progress * (3 - 2 * progress);
        const position = [...mixVec3(camera.from, camera.to, ease)] as [number, number, number];
        const target = [...camera.targetOffset] as [number, number, number];
        if (/waterline|broadside|\/ship|\/bow/.test(source.id)) {
          const travel = shipTravel(scene, time); position[0] += travel; target[0] += travel;
        }
        const shake = cannonEvents.filter(e => e.scene === scene).reduce((n, e) => n + (time >= e.t ? Math.exp(-(time-e.t)*9) : 0), 0);
        position[1] += Math.sin(time*53)*shake*.12;
        position[0] += Math.sin(time*71)*shake*.08;
        return {
          position,
          target,
          focalLengthMm: source.lensMm,
          focusDistance: source.focusDistance,
          aperture: source.aperture,
        };
      },
    };
  });
}

function mat(color: THREE.ColorRepresentation, roughness = 0.82, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function box(parent: THREE.Object3D, size: [number, number, number], at: [number, number, number], material: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...at);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent: THREE.Object3D, top: number, bottom: number, height: number, at: [number, number, number], material: THREE.Material, sides = 12): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material);
  mesh.position.set(...at);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function tube(parent: THREE.Object3D, points: THREE.Vector3[], color: THREE.ColorRepresentation, radius = 0.045): THREE.Mesh {
  const path = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 64, radius, 8, false), new THREE.MeshStandardMaterial({ color, roughness: 0.45, emissive: color, emissiveIntensity: 0.12 }));
  parent.add(mesh);
  return mesh;
}

function makeFigure(parent: THREE.Object3D, x: number, z: number, color: number, scale = 1): void {
  const figure = new THREE.Group();
  figure.position.set(x, 0, z); figure.scale.setScalar(scale);
  cylinder(figure, 0.28, 0.38, 1.15, [0, 1.35, 0], mat(color, 0.92), 8);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), mat(0x987658, 0.88));
  head.position.y = 2.08; figure.add(head);
  cylinder(figure, 0.15, 0.22, 0.85, [-0.15, 0.44, 0], mat(color), 7).rotation.z = -0.1;
  cylinder(figure, 0.15, 0.22, 0.85, [0.15, 0.44, 0], mat(color), 7).rotation.z = 0.1;
  parent.add(figure);
}

function city(parent: THREE.Object3D, x: number, z: number, scale = 1): void {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.scale.setScalar(scale);
  const wall = surface(0x93846d, 'stone');
  box(group, [23, 3, 2], [0, 1.5, -8], wall);
  for (let i = -10; i <= 10; i += 4) box(group, [1, 1.4, 2.8], [i, 3.7, -8], wall);
  for (let i = -1; i <= 1; i++) {
    const x2 = i * 6;
    box(group, [4.6, 3.4, 4], [x2, 1.7, -3 - Math.abs(i)], wall);
    const roofGroup = new THREE.Group(); roofGroup.position.set(x2, 0, -3 - Math.abs(i));
    tiledRoof(roofGroup, 5.8, 5.2, 3.0); group.add(roofGroup);
  }
  parent.add(group);
}

function frame(parent: THREE.Object3D, image: THREE.Texture, position: [number, number, number], width: number): void {
  box(parent, [width + 0.44, width * 0.69 + 0.44, 0.36], position, mat(0x392c20, 0.43));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, width * 0.69), new THREE.MeshBasicMaterial({ map: image }));
  panel.position.set(position[0], position[1], position[2] + 0.2); parent.add(panel);
}

function buildCoast(): THREE.Group {
  const root = new THREE.Group(); water(root, 0x24434a);
  const shore = terrain(root, 0x5e5a47); shore.scale.set(1, 1, 0.48); shore.position.set(0, -0.36, -43);
  for (let i = 0; i < 7; i++) {
    const hill = makeRidge(20 + i * 2, 10 + i, i, i % 2 ? 0x525746 : 0x68604c);
    hill.position.set(-64 + i * 22, 3 + i % 3, -60 - Math.sin(i) * 7); hill.rotation.z = 0.18; root.add(hill);
  }
  makeFort(root, -20, -43, 1.2); makeFort(root, 22, -46, 0.86);
  const barge = makeShip(root, { x: -8, z: 5, junk: true, color: 0x3b3429, scale: 1.2, sails: 1 });
  barge.rotation.y = -0.25;
  for (let i = 0; i < 9; i++) box(barge, [.9, .6, .8], [-2 + i % 3 * 1.05, 2.7, -.9 + Math.floor(i / 3) * .9], surface(0x75583b,'wood'));
  for (let i = 0; i < 7; i++) makeFigure(root, -28 + i * 8, -43 + i % 3 * 1.2, i % 2 ? 0x5b5140 : 0x77705f, 0.85);
  return root;
}

function buildDinghai(): THREE.Group {
  const root = new THREE.Group(); water(root, 0x223d49); terrain(root, 0x5d5949).position.set(0, -0.37, -27);
  city(root, -33, -33, 1.2); makeFort(root, 20, -28, 1.2);
  makeShip(root, { x: -6, z: 5, color: 0x30383b, scale: 1.36 });
  makeShip(root, { x: 32, z: 17, color: 0x30383b, scale: 0.78 });
  for (let i = 0; i < 3; i++) {
    makeSmoke(root, -25 + i * 6, 7 + i % 4 * 2, -19 - i % 2 * 7, i * 3.71);
  }
  return root;
}

function buildMap(): THREE.Group {
  const root = new THREE.Group();
  box(root, [31, 0.9, 24], [0, 0, 0], mat(0x493828));
  box(root, [29, 0.14, 22], [0, 0.55, 0], mat(0xb7a783));
  for (let i = 0; i < 12; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(2.2 + i % 3, 14, 9), mat(0x80836b));
    hill.scale.set(1.5, 0.25, 0.9); hill.position.set(-11 + i * 7 % 23, 0.78, -8 + i * 13 % 16); root.add(hill);
  }
  tube(root, [new THREE.Vector3(-11, 0.82, 7), new THREE.Vector3(-8, 0.82, 2), new THREE.Vector3(-1, 0.82, 1), new THREE.Vector3(4, 0.82, -4), new THREE.Vector3(11, 0.82, -7)], 0x31566a, 0.22);
  tube(root, [new THREE.Vector3(11, 0.94, -7), new THREE.Vector3(7, 0.94, -5), new THREE.Vector3(3, 0.94, -2), new THREE.Vector3(-2, 0.94, 2), new THREE.Vector3(-8, 0.94, 6)], 0x9e352a, 0.1);
  for (const [x, z] of [[-9, 6], [11, -7], [0, 0]] as const) {
    cylinder(root, 0.18, 0.18, 2, [x, 1.5, z], mat(0x8f312a), 8);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), mat(0xa13c2e)); marker.position.set(x, 2.7, z); root.add(marker);
  }
  return root;
}

function buildCourt(): THREE.Group {
  const root = new THREE.Group(); box(root, [35, 0.7, 28], [0, -0.55, 0], mat(0x342b23));
  for (const x of [-14, -7, 0, 7, 14]) {
    cylinder(root, 0.48, 0.55, 12, [x, 5.5, -9], mat(0x5b2924, 0.54), 14);
    if (Math.abs(x) === 14) cylinder(root, 0.48, 0.55, 12, [x, 5.5, 9], mat(0x5b2924, 0.54), 14);
  }
  box(root, [36, 1.4, 2.8], [0, 12, -9], mat(0x37251f)); box(root, [36, 1.4, 2.8], [0, 12, 9], mat(0x37251f));
  box(root, [19, 1, 15], [0, 13, 0], mat(0x43312b));
  box(root, [12, 1, 7], [0, 2.8, 0], mat(0x513a29));
  for (const x of [-5.2, 5.2]) for (const z of [-2.7, 2.7]) box(root, [0.45, 2.5, 0.45], [x, 1.2, z], mat(0x493529));
  box(root, [7.2, 0.16, 4.1], [0, 3.4, 0], mat(0xcbb88e));
  const brush = cylinder(root, 0.08, 0.13, 2.1, [3.3, 4.05, 0.8], mat(0x211c18), 8); brush.rotation.z = -0.48;
  const seal = box(root, [0.8, 0.6, 0.8], [-3.1, 3.8, -1], mat(0x8d3028)); seal.rotation.y = 0.15;
  furnishCourt(root);
  return root;
}

function buildBranch(route: 'A' | 'B' | 'both'): THREE.Group {
  const root = new THREE.Group(); water(root, route === 'A' ? 0x3a5355 : 0x33434a); terrain(root, 0x5b594c).position.set(0, -0.37, -29);
  const first = makeShip(root, { x: -4, z: 4, color: 0x30383b, scale: route === 'both' ? 0.92 : 1.16 }); first.rotation.y = 0.06;
  makeShip(root, { x: 25, z: 18, junk: true, color: 0x44382c, scale: 0.76 }); makeFort(root, 12, -31, 0.92);
  if (route === 'A') {
    box(root, [0.18, 7, 0.18], [0, 4, -15], mat(0x624b38));
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.4), new THREE.MeshStandardMaterial({ color: 0x9b4434, side: THREE.DoubleSide }));
    flag.position.set(1.1, 6.3, -15); root.add(flag);
  }
  return root;
}

function buildConstraints(): THREE.Group {
  const root = new THREE.Group(); terrain(root, 0x565449); water(root, 0x273f49).position.z = 5;
  makeFort(root, -28, -22, 0.85); makeShip(root, { x: 13, z: 7, scale: 1.3, color: 0x2a3539 });
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
    const crate = box(root, [1.6, 1.1, 1.5], [-5 + col * 2, 0.55, -13 + row * 2], mat(0x71573d)); crate.rotation.y = (row + col) * 0.06;
  }
  for (let i = 0; i < 9; i++) makeFigure(root, -22 + i * 5.4, 7 + i % 3 * 1.5, i % 2 ? 0x6a5743 : 0x4a4a43, 0.76);
  return root;
}

function buildYangtze(): THREE.Group {
  const root = new THREE.Group(); water(root, 0x304e56);
  const banks = terrain(root, 0x6b6856); banks.scale.set(1, 1, 0.7); banks.position.z = -49;
  for (let i = 0; i < 9; i++) {
    const hill = makeRidge(24 + i % 4 * 2, 16 + i % 3 * 5, i + 12, i % 2 ? 0x59604f : 0x69624e);
    hill.position.set(-77 + i * 19, 4, -63 - i % 3 * 10); root.add(hill);
  }
  city(root, 43, -30, 1.5);
  const fleet = makeShip(root, { x: -5, z: 8, color: 0x2f3c3d, scale: 1.38 }); fleet.rotation.y = 0.04;
  makeShip(root, { x: 27, z: 24, color: 0x303a3d, scale: 0.72 });
  for (let i = 0; i < 6; i++) makeFigure(root, 40 + i % 3 * 2, -15 + Math.floor(i / 3) * 2, 0x55493a, 0.8);
  return root;
}

function buildTreaty(): THREE.Group {
  const root = new THREE.Group(); water(root, 0x283f49);
  const ship = makeShip(root, { x: -16, z: -8, scale: 0.93 }); ship.rotation.y = -0.18;
  const ship2 = makeShip(root, { x: 19, z: -20, color: 0x30383b, scale: 0.6 }); ship2.rotation.y = 0.35;
  box(root, [25, 1.1, 19], [0, -0.4, 3], surface(0x746047, 'wood'));
  for (const z of [-6,12]) {
    box(root, [25,.16,.18], [0,1.8,z], surface(0x473529,'wood'));
    for(let x=-12;x<=12;x+=2) box(root,[.12,1.8,.12],[x,.9,z],surface(0x473529,'wood'));
  }
  box(root, [10, 1, 6], [0, 2.6, 3], mat(0x543d2c));
  for (const x of [-4.4, 4.4]) for (const z of [0.7, 5.3]) box(root, [0.45, 2.2, 0.45], [x, 1.1, z], mat(0x473528));
  box(root, [7, 0.14, 4.2], [0, 3.18, 3], mat(0xd4c39d));
  const paper=document.createElement('canvas');paper.width=1024;paper.height=640;
  const ink=paper.getContext('2d')!;ink.fillStyle='#ccbb94';ink.fillRect(0,0,1024,640);
  ink.strokeStyle='#9b805d';ink.lineWidth=3;ink.strokeRect(35,35,954,570);
  ink.fillStyle='#463c2c';ink.textAlign='center';ink.font='48px serif';ink.fillText('南京條約',512,108);
  ink.font='24px serif';ink.fillText('道光二十二年 · 一八四二',512,158);
  ink.textAlign='left';ink.font='27px serif';
  ['五口通商','割讓香港島','賠款及通商條款'].forEach((line,i)=>ink.fillText(line,105,245+i*70));
  ink.font='21px serif';ink.fillStyle='#97523c';ink.fillText('條款結構示意 · 非原件摹本',105,548);
  const map=new THREE.CanvasTexture(paper);map.colorSpace=THREE.SRGBColorSpace;
  const page=new THREE.Mesh(new THREE.PlaneGeometry(7,4.2),new THREE.MeshStandardMaterial({map,roughness:.95}));
  page.rotation.x=-Math.PI/2;page.position.set(0,3.26,3);page.userData.ownedMap=map;root.add(page);
  cylinder(root, 0.35, 0.42, 0.55, [3.2, 3.56, 4.4], mat(0x94342b));
  makeFigure(root, -3.3, 8, 0x555249, 0.88); makeFigure(root, 3.3, 8, 0x4c4034, 0.88);
  return root;
}

function buildReflection(): THREE.Group {
  const root = new THREE.Group(); terrain(root, 0x67614e).position.z = -28; water(root, 0x344e53);
  for (let i = 0; i < 14; i++) {
    const height = 5 + i % 5;
    const building = box(root, [4 + i % 3, height, 4], [-30 + i * 4.5, height / 2, -17 - i % 4 * 4], mat(i % 2 ? 0x8b7b61 : 0x625b49));
    const roof = new THREE.Group(); roof.position.set(building.position.x, 0, building.position.z);
    tiledRoof(roof, 5.2 + i % 3, 5.2, height); root.add(roof);
  }
  makeShip(root, { x: -12, z: 13, color: 0x303a3d, scale: 0.72 });
  return root;
}

function createWorld(): FilmModule<DaoguangState> {
  let service: ThreeService | undefined;
  let groups: Record<string, THREE.Group> = {};
  let textures: THREE.Texture[] = [];
  let sky: THREE.Mesh;
  let sun: THREE.DirectionalLight;
  const imageUrls = [
    new URL('../assets/humen-painting.jpg', import.meta.url).href,
    new URL('../assets/part1-naval.png', import.meta.url).href,
    new URL('../assets/treaty-painting.jpg', import.meta.url).href,
  ];
  return {
    name: 'daoguang-world',
    initOrder: 200,
    updateOrder: 500,
    reconstruction: { mode: 'pure' },
    async init(ctx) {
      service = ctx.services.require<ThreeService>(THREE_SERVICE);
      service.scene.fog = new THREE.FogExp2(0x11191a, 0.0065);
      service.renderer.shadowMap.enabled = true;
      service.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      sky = makeSky(); service.scene.add(sky);
      service.scene.add(new THREE.HemisphereLight(0xc4d9e0, 0x3b3228, 1.15));
      sun = new THREE.DirectionalLight(0xffe4bc, 2.7); sun.position.set(-35, 52, 25);
      sun.castShadow = true; sun.shadow.mapSize.setScalar(ctx.width < 700 ? 1024 : 2048);
      Object.assign(sun.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 160 });
      sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.06; service.scene.add(sun);
      const fill = new THREE.DirectionalLight(0x92b0b9, 1.05); fill.position.set(36, 18, -24); service.scene.add(fill);
      const loader = new THREE.TextureLoader();
      textures = await Promise.all(imageUrls.map((url) => loader.loadAsync(url)));
      textures.forEach((texture) => { texture.colorSpace = THREE.SRGBColorSpace; });
      groups = {
        coast: buildCoast(), dinghai: buildDinghai(), map: buildMap(), court: buildCourt(),
        branchA: buildBranch('A'), branchB: buildBranch('B'), branchBoth: buildBranch('both'),
        constraints: buildConstraints(), yangtze: buildYangtze(), treaty: buildTreaty(), reflection: buildReflection(),
      };
      for (const [name, group] of Object.entries(groups)) {
        addAction(group, name);
        group.visible = name === 'coast'; service.scene.add(group);
      }
    },
    update(time, _dt, ctx) {
      if (!service) return;
      const state = ctx.state;
      const shot = daoguangProjectStore.shotAt(time)?.id ?? 'opium-coast';
      const scene = sceneForShot[shot.split('/')[0]] ?? 'coast';
      const active = scene === 'branch' ? state.route === 'both' ? 'branchBoth' : state.route === 'A' ? 'branchA' : 'branchB' : scene;
      for (const [name, group] of Object.entries(groups)) group.visible = name === active;
      const group = groups[active];
      updateAction(group, time, active);
      group.traverse((object) => {
        if (object instanceof THREE.Mesh && (object.userData.ocean || object.userData.waterFoam || object.userData.smoke) && object.material instanceof THREE.ShaderMaterial) (object.material as THREE.ShaderMaterial).uniforms.time.value = time;
        if (object instanceof THREE.Mesh && object.userData.sailBase) {
          const p = object.geometry.getAttribute('position');
          const base = object.userData.sailBase as Float32Array;
          for (let i = 0; i < p.count; i++) {
            const ripple = Math.sin(base[i * 3 + 1] * 3 + time * 1.4) * 0.10;
            p.setXYZ(i, base[i * 3] + (object.userData.junk ? 0 : ripple), base[i * 3 + 1], base[i * 3 + 2] + (object.userData.junk ? ripple : 0));
          }
          p.needsUpdate = true;
        }
        if (object instanceof THREE.Group && object.userData.floating) {
          object.position.x = object.userData.baseX + shipTravel(active, time);
          object.position.y = Math.sin(time * 0.6 + object.userData.baseX) * 0.16;
          object.rotation.z = Math.sin(time * 0.42 + object.userData.baseZ) * 0.008;
        }
        if (object instanceof THREE.Mesh && object.userData.smoke) {
          object.position.y = object.userData.baseY + Math.sin(time * 0.32 + object.position.x) * 0.16;
          object.scale.setScalar(0.9 + (Math.sin(time * 0.3 + object.position.z) + 1) * 0.13);
        }
      });
      const indoors = scene === 'court' || scene === 'map';
      sky.visible = !indoors;
      sun.intensity = indoors ? 1.5 : 2.7;
      const dark = indoors ? 0x24201a : 0x899792;
      const fog = service.scene.fog as THREE.FogExp2;
      fog.color.set(dark); fog.density = indoors ? 0.009 : 0.0032;
      (service.scene.background as THREE.Color).set(dark);
      service.renderer.toneMappingExposure = indoors ? 1.2 : 0.95;

    },
    dispose() {
      service?.scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          if (object.userData.ocean) (object as THREE.Mesh & { dispose(): void }).dispose();
          object.geometry.dispose();
          if (object.userData.ownedMap) (object.userData.ownedMap as THREE.Texture).dispose();
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
        }
      });
      textures.forEach((texture) => texture.dispose());
      disposeSurfaces();
    },
  };
}

export function createDaoguangFilm(initialMode: FilmMode = 'linear') {
  let mode = initialMode;
  let decision: Decision | null = null;
  const director = new Director(buildShots());
  const unsubscribe = daoguangProjectStore.subscribe(() => director.setShots(buildShots()));
  const film: FilmDefinition<DaoguangState> = {
    id: 'daoguang-history-film',
    title: project.title,
    duration: project.duration,
    createState: () => ({
      t: 0, chapter: '禁烟与判断', shot: 'opium-coast', scene: 'coast', progress: 0,
      mode, decision, route: 'both', exposure: 0.7, routeProgress: 0, beat: beatAt(0),
    }),
    sample(time, state) {
      const shot = daoguangProjectStore.shotAt(time) ?? project.shots[0];
      state.t = time;
      state.chapter = chapterAt(time).id;
      state.shot = shot.id;
      state.scene = sceneForShot[shot.id.split('/')[0]] ?? 'coast';
      state.progress = Math.max(0, Math.min(1, (time - shot.range[0]) / (shot.range[1] - shot.range[0])));
      state.mode = mode;
      state.decision = decision;
      state.route = mode === 'linear' ? time < 155 ? 'A' : 'B' : decision ?? 'both';
      state.exposure = daoguangProjectStore.sampleTrack('light.exposure', time, 0.7);
      state.routeProgress = daoguangProjectStore.sampleTrack('route.progress', time, 0);
      state.beat = beatAt(time);
    },
    modules: [
      () => ({ name: 'film-project', init(ctx) { ctx.services.set(PROJECT_SERVICE, daoguangProjectStore); }, dispose() { unsubscribe(); } }),
      () => createThreeRendererModule<DaoguangState>({ background: 0x101719, maxPixelRatio: 1.75, antialias: true, adaptiveResolution: false }),
      createWorld,
      () => createThreeDirectorModule(director),
      () => ({
        name: 'daoguang-framing', updateOrder: 750, reconstruction: { mode: 'pure' },
        update(_time, _dt, ctx) {
          const { camera } = ctx.services.require<ThreeService>(THREE_SERVICE);
          const framing = Math.max(1, (16 / 9) / camera.aspect);
          camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * framing));
          camera.updateProjectionMatrix();
        },
      }),
    ],
    rehearsal: [0, 17, 55, 76, 96, 120, 135, 156, 190, 211, 239, 264],
  };
  return {
    film,
    setMode(next: FilmMode) { mode = next; },
    setDecision(next: Decision | null) { decision = next; },
    getMode: () => mode,
    getDecision: () => decision,
  };
}
