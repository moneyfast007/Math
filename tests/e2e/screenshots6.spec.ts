import { expect, test, type Page, type TestInfo } from '@playwright/test';

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
    profiles: [
      profile('a', 'עדי', 'fox'),
      profile('b', 'רוני', 'cat'),
      profile('c', 'ליה', 'frog', 1),
      profile('d', 'תמר', 'rabbit', 0),
      profile('e', 'גלי', 'panda', 3),
      profile('f', 'מאיה', 'tiger', 4),
    ],
    progress: {
      a: { topics: { 'add-sub-100': done() }, streak: { count: 0, lastDay: null } },
      e: {
        topics: { 'mult-table': done(), 'numbers-10000': done(), 'fractions-1': done() },
        streak: { count: 0, lastDay: null },
      },
      f: {
        topics: {
          'big-numbers': done(),
          'long-mul-div': done(),
          'fraction-ops': done(),
          decimals: done(),
          'perimeter-area': done(),
        },
        streak: { count: 0, lastDay: null },
      },
      d: {
        topics: { 'count-10': done(), 'add-sub-20': done() },
        streak: { count: 0, lastDay: null },
      },
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
async function level(page: Page, label: string | RegExp, name: string, hints = 0) {
  await page.getByRole('button', { name: 'שלב אחר' }).click();
  await page.getByRole('dialog').getByRole('listitem').filter({ hasText: label }).click();
  await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
  await expect(page.locator('.exercise')).toBeVisible();
  for (let i = 0; i < hints; i++)
    await page.getByRole('button', { name: 'רמז', exact: true }).click();
  await shot(page, name);
  await page.getByRole('button', { name: 'סיום' }).click();
}

/** A grade-5 child alone (the main backup is full: six children). */
const backup5 = {
  ...backup,
  data: {
    ...backup.data,
    profiles: [profile('g', 'נגה', 'koala', 5)],
    progress: {
      g: {
        topics: {
          'fraction-mul-div': done(),
          'decimal-ops': done(),
          'percent-intro': done(),
          'order-ops': done(),
        },
        streak: { count: 0, lastDay: null },
      },
    },
  },
};

async function setup(page: Page, name: string, data: object = backup) {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await page.getByTestId('backup-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await page
    .getByRole('dialog', { name: 'לשחזר מהגיבוי?' })
    .getByRole('button', { name: 'שחזור' })
    .click();
  await expect(page.getByText('השחזור הושלם.')).toBeVisible();
  await page.getByRole('button', { name: 'יציאה' }).click();
  await page.getByRole('button', { name }).click();
}

function ipadOnly(info: TestInfo) {
  test.skip(info.project.name !== 'ipad', 'iPad only');
  test.setTimeout(240_000);
}

test('money screens', async ({ page }, info) => {
  ipadOnly(info);
  await setup(page, 'עדי');
  await shot(page, 'm-01-journey-money');
  await level(page, 'מכירים את המטבעות', 'm-02-money-know');
  await level(page, 'סופרים מטבעות גדולים', 'm-03-money-count');
  await level(page, 'מטבעות ושטרות', 'm-04-money-notes', 3);
  await level(page, 'יש מספיק כסף?', 'm-05-money-enough');
  await level(page, 'באיזה ארנק', 'm-06-money-wallets');
  await level(page, 'משלמים בדיוק', 'm-07-money-pay');
  await level(page, 'עודף מ-10', 'm-08-money-change', 2);
  await level(page, 'בעיות קנייה', 'm-09-money-shopping');
});

test('clock screens', async ({ page }, info) => {
  ipadOnly(info);
  await setup(page, 'רוני');
  await shot(page, 'c-01-journey-clock');
  await level(page, 'שעות שלמות: איזה שעון?', 'c-02-clock-pick');
  await level(page, 'חצאי שעה', 'c-03-clock-half', 3);
  await level(page, 'שעון דיגיטלי', 'c-04-clock-digital');
  await level(page, 'רבע לפני', 'c-05-clock-quarter-to');
  await level(page, 'רבעי שעה: איזה שעון?', 'c-06-clock-quarters');
  await level(page, 'כמה זמן עבר?', 'c-07-clock-elapsed');
  await level(page, 'בעיות זמן', 'c-08-clock-story', 2);
});

test('grade 1 clock and money screens', async ({ page }, info) => {
  ipadOnly(info);
  await setup(page, 'ליה');
  await shot(page, 'g1-01-journey');
  await level(page, 'סופרים כסף עד 20', 'g1-02-count');
  await level(page, 'מה השעה בעוד שעה?', 'g1-03-later');
});

test('gan shapes screens', async ({ page }, info) => {
  ipadOnly(info);
  await setup(page, 'תמר');
  await shot(page, 's-01-journey');
  await level(page, 'עיגול, ריבוע, משולש', 's-02-where');
  await level(page, 'אותה צורה', 's-03-same');
  await level(page, 'כמה פינות?', 's-04-corners');
  await level(page, 'גדול וקטן', 's-05-size');
  await level(page, 'ארוך וקצר', 's-06-pencils');
  await level(page, 'דפוס של צורות', 's-07-pattern', 1);
  await level(page, 'מה חסר בדפוס?', 's-08-missing');
  await level(page, 'כמה יש בתמונה?', 's-09-count');
});

test('grade 3 measuring screens', async ({ page }, info) => {
  ipadOnly(info);
  await setup(page, 'גלי');
  await shot(page, 'u-01-journey-g3');
  await level(page, 'מה השעה? כל חמש דקות', 'u-02-clock5');
  await level(page, 'כמה דקות עברו?', 'u-03-elapsed');
  await level(page, 'מודדים בסרגל', 'u-04-ruler');
  await level(page, 'מה ארוך יותר?', 'u-05-compare');
});

test('grade 4 angles screens', async ({ page }, info) => {
  ipadOnly(info);
  await setup(page, 'מאיה');
  await shot(page, 'u-11-journey-g4');
  await level(page, 'זווית ישרה, חדה, קהה', 'u-12-angle');
  await level(page, 'משולשים לפי הצלעות', 'u-13-sides');
  await level(page, 'מרובעים', 'u-14-quad');
  await level(page, 'סכום הזוויות במשולש', 'u-15-third');
  await level(page, 'נכון או לא נכון?', 'u-16-tf');
});

test('grade 5 areas screens', async ({ page }, info) => {
  ipadOnly(info);
  await setup(page, 'נגה', backup5);
  await shot(page, 'u-21-journey-g5');
  await level(page, /שטח משולש$/, 'u-22-triangle');
  await level(page, 'שטח טרפז', 'u-23-trapezoid');
  await level(page, 'צורה מורכבת', 'u-24-house');
  await level(page, 'נפח בקוביות', 'u-25-cubes');
  await level(page, 'נפח תיבה', 'u-26-box');
});
