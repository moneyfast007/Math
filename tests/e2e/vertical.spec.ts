import { expect, test, type Page } from '@playwright/test';

/**
 * Column arithmetic (במאונך). The first level of each operation is guided:
 * each digit is checked as it is written, a slip is explained, a second slip
 * on the same digit is written for the child. Later levels are written whole
 * and then checked, with the wrong cells marked.
 */

const WORLDS: Record<number, string[]> = {
  2: ['add-sub-100', 'money', 'mult-intro', 'clock', 'vertical-2'],
};

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

/** A child of `grade` whose every other world is finished: the journey opens on `world`. */
function backup(grade: number, world: string) {
  const topics = Object.fromEntries(
    (WORLDS[grade] ?? []).filter((w) => w !== world).map((w) => [w, done]),
  );
  return {
    app: 'heshbon',
    kind: 'backup',
    schemaVersion: 3,
    exportedAt: '2026-10-18T10:00:00.000Z',
    data: {
      schemaVersion: 3,
      profiles: [
        {
          id: 'k',
          name: 'טל',
          avatar: 'fox',
          grade,
          gender: 'f',
          createdAt: 1,
          settings: { allowLevelChange: true },
        },
      ],
      progress: { k: { topics, streak: { count: 0, lastDay: null }, days: {} } },
      parent: { pin: null },
      meta: { createdAt: 1, lastBackupAt: null },
    },
  };
}

async function setup(page: Page, grade: number, world: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await page.getByTestId('backup-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup(grade, world))),
  });
  await page
    .getByRole('dialog', { name: 'לשחזר מהגיבוי?' })
    .getByRole('button', { name: 'שחזור' })
    .click();
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
  await page.getByRole('button', { name: 'טל' }).click();
}

async function openLevel(page: Page, index: number) {
  await page.getByRole('button', { name: 'שלב אחר' }).click();
  await page.getByRole('dialog').getByRole('listitem').nth(index).click();
  await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
  await expect(page.locator('.column-work')).toBeVisible();
}

/** The exercise's two numbers, read off the grid's label ("47 ועוד 25 במאונך"). */
async function operands(page: Page): Promise<[number, number, string]> {
  const label = (await page.locator('.column-work .vgrid').getAttribute('aria-label')) ?? '';
  const m = /([\d,]+) (ועוד|פחות|כפול) ([\d,]+)/.exec(label);
  if (!m) throw new Error(`Cannot read: "${label}"`);
  return [Number(m[1]?.replace(/,/g, '')), Number(m[3]?.replace(/,/g, '')), m[2] ?? ''];
}

/** The answer's digits in the order they are written: units first. */
const fromUnits = (n: number) => String(n).split('').reverse();

const pad = (page: Page) => page.locator('.column-work').getByRole('group', { name: 'התשובה' });
const press = (page: Page, d: string) =>
  pad(page).getByRole('button', { name: d, exact: true }).click();

test.describe('column arithmetic', () => {
  test('guided: a slip is explained, then column by column to the answer', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await setup(page, 2, 'vertical-2');
    await openLevel(page, 0);

    const [a, b, op] = await operands(page);
    expect(op).toBe('ועוד');
    const digits = fromUnits(a + b);
    // The first thing to do is said, with the units cell ready.
    await expect(page.locator('.column-work__say')).toBeVisible();
    await expect(page.locator('.vcell--cursor')).toHaveCount(1);

    // A wrong units digit: not written, explained.
    const wrong = String((Number(digits[0]) + 1) % 10);
    await press(page, wrong);
    await expect(page.locator('.column-work__say--explain')).toBeVisible();
    await expect(page.locator('.vcell--ok')).toHaveCount(0);

    for (const [i, d] of digits.entries()) {
      await press(page, d);
      if (i < digits.length - 1) await expect(page.locator('.vcell--ok')).toHaveCount(i + 1);
    }
    await expect(page.locator('.feedback--correct')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('guided: two slips on one digit, and it is written for the child', async ({ page }) => {
    await setup(page, 2, 'vertical-2');
    await openLevel(page, 0);
    const [a, b] = await operands(page);
    const digits = fromUnits(a + b);
    const wrong = String((Number(digits[0]) + 1) % 10);
    await press(page, wrong);
    await press(page, wrong);
    // Written for her (green), and on to the next column.
    await expect(page.locator('.vcell--ok')).toHaveCount(1);
    for (const d of digits.slice(1)) await press(page, d);
    // Finished (counted in progress as shown, not solved alone): on to the next one.
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  test('written whole: checked, the wrong cell marked, then together', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await setup(page, 2, 'vertical-2');
    await openLevel(page, 2);

    const [a, b] = await operands(page);
    const digits = fromUnits(a + b);
    // Nothing is said: she writes the whole answer, then checks.
    await expect(page.locator('.column-work__say')).toHaveCount(0);
    const confirm = pad(page).getByRole('button', { name: 'אישור' });
    await expect(confirm).toBeDisabled();

    const typed = [String((Number(digits[0]) + 1) % 10), ...digits.slice(1)];
    for (const d of typed) await press(page, d);
    // Before the check nothing is marked right or wrong.
    await expect(page.locator('.vcell--wrong')).toHaveCount(0);
    await confirm.click();
    await expect(page.locator('.feedback--almost')).toBeVisible();
    await expect(page.locator('.vcell--wrong')).toHaveCount(1);

    // Together: from the wrong column on, guided.
    await page.getByRole('button', { name: 'נעבור על זה יחד, עמודה אחרי עמודה' }).click();
    await expect(page.locator('.column-work__say')).toBeVisible();
    await expect(page.locator('.vcell--wrong')).toHaveCount(0);
    for (const d of digits) await press(page, d);
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    expect(errors).toEqual([]);
  });

  test('written whole and right the first time', async ({ page }) => {
    await setup(page, 2, 'vertical-2');
    await openLevel(page, 2);
    const [a, b] = await operands(page);
    for (const d of fromUnits(a + b)) await press(page, d);
    // Backspace takes back the last digit written.
    await pad(page).getByRole('button', { name: 'מחיקת ספרה' }).click();
    await press(page, String(a + b).charAt(0));
    await pad(page).getByRole('button', { name: 'אישור' }).click();
    await expect(page.locator('.feedback--correct')).toBeVisible();
  });
});
