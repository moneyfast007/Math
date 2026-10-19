import { expect, test, type Page } from '@playwright/test';

/**
 * How a child moves on from world to world: a short explainer the first time
 * she opens the journey (once per child, never in the way of the start
 * button), and the map of all the grade's worlds, reached from "כל העולמות":
 * finished worlds play again, the current one leads back, locked ones say
 * which world opens them and cannot be entered.
 */

const finished = {
  level: 10,
  attempts: 100,
  correct: 90,
  lastPracticedAt: 1_760_000_000_000,
  recent: [true, true, true],
  mistakes: {},
  completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  reviewPassed: true,
};

/** A grade-1 child whose first world (add-sub-20) is finished, from a backup; on the journey. */
async function restoreGrade1(page: Page) {
  const backup = {
    app: 'heshbon',
    kind: 'backup',
    schemaVersion: 3,
    exportedAt: '2026-10-18T10:00:00.000Z',
    data: {
      schemaVersion: 3,
      profiles: [
        {
          id: 'k',
          name: 'נועה',
          avatar: 'fox',
          grade: 1,
          gender: 'f',
          createdAt: 1,
          settings: { allowLevelChange: false },
        },
      ],
      progress: {
        k: {
          topics: { 'add-sub-20': finished },
          streak: { count: 0, lastDay: null },
          days: {},
        },
      },
      parent: { pin: null },
      meta: { createdAt: 1, lastBackupAt: null },
    },
  };
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
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
  await page.getByRole('button', { name: 'נועה' }).click();
  await expect(page).toHaveURL(/\/play$/);
}

/** Elements (matching `selector`) that reach past the screen's edges. */
function outside(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const width = document.documentElement.clientWidth;
    const out: string[] = [];
    for (const el of document.querySelectorAll(sel)) {
      if (el instanceof SVGElement && el.ownerSVGElement) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.left < -1 || r.right > width + 1) out.push(el.getAttribute('class') ?? el.tagName);
    }
    return out.slice(0, 5);
  }, selector);
}

test('the first visit explains how the worlds open, once, without blocking anything', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
  const form = page.getByRole('dialog', { name: 'פרופיל חדש' });
  await form.getByLabel('שם', { exact: true }).fill('מאיה');
  await form.getByRole('radio', { name: 'כיתה ב׳' }).check({ force: true });
  await form.getByRole('button', { name: 'שמירה' }).click();
  await page.getByRole('button', { name: 'להתחיל לשחק' }).click();
  await expect(page).toHaveURL(/\/play$/);

  const intro = page.getByRole('region', { name: 'ברוכה הבאה למסע!' });
  await expect(intro).toBeVisible();
  await expect(intro.getByRole('listitem')).toHaveCount(3);
  await expect(intro).toContainText('סיום העולם');
  await expect(intro).toContainText('כל העולמות');
  // Not a dialog: the child can start right away.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'יאללה, מתחילים!' })).toBeEnabled();
  await intro.getByRole('button', { name: 'הבנתי!' }).click();
  await expect(intro).toHaveCount(0);

  // The next time she opens the journey, it is not there.
  await page.getByRole('button', { name: 'מי משחק?' }).click();
  await page.getByRole('button', { name: 'מאיה' }).click();
  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByRole('button', { name: 'יאללה, מתחילים!' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'ברוכה הבאה למסע!' })).toHaveCount(0);
});

test('the map of worlds: done plays again, current goes back, locked says what opens it', async ({
  page,
}) => {
  await restoreGrade1(page);
  await expect(page.getByText('עולם 2 · מספרים עד 100')).toBeVisible();
  await page.getByRole('button', { name: 'כל העולמות' }).click();
  await expect(page).toHaveURL(/\/worlds$/);
  await expect(page.getByRole('heading', { level: 1, name: 'כל העולמות' })).toBeVisible();

  const rows = page.getByRole('list', { name: 'העולמות לפי הסדר' }).getByRole('listitem');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText('הושלם');
  await expect(rows.nth(1)).toContainText('כאן עכשיו');
  await expect(rows.nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(rows.nth(2)).toContainText('נפתח אחרי שמסיימים את "מספרים עד 100"');
  await expect(rows.nth(3)).toContainText('נפתח אחרי שמסיימים את');
  // A locked world cannot be entered.
  await expect(rows.nth(2).getByRole('button')).toHaveCount(0);
  await expect(rows.nth(3).getByRole('button')).toHaveCount(0);

  // "איך זה עובד?" brings the explainer back.
  await page.getByRole('button', { name: 'איך זה עובד?' }).click();
  const how = page.getByRole('dialog', { name: 'איך זה עובד?' });
  await expect(how.getByRole('listitem')).toHaveCount(3);
  await how.getByRole('button', { name: 'הבנתי!' }).click();
  await expect(how).toHaveCount(0);

  // The current world leads back to the journey.
  await rows.nth(1).getByRole('button', { name: 'להמשיך במסע' }).click();
  await expect(page).toHaveURL(/\/play$/);

  // A finished world plays again, as from the album.
  await page.getByRole('button', { name: 'כל העולמות' }).click();
  await page.getByRole('button', { name: 'לתרגל שוב: חיבור וחיסור עד 20' }).click();
  await expect(page).toHaveURL(/\/practice\/again$/);
  await expect(page.locator('.exercise')).toBeVisible();
});

test('phone: the explainer and the map of worlds fit a 360px screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await restoreGrade1(page);
  await expect(page.getByRole('region', { name: 'ברוכה הבאה למסע!' })).toBeVisible();
  expect(await outside(page, '.intro, .intro *, .journey__world, .journey__world *')).toEqual([]);
  await page.getByRole('button', { name: 'כל העולמות' }).click();
  await expect(page.getByRole('list', { name: 'העולמות לפי הסדר' })).toBeVisible();
  expect(await outside(page, 'main *')).toEqual([]);
});
