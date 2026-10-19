import { t } from '@/i18n';
import {
  arith,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  say,
  SHEKELS,
  wordProblem,
  spreadChoices,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';

/**
 * World 7, grade 3: "מספרים עד 10,000". Reading and building numbers, place
 * value, comparing, rounding, column addition and subtraction, estimation.
 * Everything is open: the sentences are assembled from clips.
 */

const ID = 'numbers-10000';
const L = (n: number) => `level.numbers10000.${n}`;

const PLACE_NAMES = ['place.units', 'place.tens', 'place.hundreds', 'place.thousands'] as const;

function digitsOf(n: number): number[] {
  return String(n).split('').map(Number).reverse(); // index = power of ten
}

/** "3 thousands, 4 hundreds, 5 tens, 2 units: which number?" */
function build(rng: Rng): Exercise {
  const n = randInt(rng, 1001, 9999);
  const [u = 0, te = 0, h = 0, th = 0] = digitsOf(n);
  const prompt = t('ex.build4.prompt', { params: { th, h, te, u } });
  const spoken = say('ex.build4.spoken', { th, h, te, u });
  const exN = n === 3452 ? 2715 : 3452;
  const [eu = 0, ete = 0, eh = 0, eth = 0] = digitsOf(exN);
  return exercise({
    factId: `build4:${n}`,
    topicId: ID,
    level: 1,
    prompt,
    display: '',
    spoken,
    answer: n,
    input: numpad(4),
    hints: [
      hint(say('ex.build4.hint1')),
      hint(say('ex.build4.hint2'), { visual: { type: 'placeValue', n: exN } }),
      exampleHint(
        `${eth}000 + ${eh}00 + ${ete}0 + ${eu} = ${exN}`,
        say('ex.build4.solution', { th: eth, h: eh, te: ete, u: eu, n: exN }),
      ),
    ],
    solution: say('ex.build4.solution', { th, h, te, u, n }),
    diagnose: (v) =>
      v === th + h + te + u ? 'placeValue' : String(v).length !== 4 ? 'placeValue' : null,
  });
}

/** "What is the value of the digit 4 in 3,452?" */
function placeValue(rng: Rng): Exercise {
  // The digit asked about appears once in the number: "the 4 in 4,214" would have two answers.
  let n = randInt(rng, 1000, 9999);
  let digits = digitsOf(n);
  let candidates = digits
    .map((d, i) => ({ d, i }))
    .filter((x) => x.d !== 0 && digits.filter((y) => y === x.d).length === 1);
  while (candidates.length === 0) {
    n = randInt(rng, 1000, 9999);
    digits = digitsOf(n);
    candidates = digits
      .map((d, i) => ({ d, i }))
      .filter((x) => x.d !== 0 && digits.filter((y) => y === x.d).length === 1);
  }
  const { d, i } = pick(rng, candidates);
  const answer = d * 10 ** i;
  const prompt = t('ex.placeValue.prompt', { params: { d, n } });
  const spoken = say('ex.placeValue.spoken', { d, n });
  const placeKey = PLACE_NAMES[i] ?? 'place.units';
  return exercise({
    factId: `pv:${n}:${i}`,
    topicId: ID,
    level: 2,
    prompt,
    display: String(n),
    spoken,
    answer,
    input: numpad(4),
    hints: [
      hint(say('ex.placeValue.hint1', { d, place: t(placeKey) })),
      hint(say('ex.placeValue.hint2'), {
        visual: { type: 'placeValue', n: n === 3452 ? 2715 : 3452 },
      }),
      // Not an example whose value is this exercise's answer: it would give it away.
      exampleAvoiding(answer, [
        {
          answer: 400,
          hint: () =>
            exampleHint('3452: 4 → 400', say('ex.placeValue.solution', { d: 4, n: 3452, v: 400 })),
        },
        {
          answer: 700,
          hint: () =>
            exampleHint('2715: 7 → 700', say('ex.placeValue.solution', { d: 7, n: 2715, v: 700 })),
        },
      ]),
    ],
    solution: say('ex.placeValue.solution', { d, n, v: answer }),
    // The digit itself, or the digit at another place (400 → 40): place value.
    diagnose: (v) => ([0, 1, 2, 3].some((k) => k !== i && v === d * 10 ** k) ? 'placeValue' : null),
  });
}

function compare(rng: Rng): Exercise {
  const a = randInt(rng, 1000, 9999);
  const kind = pick(rng, ['sameThousands', 'close', 'any'] as const);
  const b =
    kind === 'sameThousands'
      ? Math.floor(a / 1000) * 1000 + randInt(rng, 0, 999)
      : kind === 'close'
        ? a + pick(rng, [1, 10, 100, -1, -10, -100])
        : randInt(rng, 1000, 9999);
  if (b === a || b < 1000 || b > 9999) return compare(rng);
  return exercise({
    factId: `cmp:${a},${b}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.bigger.prompt'),
    display: '', // the two numbers are the answer buttons
    spoken: say('ex.bigger.spoken', { a, b }),
    answer: a > b ? 0 : 1,
    input: labelledChoices([String(a), String(b)]),
    hints: [
      hint(say('ex.compare4.hint1')),
      hint(say('ex.compare4.hint2'), { visual: { type: 'placeValue', n: a } }),
      exampleHint('4,205 > 4,189', say('ex.bigger.solution', { w: 4205, l: 4189 })),
    ],
    solution: say('ex.bigger.solution', { w: Math.max(a, b), l: Math.min(a, b) }),
  });
}

function rounding(rng: Rng): Exercise {
  const to = pick(rng, [10, 100, 1000] as const);
  const n = randInt(rng, to === 1000 ? 1050 : 105, 9994);
  if (n % to === 0 || (n % to) * 2 === to) return rounding(rng);
  const answer = Math.round(n / to) * to;
  const key = to === 10 ? 'tens' : to === 100 ? 'hundreds' : 'thousands';
  const prompt = t(`ex.round.prompt.${key}` as const, { params: { n } });
  const spoken = say(`ex.round.prompt.${key}` as const, { n });
  const lower = Math.floor(n / to) * to;
  // Two examples for each place, so one never rounds to this exercise's answer.
  const exNs = to === 10 ? [347, 862] : to === 100 ? [1264, 5738] : [3720, 6180];
  return exercise({
    factId: `round${to}:${n}`,
    topicId: ID,
    level: 4,
    prompt,
    display: String(n),
    spoken,
    answer,
    // Rounding up can reach 10,000: five digits.
    input: numpad(5),
    hints: [
      hint(say('ex.round.hint1', { n, lo: lower, hi: lower + to })),
      hint(say('ex.round.hint2', { half: lower + to / 2 })),
      exampleAvoiding(
        answer,
        exNs.map((exN) => {
          const r = Math.round(exN / to) * to;
          return {
            answer: r,
            hint: () =>
              exampleHint(`${exN} → ${r}`, say(`ex.round.solution.${key}` as const, { n: exN, r })),
          };
        }),
      ),
    ],
    solution: say(`ex.round.solution.${key}` as const, { n, r: answer }),
    diagnose: (v) => (v === lower || v === lower + to ? 'other' : null),
  });
}

function columnHints(op: '+' | '-'): [Hint, Hint] {
  return [
    hint(say(op === '+' ? 'hint.column.add' : 'hint.column.sub')),
    hint(say(op === '+' ? 'hint.column.carry' : 'hint.column.borrow')),
  ];
}

function column(level: number, op: '+' | '-', lo: number, hi: number): (rng: Rng) => Exercise {
  return (rng) => {
    let a = randInt(rng, lo, hi);
    let b = randInt(rng, lo, hi);
    if (op === '+' && a + b > 9999) [a, b] = [Math.floor(a / 2), Math.floor(b / 2)];
    if (op === '-' && a < b) [a, b] = [b, a];
    if (op === '-' && a === b) b = Math.max(lo, b - 7);
    const ex = op === '+' ? { a: 1234, b: 2345 } : { a: 5432, b: 1234 };
    return arith({
      topicId: ID,
      level,
      a,
      op,
      b,
      hints: columnHints(op),
      example: lo < 1000 ? (op === '+' ? { a: 234, b: 345 } : { a: 543, b: 234 }) : ex,
      input: numpad(4),
    });
  };
}

/** "About how much is 398 + 203?" with three round options. */
function estimate(rng: Rng): Exercise {
  const a = randInt(rng, 150, 4800);
  const b = randInt(rng, 150, 4800);
  const op = rng() < 0.6 ? '+' : '-';
  const [x, y] = op === '-' && a < b ? [b, a] : [a, b];
  // Estimation as taught: round each number to the hundred, then compute.
  const answer =
    op === '+'
      ? Math.round(x / 100) * 100 + Math.round(y / 100) * 100
      : Math.round(x / 100) * 100 - Math.round(y / 100) * 100;
  const chosen = spreadChoices(rng, answer, { deltas: [100, 200], min: 0, mix: true });
  const labels = chosen.map((v) => String(v));
  const prompt = t('ex.estimate.prompt');
  const rx = Math.round(x / 100) * 100;
  const ry = Math.round(y / 100) * 100;
  return exercise({
    factId: `est:${x}${op}${y}`,
    topicId: ID,
    level: 9,
    prompt,
    display: `${x} ${op === '-' ? '−' : '+'} ${y} ≈ ?`,
    spoken: say(op === '+' ? 'ex.estimate.spokenAdd' : 'ex.estimate.spokenSub', { a: x, b: y }),
    answer: chosen.indexOf(answer),
    operation: op === '+' ? 'add' : 'sub',
    input: labelledChoices(labels),
    hints: [
      hint(say('ex.estimate.hint1')),
      hint(say('ex.estimate.hint2', { a: rx, b: ry }), {
        example: {
          display: `${rx} ${op === '-' ? '−' : '+'} ${ry}`,
          spoken: say('ex.estimate.hint2', { a: rx, b: ry }),
        },
      }),
      exampleHint('398 + 203 ≈ 600', say('ex.estimate.solution', { a: 400, b: 200, r: 600 })),
    ],
    solution: say(op === '+' ? 'ex.estimate.solution' : 'ex.estimate.solutionSub', {
      a: rx,
      b: ry,
      r: op === '+' ? rx + ry : rx - ry,
    }),
  });
}

function word(rng: Rng): Exercise {
  const add = rng() < 0.5;
  if (add) {
    const a = randInt(rng, 120, 4500);
    const b = randInt(rng, 120, 4500);
    return wordProblem({
      topicId: ID,
      level: 10,
      key: 'wp.save',
      rng,
      a,
      op: '+',
      b,
      example: { a: 1250, b: 430 },
      input: numpad(4),
      nouns: SHEKELS,
    });
  }
  const a = randInt(rng, 500, 9000);
  const b = randInt(rng, 100, a - 50);
  return wordProblem({
    topicId: ID,
    level: 10,
    key: pick(rng, ['wp.spend', 'wp.compare'] as const),
    rng,
    a,
    op: '-',
    b,
    example: { a: 2400, b: 850 },
    input: numpad(4),
    nouns: SHEKELS,
  });
}

export const numbers10000 = defineTopic({
  id: ID,
  labelKey: 'topic.numbers10000',
  grades: [3],
  startLevel: () => 1,
  levels: [
    open(L(1), build),
    open(L(2), placeValue),
    open(L(3), compare),
    open(L(4), rounding),
    open(L(5), column(5, '+', 100, 899)),
    open(L(6), column(6, '-', 100, 999)),
    open(L(7), column(7, '+', 1000, 8999)),
    open(L(8), column(8, '-', 1000, 9999)),
    open(L(9), estimate),
    open(L(10), word),
  ],
});
