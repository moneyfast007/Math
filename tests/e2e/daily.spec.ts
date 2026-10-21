import { expect, test } from '@playwright/test';

/** The day's review: offered once a station is passed, a mixed round from passed stations. */
test('the day’s review appears after a passed station and starts a round', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  const backup = {
    app: 'heshbon',
    kind: 'backup',
    schemaVersion: 3,
    exportedAt: '2026-10-18T10:00:00.000Z',
    data: {
      schemaVersion: 3,
      profiles: [
        {
          id: 'a',
          name: 'שירה',
          avatar: 'cat',
          grade: 2,
          gender: 'f',
          createdAt: 1,
          settings: { allowLevelChange: true },
        },
        {
          id: 'b',
          name: 'רוני',
          avatar: 'fox',
          grade: 4,
          gender: 'f',
          createdAt: 2,
          settings: { allowLevelChange: true },
        },
      ],
      progress: {
        a: {
          topics: {
            'add-sub-100': {
              level: 4,
              attempts: 30,
              correct: 25,
              lastPracticedAt: 1_760_000_000_000,
              recent: [true, false, true],
              mistakes: {},
              completedLevels: [1, 2, 3],
              reviewPassed: false,
            },
          },
          streak: { count: 0, lastDay: null },
          days: { '2026-10-17': { exercises: 10, correct: 8, rounds: 1, daily: false } },
        },
      },
      parent: { pin: null },
      meta: { createdAt: 1, lastBackupAt: null },
    },
  };
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
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();

  // A child with nothing passed yet has no review to do.
  await page.getByRole('button', { name: 'רוני' }).click();
  await expect(page.getByRole('button', { name: 'יאללה, מתחילים!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'חזרה מכל העולמות' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'עוד תרגילים בעולם הזה' })).toHaveCount(0);
  await page.getByRole('button', { name: 'מי משחק?' }).click();

  await page.getByRole('button', { name: 'שירה' }).click();
  await page.getByRole('button', { name: 'חזרה מכל העולמות' }).click();
  await expect(page).toHaveURL(/\/practice\/daily$/);
  await expect(page.locator('.exercise')).toBeVisible();
  await page.getByRole('button', { name: 'סיום' }).click();
  await expect(page).toHaveURL(/\/play$/);
});

/** More of this world: a mixed round from the stations passed in the world she is in. */
test('more exercises in this world start a mixed round that changes nothing on the map', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  const backup = {
    app: 'heshbon',
    kind: 'backup',
    schemaVersion: 3,
    exportedAt: '2026-10-18T10:00:00.000Z',
    data: {
      schemaVersion: 3,
      profiles: [
        {
          id: 'a',
          name: 'שירה',
          avatar: 'cat',
          grade: 2,
          gender: 'f',
          createdAt: 1,
          settings: { allowLevelChange: true, roundLength: 'short', dailyGoal: 2 },
        },
      ],
      progress: {
        a: {
          topics: {
            'add-sub-100': {
              level: 4,
              attempts: 30,
              correct: 25,
              lastPracticedAt: 1_760_000_000_000,
              recent: [true, false, true],
              mistakes: {},
              completedLevels: [1, 2, 3],
              reviewPassed: false,
            },
          },
          streak: { count: 0, lastDay: null },
          days: {},
        },
      },
      parent: { pin: null },
      meta: { createdAt: 1, lastBackupAt: null },
    },
  };
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
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
  await page.getByRole('button', { name: 'שירה' }).click();
  await expect(page.getByText('תחנה 4 מתוך 10')).toBeVisible();
  // The daily goal the parent set: today's rounds, under the streak.
  await expect(page.getByRole('img', { name: /יעד יומי: 0 מתוך 2 סבבים היום/ })).toBeVisible();

  await page.getByRole('button', { name: 'עוד תרגילים בעולם הזה' }).click();
  await expect(page).toHaveURL(/\/practice\/world$/);
  await expect(page.getByText('תרגילים מהתחנות שכבר עברת בעולם הזה, מעורבבים.')).toBeVisible();
  // A short round for a grade 2 child: 7 exercises, the parent's choice.
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '7');

  // Back on the map, the station she is at is unchanged.
  await page.getByRole('button', { name: 'סיום' }).click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByText('תחנה 4 מתוך 10')).toBeVisible();
});
