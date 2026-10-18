import { expect, test } from '@playwright/test';

/**
 * Playing a finished world again: its sticker in the album is a button. The
 * round is mixed like the world's review, and the journey does not move.
 */
test('a sticker in the album plays its world again, and the journey stays put', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await expect(page).toHaveURL(/\/parents$/);

  const done = Array.from({ length: 10 }, (_, i) => i + 1);
  const backup = {
    app: 'heshbon',
    kind: 'backup',
    schemaVersion: 2,
    exportedAt: '2026-10-18T10:00:00.000Z',
    data: {
      schemaVersion: 2,
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
      ],
      progress: {
        a: {
          topics: {
            'add-sub-100': {
              level: 10,
              attempts: 120,
              correct: 110,
              lastPracticedAt: 1_760_000_000_000,
              recent: [true, true, true],
              mistakes: {},
              completedLevels: done,
              reviewPassed: true,
            },
          },
          streak: { count: 0, lastDay: null },
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

  // World 1 is finished: the journey is in world 2.
  await expect(page.getByRole('button', { name: 'יאללה, מתחילים!' })).toBeVisible();
  await page.getByRole('button', { name: 'האלבום' }).click();

  // Only the finished world's sticker is a button.
  const again = page.getByRole('button', { name: 'לתרגל שוב: חיבור וחיסור עד 100' });
  await expect(again).toBeVisible();
  await expect(page.getByRole('button', { name: /^לתרגל שוב/ })).toHaveCount(1);
  await again.click();

  await expect(page).toHaveURL(/\/practice\/again$/);
  await expect(page.locator('.exercise')).toBeVisible();
  await expect(page.getByRole('progressbar')).toBeVisible();

  // Leaving: the journey is exactly where it was, in world 2.
  await page.getByRole('button', { name: 'סיום' }).click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByText(/עולם 2/)).toBeVisible();
});
