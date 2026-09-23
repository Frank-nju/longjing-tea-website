import { expect, test } from '@playwright/test';

const heroFrames = [1.5, 10.5, 22, 42, 58, 64, 72, 78];

for (const time of heroFrames) {
  test(`hero frame @ ${time.toFixed(1)}s`, async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).__EFE_RUNTIME__));
    await page.evaluate((target) => (window as any).__EFE_RUNTIME__.seek(target), time);
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page).toHaveScreenshot(`whale-fall-${time.toFixed(1).replace('.', '_')}s.png`, {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    });
  });
}
