import './style.css';
import { FilmRuntime } from '@efe/core';
import { createCinemaFilm, layerAt, shotAt, smooth, type Route } from './cut';
import { FilmArt } from './art';
import { FilmSound } from './audio';

const element=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const storyBeats:Record<string,{from:number;to:number;period:string;seal:string;heading:string;copy:string}>={
  S03:{from:1.1,to:8.8,period:'1839 · 虎门',seal:'史实与归纳',heading:'虎门销烟',copy:'禁烟维护国家利益，但并未终止英国以武力扩大在华利益的企图。'},
  S06:{from:.7,to:6.3,period:'1840 · 七月 · 定海',seal:'史实',heading:'战争越过广东',copy:'英军进攻定海，战事出现在更北方的海岸。'},
  S08:{from:.7,to:8.8,period:'军情递送 · 驿路',seal:'叙事意象',heading:'消息仍在途中',copy:'城池得失可以发生在一天之内；奏报，却要经过一站又一站。'},
  S09:{from:1.3,to:10.2,period:'1840 · 京师',seal:'解释性归纳',heading:'奏折抵达御案',copy:'海上的战争成了一行行文字；文字到了，战场却仍在改变。'},
  S11:{from:.8,to:9.2,period:'判断时刻',seal:'历史解释',heading:'剿与抚',copy:'主战与议和的反复，不是脱离时间、兵力和消息的选择题。'},
  S14:{from:.7,to:6.1,period:'1841 · 东南海岸',seal:'史实概述',heading:'战事沿海岸扩展',copy:'次年，清军在浙东的反攻仍未扭转战局。'},
  S19:{from:.7,to:7.4,period:'1842 · 镇江',seal:'史实概述',heading:'长江战事逼近腹地',copy:'战争沿长江继续推进，京杭方向受到威胁。'},
  S21:{from:.7,to:7.5,period:'1842 · 南京',seal:'史实',heading:'《南京条约》签订',copy:'割地、赔款与通商条款，写下战争的代价。'},
  S22:{from:.8,to:7.4,period:'战后回望',seal:'叙事意象',heading:'奏报之外',copy:'文字留下战场的痕迹，也留下抵达时已经过去的时间。'},
};
function renderStoryText(time:number,branch:Route|null):boolean{
  const root=element<HTMLElement>('storyText');
  const shot=shotAt(time),beat=storyBeats[shot.id],local=time-shot.start;
  if(!started||branch||!beat||local<beat.from||local>beat.to){root.hidden=true;root.style.setProperty('--story-alpha','0');return false;}
  const fadeIn=smooth((local-beat.from)/.65),fadeOut=smooth((beat.to-local)/.8),alpha=Math.min(fadeIn,fadeOut);
  root.hidden=alpha<.005;root.style.setProperty('--story-alpha',String(alpha));
  for(const [id,value] of [['storyPeriod',beat.period],['storySeal',beat.seal],['storyHeading',beat.heading],['storyCopy',beat.copy]] as const){const node=element<HTMLElement>(id);if(node.textContent!==value)node.textContent=value;}
  return alpha>.04;
}
const screen=element<HTMLElement>('screen'),cover=element<HTMLElement>('cover');
const choice=element<HTMLElement>('choice'),branchEnd=element<HTMLElement>('branchEnd');
const seek=element<HTMLInputElement>('seek'),caption=element<HTMLElement>('caption');
const runtime=new FilmRuntime(createCinemaFilm(),element<HTMLCanvasElement>('world'));
const art=new FilmArt(element<HTMLCanvasElement>('art')),sound=new FilmSound();
let ready=false,started=false,mode:'sample'|'linear'|'interactive'='sample';
let route:Route|null=null,branchPosition=0,branchOrigin=0,branchPlaying=false,gatePassed=false,muted=false;
let actionVersion=0,lastPointer=0;
const range=()=>mode==='sample'?[74,127]:[0,270];
const branchNow=()=>branchPlaying?Math.min(18,(performance.now()-branchOrigin)/1000):branchPosition;
const format=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;
function pause():void{
  if(route){branchPosition=branchNow();branchPlaying=false;}
  runtime.pause();sound.stop();
}
async function play():Promise<void>{
  if(!ready||!started||!choice.hidden||!branchEnd.hidden)return;
  const version=++actionVersion;
  await sound.enable();
  if(version!==actionVersion||!started)return;
  if(route){if(branchPosition>=18)branchPosition=0;branchOrigin=performance.now()-branchPosition*1000;branchPlaying=true;}
  else{const [a,b]=range();if(runtime.now()>=b)runtime.seek(a);runtime.play();}
}
function stopForAction():void{actionVersion++;pause();}
function seekMain(time:number):void{
  stopForAction();route=null;choice.hidden=true;branchEnd.hidden=true;
  const [a,b]=range();gatePassed=time>=127;
  runtime.seek(Math.max(a,Math.min(b,time)));
}
function choose(next:Route):void{
  stopForAction();route=next;branchPosition=0;choice.hidden=true;branchEnd.hidden=true;
  void play();
}
function render():void{
  let time=Math.min(270,runtime.now());
  if(started&&!route&&mode==='interactive'&&!gatePassed&&time>=127){
    gatePassed=true;stopForAction();runtime.seek(127);time=127;choice.hidden=false;
  }
  if(started&&!route&&time>=range()[1]&&runtime.clock.playing){stopForAction();runtime.seek(range()[1]);time=range()[1];}
  const local=route?branchNow():time;
  if(route&&local>=18&&branchPlaying){pause();branchEnd.hidden=false;}
  art.draw(time,route,local);
  const storyActive=renderStoryText(time,route);
  const playing=route?branchPlaying:runtime.clock.playing;
  sound.sync(local,started&&playing,route);
  const text=started&&!storyActive?sound.caption(local,route):'';
  if(caption.textContent!==text)caption.textContent=text;
  const [a,b]=range();seek.min=route?'0':String(a);seek.max=route?'18':String(b);seek.value=String(local);
  element('clock').textContent=`${format(route?local:time-a)} / ${format(route?18:b-a)}`;
  element('play').textContent=playing?'暂停':'播放';
  element('segment').textContent=route?`课堂模拟 ${route}`:mode==='sample'?'文书样片':`${shotAt(time).id} · 动态分镜`;
  element('badge').textContent=route?'课堂模拟 · 非历史原话':layerAt(time)==='paper'?'文书意象 · 非档案原件':layerAt(time)==='courier'?'递送意象 · 艺术可视化':'历史场景可视化 · 动态分镜';
  screen.classList.toggle('quiet',playing&&performance.now()-lastPointer>2500);
  screen.classList.toggle('started',started);
  element('chapters').hidden=mode==='sample'||!!route;
}
async function begin(next:typeof mode):Promise<void>{
  if(!ready)return;
  stopForAction();mode=next;started=true;route=null;gatePassed=false;
  cover.hidden=true;choice.hidden=true;branchEnd.hidden=true;runtime.seek(range()[0]);
  await play();
}
for(const next of ['sample','linear','interactive'] as const)element<HTMLButtonElement>(next).addEventListener('click',()=>void begin(next));
element('play').addEventListener('click',()=>{if(!started)return;if(route?branchPlaying:runtime.clock.playing)stopForAction();else void play();});
element('home').addEventListener('click',()=>{stopForAction();started=false;route=null;choice.hidden=true;branchEnd.hidden=true;cover.hidden=false;runtime.seek(0);});
seek.addEventListener('input',()=>{stopForAction();if(route){branchPosition=Number(seek.value);branchEnd.hidden=branchPosition<18;}else seekMain(Number(seek.value));render();});
document.querySelectorAll<HTMLButtonElement>('[data-time]').forEach(button=>button.addEventListener('click',()=>{if(started)seekMain(Number(button.dataset.time));}));
document.querySelectorAll<HTMLButtonElement>('[data-route]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.route as Route)));
element('compare').addEventListener('click',()=>choose(route==='A'?'B':'A'));
element('rejoin').addEventListener('click',()=>{stopForAction();route=null;branchEnd.hidden=true;gatePassed=true;runtime.seek(127);void play();});
element('mute').addEventListener('click',()=>{muted=!muted;sound.setMuted(muted);element('mute').textContent=muted?'声音 关':'声音 开';});
element('full').addEventListener('click',()=>{if(document.fullscreenElement)void document.exitFullscreen();else void screen.requestFullscreen().catch(()=>{element('loading').textContent='此浏览器暂不支持全屏。';});});
element('info').addEventListener('click',()=>{stopForAction();element<HTMLDialogElement>('notes').showModal();});
element('closeNotes').addEventListener('click',()=>element<HTMLDialogElement>('notes').close());
screen.addEventListener('pointermove',()=>{lastPointer=performance.now();});
screen.addEventListener('pointerdown',()=>{lastPointer=performance.now();});
document.addEventListener('keydown',event=>{
  if(event.target instanceof HTMLInputElement||event.target instanceof HTMLButtonElement||element<HTMLDialogElement>('notes').open)return;
  if(event.code==='Space'){event.preventDefault();element('play').click();}
  if(started&&!route&&(event.key==='ArrowLeft'||event.key==='ArrowRight'))seekMain(runtime.now()+(event.key==='ArrowLeft'?-5:5));
});
runtime.events.on('pause',()=>sound.stop());runtime.events.on('seek',()=>sound.stop());
runtime.events.on('frame',render);
Object.assign(window,{__CINEMA__:{runtime,sound,art,seek:seekMain,choose,begin,pause:stopForAction,get state(){return {mode,route,time:runtime.now(),branchTime:branchNow(),playing:route?branchPlaying:runtime.clock.playing,ready,started};}}});
try{
  await Promise.all([runtime.init(),art.load(),sound.prepare()]);
  const resize=()=>{const box=element<HTMLCanvasElement>('world').getBoundingClientRect();runtime.resize(box.width,box.height);};resize();new ResizeObserver(resize).observe(screen);
  ready=true;element('loading').textContent='画面与声音已就绪';runtime.startLoop();render();
}catch(error){element('loading').textContent=`准备失败：${error instanceof Error?error.message:String(error)}`;console.error(error);}
