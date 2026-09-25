import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

type Surface = 'wood' | 'canvas' | 'stone' | 'ground';
const maps = new Map<Surface, THREE.CanvasTexture>();

function texture(kind: Surface): THREE.CanvasTexture {
  const cached = maps.get(kind);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  let seed = 1839;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 4294967296;
    const grain = kind === 'wood' ? Math.sin(y * 1.8 + Math.sin(x * 0.018) * 6) * 11
      : kind === 'canvas' ? ((x % 3 === 0 || y % 3 === 0) ? -18 : 4) : Math.sin(x * 0.13 + y * 0.19) * 5;
    const value = 188 + noise * 36 + grain;
    const p = (y * 512 + x) * 4;
    pixels.data[p] = pixels.data[p + 1] = pixels.data[p + 2] = value;
    pixels.data[p + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  ctx.strokeStyle = kind === 'stone' ? '#666660' : '#766b5d';
  ctx.lineWidth = kind === 'stone' ? 3 : 1;
  const row = kind === 'stone' ? 64 : kind === 'wood' ? 42 : 128;
  for (let y = 0; kind !== 'ground' && y <= 512; y += row) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    if (kind !== 'canvas') for (let x = (Math.floor(y / row) % 2) * 64; x < 512; x += kind === 'stone' ? 128 : 256) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + row); ctx.stroke();
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  maps.set(kind, map);
  return map;
}

export function surface(color: number, kind: Surface, roughness = 0.82): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, map: texture(kind), bumpMap: texture(kind), bumpScale: kind === 'stone' ? 0.12 : 0.025, roughness });
}

function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, at: number[] = [0, 0, 0]): THREE.Mesh {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(at[0], at[1], at[2]);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}

function beam(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material): void {
  const delta = b.clone().sub(a);
  const pole = mesh(parent, new THREE.CylinderGeometry(radius * 0.78, radius, delta.length(), 8), material);
  pole.position.copy(a).add(b).multiplyScalar(0.5);
  pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
}

export function makeDetailedShip(parent: THREE.Object3D, options: { x: number; z: number; scale?: number; color?: number; junk?: boolean; sails?: number }): THREE.Group {
  const ship = new THREE.Group();
  ship.position.set(options.x, 0, options.z); ship.scale.setScalar(options.scale ?? 1);
  ship.userData = { floating: true, baseX: options.x, baseZ: options.z };
  parent.add(ship);
  const wood = surface(options.junk ? 0x715039 : 0x4a3426, 'wood');
  const deck = surface(0xa38b63, 'wood');
  const dark = new THREE.MeshStandardMaterial({ color: 0x222825, roughness: 0.64, metalness: 0.12 });
  const ochre = surface(0xc0a574, 'wood');
  const cloth = surface(options.junk ? 0xb39a6a : 0xe4d9b9, 'canvas', 0.95); cloth.side = THREE.DoubleSide; cloth.emissive.set(0xaca58e); cloth.emissiveIntensity = 0.16;
  const ropeMaterial = new THREE.LineBasicMaterial({ color: 0x65594a, transparent: true, opacity: 0.85 });
  const ropes: THREE.Vector3[] = [];
  const rope = (a: number[], b: number[]) => ropes.push(new THREE.Vector3(...a as [number, number, number]), new THREE.Vector3(...b as [number, number, number]));
  const width = (x: number) => 1.85 * Math.pow(Math.max(0.002, 1 - (x / 7.4) ** 2), 0.57);
  const hullGeo = new THREE.BufferGeometry();
  const vertices: number[] = [], indices: number[] = [], uvs: number[] = [];
  const nx = 56, nr = 24;
  for (let i = 0; i <= nx; i++) {
    const x = -7.4 + 14.8 * i / nx;
    const sheer = 0.48 * (Math.abs(x) / 7.4) ** 4;
    for (let j = 0; j <= nr; j++) {
      const theta = Math.PI * j / nr;
      vertices.push(x, 2.35 + sheer - 2.95 * Math.sin(theta), width(x) * Math.cos(theta));
      uvs.push(i / nx * 3, j / nr);
      if (i < nx && j < nr) {
        const a = i * (nr + 1) + j, b = a + nr + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  hullGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); hullGeo.setIndex(indices); hullGeo.computeVertexNormals();
  const hullMaterial = surface(options.color ?? 0x373b35, 'wood'); hullMaterial.side = THREE.DoubleSide;
  mesh(ship, hullGeo, hullMaterial);
  const outline = new THREE.Shape();
  for (let i = 0; i <= 56; i++) { const x = -7.35 + i * 14.7 / 56; i ? outline.lineTo(x, width(x)) : outline.moveTo(x, width(x)); }
  for (let i = 56; i >= 0; i--) { const x = -7.35 + i * 14.7 / 56; outline.lineTo(x, -width(x)); }
  outline.closePath();
  const deckMesh = mesh(ship, new THREE.ShapeGeometry(outline, 48), deck, [0, 2.34, 0]); deckMesh.rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) {
    for (const y of [1.33, 2.48, 2.88]) {
      const points = Array.from({ length: 49 }, (_, i) => { const x = -7.2 + i * 14.4 / 48; return new THREE.Vector3(x, y + 0.48 * (Math.abs(x) / 7.4) ** 4, side * width(x)); });
      mesh(ship, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, y === 1.33 ? 0.13 : 0.055, 5, false), y === 1.33 ? ochre : wood);
    }
    for (let x = -6.5; x <= 6.5; x += 0.65) beam(ship, new THREE.Vector3(x, 2.45, side * width(x)), new THREE.Vector3(x, 2.91, side * width(x)), 0.035, wood);
    if (!options.junk) for (let x = -5.6; x <= 5.6; x += 1.25) {
      const z = side * width(x) * 0.99;
      mesh(ship, new THREE.BoxGeometry(0.58, 0.48, 0.07), dark, [x, 1.7, z]);
      beam(ship, new THREE.Vector3(x, 1.72, z), new THREE.Vector3(x, 1.72, z + side * 0.38), 0.105, dark);
    }
  }
  mesh(ship, new THREE.BoxGeometry(2.1, 0.62, 2.4), wood, [-4.7, 2.65, 0]);
  mesh(ship, new THREE.BoxGeometry(2.35, 0.13, 2.62), deck, [-4.7, 3.02, 0]);
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) mesh(ship, new THREE.BoxGeometry(0.32, 0.32, 0.025), new THREE.MeshStandardMaterial({ color: 0x344943, roughness: 0.24 }), [-5.45 + i * 0.5, 2.68, side * 1.215]);
  for (const x of [-1.8, 1.8]) {
    mesh(ship, new THREE.BoxGeometry(1.3, 0.17, 1), dark, [x, 2.45, 0]);
    for (let i = 0; i < 6; i++) mesh(ship, new THREE.BoxGeometry(0.06, 0.05, 1.05), wood, [x - 0.55 + i * 0.22, 2.56, 0]);
  }
  const mastCount = options.sails ?? 3;
  for (let m = 0; m < mastCount; m++) {
    const x = mastCount === 1 ? 0 : -3.7 + m * 3.7;
    const height = m === 1 || mastCount === 1 ? 12.5 : 10.5;
    beam(ship, new THREE.Vector3(x, 2.4, 0), new THREE.Vector3(x, height, 0), 0.13, wood);
    for (const side of [-1, 1]) for (let k = -1; k <= 1; k++) {
      rope([x, height - 0.7, 0], [x + k * 1.5, 2.75, side * 1.6]);
      if (k === 0) for (let r = 0; r < 12; r++) { const f = r / 13; rope([x - 1.4 * (1 - f), 2.8 + f * (height - 3.5), side * 1.6 * (1 - f)], [x + 1.4 * (1 - f), 2.8 + f * (height - 3.5), side * 1.6 * (1 - f)]); }
    }
    rope([x, height, 0], [7.9, 3.6, 0]);
    const tiers = options.junk ? 1 : 3;
    for (let tier = 0; tier < tiers; tier++) {
      const bottom = options.junk ? 3.8 : 3.9 + tier * 2.35;
      const sailHeight = options.junk ? height - 4.7 : 2.35;
      const breadth = options.junk ? 3.3 : 5.3 - tier * 1.05;
      if (bottom + sailHeight > height - 0.3) continue;
      const geo = new THREE.PlaneGeometry(breadth, sailHeight, 16, 14);
      const p = geo.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) / breadth + 0.5, v = p.getY(i) / sailHeight + 0.5;
        const horizontal = (u - 0.5) * breadth * (0.78 + 0.22 * v);
        const billow = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.65;
        if (options.junk) p.setXYZ(i, x + horizontal, bottom + v * sailHeight, billow);
        else p.setXYZ(i, x + billow, bottom + v * sailHeight + 0.13 * Math.sin(u * Math.PI), horizontal);
      }
      geo.computeVertexNormals();
      const canvas = mesh(ship, geo, cloth); canvas.userData.sailBase = Float32Array.from(p.array); canvas.userData.junk = !!options.junk;
      if (options.junk) for (let r = 0; r <= 6; r++) {
        const v = r / 6, y = bottom + v * sailHeight, w = breadth * (0.78 + v * 0.22) / 2;
        beam(ship, new THREE.Vector3(x - w, y, 0.02), new THREE.Vector3(x + w, y, 0.02), 0.027, wood);
      } else {
        beam(ship, new THREE.Vector3(x, bottom + sailHeight, -breadth * 0.55), new THREE.Vector3(x, bottom + sailHeight, breadth * 0.55), 0.055, wood);
        for (const side of [-1, 1]) rope([x, bottom + sailHeight, side * breadth * 0.5], [x + 1.2, 2.7, side * 1.5]);
      }
    }
  }
  beam(ship, new THREE.Vector3(5.7, 2.6, 0), new THREE.Vector3(10.1, 4.2, 0), 0.1, wood);
  rope([10.1, 4.2, 0], [3.7, 10, 0]); rope([10.1, 4.2, 0], [6.7, 0.5, 0]);
  if(!options.junk) {
    for(const points of [[[4,9,0],[9.7,4.2,0],[5.6,4.2,0]],[[.2,10.8,0],[3.2,6,0],[.2,5.5,0]]]) {
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
      geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,0,0,0],2));geo.computeVertexNormals();mesh(ship,geo,cloth);
    }
  }
  const rigging = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(ropes), ropeMaterial); ship.add(rigging);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(38, 15), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 wakeUv; void main(){wakeUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float time; varying vec2 wakeUv;
      void main(){vec2 p=(wakeUv-.5)*vec2(38.,15.)+vec2(-7.,0.);
      float hull=1.85*pow(max(.002,1.-pow(p.x/7.4,2.)),.57);
      float edge=exp(-pow((abs(p.y)-hull-.18)*3.4,2.));
      float taper=(1.-smoothstep(5.8,8.,abs(p.x)));
      float ripple=.5+.5*sin(p.x*8.-time*1.5+sin(p.y*13.));
      float aft=max(0.,-p.x-6.);
      float wake=exp(-pow((abs(p.y)-1.2-aft*.19)*2.2,2.))*(1.-smoothstep(2.,19.,aft))*step(0.01,aft);
      float alpha=(edge*taper+wake*.6)*(.13+.19*ripple);
      gl_FragColor=vec4(.66,.74,.69,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  }));
  foam.rotation.x=-Math.PI/2; foam.position.set(-7,.03,0);
  foam.userData.waterFoam=true; ship.add(foam);
  return ship;
}

export function makeOcean(parent: THREE.Object3D, color = 0x294b55): THREE.Mesh {
  const mobile=window.innerWidth<720;
  const water=new Reflector(new THREE.PlaneGeometry(500,400,100,80),{
    color,textureWidth:mobile?512:1024,textureHeight:mobile?256:512,clipBias:.003,multisample:0,
    shader:{name:'HistoricalOcean',uniforms:{color:{value:new THREE.Color(color)},tDiffuse:{value:null},textureMatrix:{value:new THREE.Matrix4()},time:{value:0}},
      vertexShader:`uniform mat4 textureMatrix;uniform float time;varying vec4 reflectionUv;varying vec3 world;
      void main(){vec3 p=position;p.z+=sin(p.x*.16+p.y*.09+time*.7)*.13+sin(p.x*.31-p.y*.23-time)*.055;
      reflectionUv=textureMatrix*vec4(position,1.);world=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
      fragmentShader:`uniform sampler2D tDiffuse;uniform vec3 color;uniform float time;varying vec4 reflectionUv;varying vec3 world;
      void main(){vec2 ripple=vec2(sin(world.x*.9+world.z*.7+time*1.4),cos(world.z*1.1-world.x*.3-time))*.008;
      vec2 uv=reflectionUv.xy/reflectionUv.w+ripple;
      vec3 reflected=texture2D(tDiffuse,clamp(uv,.002,.998)).rgb;
      vec3 n=normalize(vec3(ripple.x*12.,1.,ripple.y*12.));vec3 v=normalize(cameraPosition-world);
      float fresnel=.22+.65*pow(1.-max(dot(n,v),0.),3.);
      float glint=pow(max(dot(reflect(-normalize(vec3(-.5,.8,.35)),n),v),0.),90.);
      vec3 c=mix(color*.65,reflected,fresnel)+vec3(.9,.74,.46)*glint*.5;
      float haze=1.-exp(-length(cameraPosition-world)*.002);c=mix(c,vec3(.34,.41,.42),haze);
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    },
  });
  water.position.y=-.18;water.rotation.x=-Math.PI/2;water.userData.ocean=true;
  parent.add(water);return water;
}

export function makeLandscape(parent: THREE.Object3D, color = 0x55584a): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(230, 180, 140, 100); geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute('position');
  const colors: number[] = [];
  const base = new THREE.Color(color), sand = new THREE.Color(0xaaa18a);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    const shore = 10 + Math.sin(x * 0.041) * 5 + Math.sin(x * 0.11) * 1.5;
    const inland = Math.max(0, shore - z);
    const y = z > shore ? -(z - shore) * 0.28 : Math.min(inland * 0.35, 2.4) + Math.max(0, inland - 24) * (0.06 + 0.035 * Math.sin(x * 0.05)) + Math.sin(x * 0.13) * Math.sin(z * 0.12) * Math.min(1.3, inland * 0.04);
    positions.setY(i, y);
    const c = base.clone().lerp(sand, Math.exp(-inland * 0.11)).multiplyScalar(0.88 + 0.12 * Math.sin(x * 0.21 + z * 0.17));
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geometry.computeVertexNormals();
  const material = surface(0xffffff, 'ground', 0.98); material.vertexColors = true;
  const land = mesh(parent, geometry, material); land.position.y = -0.4;
  return land;
}

export function makeRidge(radius: number, height: number, seed: number, color: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 64, 40);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const rough = 1 + Math.sin(x * 9 + seed) * Math.sin(z * 7 + seed * 2) * 0.13;
    p.setXYZ(i, x * radius * rough, Math.max(-0.2, y) * height * rough, z * radius * 0.7 * rough);
  }
  geometry.computeVertexNormals();
  const hill = new THREE.Mesh(geometry, surface(color, 'ground', 1)); hill.receiveShadow = true;
  return hill;
}

export function makeSmoke(parent: THREE.Object3D, x: number, y: number, z: number, seed: number): void {
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 }, seed: { value: seed } },
    vertexShader: `varying vec2 smokeUv; void main(){smokeUv=uv;vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.);vec2 size=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));center.xy+=position.xy*size;gl_Position=projectionMatrix*center;}`,
    fragmentShader: `uniform float time; uniform float seed; varying vec2 smokeUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
      void main(){vec2 p=smokeUv*2.-1.;vec2 q=smokeUv*4.+vec2(seed,time*-.065);
      float n=noise(q)*.6+noise(q*2.1)*.27+noise(q*4.3)*.13;
      float edge=1.-smoothstep(.2,1.,length(p*vec2(.9,1.)));
      float alpha=edge*smoothstep(.16,.76,n)*.48;
      gl_FragColor=vec4(mix(vec3(.28,.29,.27),vec3(.58,.57,.51),n),alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  });
  const smoke = new THREE.Mesh(new THREE.PlaneGeometry(10, 9), material);
  smoke.position.set(x,y,z); smoke.userData={smoke:true,baseY:y}; parent.add(smoke);
}

export function makeSky(): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 direction;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 c=mix(vec3(.53,.58,.56),vec3(.15,.25,.31),pow(h,.55));
    vec2 p=d.xz/(.18+h)*2.8;float n=noise(p)*.55+noise(p*2.03)*.28+noise(p*4.07)*.17;
    float cloud=smoothstep(.45,.72,n)*smoothstep(0.,.17,h);
    c=mix(c,mix(vec3(.37,.42,.43),vec3(.72,.71,.65),n),cloud*.65);
    float sun=pow(max(dot(d,normalize(vec3(-.5,.8,.35))),0.),180.);c+=vec3(.9,.65,.32)*sun;gl_FragColor=vec4(c,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
  }));
}

export function disposeSurfaces(): void { for (const map of maps.values()) map.dispose(); maps.clear(); }

export function tiledRoof(parent: THREE.Object3D, width: number, depth: number, y: number): void {
  const roof = new THREE.PlaneGeometry(width, depth, 24, 16);
  const p = roof.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getY(i), slope = Math.abs(z) / (depth / 2);
    p.setXYZ(i, x, y + (1 - slope) * 1.5 + slope ** 5 * 0.4 + (Math.abs(x) / (width / 2)) ** 8 * 0.25, z);
  }
  roof.computeVertexNormals();
  const material = surface(0x59574d, 'stone', 0.94); material.side = THREE.DoubleSide;
  mesh(parent, roof, material);
  const tiles: THREE.Vector3[] = [];
  for (let x = -width / 2; x <= width / 2; x += 0.24) for (let j = 0; j < 20; j++) {
    for (const z of [-depth / 2 + j * depth / 20, -depth / 2 + (j + 1) * depth / 20]) {
      const s = Math.abs(z) / (depth / 2);
      tiles.push(new THREE.Vector3(x, y + (1 - s) * 1.5 + s ** 5 * 0.4 + (Math.abs(x) / (width / 2)) ** 8 * 0.25 + 0.035, z));
    }
  }
  parent.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tiles), new THREE.LineBasicMaterial({ color: 0x8b8574 })));
  beam(parent, new THREE.Vector3(-width / 2, y + 1.55, 0), new THREE.Vector3(width / 2, y + 1.55, 0), 0.09, material);
}

export function detailedFort(parent: THREE.Object3D, x: number, z: number, scale = 1): THREE.Group {
  const fort = new THREE.Group(); fort.position.set(x, 0, z); fort.scale.setScalar(scale); parent.add(fort);
  const stone = surface(0x969183, 'stone', 0.98), trim = surface(0xb0a693, 'stone'), wood = surface(0x5f4431, 'wood');
  const iron = new THREE.MeshStandardMaterial({ color: 0x383b37, roughness: 0.6, metalness: 0.5 });
  mesh(fort, new THREE.BoxGeometry(22, 2.7, 7), stone, [0, 1.35, 0]);
  mesh(fort, new THREE.BoxGeometry(22.4, .3, 7.3), trim, [0, 2.8, 0]);
  mesh(fort, new THREE.BoxGeometry(22, 1.05, .8), stone, [0, 3.35, 3.3]);
  for (let i = -10; i <= 10; i += 1.3) mesh(fort, new THREE.BoxGeometry(.72, .65, .85), trim, [i, 4.18, 3.3]);
  for (const side of [-1, 1]) {
    mesh(fort, new THREE.CylinderGeometry(2.3, 2.55, 3.6, 24), stone, [side * 10, 1.8, 1]);
    mesh(fort, new THREE.CylinderGeometry(2.5, 2.3, .28, 24), trim, [side * 10, 3.72, 1]);
  }
  const gate = new THREE.Group(); gate.position.set(0, 2.9, -1); fort.add(gate);
  mesh(gate, new THREE.BoxGeometry(5.5, 2.6, 3.6), stone, [0, 1.3, 0]);
  mesh(gate, new THREE.BoxGeometry(1.6, 2.3, .08), wood, [0, 1.15, 1.84]);
  for (let i = -2; i <= 2; i++) mesh(gate, new THREE.BoxGeometry(.035, 2.1, .04), iron, [i * .28, 1.13, 1.9]);
  tiledRoof(gate, 7.4, 5.3, 2.25);
  for (const cx of [-8, -5, 5, 8]) {
    mesh(fort, new THREE.BoxGeometry(.72, .45, 1.7), wood, [cx, 3.2, 1.8]);
    beam(fort, new THREE.Vector3(cx, 3.68, 1.3), new THREE.Vector3(cx, 3.85, 4.6), .18, iron);
    for (const side of [-1, 1]) { const wheel = mesh(fort, new THREE.CylinderGeometry(.38, .38, .14, 16), wood, [cx + side * .48, 3.23, 1.9]); wheel.rotation.z = Math.PI / 2; }
  }
  return fort;
}

export function furnishCourt(root: THREE.Group): void {
  const wood = surface(0x654632, 'wood'), paper = surface(0xd5c5a1, 'canvas'), brass = new THREE.MeshStandardMaterial({ color: 0x9b783c, roughness: .38, metalness: .7 });
  const floor = mesh(root, new THREE.PlaneGeometry(34, 27), surface(0x4d392a, 'wood'), [0, -.17, 0]); floor.rotation.x = -Math.PI / 2;
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xada487, emissive: 0x5f4b2b, emissiveIntensity: .18, roughness: 1 });
  for (let x = -13; x <= 13; x += 6.5) {
    mesh(root, new THREE.BoxGeometry(5.8, 8, .22), wood, [x, 5, -9.3]);
    for (let row = 0; row < 7; row++) for (let col = 0; col < 6; col++) mesh(root, new THREE.BoxGeometry(.7, .58, .12), windowMat, [x - 2.2 + col * .88, 2 + row * .9, -9.14]);
  }
  const writing = document.createElement('canvas'); writing.width = 1024; writing.height = 512;
  const ctx = writing.getContext('2d')!; ctx.fillStyle = '#d0bd94'; ctx.fillRect(0, 0, 1024, 512); ctx.fillStyle = '#3b3025'; ctx.font = '28px serif';
  const columns = ['奏為籌辦海疆防務事', '欽差大臣謹奏', '沿海各口嚴密防守', '查明夷船往來情形', '遵旨據實馳奏', '伏乞皇上聖鑒'];
  columns.forEach((line, col) => [...line].forEach((char, row) => ctx.fillText(char, 900 - col * 115, 65 + row * 34)));
  ctx.strokeStyle = '#9e392b'; ctx.lineWidth = 5; ctx.strokeRect(65, 330, 78, 78); ctx.fillStyle = '#9e392b'; ctx.font = '21px serif'; ctx.fillText('示意', 80, 378);
  const map = new THREE.CanvasTexture(writing); map.colorSpace = THREE.SRGBColorSpace;
  const memorial = mesh(root, new THREE.PlaneGeometry(6.8, 3.8), new THREE.MeshStandardMaterial({ map, roughness: .95 }), [0, 3.505, 0]); memorial.rotation.x = -Math.PI / 2; memorial.userData.ownedMap = map;
  for (let i = 0; i < 6; i++) { const book = mesh(root, new THREE.BoxGeometry(1.6, .13, 2.3), i % 2 ? paper : wood, [4.2, 3.42 + i * .14, -1]); book.rotation.y = .07 * i; }
  mesh(root, new THREE.BoxGeometry(.9, .16, 1.25), new THREE.MeshStandardMaterial({ color: 0x191d1c, roughness: .3 }), [2.6, 3.48, 1]);
  for (const x of [-5, 5]) {
    mesh(root, new THREE.CylinderGeometry(.38, .6, .18, 20), brass, [x, 3.4, 2]);
    beam(root, new THREE.Vector3(x, 3.4, 2), new THREE.Vector3(x, 4.5, 2), .07, brass);
    mesh(root, new THREE.CylinderGeometry(.4, .22, .12, 20), brass, [x, 4.5, 2]);
    mesh(root, new THREE.CylinderGeometry(.09, .1, .55, 12), paper, [x, 4.8, 2]);
    mesh(root, new THREE.SphereGeometry(.085, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffc566 }), [x, 5.12, 2]);
    const light = new THREE.PointLight(0xffb868, 9, 13, 2); light.position.set(x, 5.3, 2); root.add(light);
  }
}
