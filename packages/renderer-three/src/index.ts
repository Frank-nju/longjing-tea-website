import * as THREE from 'three';
import type { FilmModule } from '@efe/core';
import { focalLengthToVerticalFov, type CameraRig, type Director } from '@efe/director';

export const THREE_SERVICE = 'renderer-three';

export interface ThreeService {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export interface ThreeRendererOptions {
  background?: THREE.ColorRepresentation;
  maxPixelRatio?: number;
  adaptiveResolution?: boolean;
}

export function createThreeRendererModule<S extends object>(options: ThreeRendererOptions = {}): FilmModule<S> {
  let service: ThreeService | null = null;
  let frameTime = 0;
  let frameCount = 0;
  let pixelRatio = Math.min(devicePixelRatio || 1, options.maxPixelRatio ?? 1.75);

  return {
    name: 'renderer-three',
    order: 1000,
    init(ctx) {
      const renderer = new THREE.WebGLRenderer({ canvas: ctx.canvas, antialias: false, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setPixelRatio(pixelRatio);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(options.background ?? 0x02060b);
      const camera = new THREE.PerspectiveCamera(45, ctx.width / ctx.height, 0.1, 10000);
      service = { renderer, scene, camera };
      ctx.services.set(THREE_SERVICE, service);
    },
    update(_time, dt, ctx) {
      if (!service) return;
      if (options.adaptiveResolution !== false) {
        frameTime += dt;
        frameCount++;
        if (frameTime >= 2 && frameCount > 5) {
          const fps = frameCount / Math.max(1e-6, frameTime);
          const max = Math.min(devicePixelRatio || 1, options.maxPixelRatio ?? 1.75);
          let next = pixelRatio;
          if (fps < 42) next = Math.max(0.65, pixelRatio * 0.88);
          else if (fps > 58) next = Math.min(max, pixelRatio * 1.05);
          frameTime = 0;
          frameCount = 0;
          if (Math.abs(next - pixelRatio) > 0.01) {
            pixelRatio = next;
            service.renderer.setPixelRatio(pixelRatio);
            service.renderer.setSize(ctx.width, ctx.height, false);
          }
        }
      }
      service.renderer.render(service.scene, service.camera);
    },
    resize(width, height) {
      if (!service) return;
      service.camera.aspect = width / height;
      service.camera.updateProjectionMatrix();
      service.renderer.setSize(width, height, false);
    },
    dispose() {
      service?.renderer.dispose();
    },
  };
}

export function applyCameraRig(camera: THREE.PerspectiveCamera, rig: CameraRig): void {
  camera.position.set(...rig.position);
  camera.up.set(0, 1, 0);
  camera.lookAt(...rig.target);
  if (rig.roll) camera.rotateZ(rig.roll);
  camera.fov = focalLengthToVerticalFov(rig.focalLengthMm);
  camera.updateProjectionMatrix();
  camera.userData.focusDistance = rig.focusDistance;
  camera.userData.aperture = rig.aperture;
  camera.userData.fade = rig.fade;
}

export function createThreeDirectorModule<S extends object>(director: Director<S>): FilmModule<S> {
  return {
    name: 'director-three',
    order: 700,
    update(time, _dt, ctx) {
      const service = ctx.services.get<ThreeService>(THREE_SERVICE);
      if (!service) return;
      const directed = director.evaluate(time, ctx.state);
      if (!directed) return;
      applyCameraRig(service.camera, directed.rig);
      service.camera.userData.shot = directed.shotId;
      service.camera.userData.cut = directed.cut;
    },
  };
}
