import { t } from '@/i18n';
import {
  arith,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  say,
  wordProblem,
  type Said,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';

/**
 * World 10, grade 4: "כפל וחילוק ארוכים". Multiplying by tens and hundreds,
 * three-digit by one-digit, two-digit by two-digit, long division (exact and
 * with a remainder), order of operations, word problems.
 */

const ID = 'long-mul-div';
const L = (n: number) => `level.longMulDiv.${n}`;

function byTens(rng: Rng): Exercise {
  // A two-digit number: 5 × 60 is the multiplication table again (grade 3).
  const a = randInt(rng, 11, 99);
  const k = pick(rng, [20, 30, 40, 50, 60, 70, 80, 90, 200, 300, 400, 500]);
  const hundreds = k >= 100;
  return arith({
    topicId: ID,
    level: 1,
    a,
    op: '×',
    b: k,
    hints: [
      // "One zero" or "two zeros", said for this multiplier.
      hint(say(hundreds ? 'g4.byTens.2' : 'g4.byTens.1', { d: hundreds ? k / 100 : k / 10 })),
      hint(say('hint.mul.tensExample'), {
        example: { display: '12 × 3 = 36 → 12 × 30 = 360', spoken: say('hint.mul.tensExample') },
      }),
    ],
    // Not the 12 × 30 of hint 2 again.
    example: { a: 23, b: 400 },
    input: numpad(5),
  });
}

function splitHints(a: number): [ReturnType<typeof hint>, ReturnType<typeof hint>] {
  return [hint(say('hint.longMul.split', { a })), hint(say('g4.longMul.column'))];
}

function threeByOne(rng: Rng): Exercise {
  const a = randInt(rng, 102, 989);
  const b = randInt(rng, 2, 9);
  return arith({
    topicId: ID,
    level: 2,
    a,
    op: '×',
    b,
    hints: splitHints(a),
    // An example that carries, like most of the exercises.
    example: { a: 286, b: 7 },
    input: numpad(4),
  });
}

/**
 * Two-digit by two-digit, worked as the curriculum teaches it: the second number
 * split into tens and units, two partial products, their sum. Hint 3 shows that
 * way on other numbers, not only a result.
 */
function twoByTwoExercise(level: 3 | 4, a: number, b: number): Exercise {
  const e = arith({
    topicId: ID,
    level,
    a,
    op: '×',
    b,
    hints: [
      hint(say('hint.longMul.twoByTwo', { b, t: Math.floor(b / 10) * 10, u: b % 10 })),
      hint(say('g4.longMul.column')),
    ],
    example: { a: 23, b: 12 },
    input: numpad(4),
  });
  const examples = (
    level === 3
      ? [
          { a: 23, b: 12 },
          { a: 31, b: 14 },
        ]
      : [
          { a: 34, b: 25 },
          { a: 46, b: 23 },
        ]
  ).filter((x) => !(x.a === a && x.b === b) && !(x.a === b && x.b === a));
  return {
    ...e,
    hints: [
      e.hints[0],
      e.hints[1],
      exampleAvoiding(
        e.answer,
        examples.map((x) => {
          const t = Math.floor(x.b / 10) * 10;
          const u = x.b % 10;
          const r = x.a * x.b;
          return {
            answer: r,
            hint: () =>
              exampleHint(
                `${x.a} × ${x.b} = ${x.a} × ${t} + ${x.a} × ${u} = ${x.a * t} + ${x.a * u} = ${r}`,
                say('g4.longMul.partial', { a: x.a, t, u, p: x.a * t, q: x.a * u, r }),
              ),
          };
        }),
      ),
    ],
  };
}

function twoByTwoEasy(rng: Rng): Exercise {
  return twoByTwoExercise(3, randInt(rng, 11, 39), randInt(rng, 11, 19));
}

/** The second factor up to 39: two partial products a child can still add in her head. */
function twoByTwo(rng: Rng): Exercise {
  // Not 30: "30 = 30 + 0" is no split.
  const b = pick(rng, [21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 34, 35, 36, 37, 38, 39]);
  return twoByTwoExercise(4, randInt(rng, 21, 99), b);
}

/** The first part of the number the divisor goes into, from the left: 64 in 6433 ÷ 7. */
function firstPart(a: number, b: number): number {
  const digits = String(a);
  for (let i = 1; i <= digits.length; i++) {
    const part = Number(digits.slice(0, i));
    if (part >= b) return part;
  }
  return a;
}

/** Said for these numbers, as worked in the head from the left (the digits of the answer come in typing order). */
function divHints(a: number, b: number): [ReturnType<typeof hint>, ReturnType<typeof hint>] {
  return [
    hint(say('g4.div.first', { b, first: firstPart(a, b) })),
    hint(say('hint.longDiv.check')),
  ];
}

function divExact(level: number, lo: number, hi: number, minQ = 2): (rng: Rng) => Exercise {
  return (rng) => {
    const b = randInt(rng, 2, 9);
    const q = randInt(rng, Math.max(minQ, Math.ceil(lo / b)), Math.floor(hi / b));
    return arith({
      topicId: ID,
      level,
      a: b * q,
      op: '÷',
      b,
      hints: divHints(b * q, b),
      example: level === 5 ? { a: 252, b: 7 } : { a: 1236, b: 4 },
      input: numpad(4),
    });
  };
}

function divRemainder(level: number, askRemainder: boolean): (rng: Rng) => Exercise {
  return (rng) => {
    const b = randInt(rng, 3, 9);
    const q = randInt(rng, 12, 120);
    const r = randInt(rng, 1, b - 1);
    const a = b * q + r;
    const solved = say('eq.remainder.solution', { a, b, q, r });
    const ex = a === 127 && b === 5 ? { a: 131, b: 4, q: 32, r: 3 } : { a: 127, b: 5, q: 25, r: 2 };
    return remainderExercise(level, a, b, q, r, askRemainder, askRemainder ? r : q, solved, ex);
  };
}

function remainderExercise(
  level: number,
  a: number,
  b: number,
  q: number,
  r: number,
  askRemainder: boolean,
  answer: number,
  solved: Said,
  ex: { a: number; b: number; q: number; r: number },
): Exercise {
  return exercise({
    factId: `lrem:${a}/${b}:${askRemainder ? 'r' : 'q'}`,
    topicId: ID,
    level,
    prompt: t(askRemainder ? 'ex.remainder.promptR' : 'ex.remainder.promptQ'),
    display: askRemainder ? `${a} ÷ ${b} = ${q} (?)` : `${a} ÷ ${b} = ? (${r})`,
    // What is shown is also said: the quotient when the remainder is asked, and the other way round.
    spoken: say(askRemainder ? 'g4.rem.spokenR' : 'g4.rem.spokenQ', { a, b, q, r }),
    answer,
    operation: 'div',
    input: numpad(askRemainder ? 1 : 3),
    hints: [
      // With the quotient given, the remainder is what is missing from quotient × divisor.
      askRemainder
        ? hint(say('g4.rem.hintR', { q, b, a }))
        : hint(say('g4.div.first', { b, first: firstPart(a, b) })),
      hint(say('g4.longDiv.remainder', { b })),
      exampleHint(`${ex.a} ÷ ${ex.b} = ${ex.q} (${ex.r})`, say('eq.remainder.solution', ex)),
    ],
    solution: solved,
    diagnose: (v) => (v === (askRemainder ? q : r) ? 'remainder' : null),
  });
}

type OrderKind = 'a+bc' | '(a+b)c' | 'a-bc' | 'a-b:c';

/** The solution in its two steps: what is done first, then the rest. */
function orderSolved(kind: OrderKind, a: number, b: number, c: number) {
  switch (kind) {
    case 'a+bc':
      return say('g4.ord.sol.plusTimes', { a, b, c, p: b * c, r: a + b * c });
    case '(a+b)c':
      return say('g4.ord.sol.brackets', { a, b, c, p: a + b, r: (a + b) * c });
    case 'a-bc':
      return say('g4.ord.sol.minusTimes', { a, b, c, p: b * c, r: a - b * c });
    case 'a-b:c':
      return say('g4.ord.sol.minusDiv', { a, b, c, p: b / c, r: a - b / c });
  }
}

function orderDisplay(kind: OrderKind, a: number, b: number, c: number, r: number | string) {
  switch (kind) {
    case 'a+bc':
      return `${a} + ${b} × ${c} = ${r}`;
    case '(a+b)c':
      return `(${a} + ${b}) × ${c} = ${r}`;
    case 'a-bc':
      return `${a} − ${b} × ${c} = ${r}`;
    case 'a-b:c':
      return `${a} − ${b} ÷ ${c} = ${r}`;
  }
}

const orderValue = (kind: OrderKind, a: number, b: number, c: number) =>
  kind === 'a+bc'
    ? a + b * c
    : kind === '(a+b)c'
      ? (a + b) * c
      : kind === 'a-bc'
        ? a - b * c
        : a - b / c;

/** Worked examples of the same kind (brackets for brackets); two, so one never has this answer. */
const ORDER_EXAMPLES: Record<OrderKind, { a: number; b: number; c: number }[]> = {
  'a+bc': [
    { a: 2, b: 3, c: 4 },
    { a: 5, b: 2, c: 3 },
  ],
  '(a+b)c': [
    { a: 3, b: 4, c: 5 },
    { a: 2, b: 6, c: 3 },
  ],
  'a-bc': [
    { a: 20, b: 3, c: 4 },
    { a: 30, b: 4, c: 5 },
  ],
  'a-b:c': [
    { a: 20, b: 12, c: 4 },
    { a: 25, b: 10, c: 5 },
  ],
};

/** a + b × c, (a + b) × c, a − b × c, a − b ÷ c: the order of operations. */
function order(rng: Rng): Exercise {
  const kind = pick(rng, ['a+bc', '(a+b)c', 'a-bc', 'a-b:c'] as const);
  const m = randInt(rng, 2, 20);
  const n = randInt(rng, 2, 9);
  const c = randInt(rng, 2, 9);
  // a − b × c and a − b ÷ c: left to right gives another result, so the level tests the order.
  const [a, b] =
    kind === 'a-bc'
      ? [n * c + randInt(rng, 1, 20), n]
      : kind === 'a-b:c'
        ? [m + n * c, n * c]
        : [m, n];
  const answer = orderValue(kind, a, b, c);
  const wrong =
    kind === 'a+bc'
      ? (a + b) * c
      : kind === '(a+b)c'
        ? a + b * c
        : kind === 'a-bc'
          ? (a - b) * c
          : Math.floor((a - b) / c);
  const spoken =
    kind === 'a+bc'
      ? say('ex.ord.aPlusBC', { a, b, c })
      : kind === '(a+b)c'
        ? say('ex.ord.bracketPlusTimes', { a, b, c })
        : kind === 'a-bc'
          ? say('ex.ord.aMinusBC', { a, b, c })
          : say('ex.ord.xMinusYdivC', { x: a, y: b, c });
  const display = orderDisplay(kind, a, b, c, '?');
  return exercise({
    factId: `ord:${display}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.arith.prompt'),
    display,
    spoken,
    answer,
    input: numpad(3),
    hints: [
      hint(say(kind === '(a+b)c' ? 'hint.order.brackets' : 'hint.order.first')),
      hint(say('hint.order.rule')),
      // Never one with this exercise's answer (so never the exercise itself): it gives it away.
      exampleAvoiding(
        answer,
        ORDER_EXAMPLES[kind].map((ex) => {
          const r = orderValue(kind, ex.a, ex.b, ex.c);
          return {
            answer: r,
            hint: () =>
              exampleHint(
                orderDisplay(kind, ex.a, ex.b, ex.c, r),
                orderSolved(kind, ex.a, ex.b, ex.c),
              ),
          };
        }),
      ),
    ],
    solution: orderSolved(kind, a, b, c),
    diagnose: (v) => (v === wrong ? 'order' : null),
  });
}

function word(rng: Rng): Exercise {
  const kind = pick(rng, ['×', '÷', 'rem'] as const);
  if (kind === '×') {
    const a = randInt(rng, 12, 60);
    const b = randInt(rng, 12, 40);
    return wordProblem({
      topicId: ID,
      level: 10,
      key: 'wp.boxes',
      rng,
      a,
      op: '×',
      b,
      example: { a: 24, b: 15 },
      input: numpad(4),
    });
  }
  const b = randInt(rng, 3, 9);
  const q = randInt(rng, 12, 60);
  if (kind === 'rem') {
    return wordProblem({
      topicId: ID,
      level: 10,
      // "As many as possible": only then is the remainder the one answer.
      key: 'g4.wp.leftover',
      rng,
      a: b * q + randInt(rng, 1, b - 1),
      op: '÷',
      b,
      example: { a: 127, b: 5 },
      input: numpad(1),
      askRemainder: true,
    });
  }
  return wordProblem({
    topicId: ID,
    level: 10,
    key: pick(rng, ['wp.share', 'wp.bags'] as const),
    rng,
    a: b * q,
    op: '÷',
    b,
    example: { a: 144, b: 6 },
    input: numpad(3),
  });
}

export const longMulDiv = defineTopic({
  id: ID,
  labelKey: 'topic.longMulDiv',
  grades: [4],
  startLevel: () => 1,
  levels: [
    open(L(1), byTens),
    open(L(2), threeByOne),
    open(L(3), twoByTwoEasy),
    open(L(4), twoByTwo),
    // Quotients of 12 and more: 81 ÷ 9 is a multiplication-table fact, not long division.
    open(L(5), divExact(5, 24, 400, 12)),
    open(L(6), divExact(6, 1000, 9999)),
    open(L(7), divRemainder(7, false)),
    open(L(8), divRemainder(8, true)),
    open(L(9), order),
    open(L(10), word),
  ],
});
