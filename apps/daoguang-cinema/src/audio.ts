import { shots, cannonTimes, type Route } from './cut';
import { voiceUrls, voiceTimings } from './voice-assets';

type Caption = {start:number;end:number;text:string};
const instrumentUrls = [
  new URL('../../../films/daoguang/assets/audio/harp-D4.mp3',import.meta.url).href,
  new URL('../../../films/daoguang/assets/audio/cello-D3.mp3',import.meta.url).href,
];
export class FilmSound {
  private context:AudioContext|null=null;
  private output:GainNode|null=null;
  private source:AudioBufferSourceNode|null=null;
  private buffers=new Map<string,AudioBuffer>();
  private captions=new Map<string,Caption[]>();
  private prepared:Promise<void>|null=null;
  private origin=0;
  private key='main';
  private muted=false;
  get diagnostics(){return {ready:this.buffers.has('main'),activeSources:Number(!!this.source),key:this.key,duration:this.buffers.get('main')?.duration??0};}
  prepare():Promise<void>{
    if(!this.prepared)this.prepared=this.build();
    return this.prepared;
  }
  private async build():Promise<void>{
    const decoder=new OfflineAudioContext(1,1,24000);
    const decode=async(url:string)=>{const response=await fetch(url);if(!response.ok)throw new Error('无法加载音频');return decoder.decodeAudioData(await response.arrayBuffer());};
    const [voices,instruments]=await Promise.all([
      Promise.all(Object.entries(voiceUrls).map(async([id,url])=>[id,await decode(url)] as const)),
      Promise.all(instrumentUrls.map(decode)),
    ]);
    const voiceMap=new Map(voices);
    for(const key of ['main','A','B']){
      const length=key==='main'?270:18;
      const ctx=new OfflineAudioContext(2,length*24000,24000);
      const master=ctx.createGain();master.gain.value=.88;
      const limit=ctx.createDynamicsCompressor();limit.threshold.value=-8;limit.ratio.value=5;limit.knee.value=6;master.connect(limit).connect(ctx.destination);
      const music=ctx.createGain();music.gain.value=.45;music.connect(master);
      const cues:Caption[]=[];
      const narration=key==='main'?shots.filter(s=>s.voice).map(s=>({id:s.id,start:s.voice_start!,end:s.voice_end!,text:s.voice})):[{id:key,start:1,end:16,text:key==='A'?'假如先争取交涉的时间，仍要面对对方的要求。停战能否实现，并不由一方决定。':'假如先集结兵力，命令仍要化为运输、训练与协同。决心本身，不能保证反攻成功。'}];
      for(const item of narration){
        const buffer=voiceMap.get(item.id);if(!buffer)throw new Error(`Missing voice ${item.id}`);
        const rate=Math.max(1,buffer.duration/(item.end-item.start));
        if(rate>1.15)throw new Error(`旁白需重新剪辑：${item.id}`);
        const source=ctx.createBufferSource();source.buffer=buffer;source.playbackRate.value=rate;source.connect(master);source.start(item.start);
        const end=item.start+buffer.duration/rate;
        const words=voiceTimings[item.id];
        if(words?.length)for(const sentence of words)cues.push({start:item.start+sentence.offset/1e7/rate,end:Math.min(end,item.start+(sentence.offset+sentence.duration)/1e7/rate),text:sentence.text});
        else cues.push({start:item.start,end,text:item.text});
        music.gain.setValueAtTime(.45,Math.max(0,item.start-.25));music.gain.linearRampToValueAtTime(.19,item.start);music.gain.setValueAtTime(.19,end);music.gain.linearRampToValueAtTime(.45,Math.min(length,end+.5));
      }
      const note=(at:number,midi:number,duration:number,volume:number,bow=false,pan=0)=>{
        if(at>=length)return;
        const source=ctx.createBufferSource(),gain=ctx.createGain(),stereo=ctx.createStereoPanner();source.buffer=instruments[bow?1:0];source.playbackRate.value=2**((midi-(bow?50:62))/12);stereo.pan.value=pan;
        const end=Math.min(length,at+duration);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+(bow?.65:.025));gain.gain.exponentialRampToValueAtTime(.0001,end);
        source.connect(gain).connect(stereo).connect(music);source.start(at);source.stop(end);
      };
      for(let t=key==='main'?12:0,i=0;t<length-2;t+=key==='main'?(t<115?9:t<211?6:10):6,i++){
        if(key==='main'&&(t>=64&&t<74||t>=173&&t<185||t>=223&&t<235))continue;
        note(t,[62,69,67][i%3],6,.14,false,-.2);if(i%3===0)note(t+.2,[38,41,36][Math.floor(i/3)%3],9,.10,true,.18);
      }
      let seed=1840;
      const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const texture=ctx.createBuffer(1,24000*2,24000),data=texture.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(rnd()*2-1);
      const rustle=(at:number,duration:number,volume:number,hz:number,pan=0)=>{
        const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),stereo=ctx.createStereoPanner();source.buffer=texture;filter.type='bandpass';filter.frequency.value=hz;filter.Q.value=.7;stereo.pan.value=pan;
        gain.gain.setValueAtTime(.00001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.025);gain.gain.exponentialRampToValueAtTime(.00001,at+duration);source.connect(filter).connect(gain).connect(stereo).connect(master);source.start(at);source.stop(at+duration);
      };
      const tap=(at:number,freq:number,volume:number,duration=.12)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(freq*.5,at+duration);g.gain.setValueAtTime(volume,at);g.gain.exponentialRampToValueAtTime(.00001,at+duration);o.connect(g).connect(master);o.start(at);o.stop(at+duration);};
      if(key==='main'){
        for(const t of [2,35,40,75,82.1,83,87.2,89,90.5,92,93.5,101.4,111.3,118,128,131,186,189,192,236,248])rustle(t,.4,.07,1700,-.2);
        for(let t=77;t<82;t+=.47){tap(t,105,.085);tap(t+.18,85,.06);}
        for(let t=77;t<82;t+=.18)tap(t,800+rnd()*1100,.004,.025);
        for(const t of cannonTimes){tap(t,62,.24,.8);rustle(t,.25,.24,480,.25);rustle(t+.1,1.2,.14,140,-.3);}
        for(const [a,b] of [[7,34],[55,74],[149,173],[197,235],[259,269]])for(let t=a;t<b-2;t+=4.9)rustle(t,1.8,.011,330,.2);
      }else{
        rustle(1,.5,.08,1700);rustle(5,.4,.045,1200);
        if(key==='B')for(let t=6;t<12;t+=.55)tap(t,100,.07);
      }
      this.captions.set(key,cues);this.buffers.set(key,await ctx.startRendering());
    }
  }
  async enable():Promise<void>{
    if(!this.context){this.context=new AudioContext();this.output=this.context.createGain();this.output.gain.value=this.muted?0:1;this.output.connect(this.context.destination);}
    await this.context.resume();await this.prepare();
  }
  caption(time:number,route:Route|null=null):string {return this.captions.get(route??'main')?.find(c=>time>=c.start&&time<c.end)?.text??'';}
  setMuted(value:boolean):void{this.muted=value;if(this.output&&this.context)this.output.gain.setTargetAtTime(value?0:1,this.context.currentTime,.025);}
  stop():void{if(this.source){this.source.onended=null;this.source.stop();this.source.disconnect();this.source=null;}}
  sync(time:number,playing:boolean,route:Route|null=null):void{
    const ctx=this.context,key=route??'main',buffer=this.buffers.get(key);
    if(!ctx||ctx.state!=='running'||!this.output||!buffer)return;
    if(!playing||time>=buffer.duration){this.stop();return;}
    if(this.source&&(key!==this.key||Math.abs(ctx.currentTime-this.origin-time)>.18))this.stop();
    if(!this.source){const source=ctx.createBufferSource();source.buffer=buffer;source.connect(this.output);source.start(0,Math.max(0,time));this.source=source;this.origin=ctx.currentTime-time;this.key=key;source.onended=()=>{if(this.source===source){source.disconnect();this.source=null;}};}
  }
}
