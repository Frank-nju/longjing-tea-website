import { expect, test } from '@playwright/test';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

test('linear cut is time-addressable and has all four chapter jumps', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#stage')).toBeVisible();
  await page.getByRole('button', { name: '观看线性正片' }).click();
  await expect(page.locator('#modeLabel')).toContainText('线性正片');
  await page.evaluate(() => {
    const runtime = (window as any).__DAOGUANG_RUNTIME__;
    runtime.pause();
    runtime.seek(96);
  });
  await expect(page.locator('#beatTitle')).toHaveText('奏折抵达御案');
  const first = await page.evaluate(() => JSON.stringify((window as any).__DAOGUANG_RUNTIME__.state));
  await page.evaluate(() => {
    const runtime = (window as any).__DAOGUANG_RUNTIME__;
    runtime.seek(239);
    runtime.seek(96);
  });
  const second = await page.evaluate(() => JSON.stringify((window as any).__DAOGUANG_RUNTIME__.state));
  expect(second).toBe(first);
  await expect(page.locator('.chapter-button')).toHaveCount(4);
  await page.evaluate(() => {
    (window as any).__DAOGUANG_RUNTIME__.events.on('seek', (time: number) => {
      (window as any).__LAST_CHAPTER_SEEK__ = time;
    });
  });
  await page.getByRole('button', { name: /04 \/ 1842—1860/ }).click();
  expect(await page.evaluate(() => (window as any).__LAST_CHAPTER_SEEK__)).toBe(211);
  await expect(page.locator('#beatTitle')).toHaveText('舰队驶入帝国腹地');
});

test('interactive mode pauses for a labeled choice, rejoins history, and can replay the other route', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '进入互动版' }).click();
  await page.evaluate(() => {
    const runtime = (window as any).__DAOGUANG_RUNTIME__;
    runtime.pause();
    runtime.seek(135);
  });
  await expect(page.locator('#decisionGate')).toBeVisible();
  await expect(page.locator('#kindLabel')).toHaveText('模拟');
  await page.locator('[data-route="B"]').click();
  await expect(page.locator('#modeChip')).toContainText('互动路线 B');
  await page.evaluate(() => {
    const runtime = (window as any).__DAOGUANG_RUNTIME__;
    runtime.pause();
    runtime.seek(180);
  });
  await expect(page.locator('#modeChip')).toContainText('互动路线 B');
  await page.getByRole('button', { name: '比较另一条路线' }).click();
  await expect(page.locator('#modeChip')).toContainText('互动路线 A');
  await page.evaluate(() => {
    const runtime = (window as any).__DAOGUANG_RUNTIME__;
    runtime.pause();
    runtime.seek(211);
  });
  await expect(page.locator('#beatTitle')).toHaveText('舰队驶入帝国腹地');
  await expect(page.locator('#decisionGate')).toBeHidden();
});

test('single HTML runs in isolation without network access and retains captions', async ({ page }) => {
  const externalRequests: string[] = [];
  const pageErrors: string[] = [];
  const isolatedDir = await mkdtemp(join(tmpdir(), 'daoguang-offline-'));
  const isolatedFile = join(isolatedDir, 'film.html');
  page.on('request', (request) => {
    if (!request.url().startsWith('file:') && !request.url().startsWith('data:')) externalRequests.push(request.url());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });
  try {
    await copyFile(fileURLToPath(new URL('../release/daoguang-history-film.html', import.meta.url)), isolatedFile);
    await page.context().setOffline(true);
    await page.goto(pathToFileURL(isolatedFile).href);
    await page.waitForFunction(() => Boolean((document.querySelector('#stage') as HTMLCanvasElement | null)?.getContext('webgl2')));
    await page.getByRole('button', { name: '观看线性正片' }).click();
    await page.evaluate(() => {
      const runtime = (window as any).__DAOGUANG_RUNTIME__;
      runtime.pause();
      runtime.seek(211);
    });
    await expect(page.locator('#beatTitle')).toHaveText('舰队驶入帝国腹地');
    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
  } finally {
    await rm(isolatedDir, { recursive: true, force: true });
  }
});

test('mobile branch choice and subtitle stay inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '进入互动版' }).click();
  await page.evaluate(() => {
    const runtime = (window as any).__DAOGUANG_RUNTIME__;
    runtime.pause();
    runtime.seek(135);
  });
  await expect(page.locator('#decisionGate')).toBeVisible();
  await expect(page.locator('[data-route="A"]')).toBeVisible();
  await expect(page.locator('[data-route="B"]')).toBeVisible();
  const gate = await page.locator('.gate-card').boundingBox();
  expect(gate).not.toBeNull();
  expect(gate!.x).toBeGreaterThanOrEqual(0);
  expect(gate!.x + gate!.width).toBeLessThanOrEqual(390);
  await page.locator('[data-route="A"]').click();
  await page.evaluate(() => {
    const runtime = (window as any).__DAOGUANG_RUNTIME__;
    runtime.pause();
    runtime.seek(211);
  });
  const subtitle = await page.locator('.subtitle').boundingBox();
  expect(subtitle).not.toBeNull();
  expect(subtitle!.x + subtitle!.width).toBeLessThanOrEqual(390);
  await expect(page.locator('#beatTitle')).toHaveText('舰队驶入帝国腹地');
});


test('rendered chapter and branch frames are identical after unrelated seeks', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.getByRole('button', { name: '观看线性正片' }).click();
  await page.evaluate(() => (window as any).__DAOGUANG_RUNTIME__.pause());
  const results = await page.evaluate(() => {
    const runtime = (window as any).__DAOGUANG_RUNTIME__;
    const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
    return [0, 55, 115, 140, 160, 211].map((time) => {
      runtime.seek(time);
      const first = canvas.toDataURL();
      runtime.seek(264);
      runtime.seek(time);
      return { time, identical: first === canvas.toDataURL() };
    });
  });
  for (const { time, identical } of results) {
    expect(identical, `pixels at ${time}s must not depend on earlier seeks`).toBe(true);
  }
});
