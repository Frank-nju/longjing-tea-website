import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('apps/daoguang-cinema/dist');
let html=await fs.readFile(path.join(root,'index.html'),'utf8');
for(const match of [...html.matchAll(/<script[^>]+src="([^\"]+)"[^>]*><\/script>/g)]){
  const js=await fs.readFile(path.join(root,match[1]),'utf8');
  html=html.replace(match[0],()=>`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
}
for(const match of [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^\"]+)"[^>]*>/g)]){
  const css=await fs.readFile(path.join(root,match[1]),'utf8');html=html.replace(match[0],()=>`<style>${css}</style>`);
}
if(/<(?:script|link|img|source)[^>]+(?:src|href)="(?:https?:|(?:\.\/)?assets\/)/i.test(html))throw new Error('Unbundled resource');
const output=path.resolve('release/daoguang-cinema-workprint.html');
await fs.mkdir(path.dirname(output),{recursive:true});
try{await fs.copyFile(output,`${output}.bak`);}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.writeFile(output,html);console.log(output,Buffer.byteLength(html),'bytes');
