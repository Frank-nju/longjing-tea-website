import { layerAt, progress, shotAt, smooth, type Route } from './cut';

const assets = {
  court: new URL('../../../films/daoguang/assets/cinema/court.webp', import.meta.url).href,
  courier: new URL('../../../films/daoguang/assets/cinema/courier.webp', import.meta.url).href,
  river: new URL('../../../films/daoguang/assets/cinema/river.webp', import.meta.url).href,
  humen: new URL('../../../films/daoguang/assets/cinema/humen.webp', import.meta.url).href,
};
const W = 1600, H = 900;
export class FilmArt {
  private images = new Map<string, HTMLImageElement>();
  private paper = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = W; canvas.height = H;
    this.ctx = canvas.getContext('2d')!;
    this.paper.width = 600; this.paper.height = 700;
    const p = this.paper.getContext('2d')!;
    const g = p.createLinearGradient(0,0,600,700);g.addColorStop(0,'#e2d1aa');g.addColorStop(.6,'#c6b18b');g.addColorStop(1,'#a99572');
    p.fillStyle=g;p.fillRect(0,0,600,700);
    let seed=1840;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<18000;i++){p.fillStyle=`rgba(66,45,21,${random()*.06})`;p.fillRect(random()*600,random()*700,.4+random()*2,.5+random()*3);}
    for(let i=0;i<350;i++){p.strokeStyle='rgba(230,217,183,.17)';p.beginPath();const x=random()*600,y=random()*700;p.moveTo(x,y);p.lineTo(x+random()*14,y+random()*4);p.stroke();}
  }
  async load(): Promise<void> {
    await Promise.all(Object.entries(assets).map(async([name,url])=>{const image=new Image();image.src=url;await image.decode();this.images.set(name,image);}));
  }
  private plate(name:string,zoom=1,dx=0,dy=0):void {
    const image=this.images.get(name);if(!image)return;
    this.ctx.drawImage(image,-W*(zoom-1)/2+dx,-H*(zoom-1)/2+dy,W*zoom,H*zoom);
  }
  private envelope(t:number,x=930,y=620,scale=1):void {
    const c=this.ctx;c.save();c.translate(x,y);c.rotate(-.08);c.scale(scale,scale);
    c.shadowColor='#000b';c.shadowBlur=25;c.shadowOffsetY=15;c.drawImage(this.paper,-220,-105,440,210);c.shadowColor='transparent';
    c.fillStyle='#9c866050';c.beginPath();c.moveTo(-220,-105);c.lineTo(0,4);c.lineTo(220,-105);c.closePath();c.fill();
    c.strokeStyle='#7c684c66';c.lineWidth=1;c.stroke();
    c.fillStyle='#30291dd9';c.textAlign='center';c.font='30px "Noto Serif CJK SC", "SimSun", serif';c.fillText('海 疆 軍 情',0,43);
    c.fillStyle='#514331';c.font='13px serif';c.fillText('文 書 意 象',0,76);
    c.strokeStyle='#77654b';c.lineWidth=3;c.beginPath();c.moveTo(-225,-25);c.bezierCurveTo(-60,-14,65,-18,223,-31);c.stroke();
    c.restore();
  }
  private memorial(open:number,time:number,mode:string):void {
    const c=this.ctx;const panelWidth=137;const fullWidth=panelWidth*5;
    c.save();c.translate(835,552);c.rotate(-.06);c.transform(1,.01,-.19,.88,0,0);
    const zoom=mode==='close'?1.32:1;c.scale(zoom,zoom);
    const reveal=smooth(open);const widths=Array.from({length:5},(_,i)=>panelWidth*(.13+.87*smooth(reveal*1.9-i*.2)));
    const total=widths.reduce((a,b)=>a+b,0);let x=total/2;
    const texts=mode==='treaty'?['南京條約','一八四二年','八月二十九日','割地賠款','五口通商']:['海疆軍情','消息抵達之時','戰局已經改變','遠方與御案','奏報之外'];
    for(let i=0;i<5;i++){
      const width=widths[i];x-=width;const fold=(1-width/panelWidth)*28;
      c.save();c.translate(x,-185+(i%2?fold:-fold));c.transform(width/panelWidth,0,0,1,0,0);
      c.shadowColor='#0008';c.shadowBlur=12;c.shadowOffsetY=10;c.drawImage(this.paper,0,0,panelWidth,370);c.shadowColor='transparent';
      c.strokeStyle='#93785165';c.strokeRect(10,12,panelWidth-20,345);
      c.font='23px "KaiTi", "Noto Serif CJK SC", serif';c.textAlign='center';c.fillStyle='#403729';
      [...texts[i]].forEach((ch,j)=>c.fillText(ch,95,45+j*30));
      const detail=mode==='treaty'?['條約於南京簽訂','清政府被迫承受戰爭代價']:['消息由沿海遞送入京','戰場仍在奏報之外改變'];
      c.font='12px "KaiTi", "Noto Serif CJK SC", serif';c.fillStyle='#514331b8';
      detail.forEach((line,k)=>[...line].forEach((ch,j)=>c.fillText(ch,59-k*23,47+j*21)));
      c.font='9px serif';c.fillStyle='#63533e';c.fillText('敘事文字 · 非原文',panelWidth/2,340);
      const shade=c.createLinearGradient(0,0,panelWidth,0);shade.addColorStop(0,'#33271955');shade.addColorStop(.11,'#fff2');shade.addColorStop(.52,'#0000');shade.addColorStop(1,'#30221c55');c.fillStyle=shade;c.fillRect(0,0,panelWidth,370);
      c.restore();
    }
    if(mode==='decision'){
      const ink=smooth((time-3)/3);c.save();c.beginPath();c.rect(-fullWidth/2,-185,fullWidth*ink,370);c.clip();c.strokeStyle='#7c2d21b3';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-110,80);c.bezierCurveTo(-60,50,-100,20,-18,15);c.bezierCurveTo(-44,50,65,-3,88,53);c.stroke();c.restore();
    }
    c.restore();
  }
  private brush(time:number):void {
    const c=this.ctx;const u=smooth(time/4);c.save();c.translate(1230-u*320,235+u*78);c.rotate(-.61+u*.08);
    c.shadowColor='#0008';c.shadowBlur=24;c.shadowOffsetX=-23;c.shadowOffsetY=25;
    const g=c.createLinearGradient(-9,0,9,0);g.addColorStop(0,'#261b13');g.addColorStop(.4,'#a88958');g.addColorStop(1,'#3b2a1b');c.fillStyle=g;c.fillRect(-6,-190,12,245);c.shadowColor='transparent';
    c.fillStyle='#211c17';c.beginPath();c.moveTo(-7,55);c.quadraticCurveTo(-10,86,0,114);c.quadraticCurveTo(10,86,7,55);c.fill();c.restore();
  }
  private rain(time:number):void {
    const c=this.ctx;c.save();c.lineWidth=.7;
    for(let i=0;i<140;i++){
      const x=(i*131.73+time*48)%W;const y=(i*77.31+time*(290+i%5*30))%H;
      c.strokeStyle=`rgba(187,201,215,${.035+i%4*.013})`;c.beginPath();c.moveTo(x,y);c.lineTo(x-5,y+23);c.stroke();
    }
    for(let i=0;i<22;i++){
      const u=(time*.63+i*.213)%1;c.strokeStyle=`rgba(172,196,210,${(1-u)*.1})`;c.beginPath();c.ellipse((i*153)%W,640+i%5*40,3+u*20,1+u*4,0,0,Math.PI*2);c.stroke();
    }c.restore();
  }
  private humen(time:number,u:number):void {
    const c=this.ctx;
    this.plate('humen',1.035+u*.055,-u*18,-u*4);
    c.save();
    c.beginPath();c.moveTo(718,431);c.lineTo(1268,432);c.lineTo(1400,613);c.lineTo(724,616);c.closePath();c.clip();
    for(let i=0;i<48;i++){
      const y=441+i*3.45+Math.sin(time*.72+i*.63)*1.4;
      const x=740+(i*83)%590+Math.sin(time*.42+i)*9;
      const width=18+(i*47)%145;
      c.globalAlpha=.025+(i%4)*.014;c.strokeStyle=i%3===0?'#d7dfd8':'#70817e';c.lineWidth=.6+(i%5)*.18;
      c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+width*.3,y+Math.sin(time+i)*1.3,x+width*.7,y-Math.sin(time*.7+i)*1.1,x+width,y+Math.sin(time+i*.2));c.stroke();
    }
    c.restore();
    c.save();
    const mist=c.createLinearGradient(0,190,0,430);mist.addColorStop(0,'#d7d4c900');mist.addColorStop(.55,'#d7d4c914');mist.addColorStop(1,'#d7d4c900');
    c.fillStyle=mist;c.fillRect(0,185,W,250);
    for(let i=0;i<5;i++){
      const x=(i*367+time*5)%1900-120;const y=260+(i%3)*35;
      const haze=c.createRadialGradient(x,y,5,x,y,180);haze.addColorStop(0,'#d8d8d21a');haze.addColorStop(1,'#d8d8d200');c.fillStyle=haze;c.fillRect(x-180,y-70,360,140);
    }
    c.restore();
    c.save();c.globalAlpha=.25;
    for(let i=0;i<22;i++){
      const sway=Math.sin(time*.7+i*.42)*3.2,x=12+i*23,y=900-(i%5)*7;
      c.strokeStyle=i%2?'#242b1d':'#a0a17b';c.lineWidth=.7+i%3*.3;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-4,y-24,x+sway,y-58-i%4*9);c.stroke();
    }
    c.restore();
  }
  private river(time:number,u:number):void {
    const c=this.ctx;this.plate('river',1.035+u*.035,-u*12,0);
    c.save();c.globalAlpha=.13;
    for(let i=0;i<48;i++){
      const y=490+i*8;c.strokeStyle=i%3===0?'#d7dacf':'#344447';c.lineWidth=.7+i/80;c.beginPath();
      const x=400+(i*113)%1200+Math.sin(time*.3+i)*16;c.moveTo(x,y);c.lineTo(x+25+i*1.8,y+Math.sin(time+i)*1.4);c.stroke();
    }c.restore();
    c.save();c.strokeStyle='#0e1716bb';c.lineCap='round';
    for(let i=0;i<12;i++){const x=30+i*17;c.lineWidth=2;c.beginPath();c.moveTo(x,H);c.quadraticCurveTo(x-5,775,x+Math.sin(time*.7+i*.3)*11,715+i%4*21);c.stroke();}c.restore();
  }
  draw(time:number,route:Route|null=null,branchTime=0):void {
    const c=this.ctx;c.clearRect(0,0,W,H);
    const shot=shotAt(time),local=time-shot.start,u=progress(time,shot.start,shot.end);
    let layer=layerAt(time);if(route)layer=route==='A'?'paper':'courier';
    if(layer==='sea'){this.canvas.style.opacity='0';return;}
    this.canvas.style.opacity='1';
    if(layer==='river'){if(shot.id==='S03')this.humen(time,u);else this.river(time,u);}
    else if(layer==='courier'){
      const t=route?branchTime:local;
      if(!route&&(t<3||t>=8)){
        this.plate('court',1.08,-20,25);this.envelope(t,route?820:1150-smooth(t<3?t/3:(t-8)/2)*330,600,1.05);
      }else{this.plate('courier',1.03+smooth(t/18)*.065,-smooth(t/18)*25,0);this.rain(t);}
    }else{
      const t=route?branchTime:local;
      const close=shot.id==='S01'||shot.id==='S10'||shot.id==='S22';
      this.plate('court',close?1.2+u*.04:1.025+u*.025,0,close?-45:0);
      if(shot.id==='S04')this.envelope(t,920-smooth(t/10)*90,615,1.12);
      else{
        let open=shot.id==='S09'?progress(t,2,7):1;
        if(route)open=progress(t,0,5);
        if(shot.id==='S17'){
          this.envelope(t,1070,670,.9);this.envelope(t,1090-smooth(t/4)*20,625-smooth(t/4)*12,.95);
        }
        this.memorial(open,t,shot.id==='S21'?'treaty':shot.id==='S11'?'decision':close?'close':'normal');
        if(shot.id==='S09'&&t<5)this.envelope(t,970+smooth(t/5)*800,570,1);
        if(shot.id==='S11'||shot.id==='S10'&&t>10)this.brush(t);
      }
      const light=c.createRadialGradient(230,350,20,230,350,1200);light.addColorStop(0,`rgba(220,135,51,${.025+.012*Math.sin(time*2.7)})`);light.addColorStop(1,'#0000');c.fillStyle=light;c.fillRect(0,0,W,H);
    }
    const vignette=c.createRadialGradient(W/2,H*.45,H*.25,W/2,H*.45,W*.6);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#03080bab');c.fillStyle=vignette;c.fillRect(0,0,W,H);
    if(!route&&time<3){c.fillStyle=`rgba(0,0,0,${1-smooth(time/3)})`;c.fillRect(0,0,W,H);}
    if(!route&&time>267){c.fillStyle=`rgba(0,0,0,${smooth((time-267)/3)})`;c.fillRect(0,0,W,H);}
  }
}
