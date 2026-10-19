import { shown } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import { fractionNoun, fractionWords as w } from '@/lang/fractions';
import type { Noun } from '@/lang/hebrewNumbers';
import type { MistakeKind } from '@/state/schema';
import {
  arith,
  CHARACTERS,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  round,
  say,
  type Character,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';

/**
 * Grade 6: "פעולות בשברים עשרוניים". Multiplying and dividing
 * decimals by 10, 100 and 1,000, a decimal times a whole, a decimal times a
 * decimal, a decimal divided by a whole, a whole divided by a half or a
 * quarter, money and measurement stories. Sentences are assembled from clips.
 */

const ID = 'decimal-ops';
const L = (n: number) => `level.decimalOps.${n}`;

/** Off by a factor of ten (the point in the wrong place). */
function pointSlip(answer: number): (v: number) => MistakeKind | null {
  return (v) => {
    for (const k of [10, 100, 1000]) {
      if (Math.abs(round(v * k, 6) - answer) < 1e-9 || Math.abs(round(v / k, 6) - answer) < 1e-9)
        return 'placeValue';
    }
    return null;
  };
}

function hints(a: string, b: string): [Hint, Hint] {
  return [hint(say(a as 'ex.dop.power.hint1')), hint(say(b as 'ex.dop.power.hint2'))];
}

/** A decimal that is not a shorter one in disguise (2.0 for tenths, 3.50 for hundredths): n / k, n not a multiple of ten. */
function trueDecimal(rng: Rng, lo: number, hi: number, k: 10 | 100): number {
  let n: number;
  do n = randInt(rng, lo, hi);
  while (n % 10 === 0);
  return round(n / k, 2);
}

function byPower(level: 1 | 2, rng: Rng): Exercise {
  const k = pick(rng, [10, 100, 1000]);
  const times = level === 1;
  // Multiplying: two decimals. Dividing: one decimal, and a whole number by a thousand,
  // so no answer goes past thousandths (grade 5 reads up to thousandths).
  const x = times
    ? round(randInt(rng, 11, 9999) / 100, 2)
    : k === 1000
      ? randInt(rng, 11, 9999)
      : round(randInt(rng, 11, 9999) / 10, 1);
  const answer = round(times ? x * k : x / k, 5);
  return arith({
    topicId: ID,
    level,
    a: x,
    op: times ? '×' : '÷',
    b: k,
    hints: times
      ? hints('ex.dop.power.hint1', 'ex.dop.power.hint2')
      : hints('ex.dop.powerDiv.hint1', 'ex.dop.powerDiv.hint2'),
    example: times ? { a: 3.45, b: k } : { a: k === 1000 ? 345 : 34.5, b: k },
    input: numpad(6, true),
    diagnose: pointSlip(answer),
  });
}

/** Hints for a decimal times a whole: how many digits after the point, and an estimate with these numbers. */
function timesWholeHints(x: number, k: number, places: 1 | 2): [Hint, Hint] {
  return [
    hint(say(places === 1 ? 'dop.timesWhole.hint1.one' : 'dop.timesWhole.hint1.two')),
    hint(say('dop.timesWhole.hint2', { x, r: Math.max(1, Math.round(x)), k })),
  ];
}

function timesWhole(rng: Rng): Exercise {
  // Never a whole number (2.0 × 5 has no point to place).
  const x = trueDecimal(rng, 11, 99, 10);
  const k = randInt(rng, 2, 9);
  return arith({
    topicId: ID,
    level: 3,
    a: x,
    op: '×',
    b: k,
    hints: timesWholeHints(x, k, 1),
    example: { a: 2.5, b: 4 },
    input: numpad(4, true),
    diagnose: pointSlip(round(x * k, 2)),
  });
}

function timesWhole2(rng: Rng): Exercise {
  // Real hundredths: not 2.00 or 2.50.
  const x = trueDecimal(rng, 101, 999, 100);
  const k = randInt(rng, 2, 9);
  return arith({
    topicId: ID,
    level: 4,
    a: x,
    op: '×',
    b: k,
    hints: timesWholeHints(x, k, 2),
    example: { a: 1.25, b: 4 },
    input: numpad(5, true),
    diagnose: pointSlip(round(x * k, 2)),
  });
}

function timesDecimal(rng: Rng): Exercise {
  const a = round(randInt(rng, 2, 9) / 10, 1);
  const b = trueDecimal(rng, 11, 99, 10);
  return arith({
    topicId: ID,
    level: 5,
    a: b,
    op: '×',
    b: a,
    hints: hints('ex.dop.timesDec.hint1', 'ex.dop.timesDec.hint2'),
    example: { a: 1.5, b: 0.4 },
    input: numpad(4, true),
    diagnose: pointSlip(round(a * b, 2)),
  });
}

function divWhole(rng: Rng): Exercise {
  const k = randInt(rng, 2, 9);
  const q = trueDecimal(rng, 11, 99, 10);
  const a = round(q * k, 1);
  // A whole number divided (8 ÷ 4) has no point to keep above: draw again.
  if (Number.isInteger(a)) return divWhole(rng);
  return arith({
    topicId: ID,
    level: 6,
    a,
    op: '÷',
    b: k,
    hints: hints('ex.dop.divWhole.hint1', 'ex.dop.divWhole.hint2'),
    example: { a: 7.5, b: 3 },
    input: numpad(4, true),
    diagnose: pointSlip(q),
  });
}

function divHalf(rng: Rng): Exercise {
  const b = pick(rng, [0.5, 0.25, 0.1]);
  const a = randInt(rng, 2, 20);
  const per = Math.round(1 / b);
  return arith({
    topicId: ID,
    level: 7,
    a,
    op: '÷',
    b,
    // The question for this divisor: how many halves (quarters, tenths) are in a?
    hints: [
      hint(
        say('dop.divHalf.hint1', {
          b,
          plural: fractionNoun(per).plural,
          a,
          per: { n: per, noun: fractionNoun(per) },
        }),
      ),
      hint(say('ex.dop.divHalf.hint2')),
    ],
    example: { a: 3, b: 0.5 },
    input: numpad(3),
    diagnose: (v) => (v === round(a * b, 2) ? 'wrongOperation' : null),
  });
}

/** 0.25 = 1/4 (the denominator is asked), 0.75 = ?/4 (the numerator). */
const FAMILIAR: readonly { x: number; n: number; d: number }[] = [
  { x: 0.5, n: 1, d: 2 },
  { x: 0.25, n: 1, d: 4 },
  { x: 0.2, n: 1, d: 5 },
  { x: 0.1, n: 1, d: 10 },
  { x: 0.125, n: 1, d: 8 },
  { x: 0.05, n: 1, d: 20 },
  { x: 0.04, n: 1, d: 25 },
  { x: 0.02, n: 1, d: 50 },
  { x: 0.01, n: 1, d: 100 },
  { x: 0.75, n: 3, d: 4 },
  { x: 0.4, n: 2, d: 5 },
  { x: 0.6, n: 3, d: 5 },
  { x: 0.8, n: 4, d: 5 },
  { x: 0.3, n: 3, d: 10 },
  { x: 0.7, n: 7, d: 10 },
  { x: 0.9, n: 9, d: 10 },
  { x: 0.375, n: 3, d: 8 },
  { x: 0.625, n: 5, d: 8 },
];

/** The familiar decimals as fractions: a unit fraction's denominator, or a numerator. */
function familiar(rng: Rng): Exercise {
  const { x, n, d } = pick(rng, FAMILIAR);
  const unit = n === 1;
  // "אפס נקודה חמש זה חצי: אחד חלקי שתיים", or "שלושה רבעים".
  const solved = (e: { x: number; n: number; d: number }) =>
    e.n === 1
      ? e.d <= 10 || e.d === 100
        ? say('dop.familiar.solution', { x: e.x, frac: w(1, e.d), d: e.d })
        : say('ex.dop.familiar.solution', { x: e.x, d: e.d })
      : say('dop.familiar.numSolution', { x: e.x, frac: w(e.n, e.d) });
  const examples = unit
    ? [
        { x: 0.25, n: 1, d: 4 },
        { x: 0.5, n: 1, d: 2 },
      ]
    : [
        { x: 0.75, n: 3, d: 4 },
        { x: 0.4, n: 2, d: 5 },
      ];
  return exercise({
    factId: `dfam:${x}`,
    topicId: ID,
    level: 8,
    prompt: t(unit ? 'ex.fmul.denominator.prompt' : 'ex.frac.expand.prompt'),
    display: unit ? `${x} = 1/?` : `${x} = ?/${d}`,
    spoken: unit
      ? say('ex.dop.familiar.spoken', { x })
      : say('dop.familiar.num', { x, plural: fractionNoun(d).plural }),
    answer: unit ? d : n,
    input: numpad(3),
    hints: [
      hint(say('ex.dop.familiar.hint1')),
      unit
        ? hint(say('ex.dop.familiar.hint2'))
        : hint(say('dop.familiar.numHint2', { unit: w(1, d), ux: round(1 / d, 3), x })),
      exampleAvoiding(
        unit ? d : n,
        examples
          .filter((e) => e.x !== x)
          .map((e) => ({
            answer: unit ? e.d : e.n,
            hint: () => exampleHint(`${e.x} = ${e.n}/${e.d}`, solved(e)),
          })),
      ),
    ],
    solution: solved({ x, n, d }),
  });
}

/** Rounding to the nearest tenth. */
function roundTenth(rng: Rng): Exercise {
  const x = round(randInt(rng, 101, 9999) / 100, 2);
  if (Math.round(x * 100) % 10 === 5 || Math.round(x * 100) % 10 === 0) return roundTenth(rng);
  const answer = round(Math.round(x * 10) / 10, 1);
  // Not one that rounds to a whole number (13.97 → 14): "14.0" is an odd answer to type.
  if (Number.isInteger(answer)) return roundTenth(rng);
  return exercise({
    factId: `dr10:${x}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.dop.round.prompt'),
    display: String(x),
    spoken: say('ex.dop.round.spoken', { x }),
    answer,
    input: numpad(4, true),
    hints: [
      hint(say('ex.dop.round.hint1')),
      // Rounding to tenths looks at the hundredths (the grade 4 hint was about whole numbers).
      hint(say('ex.dop.round.hint2', { x, d: Math.round(x * 100) % 10 })),
      exampleAvoiding(
        answer,
        [
          { x: 3.47, r: 3.5 },
          { x: 2.81, r: 2.8 },
        ].map((ex) => ({
          answer: ex.r,
          hint: () => exampleHint(`${ex.x} → ${ex.r}`, say('ex.dop.round.solution', ex)),
        })),
      ),
    ],
    solution: say('ex.dop.round.solution', { x, r: answer }),
    diagnose: (v) => (v === Math.round(x) ? 'placeValue' : null),
  });
}

const NOTEBOOK: Noun = { singular: 'מחברת', plural: 'מחברות', gender: 'f' };
const BOTTLE: Noun = { singular: 'בקבוק', plural: 'בקבוקים', gender: 'm' };
const METRE: Noun = { singular: 'מטר', plural: 'מטרים', gender: 'm' };

/** Shopping stories: notebooks, bottles of juice, metres of ribbon, each at a decimal price. */
const STORIES: readonly { key: TranslationKey; noun: Noun }[] = [
  { key: 'wp.dop.shop.story', noun: NOTEBOOK },
  { key: 'dop.wp.juice', noun: BOTTLE },
  { key: 'dop.wp.ribbon', noun: METRE },
];

/** Shopping: k items at a decimal price. The character and the story follow from the numbers. */
function story(rng: Rng): Exercise {
  // 0.55 .. 4.95 in steps of 0.05, never a whole number of shekels (that is no decimal exercise).
  let price = 0;
  do price = round(randInt(rng, 11, 99) / 2 / 10, 2);
  while (Number.isInteger(price));
  const k = randInt(rng, 3, 9);
  const who = CHARACTERS[k % CHARACTERS.length] as Character;
  const s = STORIES[(k + Math.round(price * 20)) % STORIES.length] as (typeof STORIES)[number];
  const answer = round(price * k, 2);
  const spoken = say(s.key, { name: who.name, k: { n: k, noun: s.noun }, price }, who.gender);
  return exercise({
    factId: `dopwp:${k}x${price}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: 'mul',
    input: numpad(4, true),
    hints: [
      hint(say('dop.wp.hint1')),
      {
        ...hint(say('hint.equation')),
        example: { display: `${k} × ${price} = ?`, spoken: say('hint.equation').text },
      },
      exampleAvoiding(
        answer,
        [
          { a: 4, b: 2.5 },
          { a: 3, b: 1.5 },
        ].map((ex) => {
          const c = round(ex.a * ex.b, 2);
          return {
            answer: c,
            hint: () =>
              exampleHint(`${ex.a} × ${ex.b} = ${c}`, say('eq.times.solution', { ...ex, c })),
          };
        }),
      ),
    ],
    solution: say('eq.times.solution', { a: k, b: price, c: answer }),
    diagnose: pointSlip(answer),
  });
}

function storyBank(): string[] {
  const out: string[] = [];
  for (const who of CHARACTERS)
    for (const s of STORIES)
      out.push(
        ...say(s.key, { name: who.name, k: { n: 3, noun: s.noun }, price: 2.5 }, who.gender).parts,
      );
  return out;
}

export const decimalOps = defineTopic({
  id: ID,
  labelKey: 'topic.decimalOps',
  grades: [6],
  startLevel: () => 1,
  extraBank: storyBank,
  levels: [
    open(L(1), (rng) => byPower(1, rng)),
    open(L(2), (rng) => byPower(2, rng)),
    open(L(3), timesWhole),
    open(L(4), timesWhole2),
    open(L(5), timesDecimal),
    open(L(6), divWhole),
    open(L(7), divHalf),
    open(L(8), familiar),
    open(L(9), roundTenth),
    open(L(10), story),
  ],
});
