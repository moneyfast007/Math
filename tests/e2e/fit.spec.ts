import { expect, test, type Page } from '@playwright/test';

/**
 * The whole exercise fits one phone screen: nothing on the page scrolls, and
 * the ✓ key (with the rest of the number pad) or every answer button is fully
 * on the screen, without scrolling. For a child in every grade, on the
 * smallest common phones (360×640 Android, 375×667 iPhone SE) and a usual one
 * (390×844), for a sample of levels (1, 5, 10) of every world.
 *
 * Runs in the iPhone project only (WebKit, like Safari on a phone). One test
 * per world, so they spread over the workers.
 */

const WORLDS: Record<number, string[]> = {
  0: ['count-10', 'add-sub-20', 'shapes'],
  1: [
    'add-sub-20',
    'numbers-100',
    'patterns-1',
    'polygons',
    'solids-1',
    'measure-1',
    'clock-money-1',
    'data',
  ],
  2: [
    'add-sub-100',
    'numbers-1000',
    'money',
    'mult-intro',
    'clock',
    'polygons-2',
    'vertical-2',
    'data',
  ],
  3: ['mult-table', 'numbers-10000', 'fractions-1', 'measure', 'angles', 'vertical-3', 'data'],
  4: [
    'big-numbers',
    'long-mul-div',
    'divisibility',
    'fraction-ops',
    'perimeter-area',
    'angles-4',
    'vertical-4',
    'data-stats',
  ],
  5: ['fraction-ops', 'decimals', 'percent-intro', 'order-ops', 'areas', 'data-stats'],
  6: ['fraction-mul-div', 'decimal-ops', 'percent', 'ratio', 'circle-volume', 'data-stats'],
};

const PHONES = [
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
] as const;

/** Levels to open, by their place in the level picker (levels 1, 5 and 10). */
const SAMPLE = [0, 4, 9];

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
  await page.setViewportSize(PHONES[0]);
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

/** How far the page scrolls, and which answer controls are not fully on the screen. */
function measure(page: Page) {
  return page.evaluate(() => {
    const height = window.innerHeight;
    const scroll = document.scrollingElement?.scrollHeight ?? 0;
    const controls = [
      ...document.querySelectorAll<HTMLElement>('.practice .numpad__key, .practice .choice-big'),
    ];
    const off = controls
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top < -0.5 || r.bottom > height + 0.5;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        const name = el.getAttribute('aria-label') ?? el.textContent ?? '?';
        return `${name.trim()} ${Math.round(r.top)}…${Math.round(r.bottom)}`;
      });
    return { height, scroll, controls: controls.length, off: off.slice(0, 5) };
  });
}

for (const [grade, worlds] of Object.entries(WORLDS)) {
  for (const world of worlds) {
    test(`fit: grade ${grade}, ${world}: the exercise fits one phone screen`, async ({
      page,
    }, info) => {
      test.skip(info.project.name !== 'iphone', 'phone only');
      test.setTimeout(180_000);
      await setup(page, Number(grade), world);
      const other = page.getByRole('button', { name: 'תחנה אחרת' });
      await expect(other).toBeVisible();

      // A world can end earlier for a younger grade (gan stops at level 5 of world 2).
      await other.click();
      const count = await page.getByRole('dialog').getByRole('listitem').count();
      await page.keyboard.press('Escape');
      const levels = [...new Set(SAMPLE.map((i) => Math.min(i, count - 1)))];

      for (const phone of PHONES) {
        await page.setViewportSize(phone);
        for (const i of levels) {
          await other.click();
          await page.getByRole('dialog').getByRole('listitem').nth(i).click();
          await page.getByRole('button', { name: 'יאללה, מתחילים!' }).click();
          await expect(page.locator('.exercise')).toBeVisible();
          const where = `${phone.width}×${phone.height}, level ${i + 1}`;

          // Sizes settle within a frame or two (fonts, the fit to the card).
          await expect
            .poll(async () => (await measure(page)).scroll, { message: `${where}: page scrolls` })
            .toBeLessThanOrEqual(phone.height + 1);
          const m = await measure(page);
          expect(m.controls, `${where}: no answer controls`).toBeGreaterThan(0);
          expect(m.off, `${where}: answer controls off the screen`).toEqual([]);

          // The ✓ key itself, when this exercise has one (a guided column exercise has none).
          const confirm = page.getByRole('button', { name: 'אישור' });
          if ((await confirm.count()) > 0) {
            const box = await confirm.boundingBox();
            expect(box, `${where}: ✓ not laid out`).not.toBeNull();
            expect(
              (box?.y ?? 0) + (box?.height ?? 0),
              `${where}: ✓ below the screen`,
            ).toBeLessThanOrEqual(phone.height);
            expect(box?.y ?? -1, `${where}: ✓ above the screen`).toBeGreaterThanOrEqual(0);
          }
          // Every answer button, when the answers are buttons.
          const choices = page.locator('.choices-big').getByRole('button');
          for (let k = 0; k < (await choices.count()); k++) {
            const box = await choices.nth(k).boundingBox();
            expect(box, `${where}: answer ${k + 1} not laid out`).not.toBeNull();
            expect(
              (box?.y ?? 0) + (box?.height ?? 0),
              `${where}: answer ${k + 1} below the screen`,
            ).toBeLessThanOrEqual(phone.height);
          }

          await page.getByRole('button', { name: 'סיום' }).click();
        }
      }
    });
  }
}
