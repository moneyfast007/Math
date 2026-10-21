import { t } from '@/i18n';
import {
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  say,
  spreadChoices,
} from '../build';
import { pick, randInt, shuffle } from '../rng';
import type { Exercise, Rng, Visual } from '../types';

/**
 * What the two data worlds share: the survey themes, the bar chart, and the
 * levels both use (reading a bar, two steps, the average, a percent). Every
 * generator takes the world's id and the level it is played at.
 */

/** Survey themes: the question, the categories (Hebrew, as on the chart) and a picture of each. */
export const THEMES = [
  {
    key: 'fruit',
    items: ['תפוח', 'בננה', 'ענבים', 'תות', 'אבטיח'],
    icons: ['🍎', '🍌', '🍇', '🍓', '🍉'],
  },
  {
    key: 'sport',
    items: ['כדורגל', 'כדורסל', 'שחייה', 'ריקוד', 'טניס'],
    icons: ['⚽', '🏀', '🏊', '💃', '🎾'],
  },
  {
    key: 'pet',
    items: ['כלב', 'חתול', 'דג', 'ארנב', 'תוכי'],
    icons: ['🐶', '🐱', '🐟', '🐰', '🦜'],
  },
  {
    key: 'color',
    items: ['כחול', 'אדום', 'ירוק', 'צהוב', 'סגול'],
    icons: ['🔵', '🔴', '🟢', '🟡', '🟣'],
  },
] as const;

export type Theme = (typeof THEMES)[number];

export const themeTitle = (theme: Theme) => t(`ex.data.title.${theme.key}`);

/** Distinct values, so "most" and "least" have one answer. */
export function values(rng: Rng, n: number, lo: number, hi: number, step = 1): number[] {
  const pool = shuffle(
    rng,
    Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step),
  );
  return pool.slice(0, n);
}

export interface Survey {
  theme: Theme;
  labels: string[];
  vals: number[];
  step: number;
}

export function survey(rng: Rng, n: number, lo: number, hi: number, step = 1): Survey {
  const theme = pick(rng, THEMES);
  const labels = shuffle(rng, [...theme.items]).slice(0, n);
  return { theme, labels, vals: values(rng, n, lo, hi, step), step };
}

/** The bar chart of a survey; `pictures`: a picture graph, one icon per child. */
export function chart(s: Survey, pictures = false): Visual {
  const icon = (label: string) => {
    const i = (s.theme.items as readonly string[]).indexOf(label);
    return s.theme.icons[i] as string;
  };
  return {
    type: 'bars',
    bars: s.labels.map((label, i) => ({
      label,
      value: s.vals[i] ?? 0,
      ...(pictures ? { icon: icon(label) } : {}),
    })),
    step: s.step,
    title: themeTitle(s.theme),
  };
}

export const pickIndex = (rng: Rng, n: number) => randInt(rng, 0, n - 1);

export const sum = (xs: readonly number[]) => xs.reduce((x, y) => x + y, 0);

/** Three number buttons around a small answer (grade 1: choose, do not type). */
export function smallChoices(rng: Rng, answer: number, min = 1) {
  return {
    type: 'choices' as const,
    choices: spreadChoices(rng, answer, { deltas: [1, 2, 3], min, count: 3, mix: true }),
  };
}

/* ---------- Levels both worlds use ---------- */

export interface ReadOptions {
  id: string;
  level: number;
  /** The scale's step: 1, 2, 5, 10 (one of these at random when several). */
  steps: readonly number[];
  bars: number;
  /** Values from `step` to `step × top`. */
  top: number;
  /** A picture graph, answered with buttons (grade 1). */
  pictures?: boolean;
  /** Values may end half way between two lines (grade 4). */
  halves?: boolean;
}

/** How many chose this? Read one bar. */
export function read(o: ReadOptions) {
  return (rng: Rng): Exercise => {
    const step = pick(rng, o.steps);
    const unit = o.halves ? step / 2 : step;
    const s = { ...survey(rng, o.bars, unit, step * o.top, unit), step };
    const i = pickIndex(rng, o.bars);
    const item = s.labels[i] as string;
    const answer = s.vals[i] as number;
    return exercise({
      factId: `dread${o.level}:${s.labels.join(',')}:${s.vals.join(',')}:${i}`,
      topicId: o.id,
      level: o.level,
      prompt: t('ex.data.read.prompt', { params: { item } }),
      display: '',
      spoken: say('ex.data.read.prompt', { item }),
      visual: chart(s, o.pictures),
      answer,
      input: o.pictures ? smallChoices(rng, answer) : numpad(3),
      hints: [
        hint(say('ex.data.read.hint1', { item })),
        hint(
          o.pictures
            ? say('ex.data2.pic.hint2')
            : say(step === 1 ? 'ex.data.read.hint2' : 'ex.data.scale.hint2', { step }),
        ),
        hint(say(o.halves ? 'ex.data2.half.hint3' : 'ex.data.read.hint3')),
      ],
      // "ילד אחד בחר": one child takes the verb in the singular.
      solution:
        answer === 1
          ? say('ex.data.read.solution1', { item })
          : say('ex.data.read.solution', { item, n: answer }),
      // Counted the grid lines instead of reading the scale (6 for 12 when each line is 2).
      diagnose: (v) => (step > 1 && v === Math.floor(answer / step) ? 'other' : null),
    });
  };
}

/** Which was chosen most (or least)? */
export function most(id: string, level: number, bars: number, top: number, pictures = false) {
  return (rng: Rng): Exercise => {
    const s = survey(rng, bars, 1, top);
    const least = rng() < 0.5;
    const target = least ? Math.min(...s.vals) : Math.max(...s.vals);
    const right = s.labels[s.vals.indexOf(target)] as string;
    return exercise({
      factId: `dmost${level}:${least}:${s.labels.join(',')}:${s.vals.join(',')}`,
      topicId: id,
      level,
      prompt: t(least ? 'ex.data.least.prompt' : 'ex.data.most.prompt'),
      display: '',
      spoken: say(least ? 'ex.data.least.prompt' : 'ex.data.most.prompt'),
      visual: chart(s, pictures),
      answer: s.labels.indexOf(right),
      input: labelledChoices(s.labels, true),
      hints: [
        hint(say(least ? 'ex.data.least.hint1' : 'ex.data.most.hint1')),
        hint(say('ex.data.most.hint2')),
        hint(say('ex.data.read.hint3')),
      ],
      solution: say(least ? 'ex.data.least.solution' : 'ex.data.most.solution', { item: right }),
    });
  };
}

/** The worked example of "how many more", with a difference other than the answer. */
export function moreExample(answer: number) {
  return exampleAvoiding(answer, [
    {
      answer: 3,
      hint: () => exampleHint('8 − 5 = 3', say('ex.data.more.example', { x: 8, y: 5, d: 3 })),
    },
    {
      answer: 4,
      hint: () => exampleHint('9 − 5 = 4', say('ex.data.more.example', { x: 9, y: 5, d: 4 })),
    },
  ]);
}

/** How many more chose A than B? (a picture graph with buttons, grade 1) */
export function more(id: string, level: number, bars: number, top: number, pictures = false) {
  return (rng: Rng): Exercise => {
    const s = survey(rng, bars, 1, top);
    const [i, j] = shuffle(
      rng,
      s.vals.map((_, k) => k),
    ).slice(0, 2) as [number, number];
    const [a, b] = (s.vals[i] as number) > (s.vals[j] as number) ? [i, j] : [j, i];
    const A = s.labels[a] as string;
    const B = s.labels[b] as string;
    const answer = (s.vals[a] as number) - (s.vals[b] as number);
    return exercise({
      factId: `dmore${level}:${s.labels.join(',')}:${s.vals.join(',')}:${a},${b}`,
      topicId: id,
      level,
      prompt: t('ex.data.more.prompt', { params: { a: A, b: B } }),
      display: '',
      spoken: say('ex.data.more.prompt', { a: A, b: B }),
      visual: chart(s, pictures),
      answer,
      operation: 'sub',
      input: pictures ? smallChoices(rng, answer) : numpad(2),
      hints: [
        hint(say('ex.data.more.hint1')),
        hint(say('ex.data.more.hint2', { a: A, b: B })),
        moreExample(answer),
      ],
      solution: say('ex.data.more.solution', { a: A, b: B, d: answer }),
      diagnose: (v) =>
        v === (s.vals[a] as number) + (s.vals[b] as number) ? 'wrongOperation' : null,
    });
  };
}

/** Two steps: how many more chose A and B together than C? */
export function twoSteps(id: string, level: number, step: number) {
  return (rng: Rng): Exercise => {
    for (;;) {
      const s = survey(rng, 3, step, step * 8, step);
      const [a, b, c] = s.vals as [number, number, number];
      if (a + b <= c) continue;
      const [A, B, C] = s.labels as [string, string, string];
      const answer = a + b - c;
      return exercise({
        factId: `dtwo${level}:${s.labels.join(',')}:${s.vals.join(',')}`,
        topicId: id,
        level,
        prompt: t('ex.data.two.prompt', { params: { a: A, b: B, c: C } }),
        display: '',
        spoken: say('ex.data.two.prompt', { a: A, b: B, c: C }),
        visual: chart(s),
        answer,
        input: numpad(3),
        hints: [
          hint(say('ex.data.two.hint1', { a: A, b: B })),
          hint(say('ex.data.two.hint2', { c: C })),
          exampleAvoiding(answer, [
            {
              answer: 2,
              hint: () =>
                exampleHint('6 + 4 − 8 = 2', say('ex.data.two.example', { s: 10, c: 8, r: 2 })),
            },
            {
              answer: 4,
              hint: () =>
                exampleHint('8 + 6 − 10 = 4', say('ex.data.two.example', { s: 14, c: 10, r: 4 })),
            },
          ]),
        ],
        solution: say('ex.data.two.solution', { s: a + b, c: C, r: answer }),
        diagnose: (v) => (v === a + b ? 'other' : null),
      });
    }
  };
}

/** The average (mean) of the bars: 3 bars, or 4 or 5. */
export function average(id: string, level: number, counts: readonly number[]) {
  return (rng: Rng): Exercise => {
    const n = pick(rng, counts);
    for (;;) {
      // Even values: the scale goes up in twos, so every bar ends on a line.
      const s = survey(rng, n, 2, 18, 2);
      const total = sum(s.vals);
      if (total % n !== 0) continue;
      const answer = total / n;
      return exercise({
        factId: `davg${level}:${s.labels.join(',')}:${s.vals.join(',')}`,
        topicId: id,
        level,
        prompt: t('ex.data.avg.prompt'),
        display: '',
        spoken: say('ex.data.avg.prompt'),
        visual: chart(s),
        answer,
        operation: 'div',
        input: numpad(2),
        hints: [
          hint(say('ex.data.avg.hint1')),
          hint(say('ex.data.avg.hint2', { s: total, n })),
          exampleAvoiding(answer, [
            {
              answer: 6,
              hint: () =>
                exampleHint(
                  '(4 + 6 + 8) ÷ 3 = 6',
                  say('ex.data.avg.example', { s: 18, n: 3, r: 6 }),
                ),
            },
            {
              answer: 7,
              hint: () =>
                exampleHint(
                  '(5 + 7 + 9) ÷ 3 = 7',
                  say('ex.data.avg.example', { s: 21, n: 3, r: 7 }),
                ),
            },
          ]),
        ],
        solution: say('ex.data.avg.example', { s: total, n, r: answer }),
        // Stopped at the sum, or divided by the wrong count.
        diagnose: (v) => (v === total ? 'other' : null),
      });
    }
  };
}

/** What percent of the children chose this? (totals of 20, 25, 50) */
export function percentOf(id: string, level: number) {
  return (rng: Rng): Exercise => {
    for (;;) {
      const totalWanted = pick(rng, [20, 25, 50]);
      const s = survey(rng, 4, 1, totalWanted / 2);
      const total = sum(s.vals);
      if (total !== totalWanted) continue;
      const i = pickIndex(rng, 4);
      const item = s.labels[i] as string;
      const answer = ((s.vals[i] as number) * 100) / total;
      return exercise({
        factId: `dpct:${s.labels.join(',')}:${s.vals.join(',')}:${i}`,
        topicId: id,
        level,
        prompt: t('ex.data.pct.prompt', { params: { item } }),
        display: '',
        spoken: say('ex.data.pct.prompt', { item }),
        visual: chart(s),
        answer,
        input: numpad(3),
        hints: [
          hint(say('ex.data.pct.hint1')),
          hint(say('ex.data.pct.hint2', { s: total })),
          exampleAvoiding(answer, [
            {
              answer: 25,
              hint: () =>
                exampleHint(
                  '5 ÷ 20 × 100 = 25',
                  say('ex.data.pct.example', { k: 5, s: 20, r: 25 }),
                ),
            },
            {
              answer: 40,
              hint: () =>
                exampleHint(
                  '8 ÷ 20 × 100 = 40',
                  say('ex.data.pct.example', { k: 8, s: 20, r: 40 }),
                ),
            },
          ]),
        ],
        solution: say('ex.data.pct.example', { k: s.vals[i] as number, s: total, r: answer }),
        diagnose: (v) => (v === s.vals[i] ? 'other' : null),
      });
    }
  };
}
