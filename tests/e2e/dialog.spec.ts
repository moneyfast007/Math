import { expect, test } from '@playwright/test';

/**
 * A long dialog on a phone: the level picker has more levels than fit on an
 * iPhone screen. The list scrolls inside the dialog; the page behind stays put.
 */
test('the level picker scrolls inside the dialog, not the page behind', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
  const form = page.getByRole('dialog', { name: 'פרופיל חדש' });
  await form.getByLabel('שם', { exact: true }).fill('רוני');
  await form.getByRole('radio', { name: 'כיתה ד׳' }).check({ force: true });
  await form.getByRole('button', { name: 'שמירה' }).click();
  await page.getByRole('button', { name: 'יציאה' }).click();
  await page.getByRole('button', { name: 'רוני' }).click();

  await page.getByRole('button', { name: 'שלב אחר' }).click();
  const dialog = page.getByRole('dialog', { name: 'באיזה שלב לתרגל?' });
  await expect(dialog).toBeVisible();

  // The whole panel is on screen: title at the top, nothing cut off below.
  const viewport = page.viewportSize();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  if (box && viewport) {
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  }
  await expect(dialog.getByRole('heading', { name: 'באיזה שלב לתרגל?' })).toBeInViewport();

  // The page behind is pinned while the dialog is open.
  expect(await page.evaluate(() => getComputedStyle(document.body).position)).toBe('fixed');

  const body = dialog.locator('.dialog__body');
  if (test.info().project.name === 'iphone') {
    // Taller than the phone: the body is the part that scrolls.
    const { scrollHeight, clientHeight } = await body.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(scrollHeight).toBeGreaterThan(clientHeight);
    await body.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    expect(await body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  }

  // The last level can be reached and chosen.
  const items = dialog.getByRole('listitem');
  const last = items.last();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  await last.click();
  await expect(dialog).toHaveCount(0);

  // Closed: the page is free again.
  expect(await page.evaluate(() => document.body.getAttribute('style'))).toBeNull();
});
