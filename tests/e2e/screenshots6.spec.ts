import { expect, test, type Page } from '@playwright/test';

/**
 * Not a test: photographs the money and clock worlds (phase 6) for a visual
 * review. Runs only with SCREENSHOTS=1 and only in the iPad project.
 */

test.skip(!process.env['SCREENSHOTS'], 'visual review only');

const OUT = '.ci/screens';

const done = (level = 10) => ({
  level,
  attempts: 100,
  correct: 90,
  lastPracticedAt: 1_760_000_000_000,
  recent: [true, true, true],
  mistakes: {},
  completedLevels: Array.from({ length: 10 }, (_, i) => i + 1),
  reviewPassed: true,
});

const profile = (id: string, name: string, avatar: string, grade = 2) => ({
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
  schemaVersion: 2,
  exportedAt: '2026-10-18T10:00:00.000Z',
  data: {
    schemaVersion: 2,
    profiles: [profile('a', 'עדי', 'fox'), profile('b', 'רוני', 'cat'), profile('c', 'ליה', 'frog', 1)],
    progress: {
      a: { topics: { 'add-sub-100': done() }, streak: { count: 0, lastDay: null } },
      c: {
        topics: { 'add-sub-20': done(), 'numbers-100': done() },
        streak: { count: 0, lastDay: null },
      },
      b: {
        topics: { 'add-sub-100': done(), money: done(), 'mult-intro': done() },
        streak: { count: 0, lastDay: null },
      },
    },
    parent: { pin: null },
    meta: { createdAt: 1, lastBackupAt: null },
  },
};

async function shot(page: Page, name: string) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

/** From the journey: pick a level in the picker, start it, photograph, go back. */
async function level(page: Page, label: string, name: string, hints = 0) {
  await page.getByRole('button', { name: 'שלב אחר' }).click();
  await page.getByRole('dialog').getByRole('listitem').filter({ hasText: label }).click();
  await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
  await expect(page.locator('.exercise')).toBeVisible();
  for (let i = 0; i < hints; i++)
    await page.getByRole('button', { name: 'רמז', exact: true }).click();
  await shot(page, name);
  await page.getByRole('button', { name: 'סיום' }).click();
}

test('money and clock screens', async ({ page }, info) => {
  test.skip(info.project.name !== 'ipad', 'iPad only');
  test.setTimeout(180_000);

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
  await page.getByRole('button', { name: 'יציאה' }).click();

  // Money
  await page.getByRole('button', { name: 'עדי' }).click();
  await shot(page, 'm-01-journey-money');
  await level(page, 'מכירים את המטבעות', 'm-02-money-know');
  await level(page, 'סופרים מטבעות גדולים', 'm-03-money-count');
  await level(page, 'מטבעות ושטרות', 'm-04-money-notes', 3);
  await level(page, 'יש מספיק כסף?', 'm-05-money-enough');
  await level(page, 'באיזה ארנק', 'm-06-money-wallets');
  await level(page, 'משלמים בדיוק', 'm-07-money-pay');
  await level(page, 'עודף מ-10', 'm-08-money-change', 2);
  await level(page, 'בעיות קנייה', 'm-09-money-shopping');
  await page.getByRole('button', { name: 'מי משחק?' }).click();

  // Clock
  await page.getByRole('button', { name: 'רוני' }).click();
  await shot(page, 'c-01-journey-clock');
  await level(page, 'שעות שלמות: איזה שעון?', 'c-02-clock-pick');
  await level(page, 'חצאי שעה', 'c-03-clock-half', 3);
  await level(page, 'שעון דיגיטלי', 'c-04-clock-digital');
  await level(page, 'רבע לפני', 'c-05-clock-quarter-to');
  await level(page, 'רבעי שעה: איזה שעון?', 'c-06-clock-quarters');
  await level(page, 'כמה זמן עבר?', 'c-07-clock-elapsed');
  await level(page, 'בעיות זמן', 'c-08-clock-story', 2);

  // Grade 1: clock and money
  await page.getByRole('button', { name: 'מי משחק?' }).click();
  await page.getByRole('button', { name: 'ליה' }).click();
  await shot(page, 'g1-01-journey');
  await level(page, 'סופרים כסף עד 20', 'g1-02-count');
  await level(page, 'מה השעה בעוד שעה?', 'g1-03-later');
});
