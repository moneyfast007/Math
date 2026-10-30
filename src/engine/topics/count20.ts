import { t } from '@/i18n';
import { shown } from '@/lang/compose';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  pictureExample,
  range,
  say,
  spreadChoices,
  type AdviceSpec,
} from '../build';
import { NOUNS, type CountableNoun } from '../nouns';
import type { Exercise, Rng, Visual } from '../types';

/**
 * World 6, gan hova: "מספרים עד 20". After counting to ten: dice faces known at
 * a glance, two dice together, ten and some more, the numbers to twenty in
 * order (after, before, missing, bigger), the same number twice, and hops
 * forwards and backwards on the number line. Every level is a closed list, so
 * every sentence is recorded whole; answers are three big number buttons.
 */

const ID = 'count-20';
const L = (n: number) => `level.count20.${n}`;

const DOT: Noun = { singular: 'נקודה', plural: 'נקודות', gender: 'f' };
const HOP: Noun = { singular: 'קפיצה', plural: 'קפיצות', gender: 'f' };

/** The object of a fact comes from the fact, so the bank knows every sentence (see count10). */
function nounFor(seed: number): CountableNoun {
  return NOUNS[Math.abs(seed) % NOUNS.length] as CountableNoun;
}

/** Three buttons near the answer, within the level's numbers. */
function near(rng: Rng, answer: number, min: number, max: number): number[] {
  return spreadChoices(rng, answer, { deltas: [1, 2], min, max });
}

const offByOne = (answer: number) => (v: number) =>
  Math.abs(v - answer) === 1 ? 'offByOne' : null;

/** The same for dots on dice. */
const dotAdvice = (n: number): AdviceSpec[] => [
  { value: n + 1, say: say('adv.c20.die.twice') },
  ...(n > 1 ? [{ value: n - 1, say: say('adv.c20.die.skipped') }] : []),
];

const countAdvice = (n: number): AdviceSpec[] => [
  { value: n + 1, say: say('adv.count.twice') },
  ...(n > 1 ? [{ value: n - 1, say: say('adv.count.skipped') }] : []),
];

/** The first candidate that is none of `avoid` (a worked example never shares the exercise's numbers). */
function other<T>(candidates: readonly T[], avoid: (c: T) => boolean): T {
  return candidates.find((c) => !avoid(c)) ?? (candidates[0] as T);
}

/* ---------- 1: one die ---------- */

type Die = { n: number; tone: 0 | 1 };

function die(level: number, { n, tone }: Die, rng: Rng): Exercise {
  const prompt = t('ex.c20.die.prompt');
  const exN = other([5, 3, 4, 2, 6], (x) => x === n);
  const exSolved = say('ex.c20.die.solution', { a: { n: exN, noun: DOT } });
  return exercise({
    factId: `die:${n}${tone ? ':b' : ''}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: { text: prompt, parts: [prompt] },
    visual: { type: 'dice', dice: [n], tone },
    answer: n,
    input: { type: 'choices', choices: near(rng, n, 1, 6) },
    hints: [
      hint(say('ex.c20.die.hint1')),
      hint(say('ex.c20.die.hint2')),
      pictureExample(exSolved, { type: 'dice', dice: [exN], tone: tone === 0 ? 1 : 0 }),
    ],
    solution: say('ex.c20.die.solution', { a: { n, noun: DOT } }),
    diagnose: offByOne(n),
    advice: dotAdvice(n),
  });
}

/* ---------- 2: two dice ---------- */

type Pair = { a: number; b: number };

function dice2(level: number, { a, b }: Pair, rng: Rng): Exercise {
  const c = a + b;
  const prompt = t('ex.c20.dice2.prompt');
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  const ex = other(
    [
      { a: 3, b: 2 },
      { a: 4, b: 1 },
      { a: 2, b: 4 },
      { a: 5, b: 3 },
    ],
    (x) => x.a + x.b === c || x.a === a || x.b === b,
  );
  const exSolved = say('ex.c20.dice2.solution', { a: ex.a, b: ex.b, c: ex.a + ex.b });
  return exercise({
    factId: `dice2:${a},${b}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: { text: prompt, parts: [prompt] },
    visual: { type: 'dice', dice: [a, b] },
    answer: c,
    operation: 'add',
    input: { type: 'choices', choices: near(rng, c, 2, 12) },
    hints: [
      hint(say('ex.c20.dice2.hint1')),
      hint(say('ex.c20.dice2.hint2'), {
        visual: { type: 'numberLine', from: 0, to: 12, start: big, hops: small, hide: c },
      }),
      pictureExample(exSolved, { type: 'dice', dice: [ex.a, ex.b], tone: 1 }),
    ],
    solution: say('ex.c20.dice2.solution', { a, b, c }),
    diagnose: offByOne(c),
    advice: [
      { value: a, say: say('adv.c20.dice2.one') },
      { value: b, say: say('adv.c20.dice2.one') },
      ...dotAdvice(c),
    ],
  });
}

/* ---------- 3, 4: ten and more ---------- */

type Variant = { n: number; v: number };
const variants = (ns: number[], count: number): Variant[] =>
  ns.flatMap((n) => range(0, count - 1).map((v) => ({ n, v })));

function tenMore(level: number, { n, v }: Variant, rng: Rng): Exercise {
  const k = n - 10;
  const noun = nounFor(n + v * 3);
  const g = noun.gender;
  const prompt = t('ex.count.prompt', { params: { plural: noun.plural } });
  const exK = other([3, 6, 2, 7, 4], (x) => x === k);
  const exNoun = nounFor(n + v * 3 + 1);
  const exSolved = say('ex.c20.tenMore.solution', {
    all: { n: 10 + exK, noun: exNoun },
    ten: { n: 10, gender: exNoun.gender },
    k: { n: exK, gender: exNoun.gender },
  });
  return exercise({
    factId: `tenMore:${n}${v ? `:${v}` : ''}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: { text: prompt, parts: [prompt] },
    // Ten in two rows of five, and the rest beside them: ten is seen, not counted again.
    visual: { type: 'objects', kind: noun, groups: [10, k], arranged: true },
    answer: n,
    input: { type: 'choices', choices: near(rng, n, 10, 20) },
    hints: [
      hint(say('ex.c20.tenMore.hint1', { ten: { n: 10, noun } })),
      hint(say('ex.c20.tenMore.hint2'), {
        visual: { type: 'numberLine', from: 10, to: 20, start: 10, hops: k, hide: n },
      }),
      pictureExample(
        exSolved,
        { type: 'objects', kind: exNoun, groups: [10, exK], arranged: true },
        `10 + ${exK} = ${10 + exK}`,
      ),
    ],
    solution: say('ex.c20.tenMore.solution', {
      all: { n, noun },
      ten: { n: 10, gender: g },
      k: { n: k, gender: g },
    }),
    diagnose: offByOne(n),
    advice: countAdvice(n),
  });
}

/* ---------- 5: after and before ---------- */

type Step = { n: number; after: boolean };

function neighbour(level: number, { n, after }: Step, rng: Rng): Exercise {
  const answer = after ? n + 1 : n - 1;
  const exN = other(
    [15, 17, 12, 18, 13],
    (x) => [n, answer].includes(x) || [n, answer].includes(after ? x + 1 : x - 1),
  );
  const exSolved = say(after ? 'ex.after.solution' : 'ex.before.solution', {
    n: exN,
    c: after ? exN + 1 : exN - 1,
  });
  const prompt = t(after ? 'ex.after.prompt' : 'ex.before.prompt', { params: { n } });
  return exercise({
    factId: `${after ? 'after' : 'before'}:${n}`,
    topicId: ID,
    level,
    prompt,
    display: String(n),
    spoken: say(after ? 'ex.after.spoken' : 'ex.before.spoken', { n }),
    answer,
    input: { type: 'choices', choices: near(rng, answer, 9, 20) },
    hints: [
      hint(say(after ? 'ex.after.hint1' : 'ex.before.hint1')),
      hint(say('hint.numberLine'), {
        visual: {
          type: 'numberLine',
          from: 10,
          to: 20,
          start: n,
          hops: after ? 1 : -1,
          hide: answer,
        },
      }),
      pictureExample(exSolved, {
        type: 'numberLine',
        from: 10,
        to: 20,
        start: exN,
        hops: after ? 1 : -1,
      }),
    ],
    solution: say(after ? 'ex.after.solution' : 'ex.before.solution', { n, c: answer }),
    diagnose: offByOne(answer),
    advice: [
      {
        value: after ? n - 1 : n + 1,
        say: say(after ? 'adv.after.before' : 'adv.before.after', {
          v: after ? n - 1 : n + 1,
          n,
        }),
      },
      { value: n, say: say(`adv.${after ? 'after' : 'before'}.self` as const, { n }) },
      {
        value: after ? n + 2 : n - 2,
        say: say(`adv.${after ? 'after' : 'before'}.skip` as const, { n }),
      },
    ].filter((a) => a.value >= 9 && a.value <= 20),
  });
}

/* ---------- 6: the missing number ---------- */

type Row = { s: number; gap: 1 | 2 };

function missing(level: number, { s, gap }: Row, rng: Rng): Exercise {
  const row = [s, s + 1, s + 2, s + 3];
  const answer = row[gap] as number;
  const prompt = t('ex.c20.missing.prompt');
  const items = row.map((x, i) => (i === gap ? null : x));
  const ex = other(
    [
      { s: 6, gap: 2 },
      { s: 12, gap: 1 },
      { s: 3, gap: 1 },
      { s: 15, gap: 2 },
    ] as const,
    (x) => x.s + x.gap === answer || x.s === s,
  );
  const exRow = [ex.s, ex.s + 1, ex.s + 2, ex.s + 3];
  const sayRow = (r: number[]) =>
    say('ex.c20.missing.solution', { a: r[0] ?? 0, b: r[1] ?? 0, c: r[2] ?? 0, d: r[3] ?? 0 });
  const shownNext = row.filter((x, i) => i !== gap && Math.abs(x - answer) === 1);
  return exercise({
    factId: `missing:${s},${gap}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: { text: prompt, parts: [prompt] },
    visual: { type: 'sequence', items },
    answer,
    input: { type: 'choices', choices: near(rng, answer, 1, 20) },
    hints: [
      hint(say('ex.c20.missing.hint1')),
      hint(say('ex.c20.missing.hint2'), {
        visual: {
          type: 'numberLine',
          from: Math.max(0, s - 2),
          to: Math.min(20, Math.max(s - 2, 0) + 10),
          start: s,
          hops: gap,
          hide: answer,
        },
      }),
      pictureExample(sayRow(exRow), { type: 'sequence', items: exRow }),
    ],
    solution: sayRow(row),
    diagnose: offByOne(answer),
    advice: [
      ...shownNext.map((v) => ({ value: v, say: say('adv.c20.missing.shown', { v }) })),
      { value: answer - 2, say: say('adv.c20.missing.near') },
      { value: answer + 2, say: say('adv.c20.missing.near') },
    ].filter((a) => a.value >= 1 && a.value <= 20),
  });
}

/* ---------- 7: which number is bigger ---------- */

function bigger(level: number, p: Pair): Exercise {
  const noun = nounFor(p.a + p.b);
  const prompt = t('ex.bigger.prompt');
  const answer = p.a > p.b ? 0 : 1;
  const [w, l] = other(
    [
      [6, 2],
      [7, 3],
      [8, 4],
      [9, 5],
    ] as const,
    (x) => x.some((y) => y === p.a || y === p.b),
  );
  const exSolved = say('ex.bigger.solution', { w, l });
  return exercise({
    factId: `bigger:${p.a},${p.b}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: say('ex.bigger.spoken', { a: p.a, b: p.b }),
    answer,
    input: labelledChoices([String(p.a), String(p.b)]),
    hints: [
      hint(say('ex.bigger.hint1')),
      hint(say('ex.bigger.hint2'), {
        visual: { type: 'objects', kind: noun, groups: [p.a, p.b], arranged: true },
      }),
      pictureExample(
        exSolved,
        { type: 'objects', kind: noun, groups: [w, l], arranged: true },
        `${w}     ${l}`,
      ),
    ],
    solution: say('ex.bigger.solution', { w: Math.max(p.a, p.b), l: Math.min(p.a, p.b) }),
    advice: [{ value: 1 - answer, say: say('adv.bigger.check', { a: p.a, b: p.b }) }],
  });
}

/* ---------- 8: the same number twice ---------- */

function double(level: number, { n, v }: Variant, rng: Rng): Exercise {
  const noun = nounFor(n * 2 + v * 3);
  const c = 2 * n;
  const spoken = say('ex.c20.double.prompt', { a: { n, noun }, plural: noun.plural });
  const exN = other([3, 4, 2, 5], (x) => x === n || 2 * x === c || x === c);
  const both: Visual = { type: 'objects', kind: noun, kinds: [noun, noun], groups: [n, n] };
  return exercise({
    factId: `double:${n}${v ? `:${v}` : ''}`,
    topicId: ID,
    level,
    // "בכל קבוצה יש 1 תפוח" reads oddly: one is said in words.
    prompt: n === 1 ? spoken.text : shown(spoken),
    display: '',
    spoken,
    visual: both,
    answer: c,
    operation: 'add',
    input: { type: 'choices', choices: near(rng, c, 1, 12) },
    hints: [
      hint(say('ex.c20.double.hint1')),
      hint(say('ex.c20.double.hint2', { n, k: { n, noun: HOP } }), {
        visual: { type: 'numberLine', from: 0, to: 10, start: n, hops: n, hide: c },
      }),
      exampleHint(
        `${exN} + ${exN} = ${2 * exN}`,
        say('ex.c20.double.solution', { n: exN, c: 2 * exN }),
      ),
    ],
    solution: say('ex.c20.double.solution', { n, c }),
    diagnose: offByOne(c),
    advice: [{ value: n, say: say('adv.c20.double.one') }, ...countAdvice(c)],
  });
}

/* ---------- 9, 10: hops on the number line ---------- */

type Hop = { s: number; k: number };

function hop(level: number, { s, k }: Hop, rng: Rng, fwd: boolean): Exercise {
  const c = fwd ? s + k : s - k;
  const spoken = say(fwd ? 'ex.c20.hopFwd.prompt' : 'ex.c20.hopBack.prompt', {
    s,
    k: { n: k, noun: HOP },
  });
  const ex = other(
    fwd
      ? [
          { s: 6, k: 2 },
          { s: 12, k: 3 },
          { s: 9, k: 1 },
        ]
      : [
          { s: 8, k: 2 },
          { s: 15, k: 3 },
          { s: 11, k: 1 },
        ],
    (x) => x.s === s || (fwd ? x.s + x.k : x.s - x.k) === c,
  );
  const exC = fwd ? ex.s + ex.k : ex.s - ex.k;
  const solution = (a: number, b: number, r: number) =>
    say(fwd ? 'ex.c20.hopFwd.solution' : 'ex.c20.hopBack.solution', { s: a, k: b, c: r });
  return exercise({
    factId: `${fwd ? 'fwd' : 'back'}:${s},${k}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: { type: 'numberLine', ...window10(s, c), start: s, hops: 0 },
    answer: c,
    operation: fwd ? 'add' : 'sub',
    input: { type: 'choices', choices: near(rng, c, 0, 20) },
    hints: [
      hint(say('ex.c20.hop.hint1')),
      hint(say('hint.numberLine'), {
        visual: { type: 'numberLine', ...window10(s, c), start: s, hops: fwd ? k : -k, hide: c },
      }),
      exampleHint(`${ex.s} ${fwd ? '+' : '−'} ${ex.k} = ${exC}`, solution(ex.s, ex.k, exC)),
    ],
    solution: solution(s, k, c),
    diagnose: offByOne(c),
    advice: [
      { value: s, say: say('adv.c20.hop.stay') },
      { value: fwd ? s - k : s + k, say: say(fwd ? 'adv.c20.hopFwd.back' : 'adv.c20.hopBack.fwd') },
      { value: c - 1, say: say('adv.c20.hop.count'), kind: 'offByOne' as const },
      { value: c + 1, say: say('adv.c20.hop.count'), kind: 'offByOne' as const },
    ].filter((a) => a.value >= 0 && a.value <= 20),
  });
}

/** A stretch of ten on the number line holding both numbers (big enough to read on a phone). */
function window10(a: number, b: number): { from: number; to: number } {
  const from = Math.min(Math.max(0, Math.min(a, b) - 2), 10);
  return { from, to: from + 10 };
}

/* ---------- The facts ---------- */

/** Two dice up to ten together: both orders, so each die is the bigger one sometimes. */
const dicePairs = (): Pair[] => [
  ...range(1, 5).flatMap((a) => range(1, 5).map((b) => ({ a, b }))),
  ...range(1, 4).flatMap((b) => [
    { a: 6, b },
    { a: b, b: 6 },
  ]),
];

/** Rows of four in 1–20, the gap second or third (never at the end: then it is "after"). */
const rows = (): Row[] => range(1, 17).map((s) => ({ s, gap: s % 2 === 0 ? 1 : 2 }));

/** Two numbers across or above ten, one to five apart, the bigger one on either side. */
const biggerPairs = (): Pair[] =>
  range(11, 20).flatMap((x) =>
    [1, 3, 5].map((d) => (x % 2 === 0 ? { a: x, b: x - d } : { a: x - d, b: x })),
  );

/** A start and one, two or three hops, staying within 0–20. */
const hops = (fwd: boolean): Hop[] =>
  range(fwd ? 4 : 5, fwd ? 17 : 20)
    .flatMap((s) => [1 + (s % 3), 1 + ((s + 1) % 3)].map((k) => ({ s, k })))
    .filter(({ s, k }) => (fwd ? s + k <= 20 : s - k >= 1));

export const count20 = defineTopic({
  id: ID,
  labelKey: 'topic.count20',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      (): Die[] => range(1, 6).flatMap((n) => [0, 1].map((tone) => ({ n, tone: tone as 0 | 1 }))),
      (f, rng) => die(1, f, rng),
    ),
    closed(L(2), dicePairs, (p, rng) => dice2(2, p, rng)),
    closed(
      L(3),
      () => variants(range(11, 15), 2),
      (f, rng) => tenMore(3, f, rng),
    ),
    closed(
      L(4),
      () => variants(range(16, 20), 2),
      (f, rng) => tenMore(4, f, rng),
    ),
    closed(
      L(5),
      (): Step[] => [
        ...range(10, 19).map((n) => ({ n, after: true })),
        ...range(11, 20).map((n) => ({ n, after: false })),
      ],
      (f, rng) => neighbour(5, f, rng),
    ),
    closed(L(6), rows, (f, rng) => missing(6, f, rng)),
    closed(L(7), biggerPairs, (p) => bigger(7, p)),
    closed(
      L(8),
      () => variants(range(1, 5), 3),
      (f, rng) => double(8, f, rng),
    ),
    closed(
      L(9),
      () => hops(true),
      (f, rng) => hop(9, f, rng, true),
    ),
    closed(
      L(10),
      () => hops(false),
      (f, rng) => hop(10, f, rng, false),
    ),
  ],
});
