import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { handleApi, memoryServices, type Services } from '../../worker/core';

/**
 * Sync between two devices, end to end: two browsers (two "devices") talk to
 * the real server logic (worker/core.ts) running in memory here, in place of
 * Cloudflare. Service workers are blocked so every /api request is routed.
 */

test.use({ serviceWorkers: 'block' });

const SHOTS = '.ci/screens';

async function shot(page: Page, name: string) {
  if (!process.env['SCREENSHOTS'] || test.info().project.name !== 'ipad') return;
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

async function serve(context: BrowserContext, services: Services) {
  await context.route('**/api/**', async (route) => {
    const req = route.request();
    const init: RequestInit = { method: req.method(), headers: req.headers() };
    const body = req.postData();
    if (body !== null) init.body = body;
    const res = await handleApi(new Request(req.url(), init), services);
    await route.fulfill({
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: await res.text(),
    });
  });
}

async function addChild(page: Page, name: string, grade: string) {
  await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
  const form = page.getByRole('dialog', { name: 'פרופיל חדש' });
  await form.getByLabel('שם', { exact: true }).fill(name);
  await form.getByRole('radio', { name: grade }).check({ force: true });
  await form.getByRole('button', { name: 'שמירה' }).click();
  await page
    .getByRole('dialog', { name: new RegExp(`^${name} מוכ`) })
    .getByRole('button', { name: 'סגירה' })
    .click();
}

const children = (page: Page) => page.locator('[data-screen="parents"] .child-row__name');

test('two devices: create a family, link with a code, see each other’s changes, unlink', async ({
  page: a,
  context,
  browser,
}, info) => {
  test.setTimeout(90_000);
  const services = memoryServices();
  await serve(context, services);

  // Device A: a child, then the family.
  await a.goto('/');
  await a.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await addChild(a, 'נועה', 'כיתה ב׳');
  await a.getByRole('button', { name: 'זה המכשיר הראשון: יצירת משפחה' }).click();
  await expect(a.getByText(/^מסונכרן · /)).toBeVisible();
  await expect(
    a.getByText('ההתקדמות מסונכרנת בין המכשירים של המשפחה', { exact: false }),
  ).toBeVisible();

  await a.getByRole('button', { name: 'חיבור מכשיר נוסף' }).click();
  const pairing = a.getByRole('dialog', { name: 'חיבור מכשיר נוסף' });
  const codeBox = pairing.locator('.sync-code--big');
  await expect(codeBox).toHaveText(/^\d{6}$/);
  const code = (await codeBox.textContent()) ?? '';
  await shot(a, 'sync-01-code');

  // Device B: a fresh browser, joins with the code.
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch } = info.project.use;
  const bContext = await browser.newContext({
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
    baseURL: 'http://localhost:4173',
    locale: 'he-IL',
    serviceWorkers: 'block',
  });
  await serve(bContext, services);
  const b = await bContext.newPage();
  await b.goto('/');
  await b.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await b.getByRole('button', { name: 'חיבור למשפחה קיימת' }).click();
  const join = b.getByRole('dialog', { name: 'חיבור למשפחה קיימת' });
  for (const d of code) await join.getByRole('button', { name: d, exact: true }).click();
  await shot(b, 'sync-02-join');
  await join.getByRole('button', { name: 'חיבור', exact: true }).click();
  const joined = b.getByRole('dialog', { name: 'המכשיר חובר!' });
  await expect(joined).toBeVisible();
  await joined.getByRole('button', { name: 'ממשיכים' }).click();
  await expect(children(b)).toHaveText([/נועה/]);

  // B adds a child; A sees her after syncing.
  await addChild(b, 'מאיה', 'גן חובה');
  await b.getByRole('button', { name: 'סנכרון עכשיו' }).click();
  await expect(b.getByText(/^מסונכרן · /)).toBeVisible();
  await pairing.getByRole('button', { name: 'סגירה' }).click();
  await a.getByRole('button', { name: 'סנכרון עכשיו' }).click();
  await expect(children(a)).toHaveText([/נועה/, /מאיה/]);
  await expect(a.locator('.sync-device')).toHaveCount(2);
  await a.locator('#sync').scrollIntoViewIfNeeded();
  await shot(a, 'sync-03-linked');

  // A unlinks B; B is told on its next sync and keeps both children.
  await a
    .locator('.sync-device')
    .filter({ hasNotText: 'המכשיר הזה' })
    .getByRole('button', { name: 'ניתוק' })
    .click();
  await a
    .getByRole('dialog', { name: 'לנתק את המכשיר?' })
    .getByRole('button', { name: 'ניתוק' })
    .click();
  await expect(a.locator('.sync-device')).toHaveCount(1);
  await b.getByRole('button', { name: 'סנכרון עכשיו' }).click();
  await expect(b.getByText('המכשיר נותק מהסנכרון', { exact: false })).toBeVisible();
  await expect(children(b)).toHaveText([/נועה/, /מאיה/]);
  await bContext.close();
});

test('a wrong code is explained, and nothing changes', async ({ page, context }) => {
  await serve(context, memoryServices());
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await page.getByRole('button', { name: 'חיבור למשפחה קיימת' }).click();
  const join = page.getByRole('dialog', { name: 'חיבור למשפחה קיימת' });
  for (const d of '123456') await join.getByRole('button', { name: d, exact: true }).click();
  await join.getByRole('button', { name: 'חיבור', exact: true }).click();
  await expect(join.getByText('הקוד לא נכון או שפג תוקפו', { exact: false })).toBeVisible();
});
