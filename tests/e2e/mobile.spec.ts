import { expect, test, type Page } from '@playwright/test';

/**
 * Every level of every world on a narrow phone (360px, the smallest common
 * width): nothing on the practice screen may reach past the screen's edges,
 * the exercise stays readable, and the typed answer still fits once it is long.
 *
 * Runs in the iPhone project only (WebKit, like Safari on a phone). One test
 * per world, so they spread over the workers.
 */

const WORLDS: Record<number, string[]> = {
  0: ['count-10', 'add-sub-20', 'shapes'],
  1: ['add-sub-20', 'numbers-100', 'clock-money-1'],
  2: ['add-sub-100', 'money', 'mult-intro', 'clock'],
  3: ['mult-table', 'numbers-10000', 'fractions-1', 'measure'],
  4: ['big-numbers', 'long-mul-div', 'fraction-ops', 'decimals', 'perimeter-area', 'angles'],
  5: ['fraction-mul-div', 'decimal-ops', 'percent-intro', 'order-ops', 'areas'],
  6: ['percent', 'ratio', 'circle-volume'],
};

/** Smallest acceptable size of the exercise's digits, px. */
const MIN_DIGITS_PX = 20;

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
  await page.setViewportSize({ width: 360, height: 740 });
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

/** What reaches past the screen's edges, and how small the exercise's digits are. */
function inspect(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const outside: string[] = [];
    for (const el of document.querySelectorAll('main *')) {
      if (el instanceof SVGElement && el.ownerSVGElement) continue; // the <svg> itself is checked
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.left < -1 || r.right > width + 1) {
        const cls = el.getAttribute('class') ?? '';
        outside.push(
          `<${el.tagName.toLowerCase()} class="${cls}"> ${Math.round(r.left)}…${Math.round(r.right)}`,
        );
      }
    }
    const math = document.querySelector<HTMLElement>('.exercise .math--block');
    const digits = math ? parseFloat(getComputedStyle(math).fontSize) : null;
    return {
      outside: outside.slice(0, 5),
      digits,
      wrapped: math?.hasAttribute('data-wrap') ?? false,
    };
  });
}

for (const [grade, worlds] of Object.entries(WORLDS)) {
  for (const world of worlds) {
    test(`phone: grade ${grade}, ${world}: every level fits the screen`, async ({ page }, info) => {
      test.skip(info.project.name !== 'iphone', 'phone only');
      test.setTimeout(150_000);
      await setup(page, Number(grade), world);
      await expect(page.getByRole('button', { name: 'שלב אחר' })).toBeVisible();

      for (let i = 0; i < 10; i++) {
        await page.getByRole('button', { name: 'שלב אחר' }).click();
        await page.getByRole('dialog').getByRole('listitem').nth(i).click();
        await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
        await expect(page.locator('.exercise')).toBeVisible();
        const where = `level ${i + 1}`;

        const first = await inspect(page);
        expect(first.outside, `${where}: past the screen's edge`).toEqual([]);
        if (first.digits !== null) {
          expect(first.digits, `${where}: digits too small`).toBeGreaterThanOrEqual(MIN_DIGITS_PX);
        }

        // A long typed answer must still fit (the pad stops at its own maximum).
        const eight = page.locator('.numpad').getByRole('button', { name: '8', exact: true });
        if (await eight.isVisible()) {
          for (let k = 0; k < 9; k++) await eight.click();
          const typed = await inspect(page);
          expect(typed.outside, `${where}, long answer: past the screen's edge`).toEqual([]);
          if (typed.digits !== null) {
            expect(typed.digits, `${where}, long answer: digits too small`).toBeGreaterThanOrEqual(
              MIN_DIGITS_PX,
            );
          }
        }
        await page.getByRole('button', { name: 'סיום' }).click();
      }
    });
  }
}

/** Not a test: phone screenshots of the longest exercises, for a visual review (SCREENSHOTS=1). */
test('phone screens for review', async ({ page }, info) => {
  test.skip(!process.env['SCREENSHOTS'] || info.project.name !== 'ipad', 'visual review only');
  test.setTimeout(120_000);
  const shot = async (name: string) => {
    await page.waitForTimeout(400);
    await page.screenshot({ path: `.ci/screens/${name}.png` });
  };
  const open = async (i: number) => {
    await page.getByRole('button', { name: 'שלב אחר' }).click();
    await page.getByRole('dialog').getByRole('listitem').nth(i).click();
    await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
    await expect(page.locator('.exercise')).toBeVisible();
  };
  await setup(page, 4, 'big-numbers');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const i of [3, 6, 9]) {
    await open(i);
    await shot(`phone-big-${i + 1}`);
    const eight = page.locator('.numpad').getByRole('button', { name: '8', exact: true });
    if (await eight.isVisible()) {
      for (let k = 0; k < 9; k++) await eight.click();
      await shot(`phone-big-${i + 1}-typed`);
    }
    await page.getByRole('button', { name: 'סיום' }).click();
  }
});
