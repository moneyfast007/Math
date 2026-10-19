import { t, type TranslationKey } from '@/i18n';
import { compose, shown, type Slot } from '@/lang/compose';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  arith,
  CHARACTERS,
  defineTopic,
  diagnoseArith,
  WORD_NOUNS,
  type Character,
  type WordNoun,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  say,
  wordProblem,
  exampleAvoiding,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';
import { missingExample, withExample } from './addSub100';

/**
 * World 6, grade 3: "לוח הכפל". The whole table, division facts, missing
 * factors, tens, two-digit by one-digit, division with a remainder.
 */

const ID = 'mult-table';
const L = (n: number) => `level.multTable.${n}`;

function mulHints(a: number, b: number): [Hint, Hint] {
  return [
    hint(say('hint.mul.groups', { a: { n: a, gender: 'f' }, b })),
    // "a groups of b": a rows of b, as the words say.
    hint(say('hint.mul.arraySkip', { b }), { visual: { type: 'array', rows: a, cols: b } }),
  ];
}

function divHints(a: number, b: number): [Hint, Hint] {
  return [
    hint(say('hint.div.table', { b })),
    hint(say('hint.div.array'), { visual: { type: 'array', rows: b, cols: a / b } }),
  ];
}

function mul(level: number, factors: readonly number[], hard = 0): (rng: Rng) => Exercise {
  return (rng) => {
    // `hard`: the share of facts with both factors 6–9, the ones still to learn.
    const tough = rng() < hard;
    const f = tough ? randInt(rng, 6, 9) : pick(rng, factors);
    const o = tough ? randInt(rng, 6, 9) : randInt(rng, 2, 10);
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

/** Another pair from the table for a worked example: not this missing number, not this product. */
function otherPair(rng: Rng, missing: number, product: number): [number, number] {
  for (;;) {
    const x = randInt(rng, 2, 10);
    const y = randInt(rng, 2, 10);
    if (y !== missing && x !== missing && x * y !== product) return [x, y];
  }
}

function missingFactor(rng: Rng): Exercise {
  const b = randInt(rng, 2, 10);
  const a = randInt(rng, 2, 10);
  const asA = rng() < 0.5;
  const known = asA ? b : a;
  const asked = asA ? a : b;
  const e = arith({
    topicId: ID,
    level: 5,
    a,
    op: '×',
    b,
    missing: asA ? 'a' : 'b',
    hints: [
      hint(say('hint.mul.missing', { c: a * b, b: known })),
      // The known number of rows and the total: how many in each row is the question.
      hint(say('hint.mul.missingRows', { b: known, c: a * b }), {
        visual: { type: 'array', rows: known, cols: asked },
      }),
    ],
    example: { a: 6, b: 7 },
    input: numpad(2),
  });
  // Hint 3 in the same shape: "6 × ? = 42 → 7".
  const [x, y] = otherPair(rng, asked, a * b);
  return withExample(e, asA ? missingExample(y, '×', x, 'a') : missingExample(x, '×', y, 'b'));
}

function missingInDivision(rng: Rng): Exercise {
  const b = randInt(rng, 2, 10);
  const q = randInt(rng, 2, 10);
  const asA = rng() < 0.5;
  const e = arith({
    topicId: ID,
    level: 6,
    a: b * q,
    op: '÷',
    b,
    missing: asA ? 'a' : 'b',
    hints: [
      hint(say(asA ? 'hint.div.missingStart2' : 'hint.div.missingDivisor', { q, b, a: b * q })),
      hint(say(asA ? 'hint.div.arrayStart' : 'hint.div.arrayDivisor', { q, b, a: b * q }), {
        visual: { type: 'array', rows: b, cols: q },
      }),
    ],
    example: { a: 24, b: 6 },
    input: numpad(3),
  });
  // Hint 3 in the same shape: "? : 6 = 4 → 24", "24 : ? = 4 → 6".
  const asked = asA ? b * q : b;
  let ex = { b: 6, q: 4 };
  for (let i = 0; i < 30 && (ex.b * ex.q === asked || ex.b === asked || ex.q === q); i++)
    ex = { b: randInt(rng, 2, 10), q: randInt(rng, 2, 10) };
  return withExample(e, missingExample(ex.b * ex.q, '÷', ex.b, asA ? 'a' : 'b'));
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
      // About this exercise, without its result: b is so many tens.
      hint(say('hint.mul.tensCount', { a, b, t: b / 10 })),
    ],
    example: a === 3 && b === 40 ? { a: 2, b: 30 } : { a: 3, b: 40 },
    input: numpad(3),
  });
}

function twoDigitByOne(rng: Rng): Exercise {
  // Half the exercises with a product up to 100, before the bigger ones (to 441):
  // all of it is worked out in the head, with one typed answer.
  const small = rng() < 0.5;
  let a = small ? randInt(rng, 12, 25) : randInt(rng, 12, 49);
  if (a % 10 === 0) a += randInt(rng, 1, 9); // a round ten has nothing to split
  const b = small ? randInt(rng, 2, Math.max(2, Math.floor(100 / a))) : randInt(rng, 2, 9);
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
    // From the exercise: one ten more or less, so the example is the same kind of work.
    example: { a: a + (a < 40 ? 10 : -10), b },
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
  const solved = say('eq.remainder.solution2', { a, b, q, r });

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
      // A hint for the part that is asked: how many in each group, or how many are left.
      hint(
        askRemainder
          ? say('hint.div.remainderR', { a, b, bq: b * q })
          : say('hint.div.remainderQ', { a, b }),
      ),
      // b groups of q (each row is a group), and the r left over in a row of their own.
      hint(say(askRemainder ? 'hint.div.arrayLeft' : 'hint.div.array'), {
        visual: { type: 'array', rows: b, cols: q, extra: r },
      }),
      // An example whose asked part is not this answer.
      exampleAvoiding(
        answer,
        [
          { a: 17, b: 5, q: 3, r: 2 },
          { a: 23, b: 4, q: 5, r: 3 },
          { a: 29, b: 6, q: 4, r: 5 },
        ].map((ex) => ({
          answer: askRemainder ? ex.r : ex.q,
          hint: () =>
            exampleHint(`${ex.a} ÷ ${ex.b} = ${ex.q} (${ex.r})`, say('eq.remainder.solution2', ex)),
        })),
      ),
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

/* ---------- A story with two steps ---------- */

const BOX: Noun = { singular: 'קופסה', plural: 'קופסאות', gender: 'f' };
const BOXES_PLUS: TranslationKey = 'wp.boxesPlus.story';

function boxesPlusSlots(who: Character, noun: WordNoun, a: number, b: number, c: number) {
  const slots: Record<string, Slot> = {
    name: who.name,
    boxesA: { n: a, noun: BOX },
    b: { n: b, noun },
    c: { n: c, noun },
    plural: noun.plural,
  };
  return slots;
}

/**
 * "4 boxes of 6, and 3 more: how many?" Two steps, as the grade 3 curriculum
 * asks: a multiplication, then an addition.
 */
function boxesPlus(rng: Rng): Exercise {
  const numbers = () => ({ a: randInt(rng, 3, 6), b: randInt(rng, 3, 9), c: randInt(rng, 3, 9) });
  const { a, b, c } = numbers();
  const answer = a * b + c;
  const who = pick(rng, CHARACTERS);
  const noun = pick(rng, WORD_NOUNS);
  const story = compose(t(BOXES_PLUS, { gender: who.gender }), boxesPlusSlots(who, noun, a, b, c));
  let ex = numbers();
  for (let i = 0; i < 20 && (ex.a * ex.b + ex.c === answer || ex.a * ex.b === a * b); i++)
    ex = numbers();
  const solved = (x: { a: number; b: number; c: number }) =>
    say('wp.boxesPlus.solution', { a: x.a, b: x.b, s: x.a * x.b, c: x.c, r: x.a * x.b + x.c });
  return exercise({
    factId: `wp:boxesPlus:${a}x${b}+${c}`,
    topicId: ID,
    level: 10,
    // On screen with digits; heard with words.
    prompt: shown(story),
    display: '',
    spoken: story,
    answer,
    operation: 'mul',
    input: numpad(2),
    hints: [
      hint(say('wp.boxesPlus.hint1')),
      {
        ...hint(say('hint.equation')),
        example: {
          display: `${a} × ${b} = ?   →   ? + ${c} = ?`,
          spoken: say('hint.equation').text,
        },
      },
      exampleHint(
        `${ex.a} × ${ex.b} = ${ex.a * ex.b}   →   ${ex.a * ex.b} + ${ex.c} = ${ex.a * ex.b + ex.c}`,
        solved(ex),
      ),
    ],
    solution: solved({ a, b, c }),
    // Stopping after the multiplication is its own slip (no specific advice yet).
    diagnose: (v) =>
      v === a * b ? 'other' : diagnoseArith(v, { a: a * b, op: '+', b: c, answer }),
  });
}

/** Every literal piece of the two-step story, for every character and noun (for the audio bank). */
function storyBank(): string[] {
  const out = new Set<string>();
  for (const who of CHARACTERS)
    for (const noun of WORD_NOUNS) {
      const s = compose(t(BOXES_PLUS, { gender: who.gender }), boxesPlusSlots(who, noun, 3, 3, 3));
      for (const p of s.parts) out.add(p);
    }
  return [...out];
}

function word(rng: Rng): Exercise {
  const kind = pick(rng, ['×', 'share', 'bags', 'rem', 'twoStep'] as const);
  if (kind === 'twoStep') return boxesPlus(rng);
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
    // The whole table, weighted to the hard facts (6 × 6 to 9 × 9): the rest is known by now.
    open(L(3), mul(3, [2, 3, 4, 5, 6, 7, 8, 9, 10], 0.55)),
    open(L(4), (rng) => div(4, rng)),
    open(L(5), missingFactor),
    open(L(6), missingInDivision),
    open(L(7), tens),
    open(L(8), twoDigitByOne),
    open(L(9), remainder),
    open(L(10), word),
  ],
  extraBank: storyBank,
});
