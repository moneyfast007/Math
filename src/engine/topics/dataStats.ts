import { t } from '@/i18n';
import type { Gender } from '@/lang/gender';
import { shown } from '@/lang/compose';
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
import {
  THEMES,
  average,
  percentOf,
  pickIndex,
  read,
  sum,
  themeTitle,
  twoSteps,
  values,
} from './dataKit';

/**
 * World "נתונים וממוצע", grades 4–6: a scale with half steps, a double bar
 * chart, two steps, a line graph; the average, the range, the score still
 * needed for an average; a percent of the whole and a pie chart.
 */

const ID = 'data-stats';
const L = (n: number) => `level.dataStats.${n}`;

/* ---------- Level 2: a double bar chart (boys and girls) ---------- */

function doubleBars(rng: Rng): Exercise {
  const theme = pick(rng, THEMES);
  const labels = shuffle(rng, [...theme.items]).slice(0, 3);
  const boys = t('ex.data2.boys');
  const girls = t('ex.data2.girls');
  const kind = pick(rng, ['read', 'both', 'more'] as const);
  let a = values(rng, 3, 2, 18, 2);
  let b = values(rng, 3, 2, 18, 2);
  // The "more" question: the one answer where boys outnumber girls (or girls boys).
  let right = 0;
  let moreBoys = true;
  if (kind === 'more') {
    // Exactly one answer with more boys than girls (or the other way round).
    const k = pickIndex(rng, 3);
    const hi = values(rng, 3, 6, 18, 2);
    const lo = hi.map((x) => x - 2 * randInt(rng, 1, 2));
    a = hi.map((x, i) => (i === k ? x : (lo[i] as number)));
    b = hi.map((x, i) => (i === k ? (lo[i] as number) : x));
    right = k;
    if (rng() < 0.5) {
      [a, b] = [b, a];
      moreBoys = false;
    }
  }
  const visual: Visual = {
    type: 'bars2',
    groups: labels.map((label, i) => ({ label, a: a[i] as number, b: b[i] as number })),
    series: [boys, girls],
    step: 2,
    title: themeTitle(theme),
  };
  const key = `${labels.join(',')}:${a.join(',')}:${b.join(',')}`;
  if (kind === 'read') {
    const i = pickIndex(rng, 3);
    const item = labels[i] as string;
    const ofBoys = rng() < 0.5;
    const answer = (ofBoys ? a[i] : b[i]) as number;
    const who = ofBoys ? boys : girls;
    const whoGender: Gender = ofBoys ? 'm' : 'f';
    const promptKey = ofBoys ? 'ex.data2.double.read.boys' : 'ex.data2.double.read.girls';
    return exercise({
      factId: `ddread:${key}:${i}:${ofBoys}`,
      topicId: ID,
      level: 2,
      prompt: t(promptKey, { params: { item } }),
      display: '',
      spoken: say(promptKey, { item }),
      visual,
      answer,
      input: numpad(2),
      hints: [
        hint(say('ex.data2.double.read.hint1')),
        hint(say('ex.data2.double.read.hint2', { item, who })),
        hint(say('ex.data.scale.hint2', { step: 2 })),
      ],
      solution: say('ex.data2.double.read.solution', {
        n: { n: answer, gender: whoGender },
        who,
        item,
      }),
      // Read the other group's bar.
      diagnose: (v) => (v === (ofBoys ? b[i] : a[i]) ? 'other' : null),
    });
  }
  if (kind === 'both') {
    const i = pickIndex(rng, 3);
    const item = labels[i] as string;
    const answer = (a[i] as number) + (b[i] as number);
    return exercise({
      factId: `ddboth:${key}:${i}`,
      topicId: ID,
      level: 2,
      prompt: t('ex.data2.double.both.prompt', { params: { item } }),
      display: '',
      spoken: say('ex.data2.double.both.prompt', { item }),
      visual,
      answer,
      operation: 'add',
      input: numpad(2),
      hints: [
        hint(say('ex.data2.double.both.hint1', { item })),
        hint(say('ex.data2.double.both.hint2', { item, a: { n: a[i] as number, gender: 'm' } })),
        exampleAvoiding(answer, [
          {
            answer: 14,
            hint: () =>
              exampleHint(
                '8 + 6 = 14',
                say('ex.data2.double.both.example', {
                  a: { n: 8, gender: 'm' },
                  b: { n: 6, gender: 'f' },
                  r: 14,
                }),
              ),
          },
          {
            answer: 16,
            hint: () =>
              exampleHint(
                '10 + 6 = 16',
                say('ex.data2.double.both.example', {
                  a: { n: 10, gender: 'm' },
                  b: { n: 6, gender: 'f' },
                  r: 16,
                }),
              ),
          },
        ]),
      ],
      solution: say('ex.data2.double.both.solution', { item, r: answer }),
      diagnose: (v) => (v === a[i] || v === b[i] ? 'other' : null),
    });
  }
  const side = moreBoys ? 'moreBoys' : 'moreGirls';
  return exercise({
    factId: `ddmore:${key}`,
    topicId: ID,
    level: 2,
    prompt: t(`ex.data2.double.${side}.prompt`),
    display: '',
    spoken: say(`ex.data2.double.${side}.prompt`),
    visual,
    answer: right,
    input: labelledChoices(labels, true),
    hints: [
      hint(say('ex.data2.double.more.hint1')),
      hint(say(`ex.data2.double.${side}.hint2`)),
      hint(say('ex.data2.double.read.hint1')),
    ],
    solution: say(`ex.data2.double.${side}.solution`, { item: labels[right] as string }),
  });
}

/* ---------- Level 4: a line graph ---------- */

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

const LINE_THEMES = [
  {
    key: 'books',
    step: 2,
    top: 20,
    noun: { singular: 'ספר', plural: 'ספרים', gender: 'm' },
  },
  {
    key: 'zoo',
    step: 10,
    top: 100,
    noun: { singular: 'מבקר', plural: 'מבקרים', gender: 'm' },
  },
] as const;

function lineGraph(rng: Rng): Exercise {
  const theme = pick(rng, LINE_THEMES);
  const { step } = theme;
  // A walk on the grid lines, never below one step.
  const vals: number[] = [randInt(rng, 1, 4) * step];
  while (vals.length < DAYS.length) {
    const last = vals.at(-1) as number;
    const next = last + randInt(rng, -3, 4) * step;
    vals.push(Math.min(theme.top, Math.max(step, next)));
  }
  const rises = vals.slice(1).map((v, i) => v - (vals[i] as number));
  const best = Math.max(...rises);
  const kind = pick(rng, ['value', 'rise', 'change'] as const);
  const visual: Visual = {
    type: 'lineGraph',
    points: DAYS.map((label, i) => ({ label, value: vals[i] as number })),
    step,
    title: t(`ex.data2.line.title.${theme.key}`),
  };
  const key = `${theme.key}:${vals.join(',')}`;
  // The rise questions need a real rise, and one biggest.
  if (kind !== 'value' && (best <= 0 || rises.filter((r) => r === best).length > 1))
    return lineGraph(rng);
  if (kind === 'value') {
    const i = pickIndex(rng, DAYS.length);
    const day = DAYS[i] as string;
    const answer = vals[i] as number;
    return exercise({
      factId: `dline:${key}:${i}`,
      topicId: ID,
      level: 4,
      prompt: t(`ex.data2.line.value.${theme.key}`, { params: { day } }),
      display: '',
      spoken: say(`ex.data2.line.value.${theme.key}`, { day }),
      visual,
      answer,
      input: numpad(3),
      hints: [
        hint(say('ex.data2.line.value.hint1', { day })),
        hint(say('ex.data2.line.value.hint2', { step })),
        hint(say('ex.data2.line.hint3')),
      ],
      solution: say(`ex.data2.line.value.${theme.key}.solution`, {
        day,
        n: { n: answer, noun: theme.noun },
      }),
      diagnose: (v) => (v === answer / step ? 'other' : null),
    });
  }
  if (kind === 'rise') {
    const right = rises.indexOf(best);
    const others = shuffle(
      rng,
      rises.map((_, i) => i).filter((i) => i !== right),
    ).slice(0, 2);
    const options = [right, ...others].sort((x, y) => x - y);
    const name = (i: number) => `מ${DAYS[i] as string} ל${DAYS[i + 1] as string}`;
    return exercise({
      factId: `dlinerise:${key}:${options.join(',')}`,
      topicId: ID,
      level: 4,
      prompt: t('ex.data2.line.rise.prompt'),
      display: '',
      spoken: say('ex.data2.line.rise.prompt'),
      visual,
      answer: options.indexOf(right),
      input: labelledChoices(options.map(name), true),
      hints: [
        hint(say('ex.data2.line.rise.hint1')),
        hint(say('ex.data2.line.rise.hint2')),
        hint(say('ex.data2.line.rise.hint3')),
      ],
      solution: say('ex.data2.line.rise.solution', {
        a: DAYS[right] as string,
        b: DAYS[right + 1] as string,
      }),
    });
  }
  // How much did it rise from one day to a later one (a rise in all)?
  const pairs: [number, number][] = [];
  for (let i = 0; i < DAYS.length; i++)
    for (let j = i + 1; j < DAYS.length; j++)
      if ((vals[j] as number) > (vals[i] as number)) pairs.push([i, j]);
  const [i, j] = pick(rng, pairs);
  const A = DAYS[i] as string;
  const B = DAYS[j] as string;
  const x = vals[i] as number;
  const answer = (vals[j] as number) - x;
  return exercise({
    factId: `dlinechange:${key}:${i},${j}`,
    topicId: ID,
    level: 4,
    prompt: t('ex.data2.line.change.prompt', { params: { a: A, b: B } }),
    display: '',
    spoken: say('ex.data2.line.change.prompt', { a: A, b: B }),
    visual,
    answer,
    operation: 'sub',
    input: numpad(3),
    hints: [
      hint(say('ex.data2.line.change.hint1')),
      hint(say('ex.data2.line.change.hint2', { a: A, b: B, x })),
      exampleAvoiding(answer, [
        {
          answer: 10,
          hint: () =>
            exampleHint(
              '25 − 15 = 10',
              say('ex.data2.line.change.example', { x: 15, y: 25, d: 10 }),
            ),
        },
        {
          answer: 12,
          hint: () =>
            exampleHint(
              '30 − 18 = 12',
              say('ex.data2.line.change.example', { x: 18, y: 30, d: 12 }),
            ),
        },
      ]),
    ],
    solution: say('ex.data2.line.change.solution', { a: A, b: B, d: answer }),
    diagnose: (v) => (v === vals[j] ? 'other' : null),
  });
}

/* ---------- Level 7: the range ---------- */

const NAMES = ['דנה', 'יובל', 'מאיה', 'נועם', 'שירה'];

const RANGE_THEMES = [
  { key: 'game', col: 'points', lo: 12, hi: 60, step: 1 },
  { key: 'jump', col: 'cm', lo: 90, hi: 180, step: 5 },
] as const;

function range(rng: Rng): Exercise {
  const theme = pick(rng, RANGE_THEMES);
  const n = rng() < 0.5 ? 4 : 5;
  const names = NAMES.slice(0, n);
  const vals = values(rng, n, theme.lo, theme.hi, theme.step);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const answer = max - min;
  return exercise({
    factId: `drange:${theme.key}:${vals.join(',')}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.data2.range.prompt'),
    display: '',
    spoken: say('ex.data2.range.prompt'),
    visual: {
      type: 'table',
      head: [t('ex.data2.col.name'), t(`ex.data2.col.${theme.col}`)],
      rows: names.map((name, i) => [name, vals[i] as number]),
      title: t(`ex.data2.range.title.${theme.key}`),
    },
    answer,
    operation: 'sub',
    input: numpad(3),
    hints: [
      hint(say('ex.data2.range.hint1')),
      hint(say('ex.data2.range.hint2', { max, min })),
      exampleAvoiding(answer, [
        {
          answer: 27,
          hint: () =>
            exampleHint('45 − 18 = 27', say('ex.data2.range.example', { max: 45, min: 18, r: 27 })),
        },
        {
          answer: 22,
          hint: () =>
            exampleHint('52 − 30 = 22', say('ex.data2.range.example', { max: 52, min: 30, r: 22 })),
        },
      ]),
    ],
    solution: say('ex.data2.range.solution', { max, min, r: answer }),
    // The biggest (or smallest) result, not the difference; or the sum of the two.
    diagnose: (v) => (v === max || v === min ? 'other' : v === max + min ? 'wrongOperation' : null),
  });
}

/* ---------- Level 8: the score still needed for an average ---------- */

const STUDENTS: readonly { name: string; gender: Gender }[] = [
  { name: 'דנה', gender: 'f' },
  { name: 'יובל', gender: 'm' },
  { name: 'מאיה', gender: 'f' },
  { name: 'נועם', gender: 'm' },
];

const ORDINALS = ['ראשון', 'שני', 'שלישי', 'רביעי'];

function needed(rng: Rng): Exercise {
  for (;;) {
    const who = pick(rng, STUDENTS);
    const known = rng() < 0.5 ? 2 : 3;
    const scores = Array.from({ length: known }, () => randInt(rng, 12, 20) * 5);
    const avg = randInt(rng, 14, 18) * 5;
    const total = avg * (known + 1);
    const have = sum(scores);
    const answer = total - have;
    if (answer < 50 || answer > 100 || answer === avg) continue;
    const promptKey = known === 2 ? 'ex.data2.need.prompt3' : 'ex.data2.need.prompt4';
    const spoken = say(promptKey, { name: who.name, avg }, who.gender);
    return exercise({
      factId: `dneed:${who.name}:${scores.join(',')}:${avg}`,
      topicId: ID,
      level: 8,
      prompt: shown(spoken),
      display: '',
      spoken,
      visual: {
        type: 'table',
        head: [t('ex.data2.col.test'), t('ex.data2.col.score')],
        rows: [...scores, '?'].map((s, i) => [ORDINALS[i] as string, s]),
        title: t('ex.data2.need.title'),
      },
      answer,
      input: numpad(3),
      hints: [
        hint(say('ex.data2.need.hint1')),
        hint(say('ex.data2.need.hint2', { total, sum: have })),
        exampleAvoiding(answer, [
          {
            answer: 90,
            hint: () =>
              exampleHint(
                '80 × 2 − 70 = 90',
                say('ex.data2.need.example', { avg: 80, total: 160, a: 70, r: 90 }),
              ),
          },
          {
            answer: 60,
            hint: () =>
              exampleHint(
                '75 × 2 − 90 = 60',
                say('ex.data2.need.example', { avg: 75, total: 150, a: 90, r: 60 }),
              ),
          },
        ]),
      ],
      solution: say('ex.data2.need.solution', { total, sum: have, r: answer }),
      // Wrote the average itself, or the sum still to reach.
      diagnose: (v) => (v === avg || v === total ? 'other' : null),
    });
  }
}

/* ---------- Level 10: a pie chart ---------- */

/** How a part of the circle is said: a half, a quarter, three tenths. */
const QUARTERS: Record<number, string> = { 1: 'רבע', 2: 'חצי', 3: 'שלושה רבעים' };
const TENTHS: Record<number, string> = {
  1: 'עשירית',
  2: 'שתי עשיריות',
  3: 'שלוש עשיריות',
  4: 'ארבע עשיריות',
  5: 'חצי',
  6: 'שש עשיריות',
  7: 'שבע עשיריות',
};

/** The slices: of quarters (a half and two quarters...) or of tenths. */
const SPLITS: Record<4 | 10, readonly (readonly number[])[]> = {
  4: [
    [2, 1, 1],
    [1, 1, 1, 1],
    [3, 1],
  ],
  10: [
    [5, 3, 2],
    [5, 4, 1],
    [4, 3, 2, 1],
    [5, 2, 2, 1],
    [6, 3, 1],
    [4, 4, 2],
    [7, 2, 1],
    [3, 3, 2, 2],
  ],
};

const TOTALS: Record<4 | 10, readonly number[]> = {
  4: [20, 40, 60, 80, 100, 120],
  10: [20, 30, 40, 50, 60, 100, 200],
};

function pie(rng: Rng): Exercise {
  const of = rng() < 0.4 ? 4 : 10;
  const split = shuffle(rng, [...pick(rng, SPLITS[of])]);
  const theme = pick(rng, THEMES);
  const labels = shuffle(rng, [...theme.items]).slice(0, split.length);
  const n = pick(rng, TOTALS[of]);
  const i = pickIndex(rng, split.length);
  const item = labels[i] as string;
  const parts = split[i] as number;
  const answer = (n * parts) / of;
  const frac = (of === 4 ? QUARTERS : TENTHS)[parts] as string;
  const spoken = say('ex.data2.pie.prompt', { n, item });
  return exercise({
    factId: `dpie:${labels.join(',')}:${split.join(',')}:${of}:${n}:${i}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: {
      type: 'pie',
      slices: labels.map((label, k) => ({ label, parts: split[k] as number })),
      of,
      title: themeTitle(theme),
    },
    answer,
    input: numpad(3),
    hints: [
      hint(say('ex.data2.pie.hint1', { item })),
      hint(say('ex.data2.pie.hint2', { item, frac })),
      exampleAvoiding(answer, [
        {
          answer: 10,
          hint: () =>
            exampleHint('40 ÷ 4 = 10', say('ex.data2.pie.example', { frac: 'רבע', n: 40, r: 10 })),
        },
        {
          answer: 15,
          hint: () =>
            exampleHint('30 ÷ 2 = 15', say('ex.data2.pie.example', { frac: 'חצי', n: 30, r: 15 })),
        },
      ]),
    ],
    solution: say('ex.data2.pie.solution', { frac, n, r: answer }),
    // The number of parts, not of children.
    diagnose: (v) => (v === parts ? 'other' : null),
  });
}

/** The clips of the moved levels that name a category (see the bank of `data`). */
function bank(): string[] {
  const out = new Set<string>();
  const add = (...said: { parts: readonly string[] }[]) => {
    for (const x of said) for (const p of x.parts) out.add(p);
  };
  for (const theme of THEMES)
    for (const item of theme.items) add(say('ex.data.pct.prompt', { item }));
  return [...out];
}

export const dataStats = defineTopic({
  id: ID,
  labelKey: 'topic.dataStats',
  grades: [4, 5, 6],
  startLevel: (grade) => ({ 4: 1, 5: 3, 6: 5 })[grade] ?? 1,
  lastLevel: (grade) => ({ 4: 6, 5: 8 })[grade] ?? 10,
  levels: [
    open(L(1), read({ id: ID, level: 1, steps: [10, 20, 50], bars: 4, top: 10, halves: true })),
    open(L(2), doubleBars),
    open(L(3), twoSteps(ID, 3, 5)),
    open(L(4), lineGraph),
    open('level.data.8', average(ID, 5, [3])),
    open('level.data.9', average(ID, 6, [4, 5])),
    open(L(7), range),
    open(L(8), needed),
    open('level.data.10', percentOf(ID, 9)),
    open(L(10), pie),
  ],
  extraBank: bank,
});
