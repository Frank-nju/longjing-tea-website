import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const time = Number(arg('time', '42'));
const width = Number(arg('width', '1920'));
const height = Number(arg('height', '1080'));
const out = path.resolve(arg('out', `artifacts/frame-${time.toFixed(2)}.png`));
const dist = path.resolve('apps/studio/dist');

await fs.access(path.join(dist, 'index.html'));
await fs.mkdir(path.dirname(out), { recursive: true });

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
]);

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    const file = path.resolve(dist, requested);
    if (!file.startsWith(dist + path.sep) && file !== path.join(dist, 'index.html')) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }
    const data = await fs.readFile(file);
    response.writeHead(200, { 'content-type': mime.get(path.extname(file)) ?? 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Could not open local render server.');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__EFE_RUNTIME__));
  const metadata = await page.evaluate((target) => {
    const runtime = window.__EFE_RUNTIME__;
    runtime.seek(target);
    const renderer = runtime.services.get('renderer-three');
    const camera = renderer?.camera;
    return {
      time: target,
      state: structuredClone(runtime.state),
      camera: camera ? {
        position: camera.position.toArray(),
        quaternion: camera.quaternion.toArray(),
        fov: camera.fov,
        near: camera.near,
        far: camera.far,
        focusDistance: camera.userData.focusDistance ?? null,
        aperture: camera.userData.aperture ?? null,
        shot: camera.userData.shot ?? null,
      } : null,
    };
  }, time);

  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: out });
  await fs.writeFile(out.replace(/\.png$/i, '.json'), JSON.stringify(metadata, null, 2));
  console.log(`Rendered ${out}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
