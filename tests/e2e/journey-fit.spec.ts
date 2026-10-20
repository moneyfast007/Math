import { expect, test, type Page } from '@playwright/test';

/**
 * The journey (the child's home) is one phone screen: the page never scrolls,
 * the big start button and the header's tools are fully on the screen, and a
 * child's name of five letters is shown whole. For a child in gan, grade 2 and
 * grade 4, on the smallest common phones (360×640 Android, 375×667 iPhone SE)
 * and a usual one (390×844); first with the first-time explainer over the map,
 * then without it.
 *
 * Runs in the iPhone project only (WebKit, like Safari on a phone).
 */

const PHONES = [
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
] as const;

/** Five letters: the name must fit without "…". */
const NAME = 'אביטל';

const done = {
  level: 10,
  attempts: 100,
  correct: 90,
  lastPracticedAt: 1_760_000_000_000,
  recent: [true, true, true],
  mistakes: {},
  completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  reviewPassed: false,
};

interface Case {
  label: string;
  grade: number;
  topics: Record<string, typeof done>;
  /** The progress line under the world's name (none in gan). */
  progress: RegExp | null;
}

const CASES: Case[] = [
  { label: 'gan', grade: 0, topics: {}, progress: null },
  { label: 'grade 2', grade: 2, topics: {}, progress: /^תחנה 1 מתוך 10$/ },
  { label: 'grade 4', grade: 4, topics: {}, progress: /^תחנה \d+ מתוך \d+$/ },
  {
    // Every station of the first world done: the final challenge is next, and opens world 2.
    label: 'grade 4, every station done',
    grade: 4,
    topics: { 'big-numbers': done },
    progress: /^נשאר אתגר אחד ועולם 2 נפתח$/,
  },
];

function backup(grade: number, topics: Case['topics']) {
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
          name: NAME,
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

async function setup(page: Page, c: Case) {
  await page.setViewportSize(PHONES[0]);
  await page.goto('/');
  await page.getByRole('button', { name: 'יצירת פרופיל ראשון' }).click();
  await page.getByTestId('backup-file').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup(c.grade, c.topics))),
  });
  await page
    .getByRole('dialog', { name: 'לשחזר מהגיבוי?' })
    .getByRole('button', { name: 'שחזור' })
    .click();
  await page.getByRole('button', { name: 'סיימתי, למסך הבית' }).first().click();
  await page.getByRole('button', { name: NAME }).click();
  await expect(page).toHaveURL(/\/play$/);
}

/** How far the page scrolls, what is not fully on the screen, and whether the name is cut. */
function measure(page: Page) {
  return page.evaluate(() => {
    const height = window.innerHeight;
    const width = document.documentElement.clientWidth;
    const off = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < -0.5 || r.bottom > height + 0.5 || r.left < -0.5 || r.right > width + 0.5;
    };
    const label = (el: Element) => {
      const r = el.getBoundingClientRect();
      const name = el.getAttribute('aria-label') ?? el.textContent ?? '?';
      return `${name.trim()} ${Math.round(r.left)}…${Math.round(r.right)} × ${Math.round(r.top)}…${Math.round(r.bottom)}`;
    };
    const start = document.querySelector('.journey__start');
    const tools = [...document.querySelectorAll('.journey__tools > *')];
    const hello = document.querySelector<HTMLElement>('.journey__hello');
    return {
      scroll: document.scrollingElement?.scrollHeight ?? 0,
      start: start === null ? 'missing' : off(start) ? label(start) : 'on screen',
      tools: tools.length,
      toolsOff: tools.filter(off).map(label),
      truncated: hello === null || hello.scrollWidth > hello.clientWidth + 1,
    };
  });
}

async function expectFits(page: Page, where: string, phone: { width: number; height: number }) {
  // Sizes settle within a frame or two (the map is laid out to the room it has).
  await expect
    .poll(async () => (await measure(page)).scroll, { message: `${where}: the page scrolls` })
    .toBeLessThanOrEqual(phone.height + 1);
  const m = await measure(page);
  expect(m.start, `${where}: the start button`).toBe('on screen');
  expect(m.tools, `${where}: no header tools`).toBeGreaterThanOrEqual(2);
  expect(m.toolsOff, `${where}: header tools off the screen`).toEqual([]);
  expect(m.truncated, `${where}: the child's name is cut`).toBe(false);

  const box = await page.locator('.journey__start').boundingBox();
  expect(box, `${where}: no start button`).not.toBeNull();
  expect(
    (box?.y ?? 0) + (box?.height ?? 0),
    `${where}: start below the screen`,
  ).toBeLessThanOrEqual(phone.height);
}

for (const c of CASES) {
  test(`journey fits one phone screen: ${c.label}`, async ({ page }, info) => {
    test.skip(info.project.name !== 'iphone', 'phone only');
    test.setTimeout(90_000);
    await setup(page, c);
    const start = page.getByRole('button', { name: /^יאללה, (מתחילים|לאתגר הסיום)!$/ });
    await expect(start).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`שלום ${NAME}!`);

    // The tools keep their names; the streak shows only from the first day.
    await expect(page.getByRole('button', { name: 'מי משחק?' })).toContainText('ילדים');
    await expect(page.getByRole('button', { name: 'האלבום' })).toContainText('מדבקות');
    await expect(page.getByRole('img', { name: /רצף/ })).toHaveCount(0);

    // The world's row: its name and progress at the start, "כל העולמות" at the end.
    const all = page.getByRole('button', { name: 'כל העולמות', exact: true });
    await expect(all).toBeVisible();
    if (c.progress) {
      await expect(page.locator('.journey__progress')).toHaveText(c.progress);
      await expect(page.getByRole('heading', { level: 2, name: /^עולם 1 · / })).toBeVisible();
    } else {
      await expect(page.getByText('עולם 1', { exact: false })).toHaveCount(0);
    }

    // First visit: the explainer lies over the map; the start button stays reachable.
    const intro = page.getByRole('region', { name: 'ברוכה הבאה למסע!' });
    await expect(intro).toBeVisible();
    for (const phone of PHONES) {
      await page.setViewportSize(phone);
      await expectFits(page, `${phone.width}×${phone.height}, with the explainer`, phone);
      await expect(intro.getByRole('button', { name: 'הבנתי!' })).toBeInViewport();
    }
    await intro.getByRole('button', { name: 'הבנתי!' }).click();
    await expect(intro).toHaveCount(0);

    for (const phone of PHONES) {
      await page.setViewportSize(phone);
      await expectFits(page, `${phone.width}×${phone.height}`, phone);
      await expect(page.getByRole('region', { name: 'מפת המסע' })).toBeInViewport();
    }
  });
}
