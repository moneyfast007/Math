import { t } from '@/i18n';
import { compose } from '@/lang/compose';
import {
  arith,
  choicesAround,
  closed,
  defineTopic,
  diagnoseArith,
  exampleAvoiding,
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
import { missingExample, withExample } from './addSub100';

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
    // Counting in skips, row by row: not dot by dot up to 100.
    hint(say('hint.mul.arraySkip', { b }), { visual: { type: 'array', rows: a, cols: b } }),
  ];
}

/** Rows × columns of dots: "3 rows of 4". */
function groups(level: number, a: number, b: number, rng: Rng): Exercise {
  const answer = a * b;
  const prompt = t('ex.groups.prompt', { params: { a, b } });
  const spoken = say('ex.groups.spoken', { a, b });
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
    input: { type: 'choices', choices: groupChoices(rng, a, b) },
    hints: [
      hint(say('hint.mul.countRows', { b: { n: b, gender: 'f' } })),
      hint(say('hint.mul.repeated'), {
        example: {
          display: Array.from({ length: a }, () => b).join(' + ') + ' = ?',
          spoken: say('hint.mul.repeated'),
        },
      }),
      // Not 3 × 4 for 4 × 3: an example with the same product gives the answer away.
      mulExample(answer, [
        [3, 4],
        [2, 5],
      ]),
    ],
    solution: spokenEquationSolved(a, '×', b, answer),
    // Adding the two numbers (3 + 4 for 3 rows of 4) and counting one dot off.
    diagnose: (v) => diagnoseArith(v, { a, op: '×', b, answer }),
  });
}

/** The product, often the sum of the two numbers (the classic slip), and one more near it. */
function groupChoices(rng: Rng, a: number, b: number): number[] {
  const answer = a * b;
  const sum = a + b;
  // The sum is almost always below the product: only in half the exercises, or the
  // answer would never be the first button.
  if (sum === answer || rng() < 0.5) return choicesAround(rng, answer, 1, 30);
  const near = pick(
    rng,
    [answer - 1, answer + 1, (a + 1) * b, (a - 1) * b].filter(
      (x) => x >= 1 && x !== sum && x !== answer,
    ),
  );
  return [answer, sum, near].sort((x, y) => x - y);
}

/** Hint 3: the first of these products that is not `answer`, solved. */
function mulExample(answer: number, pairs: readonly [number, number][]): Hint {
  return exampleAvoiding(
    answer,
    pairs.map(([a, b]) => ({
      answer: a * b,
      hint: () => exampleHint(`${a} × ${b} = ${a * b}`, spokenEquationSolved(a, '×', b, a * b)),
    })),
  );
}

/** Repeated addition shown as a sum: "4 + 4 + 4 = ?" */
function repeated(level: number, a: number, b: number): Exercise {
  const answer = a * b;
  const terms = Array.from({ length: a }, () => b);
  const display = `${terms.join(' + ')} = ?`;
  const slots = Object.fromEntries(terms.map((v, i) => [`t${i}`, v]));
  const spoken = compose(
    `${t('eq.howMuch')} ${terms.map((_, i) => `{t${i}}`).join(` ${t('op.add')} `)}?`,
    slots,
  );
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
      hint(say('hint.mul.arraySkip', { b }), { visual: { type: 'array', rows: a, cols: b } }),
      repeatedExample(a, b),
    ],
    solution: spokenEquationSolved(a, '×', b, answer),
  });
}

/** Hint 3 in the level's own form, a sum of the same number: "2 + 2 + 2 = 6". */
function repeatedExample(a: number, b: number): Hint {
  const answer = a * b;
  const [x, y] = (
    [
      [3, 2],
      [2, 5],
      [4, 3],
      [3, 5],
    ] as const
  ).find(([p, q]) => p * q !== answer && !(p === a && q === b)) ?? [3, 2];
  const terms = Array.from({ length: x }, () => y);
  const slots: Record<string, number> = { c: x * y };
  terms.forEach((v, i) => {
    slots[`t${i}`] = v;
  });
  const solved = compose(
    `${terms.map((_, i) => `{t${i}}`).join(` ${t('op.add')} `)} ${t('ex.repeated.is')} {c}.`,
    slots,
  );
  return exampleHint(`${terms.join(' + ')} = ${x * y}`, solved);
}

type TableFact = { a: number; b: number; factor: number };

/**
 * A fact of the table of `factor`. The worked example comes from the same
 * table, with the factor in the same place (2 × 7 → 2 × 4), not from a table
 * not learnt yet (3 × 7 for the table of 2).
 */
function table(level: number, { a, b, factor }: TableFact, rng: Rng): Exercise {
  const other = a === factor ? b : a;
  const choices = range(2, 10).filter((k) => k !== other && k * factor !== a * b);
  const k = choices.length > 0 ? pick(rng, choices) : other === 3 ? 4 : 3;
  return arith({
    topicId: ID,
    level,
    a,
    op: '×',
    b,
    hints: arrayHints(a, b),
    example: a === factor ? { a: factor, b: k } : { a: k, b: factor },
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
    // Sharing among as many groups, with another number in each.
    example: { a: b * (q === 3 ? 4 : 3), b },
    input: numpad(2),
  });
}

function missingFactor(rng: Rng): Exercise {
  const b = pick(rng, [2, 3, 4, 5, 10]);
  const a = randInt(rng, 2, 10);
  const asA = rng() < 0.5;
  const e = arith({
    topicId: ID,
    level: 9,
    a: asA ? a : b,
    op: '×',
    b: asA ? b : a,
    missing: asA ? 'a' : 'b',
    hints: [
      hint(say('hint.mul.missing', { c: a * b, b })),
      // Not the full array: it would show the missing factor. Skips of b up to the product.
      hint(say('hint.mul.missingLine', { b, c: a * b }), {
        visual: { type: 'numberLine', from: 0, to: a * b, start: 0, hops: 0, step: b },
      }),
    ],
    example: { a: 3, b: 5 },
    input: numpad(2),
  });
  // Hint 3 in the same shape ("3 × ? = 15 → 5"), with another missing number and product.
  const pairs = [2, 3, 4, 5, 10].flatMap((x) => range(2, 10).map((y) => [x, y] as const));
  const fresh = pairs.filter(([x, y]) => y !== a && x * y !== a * b);
  const [x, y] = pick(rng, fresh.length > 0 ? fresh : pairs);
  return withExample(e, asA ? missingExample(y, '×', x, 'a') : missingExample(x, '×', y, 'b'));
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

/** Both orientations: 2 × 7 and 7 × 2; 2 × 2 once, not twice as often as the others. */
const tableFacts = (factor: number): TableFact[] =>
  range(1, 10).flatMap((other) =>
    other === factor
      ? [{ a: factor, b: factor, factor }]
      : [
          { a: other, b: factor, factor },
          { a: factor, b: other, factor },
        ],
  );

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
      (f, rng) => table(3, f, rng),
    ),
    closed(
      L(4),
      () => [...tableFacts(10), ...tableFacts(5)],
      (f, rng) => table(4, f, rng),
    ),
    closed(
      L(5),
      () => tableFacts(3),
      (f, rng) => table(5, f, rng),
    ),
    closed(
      L(6),
      () => tableFacts(4),
      (f, rng) => table(6, f, rng),
    ),
    closed(
      L(7),
      () => range(2, 5).flatMap((b) => range(2, 5).map((q) => ({ a: b * q, b }))),
      (f) => share(7, f.a, f.b),
    ),
    closed(
      L(8),
      // Beyond the facts of level 7 (up to 5 × 5): those are not asked again here.
      () =>
        [2, 3, 4, 5, 10].flatMap((b) =>
          range(2, 10)
            .filter((q) => b > 5 || q > 5)
            .map((q) => ({ a: b * q, b })),
        ),
      (f) => share(8, f.a, f.b),
    ),
    open(L(9), missingFactor),
    open(L(10), word),
  ],
});
