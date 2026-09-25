import * as THREE from 'three';
import { makeSmoke } from './visuals';

export const cannonEvents = [
  { t: 58.2, scene: 'dinghai', x: -6, z: 2 },
  { t: 62.8, scene: 'dinghai', x: -3, z: 2 },
  { t: 67.4, scene: 'dinghai', x: 20, z: -23 },
  { t: 71.1, scene: 'dinghai', x: 1, z: 2 },
  { t: 139.5, scene: 'branchB', x: -4, z: 1 },
  { t: 149.2, scene: 'branchB', x: 12, z: -27 },
  { t: 158.4, scene: 'branchB', x: -2, z: 1 },
  { t: 163.5, scene: 'branchB', x: 12, z: -27 },
  { t: 177.5, scene: 'constraints', x: -28, z: -18 },
  { t: 195.4, scene: 'constraints', x: 13, z: 4 },
  { t: 228.5, scene: 'yangtze', x: 43, z: -25 },
];

export function shipTravel(scene: string, time: number): number {
  const config: Record<string, [number, number]> = {
    coast: [0,.16], dinghai: [55,.22], branch: [135,.18], branchA: [135,.18],
    branchB: [135,.18], branchBoth: [135,.18], constraints: [176,.2],
    yangtze: [211,.55], treaty: [235,.06], reflection: [252,.24],
  };
  const [start,speed]=config[scene] ?? [time,0];
  return (time-start)*speed;
}

export function addAction(root: THREE.Group, scene: string): void {
  for(const event of cannonEvents.filter(e=>e.scene===scene)) {
    const burst=new THREE.Group(); burst.userData.cannon=event;
    const flash=new THREE.Mesh(new THREE.SphereGeometry(.7,12,8),new THREE.MeshBasicMaterial({color:0xffcd75,transparent:true,depthWrite:false}));
    flash.name='flash'; burst.add(flash);
    const light=new THREE.PointLight(0xffaa42,0,20,2); burst.add(light);
    makeSmoke(burst,0,0,0,event.t);
    const smoke=burst.children.at(-1) as THREE.Mesh;
    smoke.name='plume'; smoke.userData={};
    const sparks=new THREE.BufferGeometry();const positions=new Float32Array(90);
    sparks.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const spray=new THREE.Points(sparks,new THREE.PointsMaterial({color:0xc7d6cb,size:.18,transparent:true,depthWrite:false}));
    spray.name='spray'; spray.frustumCulled=false;burst.add(spray);root.add(burst);
  }
  if(scene==='map') {
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-8,1.2,6),new THREE.Vector3(-2,1.2,2),new THREE.Vector3(3,1.2,-2),new THREE.Vector3(7,1.2,-5),new THREE.Vector3(11,1.2,-7)]);
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(160)),new THREE.LineBasicMaterial({color:0xffcb79}));
    line.name='dispatch-route';root.add(line);
    const courier=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),new THREE.MeshBasicMaterial({color:0xffe0a4}));
    courier.userData.dispatch=curve;root.add(courier);
    const beacon=new THREE.PointLight(0xffb658,3,7,2);courier.add(beacon);
  }
}

export function updateAction(root: THREE.Group,time:number,scene:string):void {
  root.traverse(object=>{
    if(object.userData.cannon) {
      const event=object.userData.cannon as typeof cannonEvents[number];const age=time-event.t;
      object.visible=age>=0&&age<6;if(!object.visible)return;
      const aboard=event.z>0;
      object.position.set(event.x+(aboard?shipTravel(scene,event.t):0),aboard?2.4:4,event.z);
      const flash=object.getObjectByName('flash') as THREE.Mesh<THREE.SphereGeometry,THREE.MeshBasicMaterial>;
      flash.visible=age<.22;flash.scale.setScalar(1+age*5);flash.material.opacity=Math.max(0,1-age/.22);
      const light=object.children.find(c=>c instanceof THREE.PointLight) as THREE.PointLight;light.intensity=65*Math.exp(-age*22);
      const plume=object.getObjectByName('plume') as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>;
      plume.scale.setScalar(.12+age*.19);plume.position.set(age*.65,age*.55,aboard?-age*.7:age*.7);
      plume.material.uniforms.time.value=time;plume.visible=age>.04;
      plume.scale.multiplyScalar(Math.min(1,(6-age)*.8));
      const spray=object.getObjectByName('spray') as THREE.Points<THREE.BufferGeometry,THREE.PointsMaterial>;
      const fall=age-.75;spray.visible=fall>=0&&fall<1.8;spray.material.opacity=Math.max(0,1-fall/1.8);
      const p=spray.geometry.getAttribute('position');
      for(let i=0;i<p.count;i++) {const a=i*2.399;const speed=.8+(i%7)*.25;
        p.setXYZ(i,Math.cos(a)*fall*speed, -object.position.y+Math.max(0,fall*(4+i%4)-4.9*fall*fall), (aboard?-15:13)+Math.sin(a)*fall*speed);
      }p.needsUpdate=true;
    }
    if(object.userData.dispatch) {
      const k=THREE.MathUtils.smoothstep(time,76,96);object.position.copy((object.userData.dispatch as THREE.CatmullRomCurve3).getPoint(k));
      (root.getObjectByName('dispatch-route') as THREE.Line).geometry.setDrawRange(0,Math.max(2,Math.floor(k*160)+1));
    }
    if(object instanceof THREE.Mesh&&object.userData.ownedMap&&scene==='court') {
      const k=THREE.MathUtils.smoothstep(time,96,99);object.position.z=time<96?0:(1-k)*4;
    }
  });
}
