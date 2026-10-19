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
  labelledChoices,
  numpad,
  range,
  say,
  shifted,
  splitTensUnits,
} from '../build';
import type { Exercise, Hint, Rng } from '../types';

/**
 * World 3, grade 1: "מספרים עד 100". The decimal structure: whole tens, tens
 * and units, comparing, neighbours, the number line, skip counting, and the
 * first sums with whole tens. All levels are closed.
 */

const ID = 'numbers-100';
const L = (n: number) => `level.numbers100.${n}`;

/** "3 tens = ?" with a picture of rows of ten. */
function wholeTens(level: number, tens: number, rng: Rng): Exercise {
  const answer = tens * 10;
  const prompt = t('ex.tens.prompt', { params: { tens } });
  const spoken = say('ex.tens.spoken', { tens });
  const ex = tens === 3 ? 5 : 3;
  return exercise({
    factId: `tens:${tens}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken,
    visual: { type: 'array', rows: tens, cols: 10, squares: true },
    answer,
    input: { type: 'choices', choices: choicesAround(rng, answer, 10, 100) },
    hints: [
      hint(say('ex.tens.hint1')),
      hint(say('ex.tens.hint2'), {
        visual: { type: 'numberLine', from: 0, to: 100, start: 0, hops: tens, step: 10, hide: answer },
      }),
      // Repeated addition, not "3 × 10": multiplication comes in grade 2.
      exampleHint(
        `${Array.from({ length: ex }, () => '10').join(' + ')} = ${ex * 10}`,
        say('ex.tens.solution', { tens: ex, n: ex * 10 }),
      ),
    ],
    solution: say('ex.tens.solution', { tens, n: answer }),
  });
}

/** "4 tens and 7 units: which number?" */
function build(level: number, n: number): Exercise {
  const tens = Math.floor(n / 10);
  const units = n % 10;
  const prompt = t('ex.build.prompt', { params: { tens, units } });
  const spoken = say('ex.build.spoken', { tens, units });
  const ex = shifted(tens, units, 1, 9, 2);
  return exercise({
    factId: `build:${n}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken,
    // The tens and the units: 47 is four rows of ten and seven more.
    visual: { type: 'array', rows: tens, cols: 10, squares: true, extra: units },
    answer: n,
    input: numpad(2),
    hints: [
      hint(say('ex.build.hint1', { tens, n: tens * 10 })),
      hint(say('ex.build.hint2')),
      exampleHint(
        `${ex.a * 10} + ${ex.b} = ${ex.a * 10 + ex.b}`,
        say('ex.build.solution', { tens: ex.a, units: ex.b, n: ex.a * 10 + ex.b }),
      ),
    ],
    solution: say('ex.build.solution', { tens, units, n }),
    diagnose: (v) =>
      v === tens + units ? 'placeValue' : v === units * 10 + tens ? 'digitReversal' : null,
  });
}

/** "How many tens in 47?" / "how many units?" */
function decompose(level: number, n: number, askTens: boolean): Exercise {
  const tens = Math.floor(n / 10);
  const units = n % 10;
  const key = askTens ? 'ex.howManyTens' : 'ex.howManyUnits';
  const answer = askTens ? tens : units;
  const prompt = t(`${key}.prompt` as 'ex.howManyTens.prompt', { params: { n } });
  const spoken = say(`${key}.spoken` as 'ex.howManyTens.spoken', { n });
  const ex = n === 47 ? 63 : 47;
  return exercise({
    factId: `${askTens ? 'tensOf' : 'unitsOf'}:${n}`,
    topicId: ID,
    level,
    prompt,
    display: String(n),
    spoken,
    answer,
    input: numpad(1),
    hints: [
      hint(say('ex.decompose.hint1')),
      // Not "21 = 20 + 1": that would be the answer itself.
      hint(say('ex.decompose.hint2sticks')),
      exampleHint(
        splitTensUnits(ex),
        say('ex.decompose.solution', { n: ex, tens: Math.floor(ex / 10), units: ex % 10 }),
      ),
    ],
    solution: say('ex.decompose.solution', { n, tens, units }),
    diagnose: (v) => (v === (askTens ? units : tens) ? 'placeValue' : null),
  });
}

/** Which of two numbers is bigger. */
function compare(level: number, a: number, b: number): Exercise {
  const answer = a > b ? 0 : 1;
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return exercise({
    factId: `compare:${a},${b}`,
    topicId: ID,
    level,
    prompt: t('ex.bigger.prompt'),
    display: '', // the two numbers are the answer buttons
    spoken: say('ex.bigger.spoken', { a, b }),
    answer,
    input: labelledChoices([String(a), String(b)]),
    hints: [
      hint(say('ex.compare100.hint1')),
      hint(say('ex.compare100.hint2'), {
        example: {
          display: `${splitTensUnits(a)}   ${splitTensUnits(b)}`,
          spoken: say('ex.compare100.hint2'),
        },
      }),
      exampleHint('63 > 47', say('ex.bigger.solution', { w: 63, l: 47 })),
    ],
    solution: say('ex.bigger.solution', { w: big, l: small }),
  });
}

/** The number before/after, or ten more/less. */
function neighbour(level: number, n: number, delta: 1 | -1 | 10 | -10): Exercise {
  const answer = n + delta;
  const key =
    delta === 1
      ? 'ex.after'
      : delta === -1
        ? 'ex.before'
        : delta === 10
          ? 'ex.tenMore'
          : 'ex.tenLess';
  const prompt = t(`${key}.prompt` as 'ex.after.prompt', { params: { n } });
  const spoken = say(`${key}.spoken` as 'ex.after.spoken', { n });
  const ex = n + 23 <= 89 ? n + 23 : n - 23;
  return exercise({
    factId: `nb${delta}:${n}`,
    topicId: ID,
    level,
    prompt,
    display: String(n),
    spoken,
    answer,
    input: numpad(3),
    hints: [
      hint(say(`${key}.hint1` as 'ex.after.hint1')),
      // Ten more or less: one hop of ten from the number, landing on "?" (not on the answer).
      Math.abs(delta) === 10
        ? hint(say('hint.numberLine10'), {
            visual: {
              type: 'numberLine',
              from: Math.max(0, Math.min(n, answer) - 10),
              to: Math.min(100, Math.max(n, answer) + 10),
              start: n,
              hops: delta / 10,
              step: 10,
              hide: answer,
            },
          })
        : hint(say('hint.numberLine'), {
            visual: {
              type: 'numberLine',
              from: Math.max(0, Math.floor(n / 10) * 10 - 10),
              to: Math.min(100, Math.floor(n / 10) * 10 + 20),
              start: n,
              hops: delta,
              hide: answer,
            },
          }),
      exampleHint(
        `${ex} → ${ex + delta}`,
        say(`${key}.solution` as 'ex.after.solution', { n: ex, c: ex + delta }),
      ),
    ],
    solution: say(`${key}.solution` as 'ex.after.solution', { n, c: answer }),
    diagnose: (v) => (Math.abs(v - answer) === 10 ? 'offByTen' : null),
  });
}

/** Which number is marked on the number line? */
function marked(level: number, n: number, rng: Rng): Exercise {
  const prompt = t('ex.marked.prompt');
  const from = Math.max(0, Math.floor(n / 10) * 10 - 10);
  const to = Math.min(100, from + 30);
  return exercise({
    factId: `marked:${n}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: say('ex.marked.spoken'),
    visual: { type: 'numberLine', from, to, start: n, hops: 0, step: 1 },
    answer: n,
    input: { type: 'choices', choices: choicesAround(rng, n, 0, 100, 4) },
    hints: [
      hint(say('ex.marked.hint1')),
      hint(say('ex.marked.hint2', { from: from, to: from + 10 })),
      exampleHint(String(from + 3), say('ex.marked.solution', { n: from + 3 })),
    ],
    solution: say('ex.marked.solution', { n }),
  });
}

/** Skip counting: "10, 20, 30, ?" */
function skip(level: number, step: 2 | 5 | 10, start: number, count: number, rng: Rng): Exercise {
  const seq = range(0, count - 1).map((i) => start + i * step);
  const answer = start + count * step;
  const shown = seq.join(', ');
  const spokenSeq = seq.map((_, i) => `{n${i}}`).join(', ');
  const slots = Object.fromEntries(seq.map((v, i) => [`n${i}`, v]));
  return exercise({
    factId: `skip${step}:${start}:${count}`,
    topicId: ID,
    level,
    prompt: t('ex.skip.prompt'),
    display: `${shown}, ?`,
    spoken: compose(t('ex.skip.spoken').replace('{seq}', spokenSeq), slots),
    answer,
    input: { type: 'choices', choices: choicesAround(rng, answer, 0, 100, 4) },
    hints: [
      hint(say('ex.skip.hint1', { step })),
      // The hops of the sequence so far; the next one is the child's, landing on "?".
      hint(say('hint.numberLineStep', { step }), {
        visual: {
          type: 'numberLine',
          from: Math.max(0, start - step),
          to: Math.min(100, answer + step),
          start,
          hops: count - 1,
          step,
          hide: answer,
        },
      }),
      // A different step from the exercise, so the example never gives the answer away.
      exampleHint(
        step === 5 ? '10, 20, 30, 40' : '5, 10, 15, 20',
        say(
          'ex.skip.solution',
          step === 5 ? { last: 30, step: 10, next: 40 } : { last: 15, step: 5, next: 20 },
        ),
      ),
    ],
    solution: say('ex.skip.solution', { last: seq.at(-1) ?? start, step, next: answer }),
  });
}

/** Whole tens: hops of ten from the first number, landing on "?". */
const tensHints = (a: number, op: '+' | '-', b: number): [Hint, Hint] => [
  hint(say('ex.tensAdd.hint1')),
  hint(say('hint.numberLine10'), {
    visual: {
      type: 'numberLine',
      from: 0,
      to: 100,
      start: a,
      hops: (op === '+' ? b : -b) / 10,
      step: 10,
      hide: op === '+' ? a + b : a - b,
    },
  }),
];

export const numbers100 = defineTopic({
  id: ID,
  labelKey: 'topic.numbers100',
  grades: [1],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => range(1, 10),
      (tens, rng) => wholeTens(1, tens, rng),
    ),
    closed(
      L(2),
      () => range(11, 99).filter((n) => n % 10 !== 0),
      (n) => build(2, n),
    ),
    closed(
      L(3),
      () =>
        range(11, 99)
          .filter((n) => n % 10 !== 0)
          .flatMap((n) => [
            { n, tens: true },
            { n, tens: false },
          ]),
      (f) => decompose(3, f.n, f.tens),
    ),
    closed(
      L(4),
      () =>
        range(10, 99).flatMap((a) =>
          [a + 1, a + 9, a + 10, a + 11, a - 1, a - 9, a - 10]
            .filter((b) => b >= 10 && b <= 99 && b !== a)
            .map((b) => ({ a, b })),
        ),
      (p) => compare(4, p.a, p.b),
    ),
    closed(
      L(5),
      () =>
        range(10, 98).flatMap((n) => [
          { n, d: 1 as const },
          { n, d: -1 as const },
        ]),
      (f) => neighbour(5, f.n, f.d),
    ),
    closed(
      L(6),
      () =>
        range(10, 89).flatMap((n) =>
          [
            { n, d: 10 as const },
            { n, d: -10 as const },
          ].filter((f) => f.n + f.d >= 0),
        ),
      (f) => neighbour(6, f.n, f.d),
    ),
    closed(
      L(7),
      () => range(1, 99).filter((n) => n % 10 !== 0 || n % 5 === 0),
      (n, rng) => marked(7, n, rng),
    ),
    closed(
      L(8),
      () => [
        ...range(1, 9).flatMap((a) =>
          range(1, 9)
            .filter((b) => a + b <= 10)
            .map((b) => ({ a: a * 10, op: '+' as const, b: b * 10 })),
        ),
        ...range(2, 10).flatMap((a) =>
          range(1, 9)
            .filter((b) => b < a)
            .map((b) => ({ a: a * 10, op: '-' as const, b: b * 10 })),
        ),
      ],
      (f) =>
        arith({
          topicId: ID,
          level: 8,
          a: f.a,
          op: f.op,
          b: f.b,
          hints: tensHints(f.a, f.op, f.b),
          example:
            f.a === 30 && f.b === 20
              ? { a: 40, b: 20 }
              : f.op === '+'
                ? { a: 30, b: 20 }
                : { a: 50, b: 20 },
          input: numpad(3),
        }),
    ),
    closed(
      L(9),
      () => [
        ...range(1, 9).flatMap((tens) =>
          range(1, 9).map((u) => ({ a: tens * 10, op: '+' as const, b: u })),
        ),
        ...range(1, 9).flatMap((tens) =>
          range(1, 9).map((u) => ({ a: tens * 10 + u, op: '-' as const, b: u })),
        ),
        ...range(1, 9).flatMap((tens) =>
          range(1, 9).map((u) => ({ a: tens * 10 + u, op: '-' as const, b: tens * 10 })),
        ),
      ],
      (f) =>
        arith({
          topicId: ID,
          level: 9,
          a: f.a,
          op: f.op,
          b: f.b,
          hints: [
            hint(say('ex.tensUnits.hint1')),
            // A hint that shows the way without the result (splitting 77 or 89 would show it).
            hint(
              say(
                f.op === '+'
                  ? 'ex.tensUnits.hint2add'
                  : f.b < 10
                    ? 'ex.tensUnits.hint2subUnits'
                    : 'ex.tensUnits.hint2subTens',
              ),
            ),
          ],
          example: f.op === '+' ? { a: 50, b: 3 } : f.b < 10 ? { a: 53, b: 3 } : { a: 53, b: 50 },
          input: numpad(2),
        }),
    ),
    closed(
      L(10),
      () => [
        ...[10, 5, 2].flatMap((step) =>
          range(0, 4).flatMap((k) => [
            { step: step as 2 | 5 | 10, start: step * (k + 1), count: 3 },
          ]),
        ),
        ...range(1, 9).map((tens) => ({ to100: tens * 10 })),
      ],
      (f, rng) =>
        'to100' in f
          ? arith({
              topicId: ID,
              level: 10,
              a: f.to100,
              op: '+',
              b: 100 - f.to100,
              missing: 'b',
              // Hops of ten, and then how much they are: not "how many hops" (that leads to 4 for 40).
              hints: [
                hint(say('ex.to100.hint1tens', { a: f.to100 })),
                hint(say('hint.numberLine10'), {
                  visual: {
                    type: 'numberLine',
                    from: 0,
                    to: 100,
                    start: f.to100,
                    hops: (100 - f.to100) / 10,
                    step: 10,
                  },
                }),
              ],
              example: { a: 30, b: 70 },
              input: numpad(3),
            })
          : skip(10, f.step, f.start, f.count, rng),
    ),
  ],
});
