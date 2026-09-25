import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

async function ready(page: import('@playwright/test').Page){await page.waitForFunction(()=>(window as any).__CINEMA__?.state.ready,null,{timeout:90000});}
test('53-second sample plays through with narration and stops at its own end',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await ready(page);await page.locator('#sample').click();
  await page.waitForFunction(()=>(window as any).__CINEMA__.sound.diagnostics.activeSources===1);
  await page.waitForFunction(()=>{const s=(window as any).__CINEMA__.state;return s.time>=127&&!s.playing;},null,{timeout:75000});
  expect(await page.evaluate(()=>(window as any).__CINEMA__.sound.diagnostics.activeSources)).toBe(0);expect(errors).toEqual([]);
});
test('document seeks reproduce pixels; complete cut stays addressable; no audio stacking',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await ready(page);await page.locator('#linear').click();
  const result=await page.evaluate(()=>{
    const app=(window as any).__CINEMA__;app.pause();const art=document.querySelector<HTMLCanvasElement>('#art')!;
    const frames=[22,23,26,29,74,79,87,90,94,101,111,119,124,197,239].map(t=>{app.seek(t);const first=art.toDataURL();app.seek(260);app.seek(t);return first===art.toDataURL();});
    app.seek(23.4);const humenEarly=art.toDataURL();app.seek(29.4);const humenLate=art.toDataURL();app.seek(23.4);const humenReplay=art.toDataURL();
    app.seek(94);const storyCard={hidden:document.querySelector<HTMLElement>('#storyText')!.hidden,title:document.querySelector('#storyHeading')!.textContent,copy:document.querySelector('#storyCopy')!.textContent};const storyCaption=document.querySelector('#caption')!.textContent;app.seek(260);app.seek(94);const storySameAfterSeek=document.querySelector('#storyHeading')!.textContent==='奏折抵达御案';
    for(const t of [0,12,22,34,44,55,65,74,87,101,115,127,137,149,161,173,185,197,211,223,235,247,259])app.seek(t);
    for(let i=0;i<8;i++){app.sound.stop();app.sound.sync(94,true,null);}
    const active=app.sound.diagnostics.activeSources;app.sound.stop();return {frames,humenChanged:humenEarly!==humenLate,humenStable:humenEarly===humenReplay,storyCard,storyCaption,sameAfterSeek:storySameAfterSeek,active,stopped:app.sound.diagnostics.activeSources};
  });
  expect(result.frames.every(Boolean)).toBe(true);expect(result.humenChanged).toBe(true);expect(result.humenStable).toBe(true);expect(result.storyCard.hidden).toBe(false);expect(result.storyCard.title).toBe('奏折抵达御案');expect(result.storyCaption).toBe('');expect(result.sameAfterSeek).toBe(true);expect(result.active).toBe(1);expect(result.stopped).toBe(0);expect(errors).toEqual([]);
});
test('interactive insert supports both choices and rejoins the same history',async({page})=>{
  await page.goto('/');await ready(page);await page.locator('#interactive').click();
  await page.evaluate(()=>{const a=(window as any).__CINEMA__;a.seek(211);});
  await expect(page.locator('#choice')).toBeHidden();expect(await page.evaluate(()=>(window as any).__CINEMA__.state.time)).toBe(211);
  await page.evaluate(()=>{const a=(window as any).__CINEMA__;a.seek(126.9);a.runtime.play();});await expect(page.locator('#choice')).toBeVisible();
  await page.locator('[data-route="A"]').click();await expect(page.locator('#branchEnd')).toBeVisible({timeout:25000});
  expect(await page.evaluate(()=>(window as any).__CINEMA__.state.route)).toBe('A');
  await page.locator('#compare').click();await expect(page.locator('#branchEnd')).toBeVisible({timeout:25000});
  expect(await page.evaluate(()=>(window as any).__CINEMA__.state.route)).toBe('B');
  await page.locator('#rejoin').click();await page.waitForFunction(()=>(window as any).__CINEMA__.state.playing);
  const state=await page.evaluate(()=>(window as any).__CINEMA__.state);expect(state.route).toBeNull();expect(state.time).toBeGreaterThanOrEqual(127);expect(state.time).toBeLessThan(130);
});
test('single file loads offline; mobile preserves image and caption bounds',async({page})=>{
  const requests:string[]=[];const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.context().setOffline(true);await page.setViewportSize({width:390,height:844});
  await page.goto(pathToFileURL(resolve('release/daoguang-cinema-workprint.html')).href);await ready(page);await page.locator('#sample').click();
  await page.evaluate(()=>{const a=(window as any).__CINEMA__;a.pause();a.seek(94);});
  await expect(page.locator('#storyText')).toBeVisible();await expect(page.locator('#caption')).toBeEmpty();const story=await page.locator('#storyText').boundingBox();expect(story!.x).toBeGreaterThanOrEqual(0);expect(story!.x+story!.width).toBeLessThanOrEqual(390);expect(story!.y+story!.height).toBeLessThan(844);
  await page.evaluate(()=>{(window as any).__CINEMA__.seek(105);});await expect(page.locator('#caption')).not.toBeEmpty();const frame=await page.locator('#art').boundingBox(),caption=await page.locator('#caption').boundingBox();
  expect(frame!.width/frame!.height).toBeCloseTo(16/9,2);expect(caption!.x).toBeGreaterThanOrEqual(0);expect(caption!.x+caption!.width).toBeLessThanOrEqual(390);expect(caption!.y+caption!.height).toBeLessThan(844);
  expect(requests).toEqual([]);expect(errors).toEqual([]);await page.screenshot({path:'/tmp/daoguang-cinema-mobile.png'});
});
