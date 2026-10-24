import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Accessibility: every screen is checked with axe against WCAG 2.0 A and AA
 * (the level the Israeli standard IS 5568 asks for). The accessibility
 * statement on /info relies on this staying green.
 */

const done = {
  level: 10,
  attempts: 100,
  correct: 90,
  lastPracticedAt: 1_760_000_000_000,
  recent: [true, true, true],
  mistakes: {},
  completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  reviewPassed: true,
};

const child = (id: string, name: string, grade: number, avatar: string) => ({
  id,
  name,
  avatar,
  grade,
  gender: 'f',
  createdAt: 1,
  settings: { allowLevelChange: true },
});

const backup = {
  app: 'heshbon',
  kind: 'backup',
  schemaVersion: 3,
  exportedAt: '2026-10-18T10:00:00.000Z',
  data: {
    schemaVersion: 3,
    profiles: [child('a', 'נועה', 2, 'fox'), child('b', 'תמר', 0, 'rabbit')],
    progress: {
      a: {
        topics: { 'add-sub-100': done, money: done, 'mult-intro': done },
        streak: { count: 2, lastDay: null },
        days: {},
      },
      b: { topics: {}, streak: { count: 0, lastDay: null }, days: {} },
    },
    parent: { pin: null },
    meta: { createdAt: 1, lastBackupAt: null },
  },
};

async function check(page: Page, where: string) {
  await page.waitForTimeout(300); // animations settle
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const found = results.violations.map(
    (v) =>
      `${v.id} (${v.impact ?? '?'}): ${v.help} — ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join(' | ')}`,
  );
  expect.soft(found, `${where}: accessibility problems`).toEqual([]);
}

async function restore(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await page.getByTestId('backup-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page
    .getByRole('dialog', { name: 'לשחזר מהגיבוי?' })
    .getByRole('button', { name: 'שחזור' })
    .click();
  await expect(page.getByText('השחזור הושלם.')).toBeVisible();
}

test.describe('accessibility (WCAG 2.0 AA)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'one browser is enough for axe');

  test('first run, install guide, information page', async ({ page }) => {
    await page.goto('/');
    // The greeting's bubble fades in for about a second: measure its colours once it is in.
    await page.waitForTimeout(1200);
    await check(page, 'welcome');
    await page.goto('/install');
    await check(page, 'install guide');
    await page.goto('/info');
    await check(page, 'information page');
  });

  test('parent area, its dialogs, and home', async ({ page }) => {
    await restore(page);
    // The restore left the parent area on its settings.
    await check(page, 'parent area: settings');
    await page.getByRole('tab', { name: 'התקדמות' }).click();
    await check(page, 'parent area: progress');
    await page.getByRole('tab', { name: 'ילדים' }).click();
    await check(page, 'parent area: children');
    await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
    await check(page, 'new profile dialog');
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'הגדרות' }).click();
    await page.getByText('בלי מייל? חיבור עם קוד').click();
    await page.getByRole('button', { name: 'חיבור למשפחה קיימת' }).click();
    await check(page, 'join family dialog');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
    await check(page, 'home');
  });

  test('journey, level picker, practice with numbers, hints and feedback, album', async ({
    page,
  }) => {
    await restore(page);
    await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
    await page.getByRole('button', { name: 'נועה' }).click();
    await check(page, 'journey');
    await page.getByRole('button', { name: 'תחנה אחרת' }).click();
    await check(page, 'level picker');
    await page.getByRole('dialog').getByRole('listitem').first().click();
    await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
    await expect(page.locator('.exercise')).toBeVisible();
    await check(page, 'practice');
    await page.getByRole('button', { name: 'רמז', exact: true }).click();
    await check(page, 'practice with a hint');
    await page.getByRole('button', { name: 'סיום' }).click();
    await page.getByRole('button', { name: 'האלבום' }).click();
    await check(page, 'album');
  });

  test('gan: picture exercises with big answer buttons', async ({ page }) => {
    await restore(page);
    await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
    await page.getByRole('button', { name: 'תמר' }).click();
    await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
    await expect(page.locator('.exercise')).toBeVisible();
    await check(page, 'gan practice');
  });

  test('parent gate', async ({ page }) => {
    await restore(page);
    await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
    await page.goto('/parents');
    await check(page, 'parent gate');
  });
});
