import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

/**
 * Phase 2: profiles, persistence, the parent gate, backup and restore.
 * Every test starts with empty storage (a fresh browser context).
 */

async function startSetup(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await expect(page).toHaveURL(/\/parents$/);
}

async function addChild(
  page: Page,
  {
    name,
    grade,
    gender = 'בלשון נקבה',
    avatar = 'שועל',
  }: { name: string; grade: string; gender?: string; avatar?: string },
) {
  await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
  const dialog = page.getByRole('dialog', { name: 'פרופיל חדש' });
  await dialog.getByLabel('שם', { exact: true }).fill(name);
  await dialog.getByRole('radio', { name: avatar }).check({ force: true });
  await dialog.getByRole('radio', { name: grade }).check({ force: true });
  await dialog.getByRole('radio', { name: gender }).check({ force: true });
  await dialog.getByRole('button', { name: 'שמירה' }).click();
  await expect(dialog).toBeHidden();
  const added = page.getByRole('dialog', { name: new RegExp(`^${name} מוכ(ן|נה)!`) });
  await added.getByRole('button', { name: 'סגירה' }).click();
  await expect(added).toBeHidden();
}

/** The parent area's sections: ילדים, התקדמות, הגדרות. */
async function openTab(page: Page, name: string) {
  await page.getByRole('tab', { name }).click();
  await expect(page.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
}

async function exitParents(page: Page) {
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
  await expect(page).toHaveURL(/\/$/);
}

async function longPress(page: Page, name: string) {
  const box = await page.getByRole('button', { name }).boundingBox();
  if (!box) throw new Error(`no button ${name}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1800);
  await page.mouse.up();
}

async function answerGate(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'כניסת הורים' });
  const text = (await dialog.locator('[data-math]').textContent()) ?? '';
  const match = /(\d+)\s*×\s*(\d+)/.exec(text);
  if (!match) throw new Error(`unexpected gate question: ${text}`);
  const answer = String(Number(match[1]) * Number(match[2]));
  for (const d of answer) await dialog.getByRole('button', { name: d, exact: true }).click();
  await dialog.getByRole('button', { name: 'אישור' }).click();
}

test.describe('profiles', () => {
  test('first run: create a profile, it appears on home and survives a reload', async ({
    page,
  }) => {
    await startSetup(page);
    await addChild(page, { name: 'נועה', grade: 'כיתה ב׳' });
    await expect(page.getByRole('article', { name: 'נועה' })).toBeVisible();
    await exitParents(page);

    await expect(page.getByRole('heading', { name: 'מי משחקת היום?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'נועה' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'נועה' })).toBeVisible();
  });

  test('after adding a child: start playing right away, or add another', async ({ page }) => {
    await startSetup(page);
    await page.getByRole('button', { name: 'הוספת ילד או ילדה' }).click();
    const form = page.getByRole('dialog', { name: 'פרופיל חדש' });
    await form.getByLabel('שם', { exact: true }).fill('נועה');
    await form.getByRole('radio', { name: 'כיתה ב׳' }).check({ force: true });
    await form.getByRole('button', { name: 'שמירה' }).click();

    const added = page.getByRole('dialog', { name: 'נועה מוכנה!' });
    await expect(added).toBeVisible();
    await added.getByRole('button', { name: 'להוסיף עוד ילד או ילדה' }).click();
    const second = page.getByRole('dialog', { name: 'פרופיל חדש' });
    await second.getByLabel('שם', { exact: true }).fill('איתי');
    await second.getByRole('radio', { name: 'כיתה ד׳' }).check({ force: true });
    await second.getByRole('radio', { name: 'בלשון זכר' }).check({ force: true });
    await second.getByRole('button', { name: 'שמירה' }).click();

    await page
      .getByRole('dialog', { name: 'איתי מוכן!' })
      .getByRole('button', { name: 'להתחיל לשחק' })
      .click();
    await expect(page).toHaveURL(/\/play$/);
    await expect(page.getByRole('button', { name: 'יאללה, מתחילים!' })).toBeVisible();
  });

  test('the way home stays in reach, however far down the parent area', async ({ page }) => {
    await startSetup(page);
    await addChild(page, { name: 'נועה', grade: 'כיתה ב׳' });
    await openTab(page, 'הגדרות');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    // One exit only, pinned at the top with the title.
    await expect(page.getByRole('button', { name: 'סיימתי, למסך הבית' })).toHaveCount(1);
    const done = page.getByRole('button', { name: 'סיימתי, למסך הבית' });
    await expect(done).toBeInViewport();
    await done.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('selecting a child greets her and applies her age band', async ({ page }) => {
    await startSetup(page);
    await addChild(page, { name: 'נועה', grade: 'כיתה ב׳' });
    await addChild(page, { name: 'מאיה', grade: 'גן חובה', avatar: 'פנדה' });
    await addChild(page, { name: 'איתי', grade: 'כיתה ד׳', gender: 'בלשון זכר', avatar: 'אריה' });
    await exitParents(page);

    // Girls and a boy: the question takes a form that is the same for both.
    await expect(page.getByRole('heading', { name: 'מי רוצה לשחק היום?' })).toBeVisible();

    const cases: [string, string][] = [
      ['נועה', 'middle'],
      ['מאיה', 'young'],
      ['איתי', 'older'],
    ];
    for (const [name, band] of cases) {
      await page.getByRole('button', { name }).click();
      await expect(page).toHaveURL(/\/play$/);
      await expect(page.getByRole('heading', { name: `שלום ${name}!` })).toBeVisible();
      await expect(page.getByRole('button', { name: 'יאללה, מתחילים!' })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-age', band);
      await page.getByRole('button', { name: 'מי משחק?' }).click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('a direct visit to /play without a chosen child goes home', async ({ page }) => {
    await page.goto('/play');
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('parent gate', () => {
  test.beforeEach(async ({ page }) => {
    await startSetup(page);
    await addChild(page, { name: 'נועה', grade: 'כיתה ב׳' });
    await exitParents(page);
  });

  test('a tap does nothing; a long press and the right answer open the parent area', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'הורים' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).toBeHidden();

    await longPress(page, 'הורים');
    const dialog = page.getByRole('dialog', { name: 'כניסת הורים' });
    await expect(dialog).toBeVisible();

    // A wrong answer keeps it locked, with a gentle message.
    await dialog.getByRole('button', { name: '1', exact: true }).click();
    await dialog.getByRole('button', { name: 'אישור' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('לא נכון. נסו שוב.');
    await expect(page).toHaveURL(/\/$/);

    await answerGate(page);
    await expect(page).toHaveURL(/\/parents$/);
    await expect(page.getByRole('heading', { name: 'אזור הורים' })).toBeVisible();
  });

  test('a direct visit to /parents shows the gate', async ({ page }) => {
    await page.goto('/parents');
    await expect(page.getByRole('dialog', { name: 'כניסת הורים' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'אזור הורים' })).toBeHidden();
    await answerGate(page);
    await expect(page.getByRole('heading', { name: 'אזור הורים' })).toBeVisible();
  });

  test('a parent PIN replaces the question', async ({ page }) => {
    await longPress(page, 'הורים');
    await answerGate(page);

    await openTab(page, 'הגדרות');
    await page.getByRole('button', { name: 'הגדרת קוד' }).click();
    const chooser = page.getByRole('dialog', { name: 'נעילת אזור ההורים' });
    for (const d of '25802580') await chooser.getByRole('button', { name: d, exact: true }).click();
    await expect(page.getByText('מוגדר קוד הורים.')).toBeVisible();
    await exitParents(page);

    await longPress(page, 'הורים');
    const gate = page.getByRole('dialog', { name: 'כניסת הורים' });
    await expect(gate.getByText('הקלידו את קוד ההורים')).toBeVisible();
    await expect(gate.locator('[data-math]')).toHaveCount(0);
    for (const d of '2580') await gate.getByRole('button', { name: d, exact: true }).click();
    await expect(page).toHaveURL(/\/parents$/);
  });
});

test.describe('backup', () => {
  test.beforeEach(async ({ page }) => {
    // Force the download path (no share sheet) so the test can capture the file.
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, 'canShare', {
        value: undefined,
        configurable: true,
      });
    });
  });

  test('export downloads a backup containing the profiles', async ({ page }) => {
    await startSetup(page);
    await addChild(page, { name: 'נועה', grade: 'כיתה ב׳' });

    await openTab(page, 'הגדרות');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'שמירת גיבוי' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^heshbon-backup-\d{4}-\d{2}-\d{2}\.json$/);

    const path = await download.path();
    const json = JSON.parse(await readFile(path, 'utf8')) as {
      app: string;
      data: { profiles: { name: string }[] };
    };
    expect(json.app).toBe('heshbon');
    expect(json.data.profiles.map((p) => p.name)).toEqual(['נועה']);
    await expect(page.getByText('גיבוי אחרון:')).toBeVisible();
  });

  test('import replaces the data after confirmation', async ({ page }) => {
    await startSetup(page);
    await addChild(page, { name: 'נועה', grade: 'כיתה ב׳' });

    const backup = {
      app: 'heshbon',
      kind: 'backup',
      schemaVersion: 1,
      exportedAt: '2026-10-17T10:00:00.000Z',
      data: {
        schemaVersion: 1,
        profiles: [
          {
            id: 'a',
            name: 'תמר',
            avatar: 'cat',
            grade: 5,
            gender: 'f',
            createdAt: 1,
            settings: { allowLevelChange: false },
          },
          {
            id: 'b',
            name: 'עומר',
            avatar: 'frog',
            grade: 1,
            gender: 'm',
            createdAt: 2,
            settings: { allowLevelChange: true },
          },
        ],
        progress: {
          a: {
            topics: {
              'add-sub-20': {
                level: 2,
                attempts: 10,
                correct: 8,
                lastPracticedAt: 1_760_000_000_000,
                // Overall 8/10, but the recent results are weak: listed as a topic to strengthen.
                recent: [false, false, true, false, false, true],
                mistakes: { wrongOperation: 2 },
              },
            },
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
    const confirm = page.getByRole('dialog', { name: 'לשחזר מהגיבוי?' });
    await expect(confirm).toContainText('2 פרופילים');
    await confirm.getByRole('button', { name: 'שחזור' }).click();

    // The chosen file opened the settings, where the confirmation and the result are.
    await expect(page.getByText('השחזור הושלם.')).toBeVisible();
    await openTab(page, 'התקדמות');
    await expect(page.getByRole('article', { name: 'תמר' })).toContainText('הצלחה: 80%');
    await expect(page.getByRole('article', { name: 'תמר' })).toContainText(
      'נושאים לחיזוק: חיבור וחיסור עד 20',
    );
    await expect(page.getByRole('article', { name: 'תמר' })).toContainText('פעולה לא נכונה');
    await expect(page.getByRole('article', { name: 'נועה' })).toHaveCount(0);

    // The child's card: where she is, and what to strengthen.
    await openTab(page, 'ילדים');
    const card = page.getByRole('article', { name: 'תמר' });
    await expect(card).toContainText('כיתה ה׳');
    await expect(card).toContainText(/תחנה \d+ מתוך \d+/);
    await expect(card).toContainText('נושאים לחיזוק: חיבור וחיסור עד 20');
  });

  test('a file that is not a backup is rejected with a reason', async ({ page }) => {
    await startSetup(page);
    await page.getByTestId('backup-file').setInputFiles({
      name: 'other.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hello": "world"}'),
    });
    await expect(page.getByText('לא הצלחנו לקרוא את הקובץ')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
