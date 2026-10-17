import { expect, test } from '@playwright/test';

test.describe('foundations', () => {
  test('page is RTL Hebrew', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('חשבון');
  });

  test('arithmetic renders left-to-right inside the RTL page', async ({ page }) => {
    await page.goto('/playground');
    const math = page.locator('[data-math]').first();
    await expect(math).toHaveAttribute('dir', 'ltr');
    await expect(math).toHaveCSS('direction', 'ltr');
    await expect(math).toHaveCSS('unicode-bidi', 'isolate');

    // Visual order check: "3" must be painted to the left of "5".
    const box3 = await page.evaluate(() => {
      const el = document.querySelector('[data-math]')!;
      const range = document.createRange();
      const text = el.firstChild!;
      range.setStart(text, 0);
      range.setEnd(text, 1);
      return range.getBoundingClientRect().left;
    });
    const box5 = await page.evaluate(() => {
      const el = document.querySelector('[data-math]')!;
      const range = document.createRange();
      const text = el.firstChild!;
      const s = text.textContent!.indexOf('5');
      range.setStart(text, s);
      range.setEnd(text, s + 1);
      return range.getBoundingClientRect().left;
    });
    expect(box3).toBeLessThan(box5);
  });

  test('no arithmetic appears outside the <MathExpr> component', async ({ page }) => {
    for (const path of ['/', '/playground', '/install']) {
      await page.goto(path);
      const offenders = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const found: string[] = [];
        const expr = /\d\s*[+−×÷=]\s*[\d?]/;
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const text = n.textContent ?? '';
          if (expr.test(text) && !(n.parentElement?.closest('[data-math]'))) found.push(text);
        }
        return found;
      });
      expect(offenders, `on ${path}`).toEqual([]);
    }
  });

  test('tap targets meet the minimum for the current age band', async ({ page }) => {
    await page.goto('/playground');
    const minPx = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tap-min')),
    );
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box, `button ${i}`).not.toBeNull();
      expect(box!.height, `button ${i} height`).toBeGreaterThanOrEqual(minPx - 8);
    }
  });

  test('age band switch changes the tap-size token', async ({ page }) => {
    await page.goto('/playground');
    await page.getByRole('button', { name: 'גן' }).click();
    const young = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--tap-min').trim(),
    );
    expect(young).toBe('72px');
    await page.getByRole('button', { name: 'כיתות ד׳–ו׳' }).click();
    const older = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--tap-min').trim(),
    );
    expect(older).toBe('48px');
  });

  test('install guide is reachable and lists the iOS steps', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'הוספה למסך הבית' }).click();
    await expect(page).toHaveURL(/\/install$/);
    await expect(page.getByRole('heading', { name: 'באייפד או באייפון (Safari)' })).toBeVisible();
  });

  test('PWA manifest and service worker are served', async ({ page, request }) => {
    const manifest = await request.get('/manifest.webmanifest');
    expect(manifest.ok()).toBeTruthy();
    const json = (await manifest.json()) as { name: string; dir: string; lang: string };
    expect(json.name).toBe('חשבון');
    expect(json.dir).toBe('rtl');
    expect(json.lang).toBe('he');

    const sw = await request.get('/sw.js');
    expect(sw.ok()).toBeTruthy();

    await page.goto('/');
    const registered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const reg = await navigator.serviceWorker.ready;
      return reg.active ? 'active' : 'none';
    });
    expect(['active', 'unsupported']).toContain(registered);
  });

  test('the page makes no request to another origin', async ({ page, baseURL }) => {
    const foreign: string[] = [];
    page.on('request', (req) => {
      if (!req.url().startsWith(baseURL!)) foreign.push(req.url());
    });
    await page.goto('/');
    await page.goto('/playground');
    await page.goto('/install');
    expect(foreign).toEqual([]);
  });
});
