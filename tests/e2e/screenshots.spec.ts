import { expect, test, type Page } from '@playwright/test';

/**
 * Not a test: photographs the main screens for a visual review. Runs only with
 * SCREENSHOTS=1 (the bootstrap workflow sets it) and only in the iPad project.
 * Images go to .ci/screens/, which the workflow commits.
 */

test.skip(!process.env['SCREENSHOTS'], 'visual review only');

const OUT = '.ci/screens';

async function addChild(
  page: Page,
  name: string,
  grade: string,
  avatar: string,
  gender = 'בלשון נקבה',
  snap?: string,
) {
  await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
  const dialog = page.getByRole('dialog', { name: 'פרופיל חדש' });
  await dialog.getByLabel('שם', { exact: true }).fill(name);
  await dialog.getByRole('radio', { name: avatar }).check({ force: true });
  await dialog.getByRole('radio', { name: grade }).check({ force: true });
  await dialog.getByRole('radio', { name: gender }).check({ force: true });
  await dialog.getByRole('button', { name: 'שמירה' }).click();
  await expect(dialog).toBeHidden();
  const added = page.getByRole('dialog', { name: new RegExp(`^${name} מוכ(ן|נה)!`) });
  if (snap) await shot(page, snap);
  await added.getByRole('button', { name: 'סגירה' }).click();
  await expect(added).toBeHidden();
}

/** The welcome greeting has finished typing itself out. */
async function welcomeTyped(page: Page) {
  await expect(page.locator('.welcome__bubble')).toBeVisible();
  await expect(page.locator('.welcome__bubble[data-typing]')).toHaveCount(0, { timeout: 15_000 });
}

async function shot(page: Page, name: string) {
  await page.waitForTimeout(400); // let animations settle
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

for (const orientation of ['landscape', 'portrait'] as const) {
  test(`screens, ${orientation}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'ipad', 'iPad only');
    test.setTimeout(120_000);
    if (orientation === 'portrait') await page.setViewportSize({ width: 810, height: 1080 });
    const o = orientation === 'portrait' ? 'p' : 'l';

    await page.goto('/');
    await welcomeTyped(page);
    await shot(page, `${o}-01-welcome`);
    await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
    await addChild(page, 'תמר', 'גן חובה', 'ארנב', 'בלשון נקבה', `${o}-01b-child-added`);
    await addChild(page, 'נועה', 'כיתה ב׳', 'שועל');
    await addChild(page, 'מאיה', 'כיתה ד׳', 'חתול');
    await shot(page, `${o}-02-parents`);
    await page.getByRole('tab', { name: 'התקדמות' }).click();
    await shot(page, `${o}-02b-parents-progress`);
    await page.getByRole('tab', { name: 'הגדרות' }).click();
    await shot(page, `${o}-02c-parents-settings`);
    await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).click();
    await shot(page, `${o}-03-home`);

    // Gan
    await page.getByRole('button', { name: 'תמר' }).click();
    await shot(page, `${o}-04-journey-gan`);
    await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
    await shot(page, `${o}-05-practice-gan`);
    await page.getByRole('button', { name: 'רמז', exact: true }).click();
    await page.getByRole('button', { name: 'רמז', exact: true }).click();
    await shot(page, `${o}-06-practice-gan-hints`);
    await page.getByRole('button', { name: 'סיום' }).click();
    await page.getByRole('button', { name: 'מי משחק?' }).click();

    // Grade 2
    await page.getByRole('button', { name: 'נועה' }).click();
    await shot(page, `${o}-07-journey-grade2`);
    await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
    await shot(page, `${o}-08-practice-grade2`);
    await page
      .getByRole('group', { name: 'התשובה' })
      .getByRole('button', { name: '1', exact: true })
      .click();
    await page
      .getByRole('group', { name: 'התשובה' })
      .getByRole('button', { name: 'אישור' })
      .click();
    await shot(page, `${o}-09-practice-wrong`);
    await page.getByRole('button', { name: 'סיום' }).click();
    await page.getByRole('button', { name: 'האלבום' }).click();
    await shot(page, `${o}-10-album`);
    await page.getByRole('button', { name: 'חזרה למסע' }).click();
    await page.getByRole('button', { name: 'מי משחק?' }).click();

    // Grade 4
    await page.getByRole('button', { name: 'מאיה' }).click();
    await shot(page, `${o}-11-journey-grade4`);
    await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
    await shot(page, `${o}-12-practice-grade4`);
  });
}

/** The screens around the game on a phone (390×844), for the mobile-first review. */
test('phone screens around the game', async ({ page }, info) => {
  test.skip(info.project.name !== 'ipad', 'iPad project, phone-sized viewport');
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await welcomeTyped(page);
  await shot(page, 'ph-01-welcome');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await shot(page, 'ph-02-parents-empty');
  await addChild(page, 'תמר', 'גן חובה', 'ארנב', 'בלשון נקבה', 'ph-02b-child-added');
  await addChild(page, 'איתי', 'כיתה ב׳', 'אריה', 'בלשון זכר');
  await shot(page, 'ph-03-parents-children');
  await page.getByRole('tab', { name: 'התקדמות' }).click();
  await shot(page, 'ph-04-parents-progress');
  await page.getByRole('tab', { name: 'הגדרות' }).click();
  await shot(page, 'ph-05-parents-settings');
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).click();
  await shot(page, 'ph-06-home');
  await page.getByRole('button', { name: 'איתי' }).click();
  await page.getByRole('button', { name: 'האלבום' }).click();
  await shot(page, 'ph-07-album');
});
