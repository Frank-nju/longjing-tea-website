import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const outputDir = path.join(root, 'apps/daoguang/dist');
const sourcePath = path.join(outputDir, 'index.html');
const outputPath = path.join(outputDir, 'daoguang-history-film.html');
const releaseDir = path.join(root, 'release');
const releasePath = path.join(releaseDir, 'daoguang-history-film.html');
let html = await fs.readFile(sourcePath, 'utf8');

const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*><\/script>/g)];
for (const match of scripts) {
  const assetPath = path.join(outputDir, match[1].replace(/^\.\//, '').replace(/^\//, ''));
  const source = await fs.readFile(assetPath, 'utf8');
  html = html.replace(match[0], () => `<script type="module">\n${source}\n</script>`);
}

const styles = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g)];
for (const match of styles) {
  const assetPath = path.join(outputDir, match[1].replace(/^\.\//, '').replace(/^\//, ''));
  const css = await fs.readFile(assetPath, 'utf8');
  html = html.replace(match[0], () => `<style>\n${css}\n</style>`);
}

const assetTags = [...html.matchAll(/<(?:script|link|img|source)\b[^>]*\b(?:src|href)="([^"]+)"/gi)].map((match) => match[1]);
if (assetTags.some((url) => url.startsWith('http') || /^(?:\.\/)?assets\//.test(url))) {
  throw new Error('Single-file output still references an external build asset.');
}
if (/@import\s+(?:url\()?['\"]?https?:/i.test(html)) throw new Error('Single-file output imports a remote stylesheet.');

html = html.replace(/[ \t]+$/gm, '');
await fs.writeFile(outputPath, html);
await fs.mkdir(releaseDir, { recursive: true });
await fs.writeFile(releasePath, html);
const stat = await fs.stat(releasePath);
console.log(`Wrote release/daoguang-history-film.html (${(stat.size / 1024 / 1024).toFixed(2)} MiB)`);
