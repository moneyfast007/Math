import { t } from '@/i18n';
import { compose, shown } from '@/lang/compose';
import { numberToWords } from '@/lang/hebrewNumbers';
import {
  arith,
  defineTopic,
  diagnoseArith,
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
  type WordNoun,
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
const L = (n: number) => `level.bigNumbers.${n}`;

/** "במקום מאות האלפים": the place of a digit (2–5: hundreds to hundred thousands), with the article Hebrew needs. */
const placeAt = (i: number) => t(`g4.pv.at.${Math.min(5, Math.max(2, i))}` as 'g4.pv.at.2');

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
      // First how to find the place (counting from the right); the place itself only in hint 2.
      hint(say('g4.pv.hint1', { d })),
      hint(say('g4.pv.hint2', { d, place: placeAt(i) }), {
        visual: { type: 'placeValue', n: n === 352_418 ? 241_635 : 352_418 },
      }),
      // Not an example whose value is this exercise's answer: it would give it away.
      exampleAvoiding(answer, [
        {
          answer: 50_000,
          hint: () =>
            exampleHint(
              '352,418: 5 → 50,000',
              say('ex.placeValue.solution', { d: 5, n: 352_418, v: 50_000 }),
            ),
        },
        {
          answer: 40_000,
          hint: () =>
            exampleHint(
              '241,635: 4 → 40,000',
              say('ex.placeValue.solution', { d: 4, n: 241_635, v: 40_000 }),
            ),
        },
      ]),
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
      // Counting digits decides only when the lengths differ; otherwise say so.
      hint(
        say(String(a).length === String(b).length ? 'g4.cmp.sameLength' : 'ex.compareBig.hint1'),
      ),
      hint(say('ex.compareBig.place')),
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
      // Two examples, so one never rounds to this exercise's answer.
      exampleAvoiding(
        answer,
        [347_200, 681_350].map((exN) => {
          const exR = Math.round(exN / to) * to;
          return {
            answer: exR,
            hint: () =>
              exampleHint(`${exN} → ${exR}`, say('ex.roundTo.solution', { n: exN, place, r: exR })),
          };
        }),
      ),
    ],
    solution: say('ex.roundTo.solution', { n, place, r: answer }),
  });
}

/** The multiplier, for its own hint sentence (by ten: one zero; by a hundred: two; …). */
const power = (k: number): 10 | 100 | 1000 => (k >= 1000 ? 1000 : k >= 100 ? 100 : 10);

function timesPower(rng: Rng): Exercise {
  const k = pick(rng, [10, 100, 1000]);
  const a = randInt(rng, 2, k === 1000 ? 999 : 9999);
  return arith({
    topicId: ID,
    level: 5,
    a,
    op: '×',
    b: k,
    hints: [hint(say(`hint.timesPower.${power(k)}`)), hint(say('hint.timesPower2'))],
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
    hints: [hint(say(`hint.dividePower.${power(k)}`)), hint(say('hint.dividePower2'))],
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

/** How many columns carry (addition) or borrow (subtraction). */
function regroupings(a: number, b: number, op: '+' | '-'): number {
  let count = 0;
  let carry = 0;
  for (let x = a, y = b; x > 0 || y > 0; x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    const col = op === '+' ? (x % 10) + (y % 10) + carry : (x % 10) - (y % 10) - carry;
    carry = op === '+' ? (col >= 10 ? 1 : 0) : col < 0 ? 1 : 0;
    count += carry;
  }
  return count;
}

/**
 * Typed on one line, so it is worked in the head or on paper: up to five digits and
 * two carries (borrows). Six digits in columns are the vertical world's.
 */
function column(level: number, op: '+' | '-'): (rng: Rng) => Exercise {
  return (rng) => {
    let a: number;
    let b: number;
    do {
      a = randInt(rng, 10_000, 99_999);
      b = randInt(rng, 1000, 89_999);
      if (op === '-' && a < b) [a, b] = [b, a];
    } while (a === b || regroupings(a, b, op) > 2);
    return arith({
      topicId: ID,
      level,
      a,
      op,
      b,
      hints: columnHints(op),
      // Examples that carry (borrow), like the exercises.
      example: op === '+' ? { a: 24_358, b: 13_476 } : { a: 52_400, b: 18_250 },
      input: numpad(6),
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
      hint(say(op === '+' ? 'hint.roundSums2' : 'g4.roundSums2.sub')),
    ],
    example: op === '+' ? { a: 340_000, b: 25_000 } : { a: 500_000, b: 120_000 },
    input: numpad(7),
  });
}

/** Things big numbers count in real life (no birthday money in the tens of thousands). */
const FANS: WordNoun = { singular: 'צופה', plural: 'צופים', gender: 'm' };
const PEOPLE: WordNoun = { singular: 'תושב', plural: 'תושבים', gender: 'm' };
const KM: WordNoun = { singular: 'קילומטר', plural: 'קילומטרים', gender: 'm' };
const SEAT: WordNoun = { singular: 'מקום', plural: 'מקומות', gender: 'm' };
const TICKET: WordNoun = { singular: 'כרטיס', plural: 'כרטיסים', gender: 'm' };
const BOOK: WordNoun = { singular: 'ספר', plural: 'ספרים', gender: 'm' };

const hundreds = (rng: Rng, lo: number, hi: number) =>
  randInt(rng, Math.ceil(lo / 100), Math.floor(hi / 100)) * 100;

/** One step: a crowd, a city, a car, a flight. */
function oneStep(rng: Rng): Exercise {
  const kind = pick(rng, ['stadium', 'city', 'car', 'flight'] as const);
  const common = { topicId: ID, level: 10, rng, input: numpad(6) };
  switch (kind) {
    case 'stadium':
      return wordProblem({
        ...common,
        key: 'g4.wp.stadium',
        a: hundreds(rng, 8000, 32_000),
        op: '+',
        b: hundreds(rng, 8000, 32_000),
        example: { a: 23_500, b: 18_200 },
        nouns: [FANS],
      });
    case 'city':
      return wordProblem({
        ...common,
        key: 'g4.wp.city',
        a: hundreds(rng, 50_000, 600_000),
        op: '+',
        b: hundreds(rng, 1000, 40_000),
        example: { a: 125_000, b: 4300 },
        nouns: [PEOPLE],
      });
    case 'car': {
      const a = hundreds(rng, 90_000, 200_000);
      return wordProblem({
        ...common,
        key: 'g4.wp.car',
        a,
        op: '-',
        b: hundreds(rng, 45_000, a - 5000),
        example: { a: 120_000, b: 86_500 },
        nouns: SHEKELS,
      });
    }
    case 'flight': {
      const a = hundreds(rng, 4000, 15_000);
      return wordProblem({
        ...common,
        key: 'g4.wp.flight',
        a,
        op: '-',
        b: hundreds(rng, 2000, a - 500),
        example: { a: 9200, b: 3800 },
        nouns: [KM],
      });
    }
  }
}

/**
 * Two steps (the curriculum asks for them): seats left after two sales, books after
 * buying and giving away. The equation is the second hint, the solution has an answer sentence.
 */
function twoStep(rng: Rng): Exercise {
  const tickets = rng() < 0.5;
  let a: number;
  let b: number;
  let c: number;
  if (tickets) {
    a = hundreds(rng, 15_000, 35_000);
    b = hundreds(rng, 5000, a / 2);
    c = hundreds(rng, 1000, a - b - 1000);
  } else {
    a = hundreds(rng, 20_000, 90_000);
    b = hundreds(rng, 1000, 9000);
    c = hundreds(rng, 500, 5000);
  }
  const answer = tickets ? a - b - c : a + b - c;
  const key = tickets ? ('g4.wp.tickets' as const) : ('g4.wp.library' as const);
  const op2 = tickets ? '−' : '+';
  const slots = (x: number, y: number, z: number) =>
    tickets
      ? { a: { n: x, noun: SEAT }, b: { n: y, noun: TICKET }, c: z }
      : { a: { n: x, noun: BOOK }, b: { n: y, noun: BOOK }, c: { n: z, noun: BOOK } };
  const solved = (x: number, y: number, z: number, r: number) =>
    say(`${key}.solution` as const, {
      a: x,
      b: y,
      c: z,
      r,
      left: { n: r, noun: tickets ? SEAT : BOOK },
    });
  const spoken = say(`${key}.story` as const, slots(a, b, c));
  const examples = tickets
    ? [
        { a: 30_000, b: 12_500, c: 8000 },
        { a: 40_000, b: 18_000, c: 9500 },
      ]
    : [
        { a: 25_000, b: 3000, c: 1500 },
        { a: 40_000, b: 2500, c: 1000 },
      ];
  return exercise({
    factId: `wp2:${key}:${a}:${b}:${c}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    input: numpad(6),
    hints: [
      hint(say(`${key}.hint1` as const)),
      {
        ...hint(say('hint.equation')),
        example: { display: `${a} ${op2} ${b} − ${c} = ?`, spoken: say('hint.equation').text },
      },
      exampleAvoiding(
        answer,
        examples.map((ex) => {
          const r = tickets ? ex.a - ex.b - ex.c : ex.a + ex.b - ex.c;
          return {
            answer: r,
            hint: () =>
              exampleHint(`${ex.a} ${op2} ${ex.b} − ${ex.c} = ${r}`, solved(ex.a, ex.b, ex.c, r)),
          };
        }),
      ),
    ],
    solution: solved(a, b, c, answer),
    // The usual slips of the last step (a forgotten borrow, a digit off).
    diagnose: (v) => diagnoseArith(v, { a: tickets ? a - b : a + b, op: '-', b: c, answer }),
  });
}

function word(rng: Rng): Exercise {
  return rng() < 0.6 ? oneStep(rng) : twoStep(rng);
}

/** The pieces of the two-step stories (the one-step ones register themselves). */
function storyBank(): string[] {
  const out: string[] = [];
  for (const key of ['g4.wp.tickets', 'g4.wp.library'] as const) {
    const tickets = key === 'g4.wp.tickets';
    out.push(
      ...say(
        `${key}.story` as const,
        tickets
          ? { a: { n: 30_000, noun: SEAT }, b: { n: 12_500, noun: TICKET }, c: 8000 }
          : {
              a: { n: 25_000, noun: BOOK },
              b: { n: 3000, noun: BOOK },
              c: { n: 1500, noun: BOOK },
            },
      ).parts,
      ...say(`${key}.solution` as const, {
        a: 30_000,
        b: 12_500,
        c: 8000,
        r: 9500,
        left: { n: 9500, noun: tickets ? SEAT : BOOK },
      }).parts,
      say(`${key}.hint1` as const).text,
    );
  }
  return out;
}

export const bigNumbers = defineTopic({
  id: ID,
  labelKey: 'topic.bigNumbers',
  grades: [4],
  startLevel: () => 1,
  extraBank: storyBank,
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
