import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Design C of the entry screen and the parents' area: the default design.
 * (The other specs walk through design A; see playwright.config.ts.)
 */

async function createChild(page: Page, name: string, grade: string) {
  const form = page.getByRole('dialog', { name: 'פרופיל חדש' });
  await form.getByLabel('שם', { exact: true }).fill(name);
  await form.getByRole('radio', { name: grade }).check({ force: true });
  await form.getByRole('button', { name: 'שמירה' }).click();
  await expect(form).toBeHidden();
  const added = page.getByRole('dialog', { name: new RegExp(`^${name} מוכ(ן|נה)!`) });
  await added.getByRole('button', { name: 'סגירה' }).click();
  await expect(added).toBeHidden();
}

test('first visit: the welcome opens the new-child form, and the child gets one big card', async ({
  page,
}) => {
  await page.goto('/?ui=c');
  await page.getByRole('button', { name: 'יוצרים פרופיל ראשון' }).click();
  await expect(page).toHaveURL(/\/parents/);
  await createChild(page, 'דניאל', 'כיתה ג׳');
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();

  // One child: hello by name, and a "start" (she has never played) that opens her journey.
  await expect(page.getByRole('heading', { name: 'שלום דניאל!' })).toBeVisible();
  const card = page.locator('.c-hero');
  await expect(card).toContainText('מתחילים');
  await card.click();
  await expect(page).toHaveURL(/\/play$/);
});

test('several children: the same card for each, in the family order, none put first', async ({
  page,
}) => {
  await page.goto('/?ui=c');
  await page.getByRole('button', { name: 'יוצרים פרופיל ראשון' }).click();
  await createChild(page, 'נועה', 'כיתה ב׳');
  await page.getByRole('tab', { name: 'הגדרות' }).click();
  await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
  await createChild(page, 'אורי', 'גן חובה');
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();

  const rows = page.locator('.c-kidrow');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('נועה');
  await expect(rows.nth(1)).toContainText('אורי');
  expect(
    await page.evaluate(() => document.scrollingElement?.scrollWidth ?? 0),
  ).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await rows.nth(1).click();
  await expect(page).toHaveURL(/\/play$/);
});
