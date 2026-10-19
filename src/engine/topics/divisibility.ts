import { t } from '@/i18n';
import {
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  say,
} from '../build';
import { pick, randInt, shuffle } from '../rng';
import type { Exercise, Rng } from '../types';

/**
 * World "התחלקות ומספרים ראשוניים", grade 4 (the curriculum's divisibility
 * unit: by 2, 5 and 10, by 3, 6 and 9, primes and composites, divisors,
 * powers, and what 0 and 1 do). No other grade has it.
 */

const ID = 'divisibility';
const L = (n: number) => `level.divisibility.${n}`;

const divides = (d: number, n: number) => n % d === 0;
const digitSum = (n: number) =>
  String(n)
    .split('')
    .reduce((s, c) => s + Number(c), 0);
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let k = 2; k * k <= n; k++) if (n % k === 0) return false;
  return true;
};
const divisorsOf = (n: number) =>
  Array.from({ length: n }, (_, i) => i + 1).filter((k) => n % k === 0);

/** "Yes" on the right, where a Hebrew reader starts; the answer is the index. */
const yesNo = () => labelledChoices([t('ex.div.no'), t('ex.div.yes')]);

/** A number that divides by d, or does not, half the time each (so "always yes" cannot pass). */
function numberFor(rng: Rng, d: number, lo: number, hi: number): { n: number; yes: boolean } {
  const yes = rng() < 0.5;
  for (;;) {
    const n = randInt(rng, lo, hi);
    if (divides(d, n) === yes) return { n, yes };
  }
}

/** "Does 4,236 divide by 3?" with the rule of that divisor as the hints. */
function divisibleBy(level: number, d: 2 | 5 | 10 | 3 | 9 | 6, lo: number, hi: number) {
  return (rng: Rng): Exercise => {
    const dd = d === 5 || d === 10 ? pick(rng, [5, 10] as const) : d;
    const { n, yes } = numberFor(rng, dd, lo, hi);
    const s = digitSum(n);
    // The worked example: the other answer than this exercise's, so it never gives it away.
    const ex = [
      { n: dd * 37, yes: true },
      { n: dd * 37 + 1, yes: false },
    ];
    return exercise({
      factId: `div${dd}:${n}`,
      topicId: ID,
      level,
      prompt: t('ex.div.prompt', { params: { n, d: dd } }),
      display: String(n),
      spoken: say('ex.div.spoken', { n, d: dd }),
      answer: yes ? 1 : 0,
      input: yesNo(),
      hints: [
        hint(say(`ex.div.rule${dd}`)),
        dd === 3 || dd === 9 || dd === 6
          ? hint(say('ex.div.sum', { s }))
          : hint(say('ex.div.last', { u: n % 10 })),
        exampleAvoiding(
          yes ? 1 : 0,
          ex.map((x) => ({
            answer: x.yes ? 1 : 0,
            hint: () =>
              exampleHint(
                `${x.n} → ${x.yes ? t('ex.div.yes') : t('ex.div.no')}`,
                say(x.yes ? 'ex.div.solutionYes' : 'ex.div.solutionNo', { n: x.n, d: dd }),
              ),
          })),
        ),
      ],
      solution: say(yes ? 'ex.div.solutionYes' : 'ex.div.solutionNo', { n, d: dd }),
    });
  };
}

/** Which of these does the number divide by? Exactly one of the three does. */
function whichDivisor(rng: Rng): Exercise {
  const set = pick(rng, [
    // Only divisors taught in levels 1–5.
    [2, 5, 9],
    [3, 5, 2],
    [6, 5, 9],
    [10, 3, 9],
  ]);
  let n = 0;
  let right = 0;
  for (;;) {
    n = randInt(rng, 100, 999);
    const ok = set.filter((d) => divides(d, n));
    if (ok.length === 1) {
      right = ok[0] ?? 0;
      break;
    }
  }
  const order = shuffle(rng, set);
  return exercise({
    factId: `which:${n}:${order.join(',')}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.div.which.prompt', { params: { n } }),
    display: String(n),
    spoken: say('ex.div.which.spoken', { n }),
    answer: order.indexOf(right),
    input: labelledChoices(order.map(String)),
    hints: [
      hint(say('ex.div.which.hint1')),
      hint(say('ex.div.which.hint2', { s: digitSum(n), u: n % 10 })),
      // Each example divides by exactly one of 2, 3, 5 and 9; never this answer.
      exampleAvoiding(right, [
        {
          answer: 2,
          hint: () => exampleHint('134 → 2', say('ex.div.solutionYes', { n: 134, d: 2 })),
        },
        {
          answer: 5,
          hint: () => exampleHint('125 → 5', say('ex.div.solutionYes', { n: 125, d: 5 })),
        },
      ]),
    ],
    solution: say('ex.div.solutionYes', { n, d: right }),
  });
}

/** Prime or not? */
function prime(rng: Rng): Exercise {
  const yes = rng() < 0.5;
  let n = 0;
  do n = randInt(rng, 2, 60);
  while (isPrime(n) !== yes);
  const ds = divisorsOf(n);
  const other = ds.find((k) => k !== 1 && k !== n);
  return exercise({
    factId: `prime:${n}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.prime.prompt', { params: { n } }),
    display: String(n),
    spoken: say('ex.prime.spoken', { n }),
    answer: yes ? 1 : 0,
    input: yesNo(),
    hints: [
      hint(say('ex.prime.hint1')),
      hint(say('ex.prime.hint2')),
      exampleAvoiding(yes ? 1 : 0, [
        { answer: 1, hint: () => exampleHint('13 → 1, 13', say('ex.prime.example13')) },
        { answer: 0, hint: () => exampleHint('15 = 3 × 5', say('ex.prime.example15')) },
      ]),
    ],
    solution: yes
      ? say('ex.prime.solutionYes', { n })
      : say('ex.prime.solutionNo', { n, k: other ?? 2 }),
  });
}

/** How many divisors? */
function howManyDivisors(rng: Rng): Exercise {
  const n = pick(rng, [6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 28, 30]);
  const ds = divisorsOf(n);
  return exercise({
    factId: `divs:${n}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.divs.prompt', { params: { n } }),
    display: String(n),
    spoken: say('ex.divs.spoken', { n }),
    answer: ds.length,
    input: numpad(2),
    hints: [
      hint(say('ex.divs.hint1')),
      hint(say('ex.divs.hint2')),
      exampleAvoiding(ds.length, [
        { answer: 4, hint: () => exampleHint('10: 1, 2, 5, 10', say('ex.divs.example10')) },
        { answer: 6, hint: () => exampleHint('12: 1, 2, 3, 4, 6, 12', say('ex.divs.example12')) },
      ]),
    ],
    solution: say('ex.divs.solution', { n, k: ds.length }),
    diagnose: (v) => (v === ds.length - 2 || v === ds.length - 1 ? 'other' : null),
  });
}

const SUP: Record<number, string> = { 2: '²', 3: '³', 4: '⁴' };

/** Powers: 2³ = 2 × 2 × 2. */
function power(rng: Rng): Exercise {
  const [b, e] = pick(rng, [
    [2, 2],
    [2, 3],
    [2, 4],
    [3, 2],
    [3, 3],
    [4, 2],
    [5, 2],
    [5, 3],
    [6, 2],
    [7, 2],
    [8, 2],
    [9, 2],
    [10, 2],
    [10, 3],
  ] as const);
  const answer = b ** e;
  return exercise({
    factId: `pow:${b}^${e}`,
    topicId: ID,
    level: 10,
    prompt: t('ex.arith.prompt'),
    display: `${b}${SUP[e] ?? ''} = ?`,
    spoken: say('ex.pow.spoken', { b, e }),
    answer,
    operation: 'mul',
    input: numpad(4),
    hints: [
      hint(say('ex.pow.hint1', { b, e })),
      hint(say('ex.pow.hint2'), {
        example: {
          display: `${b}${SUP[e] ?? ''} = ${Array.from({ length: e }, () => b).join(' × ')}`,
          spoken: say('ex.pow.hint2'),
        },
      }),
      exampleAvoiding(answer, [
        {
          answer: 8,
          hint: () =>
            exampleHint('2³ = 2 × 2 × 2 = 8', say('ex.pow.example', { b: 2, e: 3, r: 8 })),
        },
        {
          answer: 9,
          hint: () => exampleHint('3² = 3 × 3 = 9', say('ex.pow.example', { b: 3, e: 2, r: 9 })),
        },
      ]),
    ],
    solution: say('ex.pow.example', { b, e, r: answer }),
    // The classic slip: base times exponent (2³ read as 2 × 3).
    diagnose: (v) => (v === b * e ? 'other' : null),
  });
}

/** What 0 and 1 do: n × 0, n × 1, n + 0, n ÷ 1, 0 ÷ n. */
function zeroOne(rng: Rng): Exercise {
  const n = randInt(rng, 12, 999);
  const kind = pick(rng, ['×0', '×1', '+0', '÷1', '0÷'] as const);
  const display =
    kind === '×0'
      ? `${n} × 0 = ?`
      : kind === '×1'
        ? `${n} × 1 = ?`
        : kind === '+0'
          ? `${n} + 0 = ?`
          : kind === '÷1'
            ? `${n} ÷ 1 = ?`
            : `0 ÷ ${n} = ?`;
  const answer = kind === '×0' || kind === '0÷' ? 0 : n;
  const rule = {
    '×0': 'ex.zero.timesZero',
    '×1': 'ex.zero.timesOne',
    '+0': 'ex.zero.plusZero',
    '÷1': 'ex.zero.divOne',
    '0÷': 'ex.zero.zeroDiv',
  } as const;
  return exercise({
    factId: `zo:${kind}:${n}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.arith.prompt'),
    display,
    spoken: say(`${rule[kind]}.spoken`, { n }),
    answer,
    operation: kind === '+0' ? 'add' : kind === '×0' || kind === '×1' ? 'mul' : 'div',
    input: numpad(3),
    hints: [
      hint(say(rule[kind])),
      hint(say('ex.zero.hint2')),
      exampleAvoiding(answer, [
        { answer: 0, hint: () => exampleHint('25 × 0 = 0', say('ex.zero.exampleZero')) },
        { answer: 25, hint: () => exampleHint('25 × 1 = 25', say('ex.zero.exampleOne')) },
      ]),
    ],
    solution: say('eq.answerIs', { r: answer }),
    // n for "× 0", 0 for "× 1", 1 for "÷ 1": mixing up what 0 and 1 do.
    diagnose: (v) => (v === (answer === 0 ? n : 0) || v === 1 ? 'other' : null),
  });
}

export const divisibility = defineTopic({
  id: ID,
  labelKey: 'topic.divisibility',
  grades: [4],
  startLevel: () => 1,
  levels: [
    open(L(1), divisibleBy(1, 2, 10, 300)),
    open(L(2), divisibleBy(2, 5, 10, 500)),
    // What 0 and 1 do: the easiest, early, before the digit-sum rules.
    open(L(3), zeroOne),
    open(L(4), divisibleBy(4, 3, 20, 999)),
    open(L(5), divisibleBy(5, 9, 20, 999)),
    open(L(6), divisibleBy(6, 6, 20, 300)),
    open(L(7), whichDivisor),
    open(L(8), prime),
    open(L(9), howManyDivisors),
    open(L(10), power),
  ],
});
