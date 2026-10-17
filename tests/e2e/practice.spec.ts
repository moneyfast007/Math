import { expect, test, type Page } from '@playwright/test';

/**
 * Phase 3: the practice round. Exercises are random, so the tests read each
 * one off the screen and compute its answer, exactly as a child would.
 */

async function setupChild(page: Page, name: string, grade: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
  const dialog = page.getByRole('dialog', { name: 'פרופיל חדש' });
  await dialog.getByLabel('שם', { exact: true }).fill(name);
  await dialog.getByRole('radio', { name: grade }).check({ force: true });
  await dialog.getByRole('button', { name: 'שמירה' }).click();
  await page.getByRole('button', { name: 'יציאה' }).click();
  await page.getByRole('button', { name }).click();
  await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
  await expect(page).toHaveURL(/\/practice$/);
}

/** Reads the current exercise and returns its answer. */
async function currentAnswer(page: Page): Promise<number> {
  const math = page.locator('.exercise [data-math]');
  if ((await math.count()) === 0) {
    // Counting: the answer is the number of pictures that are not crossed out.
    return page.locator('.exercise .obj:not(.obj--removed)').count();
  }
  const text = ((await math.textContent()) ?? '').replace(/\s+/g, ' ').trim();
  let m = /^(\d+) ([+−]) (\d+) = \?$/.exec(text);
  if (m) return m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
  m = /^(\d+) \+ \? = (\d+)$/.exec(text);
  if (m) return Number(m[2]) - Number(m[1]);
  m = /^(\d+) − \? = (\d+)$/.exec(text);
  if (m) return Number(m[1]) - Number(m[2]);
  throw new Error(`Cannot read exercise: "${text}"`);
}

async function submit(page: Page, value: number) {
  const choices = page.locator('.choices-big');
  if ((await choices.count()) > 0) {
    await choices.getByRole('button', { name: String(value), exact: true }).click();
    return;
  }
  const pad = page.getByRole('group', { name: 'התשובה' });
  for (const d of String(value)) await pad.getByRole('button', { name: d, exact: true }).click();
  await pad.getByRole('button', { name: 'אישור' }).click();
}

test.describe('practice', () => {
  test('a full round: every answer right, the station passed, progress recorded', async ({
    page,
  }) => {
    test.slow(); // ten exercises plus the parent screen: a long test on a phone profile
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await setupChild(page, 'נועה', 'כיתה ב׳');

    const progress = page.getByRole('progressbar');
    await expect(progress).toHaveAttribute('aria-valuemax', '10');

    for (let i = 0; i < 10; i++) {
      await submit(page, await currentAnswer(page));
      await expect(page.locator('.feedback--correct')).toContainText('נכון! כל הכבוד');
      // Nothing interrupts a child who is doing well: no dialog, ever.
      await expect(page.getByRole('dialog')).toHaveCount(0);
      if (i < 9) await expect(progress).toHaveAttribute('aria-valuenow', String(i + 1));
    }

    await expect(page.getByRole('heading', { name: 'כל הכבוד, נועה!' })).toBeVisible();
    await expect(page.getByText('פתרת 10 תרגילים.')).toBeVisible();
    // Every answer right: the station is passed and the journey moves on.
    await expect(page.getByRole('status')).toContainText('עברת את התחנה! התחנה הבאה נפתחה!');

    // Back on the map: station 1 is done, 2 is next.
    await page.getByRole('button', { name: 'למסע' }).click();
    await expect(page.getByRole('button', { name: 'תחנה 1, הושלמה' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'תחנה 2, התחנה הבאה' })).toBeVisible();
    await expect(page.getByText('תחנה 2 מתוך 11')).toBeVisible();

    // The parent sees it.
    await page.getByRole('button', { name: 'מי משחק?' }).click();
    await page.goto('/parents');
    const gate = page.getByRole('dialog', { name: 'כניסת הורים' });
    const q = ((await gate.locator('[data-math]').textContent()) ?? '').match(/(\d+)\s*×\s*(\d+)/);
    const gateAnswer = String(Number(q?.[1]) * Number(q?.[2]));
    for (const d of gateAnswer) await gate.getByRole('button', { name: d, exact: true }).click();
    await gate.getByRole('button', { name: 'אישור' }).click();
    const row = page.getByRole('article', { name: 'נועה' });
    await expect(row).toContainText('תרגלה נושא אחד');
    await expect(row).toContainText('10 תרגילים');
    await expect(row).toContainText('הצלחה: 100%');
    expect(errors).toEqual([]);
  });

  test('wrong answers get a gentle explanation, hints, and finally the answer', async ({
    page,
  }) => {
    await setupChild(page, 'נועה', 'כיתה ב׳');
    const answer = await currentAnswer(page);
    const wrong = answer + 5;

    await submit(page, wrong);
    const feedback = page.locator('.feedback--almost');
    await expect(feedback).toBeVisible();
    await expect(page.locator('.feedback--correct')).toHaveCount(0);

    const hintButton = page.getByRole('button', { name: 'רמז', exact: true });
    for (let i = 1; i <= 3; i++) {
      await hintButton.click();
      await expect(page.getByText(`רמז ${i}`, { exact: true })).toBeVisible();
    }
    await expect(hintButton).toBeDisabled();
    // The third hint carries the worked example (a solved exercise).
    await expect(page.locator('.hint').nth(2).locator('[data-math]')).toHaveCount(1);

    await submit(page, wrong);
    await submit(page, wrong);
    await expect(page.locator('.feedback--reveal')).toContainText(`התשובה היא ${answer}.`);
    await expect(page.locator('.exercise .slot--done')).toHaveText(String(answer));
    await page.getByRole('button', { name: 'הבא' }).click();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  test('a child who is stuck drops a level without being asked', async ({ page }) => {
    // Grade 1 starts at station 6, so there is an easier level to drop to.
    await setupChild(page, 'נועה', 'כיתה א׳');
    for (let k = 0; k < 2; k++) {
      const answer = await currentAnswer(page);
      for (let i = 0; i < 3; i++) await submit(page, answer + 5);
      await expect(page.locator('.feedback--reveal')).toBeVisible();
      await page.getByRole('button', { name: 'הבא' }).click();
    }
    await expect(
      page.getByRole('status').filter({ hasText: 'נתרגל רגע שלב קל יותר.' }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('gan: pictures to count and three big answer buttons', async ({ page }) => {
    await setupChild(page, 'מאיה', 'גן חובה');
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '6');
    await expect(page.locator('html')).toHaveAttribute('data-age', 'young');

    for (let i = 0; i < 2; i++) {
      await expect(page.locator('.exercise .obj').first()).toBeVisible();
      await expect(page.locator('.choices-big button')).toHaveCount(3);
      await submit(page, await currentAnswer(page));
      await expect(page.locator('.feedback--correct')).toBeVisible();
      await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(i + 1));
    }
  });

  test('the speaker button never breaks the page, even without audio', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await setupChild(page, 'נועה', 'כיתה ב׳');
    await page.locator('.exercise [data-speaker]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('.exercise [data-speaker]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a child can pick another level when the profile allows it', async ({ page }) => {
    await setupChild(page, 'נועה', 'כיתה ב׳');
    await page.getByRole('button', { name: 'סיום' }).click();
    // Grade 2 starts world 1, addition and subtraction to 100, at its first station.
    const next = page.getByRole('heading', { level: 2, name: 'ועוד אחדות, בלי המרה', exact: true });
    await expect(next).toBeVisible();
    await page.getByRole('button', { name: 'שלב אחר' }).click();
    await page
      .getByRole('dialog', { name: 'באיזה שלב לתרגל?' })
      .getByRole('listitem')
      .filter({ hasText: 'מספר חסר' })
      .click();
    await expect(
      page.getByRole('heading', { level: 2, name: 'מספר חסר', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'תחנה 9, התחנה הבאה' })).toBeVisible();
    await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
    await expect(page.locator('.exercise [data-math]')).toContainText('?');
    await expect(page.getByRole('heading', { name: 'איזה מספר חסר?' })).toBeVisible();
  });
});

test.describe('journey', () => {
  test('the map shows every station, the review, Plusi, the streak and the album', async ({
    page,
  }) => {
    // Grade 1 starts world 1 (add-sub-20) at level 6: five stations already done.
    await setupChild(page, 'נועה', 'כיתה א׳');
    await page.getByRole('button', { name: 'סיום' }).click();
    await expect(page).toHaveURL(/\/play$/);

    const map = page.getByRole('region', { name: 'מפת המסע' });
    await expect(map.locator('.node')).toHaveCount(11);
    await expect(map.locator('.node--done')).toHaveCount(5);
    await expect(map.getByRole('img', { name: 'סיום העולם, עדיין סגור' })).toBeVisible();
    await expect(map.locator('.plusi')).toBeVisible();
    await expect(page.getByText('עולם 1 · חיבור וחיסור עד 20')).toBeVisible();
    await expect(page.getByText('תחנה 6 מתוך 11')).toBeVisible();
    await expect(page.getByRole('img', { name: 'בלי רצף עדיין' })).toBeVisible();

    // A done station is a shortcut back to that level.
    await map.getByRole('button', { name: 'תחנה 3, הושלמה' }).click();
    await expect(page).toHaveURL(/\/practice$/);
    // Level 3: adding with pictures.
    await expect(page.locator('.exercise .obj').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ביחד');

    await page.getByRole('button', { name: 'סיום' }).click();
    await page.getByRole('button', { name: 'האלבום' }).click();
    await expect(page).toHaveURL(/\/album$/);
    await expect(page.getByRole('heading', { name: 'האלבום של נועה' })).toBeVisible();
    await expect(page.getByText('עוד אין מדבקות. העולם הראשון מחכה!')).toBeVisible();
    await expect(page.getByRole('img', { name: 'מדבקה סגורה: בלון' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'מדבקה סגורה: סירה' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'מדבקה סגורה: סירה' })).toBeVisible();
    await page.getByRole('button', { name: 'חזרה למסע' }).click();
    await expect(page).toHaveURL(/\/play$/);
  });

  test('gan: a bigger map with no numbers on the stations', async ({ page }) => {
    await setupChild(page, 'מאיה', 'גן חובה');
    await page.getByRole('button', { name: 'סיום' }).click();
    const map = page.getByRole('region', { name: 'מפת המסע' });
    await expect(map.locator('.node--current')).toHaveText('');
    await expect(page.getByText('עולם 1', { exact: false })).toHaveCount(0);
    const box = await map.locator('.node--current').boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(72);
  });
});
