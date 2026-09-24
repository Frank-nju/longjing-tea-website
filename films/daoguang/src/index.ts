import * as THREE from 'three';
import { FilmProjectStore, type FilmProjectData, PROJECT_SERVICE } from '@efe/project';
import { Director, mixVec3, type CameraRig, type Shot } from '@efe/director';
import { createThreeDirectorModule, createThreeRendererModule, THREE_SERVICE, type ThreeService } from '@efe/renderer-three';
import type { FilmDefinition, FilmModule } from '@efe/core';
import projectJson from '../film.project.json';
import { beatAt, chapterAt } from './story';

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
  return project.shots.map((source) => {
    const camera = source.camera!;
    return {
      id: source.id,
      t0: source.range[0],
      t1: source.range[1],
      evaluate(_time, progress): CameraRig {
        return {
          position: mixVec3(camera.from, camera.to, progress),
          target: camera.targetOffset,
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

function sail(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, material: THREE.Material): void {
  const geometry = new THREE.BufferGeometry();
  geometry.setFromPoints([a, b, c]);
  geometry.setIndex([0, 1, 2]);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  (mesh.material as THREE.Material).side = THREE.DoubleSide;
  mesh.castShadow = true;
  parent.add(mesh);
}

function makeShip(parent: THREE.Object3D, options: { x: number; z: number; scale?: number; color?: number; junk?: boolean; sails?: number }): THREE.Group {
  const ship = new THREE.Group();
  ship.position.set(options.x, 0, options.z);
  ship.scale.setScalar(options.scale ?? 1);
  ship.userData.floating = true;
  ship.userData.baseX = options.x;
  ship.userData.baseZ = options.z;
  const hullMat = mat(options.color ?? 0x26353a, 0.46);
  const timber = mat(options.junk ? 0x8b6844 : 0x4d3a2b, 0.78);
  const sailMat = new THREE.MeshStandardMaterial({ color: options.junk ? 0xb69765 : 0xd6c8a9, roughness: 0.92, side: THREE.DoubleSide });
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-7, 0.25); hullShape.lineTo(-6.2, -0.9); hullShape.lineTo(5.8, -0.9);
  hullShape.lineTo(7, 0.25); hullShape.lineTo(5.5, 0.55); hullShape.lineTo(-5.5, 0.55); hullShape.closePath();
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 3.1, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.12, bevelThickness: 0.16 }), hullMat);
  hull.position.set(0, 1.45, -1.55);
  hull.castShadow = true;
  ship.add(hull);
  box(ship, [11.6, 0.18, 2.8], [0, 2.16, 0], timber);
  box(ship, [3.5, 0.8, 2.5], [3.4, 2.55, 0], timber);
  box(ship, [1.5, 1.45, 2.25], [-4.6, 2.8, 0], timber);
  for (let i = -5; i <= 5; i++) box(ship, [0.12, 0.42, 0.12], [i, 2.4, -1.35], mat(0x382d24));
  for (let i = 0; i < (options.sails ?? 3); i++) {
    const x = -4 + i * 4;
    const mastH = i === 1 ? 10 : 8.5;
    cylinder(ship, 0.09, 0.16, mastH, [x, 2.2 + mastH / 2, 0], mat(0x493a2b), 8);
    box(ship, [3.5, 0.16, 0.16], [x, 4.1 + mastH * 0.48, 0], mat(0x382d24));
    box(ship, [4.3, 0.12, 0.12], [x, 3.5 + mastH * 0.34, 0], mat(0x382d24));
    sail(ship, new THREE.Vector3(x - 1.65, 3.65, 0.12), new THREE.Vector3(x + 1.65, 3.65, 0.12), new THREE.Vector3(x + 1.2, 4.05 + mastH * 0.48, 0.12), sailMat);
    sail(ship, new THREE.Vector3(x - 1.9, 4.13 + mastH * 0.48, 0.14), new THREE.Vector3(x + 1.9, 4.13 + mastH * 0.48, 0.14), new THREE.Vector3(x + 1.45, 4.62 + mastH * 0.48, 0.14), sailMat);
    if (options.junk) {
      for (let rib = 0; rib < 4; rib++) tube(ship, [new THREE.Vector3(x - 1.65 + rib * 0.9, 3.7, 0.18), new THREE.Vector3(x + 0.9, 4.05 + mastH * 0.48, 0.18)], 0x6c5234, 0.025);
    }
  }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7), new THREE.MeshStandardMaterial({ color: options.junk ? 0x9c3c2f : 0x172a43, side: THREE.DoubleSide, roughness: 0.9 }));
  flag.position.set(0, 11.4, 0);
  ship.add(flag);
  return ship;
}

function makeFort(parent: THREE.Object3D, x: number, z: number, scale = 1): THREE.Group {
  const fort = new THREE.Group();
  fort.position.set(x, 0, z);
  fort.scale.setScalar(scale);
  const stone = mat(0x8d8069, 0.96);
  const roof = mat(0x4a2921, 0.75);
  box(fort, [15, 2.5, 4], [0, 1.25, 0], stone);
  box(fort, [11, 3.6, 4.6], [0, 4.3, 0], mat(0x514d43, 0.92));
  box(fort, [12.5, 0.35, 5.4], [0, 6.25, 0], roof);
  for (const x2 of [-6.5, 6.5]) {
    box(fort, [4.2, 6, 4.8], [x2, 3, 0], stone);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.2, 4), roof);
    cap.position.set(x2, 7.1, 0); cap.rotation.y = Math.PI / 4; fort.add(cap);
  }
  for (let i = 0; i < 5; i++) {
    const cannon = cylinder(fort, 0.22, 0.3, 2.4, [-4 + i * 2, 3.2, 2.65], mat(0x292a27, 0.4, 0.65), 10);
    cannon.rotation.x = Math.PI / 2;
    cylinder(fort, 0.72, 0.72, 0.18, [-4 + i * 2, 2.5, 2.65], mat(0x514d43), 12).rotation.x = Math.PI / 2;
  }
  return fort;
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

function water(parent: THREE.Object3D, color = 0x294b55): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(220, 170, 72, 56);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, mat(color, 0.3, 0.08));
  mesh.position.y = -0.18;
  mesh.receiveShadow = true;
  mesh.userData.waveBase = Array.from({ length: geometry.getAttribute('position').count }, (_, i) => geometry.getAttribute('position').getY(i));
  parent.add(mesh);
  return mesh;
}

function terrain(parent: THREE.Object3D, color = 0x55584a): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 180, 24, 20), mat(color, 0.98));
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = -0.4; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}

function city(parent: THREE.Object3D, x: number, z: number, scale = 1): void {
  const group = new THREE.Group(); group.position.set(x, 0, z); group.scale.setScalar(scale);
  const wall = mat(0x93846d, 0.92); const roof = mat(0x40302a, 0.82);
  box(group, [23, 3, 2], [0, 1.5, -8], wall);
  for (let i = -10; i <= 10; i += 4) box(group, [1, 1.4, 2.8], [i, 3.7, -8], wall);
  for (let i = -1; i <= 1; i++) {
    const x2 = i * 6;
    box(group, [4.6, 3.4, 4], [x2, 1.7, -3 - Math.abs(i)], wall);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.7, 4), roof);
    cap.position.set(x2, 4.2, -3 - Math.abs(i)); cap.rotation.y = Math.PI / 4; group.add(cap);
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
    const hill = new THREE.Mesh(new THREE.ConeGeometry(15 + i * 2, 8 + i, 7), mat(i % 2 ? 0x525746 : 0x68604c));
    hill.position.set(-64 + i * 22, 3 + i % 3, -60 - Math.sin(i) * 7); hill.rotation.z = 0.18; root.add(hill);
  }
  makeFort(root, -20, -30, 1.2); makeFort(root, 22, -34, 0.86);
  const barge = makeShip(root, { x: -8, z: 5, junk: true, color: 0x3b3429, scale: 1.2, sails: 1 });
  barge.rotation.y = -0.25;
  for (let i = 0; i < 9; i++) box(root, [1.4, 0.8, 1.2], [-12 + i % 3 * 2, 0.4, 3 + Math.floor(i / 3) * 2], mat(0x75583b));
  for (let i = 0; i < 7; i++) makeFigure(root, -28 + i * 8, -20 + i % 3 * 2, i % 2 ? 0x5b5140 : 0x77705f, 0.85);
  return root;
}

function buildDinghai(): THREE.Group {
  const root = new THREE.Group(); water(root, 0x223d49); terrain(root, 0x5d5949).position.set(0, -0.37, -27);
  city(root, -33, -33, 1.2); makeFort(root, 20, -28, 1.2);
  makeShip(root, { x: -6, z: 5, color: 0x30383b, scale: 1.36 });
  makeShip(root, { x: 32, z: 17, color: 0x30383b, scale: 0.78 });
  for (let i = 0; i < 9; i++) {
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(1.7 + i % 3 * 0.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0x8a8176, transparent: true, opacity: 0.16 }));
    smoke.position.set(-25 + i * 6, 7 + i % 4 * 2, -19 - i % 2 * 7); smoke.userData.baseY = smoke.position.y; smoke.userData.smoke = true; root.add(smoke);
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
    cylinder(root, 0.48, 0.55, 12, [x, 5.5, 9], mat(0x5b2924, 0.54), 14);
  }
  box(root, [36, 1.4, 2.8], [0, 12, -9], mat(0x37251f)); box(root, [36, 1.4, 2.8], [0, 12, 9], mat(0x37251f));
  box(root, [19, 1, 15], [0, 13, 0], mat(0x43312b));
  box(root, [12, 1, 7], [0, 2.8, 0], mat(0x513a29));
  for (const x of [-5.2, 5.2]) for (const z of [-2.7, 2.7]) box(root, [0.45, 2.5, 0.45], [x, 1.2, z], mat(0x493529));
  box(root, [7.2, 0.16, 4.1], [0, 3.4, 0], mat(0xcbb88e));
  for (let i = 0; i < 6; i++) tube(root, [new THREE.Vector3(-2.8, 3.51, -1.35 + i * 0.48), new THREE.Vector3(2.8, 3.51, -1.35 + i * 0.48)], 0x534638, 0.018);
  const brush = cylinder(root, 0.08, 0.13, 2.1, [3.3, 4.05, 0.8], mat(0x211c18), 8); brush.rotation.z = -0.48;
  const seal = box(root, [0.8, 0.6, 0.8], [-3.1, 3.8, -1], mat(0x8d3028)); seal.rotation.y = 0.15;
  for (let i = 0; i < 5; i++) makeFigure(root, 8 + i * 1.9, -2 + i % 2 * 3, 0x4b3931, 0.9);
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
  } else if (route === 'B') {
    for (let i = 0; i < 4; i++) {
      const flash = new THREE.Mesh(new THREE.SphereGeometry(1.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0xc27b3d, transparent: true, opacity: 0.23 }));
      flash.position.set(-22 + i * 12, 5 + i % 2 * 2, -15); flash.userData.baseY = flash.position.y; flash.userData.smoke = true; root.add(flash);
    }
  } else {
    const dividerMat = mat(0x8a7757); dividerMat.transparent = true; dividerMat.opacity = 0.48;
    box(root, [0.18, 7, 22], [0, 3.5, 0], dividerMat);
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
    const hill = new THREE.Mesh(new THREE.ConeGeometry(15 + i % 4 * 2, 13 + i % 3 * 5, 8), mat(i % 2 ? 0x59604f : 0x69624e));
    hill.position.set(-77 + i * 19, 4, -63 - i % 3 * 10); root.add(hill);
  }
  city(root, 43, -30, 1.5);
  const fleet = makeShip(root, { x: -5, z: 8, color: 0x2f3c3d, scale: 1.38 }); fleet.rotation.y = 0.04;
  makeShip(root, { x: 27, z: 24, color: 0x303a3d, scale: 0.72 });
  tube(root, [new THREE.Vector3(-33, 0.1, 26), new THREE.Vector3(-15, 0.1, 12), new THREE.Vector3(5, 0.1, 4), new THREE.Vector3(26, 0.1, -9), new THREE.Vector3(43, 0.1, -20)], 0xa34837, 0.1);
  for (let i = 0; i < 6; i++) makeFigure(root, 40 + i % 3 * 2, -15 + Math.floor(i / 3) * 2, 0x55493a, 0.8);
  return root;
}

function buildTreaty(): THREE.Group {
  const root = new THREE.Group(); water(root, 0x283f49);
  const ship = makeShip(root, { x: -16, z: -8, scale: 0.93 }); ship.rotation.y = -0.18;
  const ship2 = makeShip(root, { x: 19, z: -20, color: 0x30383b, scale: 0.6 }); ship2.rotation.y = 0.35;
  box(root, [10, 1, 6], [0, 2.6, 3], mat(0x543d2c));
  for (const x of [-4.4, 4.4]) for (const z of [0.7, 5.3]) box(root, [0.45, 2.2, 0.45], [x, 1.1, z], mat(0x473528));
  box(root, [7, 0.14, 4.2], [0, 3.18, 3], mat(0xd4c39d));
  for (let i = 0; i < 5; i++) tube(root, [new THREE.Vector3(-2.5, 3.28, 1.5 + i * 0.6), new THREE.Vector3(2.5, 3.28, 1.5 + i * 0.6)], 0x584a39, 0.02);
  cylinder(root, 0.35, 0.42, 0.55, [3.2, 3.56, 4.4], mat(0x94342b));
  makeFigure(root, -3.3, 8, 0x555249, 0.88); makeFigure(root, 3.3, 8, 0x4c4034, 0.88);
  return root;
}

function buildReflection(): THREE.Group {
  const root = new THREE.Group(); terrain(root, 0x67614e).position.z = -28; water(root, 0x344e53);
  for (let i = 0; i < 14; i++) {
    const height = 5 + i % 5;
    const building = box(root, [4 + i % 3, height, 4], [-30 + i * 4.5, height / 2, -17 - i % 4 * 4], mat(i % 2 ? 0x8b7b61 : 0x625b49));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.8, 4), mat(0x48312a));
    roof.position.set(building.position.x, building.position.y + height / 2 + 1, building.position.z);
    roof.rotation.y = Math.PI / 4; root.add(roof);
  }
  makeShip(root, { x: -12, z: 13, color: 0x303a3d, scale: 0.72 });
  return root;
}

function createWorld(): FilmModule<DaoguangState> {
  let service: ThreeService | undefined;
  let groups: Record<string, THREE.Group> = {};
  let textures: THREE.Texture[] = [];
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
      service.scene.add(new THREE.HemisphereLight(0xd7d2c3, 0x27251e, 1.4));
      const sun = new THREE.DirectionalLight(0xffd7a4, 3.4); sun.position.set(-35, 52, 25); service.scene.add(sun);
      const fill = new THREE.DirectionalLight(0x92b0b9, 1.05); fill.position.set(36, 18, -24); service.scene.add(fill);
      const loader = new THREE.TextureLoader();
      textures = await Promise.all(imageUrls.map((url) => loader.loadAsync(url)));
      textures.forEach((texture) => { texture.colorSpace = THREE.SRGBColorSpace; });
      groups = {
        coast: buildCoast(), dinghai: buildDinghai(), map: buildMap(), court: buildCourt(),
        branchA: buildBranch('A'), branchB: buildBranch('B'), branchBoth: buildBranch('both'),
        constraints: buildConstraints(), yangtze: buildYangtze(), treaty: buildTreaty(), reflection: buildReflection(),
      };
      frame(groups.coast, textures[0], [-42, 13, -52], 9);
      frame(groups.dinghai, textures[1], [35, 12, -30], 6.8);
      frame(groups.treaty, textures[2], [0, 15, -24], 7.5);
      for (const [name, group] of Object.entries(groups)) { group.visible = name === 'coast'; service.scene.add(group); }
    },
    update(time, _dt, ctx) {
      if (!service) return;
      const state = ctx.state;
      const shot = daoguangProjectStore.shotAt(time)?.id ?? 'opium-coast';
      const scene = sceneForShot[shot] ?? 'coast';
      const active = scene === 'branch' ? state.route === 'both' ? 'branchBoth' : state.route === 'A' ? 'branchA' : 'branchB' : scene;
      for (const [name, group] of Object.entries(groups)) group.visible = name === active;
      const group = groups[active];
      group.traverse((object) => {
        if (object instanceof THREE.Mesh && Array.isArray(object.userData.waveBase)) {
          const positions = object.geometry.getAttribute('position');
          for (let i = 0; i < positions.count; i++) {
            positions.setY(i, object.userData.waveBase[i] + Math.sin(positions.getX(i) * 0.075 + time * 0.7) * 0.09 + Math.cos(positions.getZ(i) * 0.08 - time * 0.52) * 0.07);
          }
          positions.needsUpdate = true; object.geometry.computeVertexNormals();
        }
        if (object instanceof THREE.Group && object.userData.floating) {
          object.position.y = Math.sin(time * 0.6 + object.userData.baseX) * 0.11;
          object.rotation.z = Math.sin(time * 0.42 + object.userData.baseZ) * 0.008;
        }
        if (object instanceof THREE.Mesh && object.userData.smoke) {
          object.position.y = object.userData.baseY + Math.sin(time * 0.32 + object.position.x) * 0.16;
          object.scale.setScalar(0.9 + (Math.sin(time * 0.3 + object.position.z) + 1) * 0.13);
        }
      });
      const dark = scene === 'court' || scene === 'treaty' ? 0x1d1917 : scene === 'map' ? 0x28231b : 0x11191a;
      service.scene.fog = new THREE.FogExp2(dark, scene === 'map' ? 0.002 : 0.0065);
      service.scene.background = new THREE.Color(dark);
      if (scene === 'coast') groups.coast.rotation.y = Math.sin(time * 0.025) * 0.018;
      if (scene === 'yangtze') groups.yangtze.rotation.y = Math.sin(time * 0.015) * 0.018;
    },
    dispose() {
      service?.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material.dispose());
        }
      });
      textures.forEach((texture) => texture.dispose());
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
      state.scene = sceneForShot[shot.id] ?? 'coast';
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
      () => createThreeRendererModule<DaoguangState>({ background: 0x101719, maxPixelRatio: 1.6 }),
      createWorld,
      () => createThreeDirectorModule(director),
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
