import { t } from '@/i18n';
import {
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  say,
} from '../build';
import { pick, randInt, shuffle } from '../rng';
import type { Exercise, Rng, Visual } from '../types';

/**
 * World "חקר נתונים", shared by grades 2–6: no grade had data before. A bar
 * chart of a class survey: reading a bar, most and least, how many more, the
 * total; then a scale of 2, 5 or 10; two steps; the average (grade 5); a
 * percent of the whole (grade 6). Each grade starts and ends at its own level.
 */

const ID = 'data';
const L = (n: number) => `level.data.${n}`;

/** Survey themes: the question and the categories (Hebrew, as on the chart). */
const THEMES = [
  { key: 'fruit', items: ['תפוח', 'בננה', 'ענבים', 'תות', 'אבטיח'] },
  { key: 'sport', items: ['כדורגל', 'כדורסל', 'שחייה', 'ריקוד', 'טניס'] },
  { key: 'pet', items: ['כלב', 'חתול', 'דג', 'ארנב', 'תוכי'] },
  { key: 'color', items: ['כחול', 'אדום', 'ירוק', 'צהוב', 'סגול'] },
] as const;

type Theme = (typeof THEMES)[number];

/** Distinct values, so "most" and "least" have one answer. */
function values(rng: Rng, n: number, lo: number, hi: number, step = 1): number[] {
  const pool = shuffle(
    rng,
    Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step),
  );
  return pool.slice(0, n);
}

function chart(theme: Theme, labels: string[], vals: number[], step: number): Visual {
  return {
    type: 'bars',
    bars: labels.map((label, i) => ({ label, value: vals[i] ?? 0 })),
    step,
    title: t(`ex.data.title.${theme.key}`),
  };
}

interface Survey {
  theme: Theme;
  labels: string[];
  vals: number[];
  step: number;
}

function survey(rng: Rng, n: number, lo: number, hi: number, step = 1): Survey {
  const theme = pick(rng, THEMES);
  const labels = shuffle(rng, [...theme.items]).slice(0, n);
  return { theme, labels, vals: values(rng, n, lo, hi, step), step };
}

const pickIndex = (rng: Rng, n: number) => randInt(rng, 0, n - 1);

/** Levels 1, 5, 6: how many chose this? (scale 1, 2, 5/10) */
function read(level: 1 | 5 | 6) {
  return (rng: Rng): Exercise => {
    const step = level === 1 ? 1 : level === 5 ? 2 : pick(rng, [5, 10]);
    const s = survey(rng, 4, step, step * 10, step);
    const i = pickIndex(rng, 4);
    const item = s.labels[i] as string;
    const answer = s.vals[i] as number;
    return exercise({
      factId: `dread${level}:${s.labels.join(',')}:${s.vals.join(',')}:${i}`,
      topicId: ID,
      level,
      prompt: t('ex.data.read.prompt', { params: { item } }),
      display: '',
      spoken: say('ex.data.read.prompt', { item }),
      visual: chart(s.theme, s.labels, s.vals, s.step),
      answer,
      input: numpad(3),
      hints: [
        hint(say('ex.data.read.hint1', { item })),
        hint(say(step === 1 ? 'ex.data.read.hint2' : 'ex.data.scale.hint2', { step })),
        hint(say('ex.data.read.hint3')),
      ],
      // "ילד אחד בחר": one child takes the verb in the singular.
      solution:
        answer === 1
          ? say('ex.data.read.solution1', { item })
          : say('ex.data.read.solution', { item, n: answer }),
      // Counted the grid lines instead of reading the scale (6 for 12 when each line is 2).
      diagnose: (v) => (step > 1 && v === answer / step ? 'other' : null),
    });
  };
}

/** Level 2: which was chosen most (or least)? */
function most(rng: Rng): Exercise {
  const s = survey(rng, 4, 1, 10);
  const least = rng() < 0.5;
  const target = least ? Math.min(...s.vals) : Math.max(...s.vals);
  const right = s.labels[s.vals.indexOf(target)] as string;
  return exercise({
    factId: `dmost:${least}:${s.labels.join(',')}:${s.vals.join(',')}`,
    topicId: ID,
    level: 2,
    prompt: t(least ? 'ex.data.least.prompt' : 'ex.data.most.prompt'),
    display: '',
    spoken: say(least ? 'ex.data.least.prompt' : 'ex.data.most.prompt'),
    visual: chart(s.theme, s.labels, s.vals, 1),
    answer: s.labels.indexOf(right),
    input: labelledChoices(s.labels, true),
    hints: [
      hint(say(least ? 'ex.data.least.hint1' : 'ex.data.most.hint1')),
      hint(say('ex.data.most.hint2')),
      hint(say('ex.data.read.hint3')),
    ],
    solution: say(least ? 'ex.data.least.solution' : 'ex.data.most.solution', { item: right }),
  });
}

/** Level 3: how many more chose A than B? */
function more(rng: Rng): Exercise {
  const s = survey(rng, 4, 1, 12);
  const [i, j] = shuffle(rng, [0, 1, 2, 3]).slice(0, 2) as [number, number];
  const [a, b] = (s.vals[i] as number) > (s.vals[j] as number) ? [i, j] : [j, i];
  const A = s.labels[a] as string;
  const B = s.labels[b] as string;
  const answer = (s.vals[a] as number) - (s.vals[b] as number);
  return exercise({
    factId: `dmore:${s.labels.join(',')}:${s.vals.join(',')}:${a},${b}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.data.more.prompt', { params: { a: A, b: B } }),
    display: '',
    spoken: say('ex.data.more.prompt', { a: A, b: B }),
    visual: chart(s.theme, s.labels, s.vals, 1),
    answer,
    operation: 'sub',
    input: numpad(2),
    hints: [
      hint(say('ex.data.more.hint1')),
      hint(say('ex.data.more.hint2', { a: A, b: B })),
      exampleAvoiding(answer, [
        {
          answer: 3,
          hint: () => exampleHint('8 − 5 = 3', say('ex.data.more.example', { x: 8, y: 5, d: 3 })),
        },
        {
          answer: 4,
          hint: () => exampleHint('9 − 5 = 4', say('ex.data.more.example', { x: 9, y: 5, d: 4 })),
        },
      ]),
    ],
    solution: say('ex.data.more.solution', { a: A, b: B, d: answer }),
    diagnose: (v) =>
      v === (s.vals[a] as number) + (s.vals[b] as number) ? 'wrongOperation' : null,
  });
}

/** Level 4: how many children answered in all? */
function total(rng: Rng): Exercise {
  const s = survey(rng, rng() < 0.5 ? 3 : 4, 1, 9);
  const answer = s.vals.reduce((x, y) => x + y, 0);
  return exercise({
    factId: `dtotal:${s.labels.join(',')}:${s.vals.join(',')}`,
    topicId: ID,
    level: 4,
    prompt: t('ex.data.total.prompt'),
    display: '',
    spoken: say('ex.data.total.prompt'),
    visual: chart(s.theme, s.labels, s.vals, 1),
    answer,
    operation: 'add',
    input: numpad(2),
    hints: [
      hint(say('ex.data.total.hint1')),
      hint(say('ex.data.total.hint2'), {
        example: { display: `${s.vals.join(' + ')} = ?`, spoken: say('ex.data.total.hint2') },
      }),
      exampleAvoiding(answer, [
        {
          answer: 15,
          hint: () => exampleHint('4 + 6 + 5 = 15', say('ex.data.total.example', { r: 15 })),
        },
        {
          answer: 18,
          hint: () => exampleHint('7 + 6 + 5 = 18', say('ex.data.total.example', { r: 18 })),
        },
      ]),
    ],
    solution: say('ex.data.total.solution', { r: answer }),
    diagnose: (v) => (s.vals.some((x) => v === answer - x) ? 'other' : null),
  });
}

/** Level 7: two steps: how many more chose A and B together than C? (scale 2) */
function twoSteps(rng: Rng): Exercise {
  for (;;) {
    const s = survey(rng, 3, 2, 16, 2);
    const [a, b, c] = s.vals as [number, number, number];
    if (a + b <= c) continue;
    const [A, B, C] = s.labels as [string, string, string];
    const answer = a + b - c;
    return exercise({
      factId: `dtwo:${s.labels.join(',')}:${s.vals.join(',')}`,
      topicId: ID,
      level: 7,
      prompt: t('ex.data.two.prompt', { params: { a: A, b: B, c: C } }),
      display: '',
      spoken: say('ex.data.two.prompt', { a: A, b: B, c: C }),
      visual: chart(s.theme, s.labels, s.vals, 2),
      answer,
      input: numpad(2),
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
}

/** Levels 8–9: the average (mean) of the bars: 3 bars, then 4 or 5. */
function average(level: 8 | 9) {
  return (rng: Rng): Exercise => {
    const n = level === 8 ? 3 : pick(rng, [4, 5]);
    for (;;) {
      const s = survey(rng, n, 2, 18);
      const sum = s.vals.reduce((x, y) => x + y, 0);
      if (sum % n !== 0) continue;
      const answer = sum / n;
      return exercise({
        factId: `davg${level}:${s.labels.join(',')}:${s.vals.join(',')}`,
        topicId: ID,
        level,
        prompt: t('ex.data.avg.prompt'),
        display: '',
        spoken: say('ex.data.avg.prompt'),
        visual: chart(s.theme, s.labels, s.vals, 2),
        answer,
        operation: 'div',
        input: numpad(2),
        hints: [
          hint(say('ex.data.avg.hint1')),
          hint(say('ex.data.avg.hint2', { s: sum, n })),
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
        solution: say('ex.data.avg.example', { s: sum, n, r: answer }),
        // Stopped at the sum, or divided by the wrong count.
        diagnose: (v) => (v === sum ? 'other' : null),
      });
    }
  };
}

/** Level 10: what percent of the children chose this? (totals of 20, 25, 50) */
function percentOf(rng: Rng): Exercise {
  for (;;) {
    const totalWanted = pick(rng, [20, 25, 50]);
    const s = survey(rng, 4, 1, totalWanted / 2);
    const sum = s.vals.reduce((x, y) => x + y, 0);
    if (sum !== totalWanted) continue;
    const i = pickIndex(rng, 4);
    const item = s.labels[i] as string;
    const answer = ((s.vals[i] as number) * 100) / sum;
    return exercise({
      factId: `dpct:${s.labels.join(',')}:${s.vals.join(',')}:${i}`,
      topicId: ID,
      level: 10,
      prompt: t('ex.data.pct.prompt', { params: { item } }),
      display: '',
      spoken: say('ex.data.pct.prompt', { item }),
      visual: chart(s.theme, s.labels, s.vals, 1),
      answer,
      input: numpad(3),
      hints: [
        hint(say('ex.data.pct.hint1')),
        hint(say('ex.data.pct.hint2', { s: sum })),
        exampleAvoiding(answer, [
          {
            answer: 25,
            hint: () =>
              exampleHint('5 ÷ 20 × 100 = 25', say('ex.data.pct.example', { k: 5, s: 20, r: 25 })),
          },
          {
            answer: 40,
            hint: () =>
              exampleHint('8 ÷ 20 × 100 = 40', say('ex.data.pct.example', { k: 8, s: 20, r: 40 })),
          },
        ]),
      ],
      solution: say('ex.data.pct.example', { k: s.vals[i] as number, s: sum, r: answer }),
      diagnose: (v) => (v === s.vals[i] ? 'other' : null),
    });
  }
}

/**
 * The clips of every sentence that names a category: the categories and their
 * pairs are too many for the bank's sample to meet them all. Numbers of 1 and 2
 * are read with their noun inside the clip ("ילד אחד", "שני ילדים"), 3 stands
 * for every larger number (its clips come from the number bank).
 */
function bank(): string[] {
  const out = new Set<string>();
  const add = (...said: { parts: readonly string[] }[]) => {
    for (const x of said) for (const p of x.parts) out.add(p);
  };
  const ns = [1, 2, 3];
  for (const theme of THEMES) {
    for (const item of theme.items) {
      add(
        say('ex.data.read.prompt', { item }),
        say('ex.data.read.hint1', { item }),
        say('ex.data.read.solution1', { item }),
        say('ex.data.most.solution', { item }),
        say('ex.data.least.solution', { item }),
        say('ex.data.pct.prompt', { item }),
        say('ex.data.two.hint2', { c: item }),
        ...ns.map((n) => say('ex.data.read.solution', { item, n })),
        ...ns.map((r) => say('ex.data.two.solution', { s: 10, c: item, r })),
      );
      for (const b of theme.items) {
        if (b === item) continue;
        add(
          say('ex.data.more.prompt', { a: item, b }),
          say('ex.data.more.hint2', { a: item, b }),
          say('ex.data.two.hint1', { a: item, b }),
          ...ns.map((d) => say('ex.data.more.solution', { a: item, b, d })),
        );
        for (const c of theme.items)
          if (c !== item && c !== b) add(say('ex.data.two.prompt', { a: item, b, c }));
      }
    }
  }
  return [...out];
}

export const data = defineTopic({
  id: ID,
  labelKey: 'topic.data',
  grades: [2, 3, 4, 5, 6],
  // Each grade starts where its curriculum does and stops at its own last level.
  startLevel: (grade) => ({ 2: 1, 3: 3, 4: 5, 5: 7, 6: 8 })[grade] ?? 1,
  lastLevel: (grade) => ({ 2: 4, 3: 6, 4: 7, 5: 9, 6: 10 })[grade] ?? 10,
  levels: [
    open(L(1), read(1)),
    open(L(2), most),
    open(L(3), more),
    open(L(4), total),
    open(L(5), read(5)),
    open(L(6), read(6)),
    open(L(7), twoSteps),
    open(L(8), average(8)),
    open(L(9), average(9)),
    open(L(10), percentOf),
  ],
  extraBank: bank,
});
