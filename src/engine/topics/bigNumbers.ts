import { t } from '@/i18n';
import { compose } from '@/lang/compose';
import { numberToWords, type Noun } from '@/lang/hebrewNumbers';
import {
  arith,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  say,
  SHEKELS,
  wordProblem,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';

/**
 * World 9, grade 4: "מספרים גדולים", up to a million. Reading numbers (a
 * dictation: words to digits), place value, comparing, rounding, multiplying
 * and dividing by 10, 100 and 1,000, column addition and subtraction, mental
 * sums of round numbers, word problems.
 */

const ID = 'big-numbers';
const ZERO: Noun = { singular: 'אפס', plural: 'אפסים', gender: 'm' };
const L = (n: number) => `level.bigNumbers.${n}`;

const PLACE_KEYS = [
  'place.units',
  'place.tens',
  'place.hundreds',
  'place.thousands',
  'place.tenThousands',
  'place.hundredThousands',
] as const;

/** A random number with `digits` digits, some of them zero, like real ones (340,205). */
function bigNumber(rng: Rng, digits: 5 | 6): number {
  let n = randInt(rng, 1, 9);
  for (let i = 1; i < digits; i++) n = n * 10 + (rng() < 0.25 ? 0 : randInt(rng, 0, 9));
  return n;
}

/** Dictation: the number in words; the child writes it in digits. */
function dictation(rng: Rng): Exercise {
  const n = bigNumber(rng, rng() < 0.5 ? 5 : 6);
  const words = numberToWords(n);
  const spoken = compose(`${t('ex.dictation.spoken')} {n}.`, { n });
  const exN = n === 40_250 ? 302_017 : 40_250;
  return exercise({
    factId: `dict:${n}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.dictation.prompt', { params: { words } }),
    display: '',
    spoken,
    answer: n,
    input: numpad(6),
    hints: [
      hint(say('ex.dictation.hint1')),
      hint(say('ex.dictation.hint2'), { visual: { type: 'placeValue', n: exN } }),
      exampleHint(String(exN), say('ex.dictation.solution', { n: exN })),
    ],
    solution: say('ex.dictation.solution', { n }),
    // Missing zeros (40,250 typed as 4,250) is the classic slip.
    diagnose: (v) => (String(v).length !== String(n).length ? 'placeValue' : null),
  });
}

function placeValue(rng: Rng): Exercise {
  // The digit asked about appears once in the number: "the 4 in 203,424" would have two answers.
  const once = (digits: number[]) =>
    digits
      .map((d, i) => ({ d, i }))
      .filter((x) => x.d !== 0 && x.i >= 2 && digits.filter((y) => y === x.d).length === 1);
  let n = bigNumber(rng, 6);
  let digits = String(n).split('').map(Number).reverse();
  let candidates = once(digits);
  while (candidates.length === 0) {
    n = bigNumber(rng, 6);
    digits = String(n).split('').map(Number).reverse();
    candidates = once(digits);
  }
  const { d, i } = pick(rng, candidates);
  const answer = d * 10 ** i;
  return exercise({
    factId: `bpv:${n}:${i}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.placeValue.prompt', { params: { d, n } }),
    display: String(n),
    spoken: say('ex.placeValue.spoken', { d, n }),
    answer,
    input: numpad(6),
    hints: [
      hint(say('ex.placeValue.hint1', { d, place: t(PLACE_KEYS[i] ?? 'place.units') })),
      hint(say('ex.placeValue.hint2'), {
        visual: { type: 'placeValue', n: n === 352_418 ? 241_635 : 352_418 },
      }),
      exampleHint(
        '352,418: 5 → 50,000',
        say('ex.placeValue.solution', { d: 5, n: 352_418, v: 50_000 }),
      ),
    ],
    solution: say('ex.placeValue.solution', { d, n, v: answer }),
    diagnose: (v) =>
      [0, 1, 2, 3, 4, 5].some((k) => k !== i && v === d * 10 ** k) ? 'placeValue' : null,
  });
}

function compare(rng: Rng): Exercise {
  const a = bigNumber(rng, 6);
  const b = pick(rng, [
    a + 1000,
    a - 1000,
    a + 10_000,
    a - 100,
    Math.floor(a / 10),
    bigNumber(rng, 6),
  ]);
  if (b === a || b < 10_000 || b > 999_999) return compare(rng);
  return exercise({
    factId: `bcmp:${a},${b}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.bigger.prompt'),
    display: '', // the two numbers are the answer buttons
    spoken: say('ex.bigger.spoken', { a, b }),
    answer: a > b ? 0 : 1,
    input: labelledChoices([String(a), String(b)]),
    hints: [
      hint(say('ex.compareBig.hint1')),
      hint(say('ex.compare4.hint1')),
      exampleHint('305,000 > 298,999', say('ex.bigger.solution', { w: 305_000, l: 298_999 })),
    ],
    solution: say('ex.bigger.solution', { w: Math.max(a, b), l: Math.min(a, b) }),
  });
}

const ROUND_PLACES = [
  { to: 1000, key: 'place.thousands' },
  { to: 10_000, key: 'place.tenThousands' },
  { to: 100_000, key: 'place.hundredThousands' },
] as const;

function rounding(rng: Rng): Exercise {
  const { to, key } = pick(rng, ROUND_PLACES);
  const n = bigNumber(rng, 6);
  if (n % to === 0 || (n % to) * 2 === to) return rounding(rng);
  const answer = Math.round(n / to) * to;
  const lower = Math.floor(n / to) * to;
  const place = t(key);
  const exN = 347_200;
  const exR = Math.round(exN / to) * to;
  return exercise({
    factId: `bround${to}:${n}`,
    topicId: ID,
    level: 4,
    prompt: t('ex.roundTo.prompt', { params: { n, place } }),
    display: String(n),
    spoken: say('ex.roundTo.prompt', { n, place }),
    answer,
    input: numpad(7),
    hints: [
      hint(say('ex.round.hint1', { n, lo: lower, hi: lower + to })),
      hint(say('ex.round.hint2', { half: lower + to / 2 })),
      exampleHint(`${exN} → ${exR}`, say('ex.roundTo.solution', { n: exN, place, r: exR })),
    ],
    solution: say('ex.roundTo.solution', { n, place, r: answer }),
  });
}

function timesPower(rng: Rng): Exercise {
  const k = pick(rng, [10, 100, 1000]);
  const a = randInt(rng, 2, k === 1000 ? 999 : 9999);
  return arith({
    topicId: ID,
    level: 5,
    a,
    op: '×',
    b: k,
    hints: [
      hint(say('hint.timesPower', { z: { n: String(k).length - 1, noun: ZERO } })),
      hint(say('hint.timesPower2')),
    ],
    example: { a: 37, b: k },
    input: numpad(7),
  });
}

function dividePower(rng: Rng): Exercise {
  const k = pick(rng, [10, 100, 1000]);
  const q = randInt(rng, 2, 999);
  return arith({
    topicId: ID,
    level: 6,
    a: q * k,
    op: '÷',
    b: k,
    hints: [
      hint(say('hint.dividePower', { z: { n: String(k).length - 1, noun: ZERO } })),
      hint(say('hint.dividePower2')),
    ],
    example: { a: 37 * k, b: k },
    input: numpad(6),
  });
}

function columnHints(op: '+' | '-'): [Hint, Hint] {
  return [
    hint(say(op === '+' ? 'hint.column.add' : 'hint.column.sub')),
    hint(say(op === '+' ? 'hint.column.carry' : 'hint.column.borrow')),
  ];
}

function column(level: number, op: '+' | '-'): (rng: Rng) => Exercise {
  return (rng) => {
    let a = randInt(rng, 10_000, 600_000);
    let b = randInt(rng, 1000, 400_000);
    if (op === '-' && a < b) [a, b] = [b, a];
    return arith({
      topicId: ID,
      level,
      a,
      op,
      b,
      hints: columnHints(op),
      example: op === '+' ? { a: 24_315, b: 13_472 } : { a: 52_400, b: 18_250 },
      input: numpad(7),
    });
  };
}

function roundSums(rng: Rng): Exercise {
  const op = rng() < 0.5 ? '+' : '-';
  const unit = pick(rng, [1000, 10_000]);
  let a = randInt(rng, 3, 90) * unit;
  let b = randInt(rng, 1, 60) * unit;
  if (op === '-' && a < b) [a, b] = [b, a];
  if (op === '-' && a === b) a += unit;
  // Grade 4 works up to a million.
  if (op === '+' && a + b >= 1_000_000) return roundSums(rng);
  return arith({
    topicId: ID,
    level: 9,
    a,
    op,
    b,
    hints: [
      hint(
        say('hint.roundSums', {
          unit: unit === 1000 ? t('place.thousands') : t('place.tenThousands'),
        }),
      ),
      hint(say('hint.roundSums2')),
    ],
    example: op === '+' ? { a: 340_000, b: 25_000 } : { a: 500_000, b: 120_000 },
    input: numpad(7),
  });
}

function word(rng: Rng): Exercise {
  if (rng() < 0.5) {
    const a = randInt(rng, 10, 400) * 100;
    const b = randInt(rng, 10, 400) * 100;
    return wordProblem({
      topicId: ID,
      level: 10,
      key: 'wp.save',
      rng,
      a,
      op: '+',
      b,
      example: { a: 12_500, b: 4300 },
      input: numpad(6),
      nouns: SHEKELS,
    });
  }
  const a = randInt(rng, 100, 900) * 100;
  const b = randInt(rng, 10, Math.floor(a / 100) - 5) * 100;
  return wordProblem({
    topicId: ID,
    level: 10,
    key: pick(rng, ['wp.spend', 'wp.compare'] as const),
    rng,
    a,
    op: '-',
    b,
    example: { a: 24_000, b: 8500 },
    input: numpad(6),
    nouns: SHEKELS,
  });
}

export const bigNumbers = defineTopic({
  id: ID,
  labelKey: 'topic.bigNumbers',
  grades: [4],
  startLevel: () => 1,
  levels: [
    open(L(1), dictation),
    open(L(2), placeValue),
    open(L(3), compare),
    open(L(4), rounding),
    open(L(5), timesPower),
    open(L(6), dividePower),
    open(L(7), column(7, '+')),
    open(L(8), column(8, '-')),
    open(L(9), roundSums),
    open(L(10), word),
  ],
});
