import { cannonEvents } from '../../../films/daoguang/src/cinema';

type RecordedSample={voice:'pluck'|'bow'|'bass';midi:number;buffer:AudioBuffer};
const sampleFiles=[
  {voice:'pluck' as const,midi:59,url:new URL('../../../films/daoguang/assets/audio/harp-B3.mp3',import.meta.url).href},
  {voice:'pluck' as const,midi:62,url:new URL('../../../films/daoguang/assets/audio/harp-D4.mp3',import.meta.url).href},
  {voice:'pluck' as const,midi:65,url:new URL('../../../films/daoguang/assets/audio/harp-F4.mp3',import.meta.url).href},
  {voice:'pluck' as const,midi:69,url:new URL('../../../films/daoguang/assets/audio/harp-A4.mp3',import.meta.url).href},
  {voice:'bow' as const,midi:38,url:new URL('../../../films/daoguang/assets/audio/cello-D2.mp3',import.meta.url).href},
  {voice:'bow' as const,midi:45,url:new URL('../../../films/daoguang/assets/audio/cello-A2.mp3',import.meta.url).href},
  {voice:'bow' as const,midi:50,url:new URL('../../../films/daoguang/assets/audio/cello-D3.mp3',import.meta.url).href},
  {voice:'bow' as const,midi:57,url:new URL('../../../films/daoguang/assets/audio/cello-A3.mp3',import.meta.url).href},
  {voice:'bow' as const,midi:62,url:new URL('../../../films/daoguang/assets/audio/cello-D4.mp3',import.meta.url).href},
 ];
async function loadSamples(ctx:BaseAudioContext):Promise<RecordedSample[]>{
  return Promise.all(sampleFiles.map(async s=>({voice:s.voice,midi:s.midi,buffer:await ctx.decodeAudioData(await (await fetch(s.url)).arrayBuffer())})));
}

type Note = { t:number; midi:number; dur:number; vel:number; voice:'pluck'|'bow'|'bell'|'bass'; pan:number };
const score:Note[]=[];
const note=(t:number,midi:number,dur:number,vel:number,voice:Note['voice']='pluck',pan=0)=>score.push({t,midi,dur,vel,voice,pan});
const theme=[62,69,67,65,64,62,57,60];
for(const [start,end,beat,level] of [[0,55,1.8,.7],[75,96,1.15,.42],[96,135,2.5,.54],[135,176,1.5,.65],[176,211,1.05,.72],[211,235,.9,.9],[235,270,2.3,.48]]) {
  for(let t=start+1,index=0;t<end-2;t+=beat*2,index++) {
    const midi=theme[index%theme.length];
    note(t,midi,beat*1.85,.10*level,'pluck',-.18);
    if(start===211||start===176) note(t+beat,midi-12,beat*.7,.055*level,'bow',.2);
  }
  for(let t=start,index=0;t<end-3;t+=beat*8,index++) {
    const root=[38,34,41,36][index%4];const dur=Math.min(beat*7.5,end-t-1);
    note(t,root,dur,.08*level,'bass',.1);
    note(t+.4,root+19,dur-.5,.04*level,'bow',-.35);
    if(start!==96)note(t+.8,root+24,dur-.8,.03*level,'bow',.35);
  }
}
for(let t=55,i=0;t<74;t+=.8,i++) {note(t,[38,45,50,53][i%4],.5,.065,'bow',i%2?.25:-.25);if(i%4===0)note(t,26,.65,.16,'bass');}
note(0,74,5,.055,'bell',.4);note(38,69,5,.05,'bell');note(96,62,4,.06,'bell');
note(235,50,8,.065,'bow');note(264,62,5,.07,'pluck');note(266,69,3.5,.04,'bell');

function noise(ctx:BaseAudioContext,seconds:number,seed=1840):AudioBuffer {
  const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate);const d=b.getChannelData(0);
  for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=seed/2147483648-1;}return b;
}

async function renderSoundtrack(samples:RecordedSample[],branchOnly=false):Promise<AudioBuffer> {
  const length=branchOnly?41:270;
  const ctx=new OfflineAudioContext(2,length*22050,22050);
  const mix=ctx.createGain();mix.gain.value=.82;
  const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-12;compressor.knee.value=10;compressor.ratio.value=3;
  mix.connect(compressor).connect(ctx.destination);
  const reverb=ctx.createConvolver();const impulse=ctx.createBuffer(2,Math.ceil(ctx.sampleRate*1.9),ctx.sampleRate);
  for(let c=0;c<2;c++){const d=impulse.getChannelData(c);let seed=17+c;for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=(seed/2147483648-1)*Math.exp(-i/ctx.sampleRate*4)*.13;}}
  reverb.buffer=impulse;const wet=ctx.createGain();wet.gain.value=.18;reverb.connect(wet).connect(mix);
  function route(gain:GainNode,pan:number){const p=ctx.createStereoPanner();p.pan.value=pan;gain.connect(p);p.connect(mix);p.connect(reverb);}
  function tone(t:number,f:number,dur:number,volume:number,voice:Note['voice'],pan=0,recorded=true){
    if(t<0||t>=length)return;
    const end=Math.min(length,t+dur);if(end<=t+.02)return;
    const g=ctx.createGain();const attack=Math.min(voice==='bow'?.65:.018,(end-t)*.25);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+attack);
    if(voice==='bow'||voice==='bass'){g.gain.setValueAtTime(volume*.75,Math.max(t+attack,end-.8));g.gain.linearRampToValueAtTime(0,end);}
    else g.gain.exponentialRampToValueAtTime(.00001,end);
    route(g,pan);
    if(recorded&&voice!=='bell') {
      const midi=69+12*Math.log2(f/440),kind=voice==='bass'?'bow':voice;
      const selected=samples.filter(s=>s.voice===kind).sort((a,b)=>Math.abs(a.midi-midi)-Math.abs(b.midi-midi))[0];
      if(selected){const source=ctx.createBufferSource();source.buffer=selected.buffer;source.playbackRate.value=2**((midi-selected.midi)/12);source.connect(g);source.start(t);source.stop(end);return;}
    }
    const partials=voice==='pluck'?[1,.42,.19,.08]:voice==='bell'?[1,.42,.22]:voice==='bow'?[1,.24,.1]:[1,.15];
    partials.forEach((amp,i)=>{
      const o=ctx.createOscillator(),h=ctx.createGain();o.type='sine';o.frequency.value=f*(voice==='bell'?[1,2.76,5.4][i]:i+1);h.gain.value=amp/(voice==='bow'?1.3:1.7);
      if(voice==='bow'){const vibrato=ctx.createOscillator(),depth=ctx.createGain();vibrato.frequency.value=4.8;depth.gain.value=3;vibrato.connect(depth).connect(o.detune);vibrato.start(t);vibrato.stop(end);}
      o.connect(h).connect(g);o.start(t);o.stop(end);
    });
  }
  const random=noise(ctx,4);
  function burst(t:number,dur:number,level:number,hz:number,pan:number,low=false){
    if(t<0||t>=length)return;
    const source=ctx.createBufferSource(),g=ctx.createGain(),filter=ctx.createBiquadFilter();source.buffer=random;filter.type=low?'lowpass':'bandpass';filter.frequency.value=hz;filter.Q.value=.65;
    g.gain.setValueAtTime(.00001,t);g.gain.exponentialRampToValueAtTime(level,t+.012);g.gain.exponentialRampToValueAtTime(.00001,Math.min(length,t+dur));
    source.connect(filter).connect(g);route(g,pan);source.start(t);source.stop(Math.min(length,t+dur));
  }
  if(!branchOnly){
    for(const n of score)tone(n.t,440*2**((n.midi-69)/12),n.dur,n.vel,n.voice,n.pan);
    // Swells are discrete and quiet; the mix has no constant broadband noise loop.
    for(const [a,b] of [[0,38],[55,75],[135,235],[252,270]])for(let t=a;t<b-3;t+=6.3)burst(t,3.8,.017,310,Math.sin(t)*.4,true);
    for(const t of [76,82,88,94]){tone(t,180,.10,.035,'pluck',-.2);tone(t+.23,145,.09,.025,'pluck',.2);}
    burst(96.4,.65,.045,1800,-.15);burst(104,.4,.018,2200,.15);
    tone(246,110,.16,.08,'pluck');burst(246,.13,.055,640,0);
    for(let t=212;t<230;t+=3.6)tone(t,48,.65,.10,'bass',0,false);
  }
  for(const event of cannonEvents.filter(e=>branchOnly?e.scene==='branchB':e.scene!=='branchB')){
    const t=event.t-(branchOnly?135:0);const pan=event.x>0?.4:-.4;
    tone(t,48,1.3,.35,'bass',pan,false);burst(t,.28,.7,1100,pan);burst(t+.04,1.8,.35,210,pan,true);
    burst(t+.55,.8,.12,450,-pan,true);burst(t+.8,.9,.1,1500,-pan);
  }
  return ctx.startRendering();
}

export class Soundscape {
  #context:AudioContext|null=null;
  #master:GainNode|null=null;
  #buffer:AudioBuffer|null=null;
  #battle:AudioBuffer|null=null;
  #prepare:Promise<void>|null=null;
  #main:AudioBufferSourceNode|null=null;
  #branch:AudioBufferSourceNode|null=null;
  #lastTime=0;
  #muted=false;
  #origin=0;
  get diagnostics(){return {ready:!!this.#buffer,activeSources:Number(!!this.#main)+Number(!!this.#branch),duration:this.#buffer?.duration??0};}
  prepare():Promise<void>{
    if(!this.#prepare)this.#prepare=loadSamples(new OfflineAudioContext(1,1,22050)).then(samples=>Promise.all([renderSoundtrack(samples),renderSoundtrack(samples,true)])).then(([main,battle])=>{this.#buffer=main;this.#battle=battle;});
    return this.#prepare;
  }
  async enable():Promise<void>{
    if(!this.#context){this.#context=new AudioContext({latencyHint:'playback'});this.#master=this.#context.createGain();this.#master.gain.value=this.#muted?0:.85;this.#master.connect(this.#context.destination);}
    await this.#context.resume();
    await this.prepare();
  }
  setMuted(muted:boolean){this.#muted=muted;if(this.#master&&this.#context)this.#master.gain.setTargetAtTime(muted?0:.85,this.#context.currentTime,.035);}
  reset(time:number){for(const source of [this.#main,this.#branch])if(source){try{source.stop();}catch{}source.disconnect();}this.#main=this.#branch=null;this.#lastTime=time;}
  sync(time:number,playing:boolean,_scene:string,route='both'){
    const ctx=this.#context;if(!ctx||ctx.state!=='running'||!this.#buffer||!this.#master)return;
    if(!playing||time>=270){if(this.#main||this.#branch)this.reset(time);return;}
    if(time<this.#lastTime-.05||Math.abs(time-(ctx.currentTime-this.#origin))>.25&&this.#main)this.reset(time);
    if(!this.#main){const source=ctx.createBufferSource();source.buffer=this.#buffer;source.connect(this.#master);source.start(0,Math.max(0,time));this.#main=source;this.#origin=ctx.currentTime-time;}
    const battle=time>=135&&time<176&&route==='B';
    if(battle&&!this.#branch&&this.#battle){const source=ctx.createBufferSource();source.buffer=this.#battle;source.connect(this.#master);source.start(0,time-135);this.#branch=source;}
    if(!battle&&this.#branch){this.#branch.stop();this.#branch.disconnect();this.#branch=null;}
    this.#lastTime=time;
  }
  async preview(start:number,seconds:number):Promise<number[][]>{await this.enable();const buffer=this.#buffer!;return [0,1].map(c=>Array.from(buffer.getChannelData(c).slice(Math.floor(start*buffer.sampleRate),Math.floor((start+seconds)*buffer.sampleRate))));}
}
