import fs from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('apps/studio/dist');
const htmlPath = path.join(dist, 'index.html');
let html = await fs.readFile(htmlPath, 'utf8');

const scriptMatch = html.match(/<script[^>]+src="([^"]+)"[^>]*><\/script>/);
if (scriptMatch) {
  const source = await fs.readFile(path.join(dist, scriptMatch[1].replace(/^\//, '')), 'utf8');
  html = html.replace(scriptMatch[0], `<script type="module">\n${source}\n</script>`);
}

const styleMatches = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g)];
for (const match of styleMatches) {
  const css = await fs.readFile(path.join(dist, match[1].replace(/^\//, '')), 'utf8');
  html = html.replace(match[0], `<style>\n${css}\n</style>`);
}

const out = path.join(dist, 'executable-film.html');
await fs.writeFile(out, html);
console.log(`Wrote ${out}`);
