import { expect, test, type Page } from '@playwright/test';

const probeTimes = [0, 10.5, 22, 42, 58, 64, 72, 78];

async function seekAndReadState(page: Page, time: number): Promise<string> {
  await page.waitForFunction(() => Boolean((window as any).__EFE_RUNTIME__));
  return page.evaluate((target) => {
    const runtime = (window as any).__EFE_RUNTIME__;
    runtime.seek(target);
    return JSON.stringify(runtime.state);
  }, time);
}

test('cold seeking the same story time reconstructs identical film state after reload', async ({ page }) => {
  await page.goto('/');

  for (const time of probeTimes) {
    const first = await seekAndReadState(page, time);
    await page.reload();
    const second = await seekAndReadState(page, time);
    expect(second).toBe(first);
  }
});
