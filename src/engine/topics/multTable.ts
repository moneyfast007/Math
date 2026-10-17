import { t } from '@/i18n';
import {
  arith,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  say,
  sayText,
  wordProblem,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';

/**
 * World 6, grade 3: "לוח הכפל". The whole table, division facts, missing
 * factors, tens, two-digit by one-digit, division with a remainder.
 */

const ID = 'mult-table';
const L = (n: number) => `level.multTable.${n}`;

function mulHints(a: number, b: number): [Hint, Hint] {
  return [
    hint(say('hint.mul.groups', { a: { n: a, gender: 'f' }, b })),
    hint(say('hint.mul.array'), {
      visual: { type: 'array', rows: Math.min(a, b), cols: Math.max(a, b) },
    }),
  ];
}

function divHints(a: number, b: number): [Hint, Hint] {
  return [
    hint(say('hint.div.table', { b })),
    hint(say('hint.div.array'), { visual: { type: 'array', rows: b, cols: a / b } }),
  ];
}

function mul(level: number, factors: readonly number[]): (rng: Rng) => Exercise {
  return (rng) => {
    const f = pick(rng, factors);
    const o = randInt(rng, 2, 10);
    const [a, b] = rng() < 0.5 ? [f, o] : [o, f];
    return arith({
      topicId: ID,
      level,
      a,
      op: '×',
      b,
      hints: mulHints(a, b),
      example: { a: f, b: o === 4 ? 3 : 4 },
      input: numpad(3),
    });
  };
}

function div(level: number, rng: Rng): Exercise {
  const b = randInt(rng, 2, 10);
  const q = randInt(rng, 2, 10);
  return arith({
    topicId: ID,
    level,
    a: b * q,
    op: '÷',
    b,
    hints: divHints(b * q, b),
    example: { a: b * (q === 3 ? 4 : 3), b },
    input: numpad(2),
  });
}

function missingFactor(rng: Rng): Exercise {
  const b = randInt(rng, 2, 10);
  const a = randInt(rng, 2, 10);
  const asA = rng() < 0.5;
  return arith({
    topicId: ID,
    level: 5,
    a,
    op: '×',
    b,
    missing: asA ? 'a' : 'b',
    hints: [
      hint(say('hint.mul.missing', { c: a * b, b: asA ? b : a })),
      hint(say('hint.mul.array'), {
        visual: { type: 'array', rows: asA ? b : a, cols: asA ? a : b },
      }),
    ],
    example: { a: 6, b: 7 },
    input: numpad(2),
  });
}

function missingInDivision(rng: Rng): Exercise {
  const b = randInt(rng, 2, 10);
  const q = randInt(rng, 2, 10);
  const asA = rng() < 0.5;
  return arith({
    topicId: ID,
    level: 6,
    a: b * q,
    op: '÷',
    b,
    missing: asA ? 'a' : 'b',
    hints: [
      hint(say(asA ? 'hint.div.missingStart' : 'hint.div.missingDivisor', { q, b, a: b * q })),
      hint(say('hint.mul.array'), { visual: { type: 'array', rows: b, cols: q } }),
    ],
    example: { a: 24, b: 6 },
    input: numpad(3),
  });
}

function tens(rng: Rng): Exercise {
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 2, 9) * 10;
  const [x, y] = rng() < 0.5 ? [a, b] : [b, a];
  return arith({
    topicId: ID,
    level: 7,
    a: x,
    op: '×',
    b: y,
    // Hint 2 shows the idea on other numbers, so it doesn't solve this exercise.
    hints: [
      hint(say('hint.mul.tens', { a, b: b / 10 })),
      hint(say('hint.mul.tensExample'), {
        example: {
          display: a === 3 && b === 40 ? '2 × 3 = 6 → 2 × 30 = 60' : '3 × 4 = 12 → 3 × 40 = 120',
          spoken: say('hint.mul.tensExample'),
        },
      }),
    ],
    example: { a: 3, b: 40 },
    input: numpad(3),
  });
}

function twoDigitByOne(rng: Rng): Exercise {
  let a = randInt(rng, 12, 49);
  if (a % 10 === 0) a += randInt(rng, 1, 9); // a round ten has nothing to split
  const b = randInt(rng, 2, 9);
  const tensPart = Math.floor(a / 10) * 10;
  const units = a % 10;
  return arith({
    topicId: ID,
    level: 8,
    a,
    op: '×',
    b,
    hints: [
      hint(say('hint.mul.split', { a, t: tensPart, u: units })),
      // Only the split, not the products: the child still does the work.
      hint(say('hint.mul.splitExample'), {
        example: {
          display: `${a} × ${b} = (${tensPart} × ${b}) + (${units} × ${b})`,
          spoken: say('hint.mul.splitExample'),
        },
      }),
    ],
    example: { a: 23, b: 4 },
    input: numpad(3),
  });
}

/** 17 ÷ 5: the quotient (and, in half the cases, the remainder). */
function remainder(rng: Rng): Exercise {
  const b = randInt(rng, 2, 9);
  const q = randInt(rng, 2, 9);
  const r = randInt(rng, 1, b - 1);
  const a = b * q + r;
  const askRemainder = rng() < 0.5;
  const answer = askRemainder ? r : q;
  const prompt = t(askRemainder ? 'ex.remainder.promptR' : 'ex.remainder.promptQ');
  const spoken = say(askRemainder ? 'ex.remainder.spokenR' : 'ex.remainder.spokenQ', { a, b });
  const solved = say('eq.remainder.solution', { a, b, q, r });
  const exSolved = say('eq.remainder.solution', { a: 17, b: 5, q: 3, r: 2 });
  return exercise({
    factId: `rem:${a}/${b}:${askRemainder ? 'r' : 'q'}`,
    topicId: ID,
    level: 9,
    prompt,
    display: askRemainder ? `${a} ÷ ${b} = ${q} (?)` : `${a} ÷ ${b} = ? (${r})`,
    spoken,
    answer,
    operation: 'div',
    input: numpad(1),
    hints: [
      hint(say('hint.div.remainder', { b, q: b * q })),
      hint(say('hint.div.array'), { visual: { type: 'array', rows: q, cols: b } }),
      exampleHint('17 ÷ 5 = 3 (2)', exSolved),
    ],
    solution: solved,
    diagnose: (v) =>
      v === (askRemainder ? q : r)
        ? 'remainder'
        : v === answer + 1 || v === answer - 1
          ? 'offByOne'
          : null,
  });
}

function word(rng: Rng): Exercise {
  const kind = pick(rng, ['×', 'share', 'bags', 'rem'] as const);
  if (kind === '×') {
    const a = randInt(rng, 3, 9);
    const b = randInt(rng, 3, 9);
    return wordProblem({
      topicId: ID,
      level: 10,
      key: 'wp.boxes',
      rng,
      a,
      op: '×',
      b,
      example: { a: 4, b: 6 },
      input: numpad(2),
    });
  }
  const b = randInt(rng, 3, 9);
  const q = randInt(rng, 2, 9);
  if (kind === 'rem') {
    const a = b * q + randInt(rng, 1, b - 1);
    return wordProblem({
      topicId: ID,
      level: 10,
      key: 'wp.leftover',
      rng,
      a,
      op: '÷',
      b,
      example: { a: 17, b: 5 },
      input: numpad(1),
      askRemainder: true,
    });
  }
  return wordProblem({
    topicId: ID,
    level: 10,
    key: kind === 'share' ? 'wp.share' : 'wp.bags',
    rng,
    a: b * q,
    op: '÷',
    b,
    example: { a: 24, b: 6 },
    input: numpad(2),
  });
}

export const multTable = defineTopic({
  id: ID,
  labelKey: 'topic.multTable',
  grades: [3],
  startLevel: () => 1,
  levels: [
    open(L(1), mul(1, [6, 7])),
    open(L(2), mul(2, [8, 9])),
    open(L(3), mul(3, [2, 3, 4, 5, 6, 7, 8, 9, 10])),
    open(L(4), (rng) => div(4, rng)),
    open(L(5), missingFactor),
    open(L(6), missingInDivision),
    open(L(7), tens),
    open(L(8), twoDigitByOne),
    open(L(9), remainder),
    open(L(10), word),
  ],
});
