import { t } from '@/i18n';
import { compose } from '@/lang/compose';
import {
  arith,
  choicesAround,
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  range,
  say,
  spokenEquationSolved,
  wordProblem,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';

/**
 * World 5, grade 2: "כפל וחילוק: היכרות". Multiplication as equal groups and
 * repeated addition, the first tables (2, 10, 5, 3, 4), division as sharing
 * and as grouping, the missing factor, and word problems.
 */

const ID = 'mult-intro';
const L = (n: number) => `level.multIntro.${n}`;

function arrayHints(a: number, b: number): [Hint, Hint] {
  return [
    hint(say('hint.mul.groups', { a: { n: a, gender: 'f' }, b })),
    hint(say('hint.mul.array'), { visual: { type: 'array', rows: a, cols: b } }),
  ];
}

/** Rows × columns of dots: "3 rows of 4". */
function groups(level: number, a: number, b: number, rng: Rng): Exercise {
  const answer = a * b;
  const prompt = t('ex.groups.prompt', { params: { a, b } });
  const spoken = say('ex.groups.spoken', { a, b });
  const ex = { a: a === 3 ? 2 : 3, b: b === 4 ? 5 : 4 };
  return exercise({
    factId: `groups:${a}x${b}`,
    topicId: ID,
    level,
    prompt,
    display: `${a} × ${b} = ?`,
    spoken,
    visual: { type: 'array', rows: a, cols: b },
    answer,
    operation: 'mul',
    input: { type: 'choices', choices: choicesAround(rng, answer, 1, 30) },
    hints: [
      hint(say('hint.mul.countRows', { b: { n: b, gender: 'f' } })),
      hint(say('hint.mul.repeated'), {
        example: {
          display: Array.from({ length: a }, () => b).join(' + ') + ' = ?',
          spoken: say('hint.mul.repeated'),
        },
      }),
      exampleHint(
        `${ex.a} × ${ex.b} = ${ex.a * ex.b}`,
        spokenEquationSolved(ex.a, '×', ex.b, ex.a * ex.b),
      ),
    ],
    solution: spokenEquationSolved(a, '×', b, answer),
  });
}

/** Repeated addition shown as a sum: "4 + 4 + 4 = ?" */
function repeated(level: number, a: number, b: number): Exercise {
  const answer = a * b;
  const terms = Array.from({ length: a }, () => b);
  const display = `${terms.join(' + ')} = ?`;
  const slots = Object.fromEntries(terms.map((v, i) => [`t${i}`, v]));
  const spoken = compose(`כמה זה ${terms.map((_, i) => `{t${i}}`).join(' ועוד ')}?`, slots);
  return exercise({
    factId: `repeated:${a}x${b}`,
    topicId: ID,
    level,
    prompt: t('ex.arith.prompt'),
    display,
    spoken,
    answer,
    operation: 'mul',
    input: numpad(2),
    hints: [
      hint(say('hint.mul.sameNumber', { a: { n: a, gender: 'f' }, b })),
      hint(say('hint.mul.array'), { visual: { type: 'array', rows: a, cols: b } }),
      exampleHint(`3 × 2 = 6`, spokenEquationSolved(3, '×', 2, 6)),
    ],
    solution: spokenEquationSolved(a, '×', b, answer),
  });
}

function table(level: number, a: number, b: number): Exercise {
  return arith({
    topicId: ID,
    level,
    a,
    op: '×',
    b,
    hints: arrayHints(a, b),
    example: a === 3 ? { a: 4, b } : { a: 3, b },
    input: numpad(3),
  });
}

/** Sharing: "12 ÷ 3". */
function share(level: number, a: number, b: number): Exercise {
  const q = a / b;
  return arith({
    topicId: ID,
    level,
    a,
    op: '÷',
    b,
    hints: [
      hint(say('hint.div.share', { a, b: { n: b, gender: 'f' } })),
      hint(say('hint.div.array'), { visual: { type: 'array', rows: b, cols: q } }),
    ],
    example: a === 12 ? { a: 15, b: 3 } : { a: 12, b: 3 },
    input: numpad(2),
  });
}

function missingFactor(rng: Rng): Exercise {
  const b = pick(rng, [2, 3, 4, 5, 10]);
  const a = randInt(rng, 2, 10);
  const asA = rng() < 0.5;
  return arith({
    topicId: ID,
    level: 9,
    a: asA ? a : b,
    op: '×',
    b: asA ? b : a,
    missing: asA ? 'a' : 'b',
    hints: [
      hint(say('hint.mul.missing', { c: a * b, b })),
      hint(say('hint.mul.array'), { visual: { type: 'array', rows: b, cols: a } }),
    ],
    example: { a: 3, b: 5 },
    input: numpad(2),
  });
}

function word(rng: Rng): Exercise {
  if (rng() < 0.5) {
    // Word-problem numbers are at least 3 (see wordProblem).
    const a = randInt(rng, 3, 6);
    const b = pick(rng, [3, 4, 5, 10]);
    return wordProblem({
      topicId: ID,
      level: 10,
      key: 'wp.boxes',
      rng,
      a,
      op: '×',
      b,
      example: { a: 3, b: 4 },
      input: numpad(2),
    });
  }
  const b = pick(rng, [3, 4, 5]);
  const q = randInt(rng, 2, 8);
  return wordProblem({
    topicId: ID,
    level: 10,
    key: pick(rng, ['wp.share', 'wp.bags'] as const),
    rng,
    a: b * q,
    op: '÷',
    b,
    example: { a: 12, b: 3 },
    input: numpad(2),
  });
}

/** Both orientations: 2 × 7 and 7 × 2. */
const tableFacts = (factor: number) =>
  range(1, 10).flatMap((other) => [
    { a: other, b: factor },
    { a: factor, b: other },
  ]);

export const multIntro = defineTopic({
  id: ID,
  labelKey: 'topic.multIntro',
  grades: [2],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => range(2, 5).flatMap((a) => range(2, 5).map((b) => ({ a, b }))),
      (p, rng) => groups(1, p.a, p.b, rng),
    ),
    closed(
      L(2),
      () => range(2, 5).flatMap((a) => range(2, 6).map((b) => ({ a, b }))),
      (p) => repeated(2, p.a, p.b),
    ),
    closed(
      L(3),
      () => tableFacts(2),
      (f) => table(3, f.a, f.b),
    ),
    closed(
      L(4),
      () => [...tableFacts(10), ...tableFacts(5)],
      (f) => table(4, f.a, f.b),
    ),
    closed(
      L(5),
      () => tableFacts(3),
      (f) => table(5, f.a, f.b),
    ),
    closed(
      L(6),
      () => tableFacts(4),
      (f) => table(6, f.a, f.b),
    ),
    closed(
      L(7),
      () => range(2, 5).flatMap((b) => range(2, 5).map((q) => ({ a: b * q, b }))),
      (f) => share(7, f.a, f.b),
    ),
    closed(
      L(8),
      () => [2, 3, 4, 5, 10].flatMap((b) => range(2, 10).map((q) => ({ a: b * q, b }))),
      (f) => share(8, f.a, f.b),
    ),
    open(L(9), missingFactor),
    open(L(10), word),
  ],
});
