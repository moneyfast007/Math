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
  const a = randInt(rng, 2, 99);
  const k = pick(rng, [20, 30, 40, 50, 60, 70, 80, 90, 200, 300, 400, 500]);
  return arith({
    topicId: ID,
    level: 1,
    a,
    op: '×',
    b: k,
    hints: [
      hint(say('hint.byTens', { d: k >= 100 ? k / 100 : k / 10 })),
      hint(say('hint.mul.tensExample'), {
        example: { display: '12 × 3 = 36 → 12 × 30 = 360', spoken: say('hint.mul.tensExample') },
      }),
    ],
    example: { a: 12, b: 30 },
    input: numpad(5),
  });
}

function splitHints(a: number): [ReturnType<typeof hint>, ReturnType<typeof hint>] {
  return [hint(say('hint.longMul.split', { a })), hint(say('hint.longMul.column'))];
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
    example: { a: 213, b: 4 },
    input: numpad(4),
  });
}

function twoByTwoEasy(rng: Rng): Exercise {
  const a = randInt(rng, 11, 39);
  const b = randInt(rng, 11, 19);
  return arith({
    topicId: ID,
    level: 3,
    a,
    op: '×',
    b,
    hints: [
      hint(say('hint.longMul.twoByTwo', { b, t: Math.floor(b / 10) * 10, u: b % 10 })),
      hint(say('hint.longMul.column')),
    ],
    example: { a: 23, b: 12 },
    input: numpad(4),
  });
}

function twoByTwo(rng: Rng): Exercise {
  const a = randInt(rng, 21, 99);
  const b = randInt(rng, 21, 99);
  return arith({
    topicId: ID,
    level: 4,
    a,
    op: '×',
    b,
    hints: [
      hint(say('hint.longMul.twoByTwo', { b, t: Math.floor(b / 10) * 10, u: b % 10 })),
      hint(say('hint.longMul.column')),
    ],
    example: { a: 34, b: 25 },
    input: numpad(4),
  });
}

function divHints(): [ReturnType<typeof hint>, ReturnType<typeof hint>] {
  return [hint(say('hint.longDiv.steps')), hint(say('hint.longDiv.check'))];
}

function divExact(level: number, lo: number, hi: number): (rng: Rng) => Exercise {
  return (rng) => {
    const b = randInt(rng, 2, 9);
    const q = randInt(rng, Math.ceil(lo / b), Math.floor(hi / b));
    return arith({
      topicId: ID,
      level,
      a: b * q,
      op: '÷',
      b,
      hints: divHints(),
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
    spoken: say(askRemainder ? 'ex.remainder.spokenR' : 'ex.remainder.spokenQ', { a, b }),
    answer,
    operation: 'div',
    input: numpad(askRemainder ? 1 : 3),
    hints: [
      hint(say('hint.longDiv.steps')),
      hint(say('hint.longDiv.remainder', { b })),
      exampleHint(`${ex.a} ÷ ${ex.b} = ${ex.q} (${ex.r})`, say('eq.remainder.solution', ex)),
    ],
    solution: solved,
    diagnose: (v) => (v === (askRemainder ? q : r) ? 'remainder' : null),
  });
}

/** a + b × c, (a + b) × c, a × b − c: the order of operations. */
function order(rng: Rng): Exercise {
  const kind = pick(rng, ['a+bc', '(a+b)c', 'a-bc', 'a-b:c'] as const);
  const a = randInt(rng, 2, 20);
  const b = randInt(rng, 2, 9);
  const c = randInt(rng, 2, 9);
  let display: string;
  let answer: number;
  let spoken;
  let wrong: number;
  switch (kind) {
    case 'a+bc':
      display = `${a} + ${b} × ${c} = ?`;
      answer = a + b * c;
      wrong = (a + b) * c;
      spoken = say('ex.ord.aPlusBC', { a, b, c });
      break;
    case '(a+b)c':
      display = `(${a} + ${b}) × ${c} = ?`;
      answer = (a + b) * c;
      wrong = a + b * c;
      spoken = say('ex.ord.bracketPlusTimes', {
        a,
        b,
        c,
      });
      break;
    case 'a-bc': {
      // Left to right gives (x − b) × c: the order changes the result, so the level tests it.
      const x = b * c + randInt(rng, 1, 20);
      display = `${x} − ${b} × ${c} = ?`;
      answer = x - b * c;
      wrong = (x - b) * c;
      spoken = say('ex.ord.aMinusBC', { a: x, b, c });
      break;
    }
    case 'a-b:c': {
      const big = a + b * c;
      display = `${big} − ${b * c} ÷ ${c} = ?`;
      answer = big - b;
      wrong = Math.floor((big - b * c) / c);
      spoken = say('ex.ord.xMinusYdivC', { x: big, y: b * c, c });
      break;
    }
  }
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
      exampleAvoiding(answer, [
        {
          answer: 14,
          hint: () =>
            exampleHint('2 + 3 × 4 = 14', say('ex.ord.example', { a: 2, b: 3, c: 4, r: 14 })),
        },
        {
          answer: 11,
          hint: () =>
            exampleHint('5 + 2 × 3 = 11', say('ex.ord.example', { a: 5, b: 2, c: 3, r: 11 })),
        },
      ]),
    ],
    solution: say('eq.answerIs', { r: answer }),
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
      key: 'wp.leftover',
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
    open(L(5), divExact(5, 24, 400)),
    open(L(6), divExact(6, 1000, 9999)),
    open(L(7), divRemainder(7, false)),
    open(L(8), divRemainder(8, true)),
    open(L(9), order),
    open(L(10), word),
  ],
});
