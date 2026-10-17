import { expect, test, type Page } from '@playwright/test';

/**
 * Not a test: photographs the main screens for a visual review. Runs only with
 * SCREENSHOTS=1 (the bootstrap workflow sets it) and only in the iPad project.
 * Images go to .ci/screens/, which the workflow commits.
 */

test.skip(!process.env['SCREENSHOTS'], 'visual review only');

const OUT = '.ci/screens';

async function addChild(page: Page, name: string, grade: string, avatar: string, gender = 'בלשון נקבה') {
  await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
  const dialog = page.getByRole('dialog', { name: 'פרופיל חדש' });
  await dialog.getByLabel('שם', { exact: true }).fill(name);
  await dialog.getByRole('radio', { name: avatar }).check({ force: true });
  await dialog.getByRole('radio', { name: grade }).check({ force: true });
  await dialog.getByRole('radio', { name: gender }).check({ force: true });
  await dialog.getByRole('button', { name: 'שמירה' }).click();
  await expect(dialog).toBeHidden();
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
    await shot(page, `${o}-01-welcome`);
    await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
    await addChild(page, 'תמר', 'גן חובה', 'ארנב');
    await addChild(page, 'נועה', 'כיתה ב׳', 'שועל');
    await addChild(page, 'מאיה', 'כיתה ד׳', 'חתול');
    await shot(page, `${o}-02-parents`);
    await page.getByRole('button', { name: 'יציאה' }).click();
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
    await page.getByRole('group', { name: 'התשובה' }).getByRole('button', { name: '1', exact: true }).click();
    await page.getByRole('group', { name: 'התשובה' }).getByRole('button', { name: 'אישור' }).click();
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
