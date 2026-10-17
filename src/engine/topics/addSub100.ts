import type { Gender } from '@/lang/gender';
import { arith, defineTopic, hint, numpad, open, say, shifted, splitTensUnits, wordProblem } from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';

/**
 * World 4, grade 2: "חיבור וחיסור עד 100". From a two-digit number plus a
 * unit, through carrying and borrowing, to missing numbers and word problems.
 * Levels 1–9 are open (too many pairs to record whole); their sentences are
 * assembled from clips.
 */

const ID = 'add-sub-100';
const L = (n: number) => `level.addSub100.${n}`;

type Gen = (rng: Rng) => { a: number; b: number };

function strategyHints(a: number, op: '+' | '-', b: number, carry: boolean): [Hint, Hint] {
  const key = op === '+' ? (carry ? 'hint.add100.carry' : 'hint.add100.plain') : carry ? 'hint.sub100.borrow' : 'hint.sub100.plain';
  return [
    hint(say(key)),
    hint(say('ex.decompose.hint2'), {
      example: { display: `${splitTensUnits(a)}   ${splitTensUnits(b)}`, spoken: say('ex.decompose.hint2') },
    }),
  ];
}

function plain(level: number, op: '+' | '-', gen: Gen, carry: boolean): (rng: Rng, gender: Gender) => Exercise {
  return (rng) => {
    const { a, b } = gen(rng);
    const ex = shifted(a, b, 1, 99, 11);
    // Keep the example valid: a subtraction never goes negative.
    const example = op === '-' && ex.a < ex.b ? { a: ex.b, b: ex.a } : ex;
    return arith({ topicId: ID, level, a, op, b, hints: strategyHints(a, op, b, carry), example, input: numpad(3) });
  };
}

/** A two-digit number whose units digit satisfies `ok`. */
function twoDigit(rng: Rng, ok: (units: number) => boolean, lo = 11, hi = 99): number {
  for (;;) {
    const a = randInt(rng, lo, hi);
    if (ok(a % 10)) return a;
  }
}

const unitsNoCarry: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u <= 8, 11, 98);
  return { a, b: randInt(rng, 1, 9 - (a % 10)) };
};
const unitsCarry: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u >= 1, 11, 89);
  return { a, b: randInt(rng, 10 - (a % 10), 9) };
};
const unitsNoBorrow: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u >= 1);
  return { a, b: randInt(rng, 1, a % 10) };
};
const unitsBorrow: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u <= 8, 20, 99);
  return { a, b: randInt(rng, (a % 10) + 1, 9) };
};
const tensPlus: Gen = (rng) => {
  const a = randInt(rng, 11, 79);
  return { a, b: randInt(rng, 1, Math.floor((99 - a) / 10)) * 10 };
};
const tensMinus: Gen = (rng) => {
  const a = randInt(rng, 31, 99);
  return { a, b: randInt(rng, 1, Math.floor(a / 10) - 1) * 10 };
};
const twoDigitNoCarry: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u <= 8, 11, 88);
  const bu = randInt(rng, 0, 9 - (a % 10));
  const bt = randInt(rng, 1, 9 - Math.floor(a / 10));
  return { a, b: bt * 10 + bu };
};
const twoDigitCarry: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u >= 1, 11, 79);
  const bu = randInt(rng, 10 - (a % 10), 9);
  const bt = randInt(rng, 1, 8 - Math.floor(a / 10));
  return { a, b: bt * 10 + bu };
};
const twoDigitNoBorrow: Gen = (rng) => {
  const a = twoDigit(rng, () => true, 22, 99);
  const bu = randInt(rng, 0, a % 10);
  const bt = randInt(rng, 1, Math.floor(a / 10) - 1);
  return { a, b: bt * 10 + bu };
};
const twoDigitBorrow: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u <= 8, 30, 99);
  const bu = randInt(rng, (a % 10) + 1, 9);
  const bt = randInt(rng, 1, Math.floor(a / 10) - 1);
  return { a, b: bt * 10 + bu };
};

/** 34 + ? = 60, ? − 20 = 35, 80 − ? = 45. */
function missing(rng: Rng): Exercise {
  const kind = pick(rng, ['b+', 'a-', 'b-'] as const);
  if (kind === 'b+') {
    const a = randInt(rng, 11, 79);
    const c = randInt(rng, a + 1, 99);
    return arith({ topicId: ID, level: 9, a, op: '+', b: c - a, missing: 'b', hints: [hint(say('hint.missAdd100')), hint(say('hint.numberLineGap'), { visual: { type: 'numberLine', from: Math.floor(a / 10) * 10, to: Math.min(100, Math.ceil(c / 10) * 10), start: a, hops: 0, target: c, step: 1 } })], example: { a: 34, b: 26 }, input: numpad(2) });
  }
  if (kind === 'a-') {
    const b = randInt(rng, 10, 60);
    const c = randInt(rng, 5, 99 - b);
    return arith({ topicId: ID, level: 9, a: b + c, op: '-', b, missing: 'a', hints: [hint(say('hint.missStart100')), hint(say('ex.decompose.hint2'), { example: { display: `? = ${c} + ${b}`, spoken: say('ex.decompose.hint2') } })], example: { a: 55, b: 20 }, input: numpad(2) });
  }
  const a = randInt(rng, 30, 99);
  const c = randInt(rng, 1, a - 10);
  return arith({ topicId: ID, level: 9, a, op: '-', b: a - c, missing: 'b', hints: [hint(say('hint.missSub100')), hint(say('hint.numberLineGap'), { visual: { type: 'numberLine', from: Math.floor(c / 10) * 10, to: Math.min(100, Math.ceil(a / 10) * 10), start: c, hops: 0, target: a, step: 1 } })], example: { a: 80, b: 35 }, input: numpad(2) });
}

const WORD_KEYS_ADD = ['wp.buy', 'wp.collect'] as const;
const WORD_KEYS_SUB = ['wp.give', 'wp.compare'] as const;

function word(rng: Rng): Exercise {
  const add = rng() < 0.5;
  if (add) {
    const a = randInt(rng, 12, 60);
    const b = randInt(rng, 5, 99 - a);
    return wordProblem({ topicId: ID, level: 10, key: pick(rng, WORD_KEYS_ADD), rng, a, op: '+', b, example: { a: 23, b: 15 }, input: numpad(3) });
  }
  const a = randInt(rng, 20, 99);
  const b = randInt(rng, 5, a - 3);
  return wordProblem({ topicId: ID, level: 10, key: pick(rng, WORD_KEYS_SUB), rng, a, op: '-', b, example: { a: 45, b: 18 }, input: numpad(2) });
}

export const addSub100 = defineTopic({
  id: ID,
  labelKey: 'topic.addSub100',
  grades: [2],
  startLevel: () => 1,
  levels: [
    open(L(1), plain(1, '+', unitsNoCarry, false)),
    open(L(2), plain(2, '+', unitsCarry, true)),
    open(L(3), plain(3, '-', unitsNoBorrow, false)),
    open(L(4), plain(4, '-', unitsBorrow, true)),
    open(L(5), (rng, g) => (rng() < 0.5 ? plain(5, '+', tensPlus, false)(rng, g) : plain(5, '-', tensMinus, false)(rng, g))),
    open(L(6), plain(6, '+', twoDigitNoCarry, false)),
    open(L(7), plain(7, '+', twoDigitCarry, true)),
    open(L(8), (rng, g) => (rng() < 0.5 ? plain(8, '-', twoDigitNoBorrow, false)(rng, g) : plain(8, '-', twoDigitBorrow, true)(rng, g))),
    open(L(9), missing),
    open(L(10), word),
  ],
});

/** Exported for the tests: every generator stays in range and matches its level's rule. */
export const GENERATORS = {
  unitsNoCarry,
  unitsCarry,
  unitsNoBorrow,
  unitsBorrow,
  tensPlus,
  tensMinus,
  twoDigitNoCarry,
  twoDigitCarry,
  twoDigitNoBorrow,
  twoDigitBorrow,
};
