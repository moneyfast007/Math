import { shown } from '@/lang/compose';
import { t } from '@/i18n';
import { displayFraction as f, fractionWords as w } from '@/lang/fractions';
import type { MistakeKind } from '@/state/schema';
import {
  arith,
  CHARACTERS,
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  range,
  round,
  say,
  sayText,
  type AdviceSpec,
  type Character,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';
import type { Noun } from '@/lang/hebrewNumbers';

const TENTH: Noun = { singular: 'עשירית', plural: 'עשיריות', gender: 'f' };

/** Digits after the point: 3.25 → 2. */
const places = (x: number): number => String(x).split('.')[1]?.length ?? 0;
/** The hundredths after the point, as a whole number: 8.7 → 70, 8.68 → 68. */
const hundredthsOf = (x: number): number => Math.round((x - Math.floor(x)) * 100);

/**
 * World 12, grade 4: "שברים עשרוניים". Tenths and hundredths as fractions and
 * as decimals, comparing (including the 0.5 / 0.45 trap), adding and
 * subtracting, rounding to a whole number, measurement word problems.
 */

const ID = 'decimals';
const L = (n: number) => `level.decimals.${n}`;

/** A decimal answer off by a factor of ten is a place-value slip. */
function decimalDiagnose(answer: number): (v: number) => MistakeKind | null {
  return (v) => {
    if (Math.abs(round(v * 10, 4) - answer) < 1e-9 || Math.abs(round(v / 10, 4) - answer) < 1e-9)
      return 'placeValue';
    if (Math.abs(round(v * 100, 4) - answer) < 1e-9 || Math.abs(round(v / 100, 4) - answer) < 1e-9)
      return 'placeValue';
    return null;
  };
}

/** 0.7 = ?/10, 1.3 = ?/10 (a whole is ten tenths), 0.35 = ?/100 */
function toFraction(level: 1 | 2, n: number): Exercise {
  const den = level === 1 ? 10 : 100;
  const x = round(n / den, 2);
  const overOne = n > den;
  // Two examples, so the one shown never has this answer.
  const ex = level === 1 ? (overOne ? (n === 14 ? 16 : 14) : n === 3 ? 7 : 3) : n === 25 ? 75 : 25;
  return exercise({
    factId: `dfrac:${x}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.expand.prompt'),
    display: `${x} = ?/${den}`,
    spoken: sayText(`{x} ${t(level === 1 ? 'ex.dec.toFrac.tenths' : 'ex.dec.toFrac.hundredths')}`, {
      x,
    }),
    // A bar of ten for tenths (a full row and the rest for more than one). Hundredths
    // have no picture of their own (the grid would be the answer, counted); a hundred
    // grid comes as hint 2.
    ...(level === 1
      ? {
          visual: overOne
            ? ({ type: 'array', rows: 1, cols: 10, squares: true, extra: n - 10 } as const)
            : ({ type: 'fraction', parts: 10, shaded: n } as const),
        }
      : {}),
    answer: n,
    input: numpad(2),
    hints: [
      hint(
        say(
          overOne
            ? 'g4.dec.tenthsWhole.hint1'
            : level === 1
              ? 'ex.dec.tenths.hint1'
              : 'ex.dec.hundredths.hint1',
        ),
      ),
      level === 1 ? hint(say('g4.dec.place.hint2')) : gridHint(n),
      exampleHint(
        `${round(ex / den, 2)} = ${f(ex, den)}`,
        say('eq.isWords', { x: round(ex / den, 2), words: w(ex, den) }),
      ),
    ],
    solution: say('eq.isWords', { x, words: w(n, den) }),
    advice:
      level === 1
        ? // 1.3 = 3/10: the whole left out.
          overOne
          ? [{ value: n - 10, say: say('g4.dec.adv.whole', { v: n - 10 }), kind: 'placeValue' }]
          : []
        : n < 10
          ? // 0.05 = 50/100: the zero tenths read as tenths.
            [{ value: n * 10, say: say('g4.dec.adv.zeroTenth'), kind: 'placeValue' }]
          : // 0.37 = 3/100: only the tenths.
            [
              {
                value: Math.floor(n / 10),
                say: say('g4.dec.adv.tenthsOnly', { v: Math.floor(n / 10) }),
                kind: 'placeValue',
              },
            ],
  });
}

/** Hint 2 for hundredths: a hundred grid, `n` squares shaded (each a hundredth, a row a tenth). */
function gridHint(n: number) {
  return hint(say('g4.dec.grid.hint2'), {
    visual: { type: 'grid', rows: 10, cols: 10, shaded: n },
  });
}

/** 7/10 = ?, 35/100 = ? (decimal answer). */
function fromFraction(n: number, den: 10 | 100): Exercise {
  const x = round(n / den, 2);
  const ex =
    den === 10
      ? n === 3
        ? { n: 7, den }
        : { n: 3, den }
      : n === 25
        ? { n: 75, den }
        : { n: 25, den };
  return exercise({
    factId: `dfrom:${n}/${den}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.dec.fromFrac.prompt'),
    display: `${f(n, den)} = ?`,
    spoken: say('ex.dec.fromFrac.spoken', { words: w(n, den) }),
    answer: x,
    input: numpad(3, true),
    hints: [
      hint(say(den === 10 ? 'ex.dec.tenths.hint1' : 'ex.dec.hundredths.hint1')),
      den === 100 ? gridHint(n) : hint(say('g4.dec.place.hint2')),
      exampleHint(
        `${f(ex.n, ex.den)} = ${round(ex.n / ex.den, 2)}`,
        say('eq.wordsIs', { words: w(ex.n, ex.den), x: round(ex.n / ex.den, 2) }),
      ),
    ],
    solution: say('eq.wordsIs', { words: w(n, den), x }),
    diagnose: decimalDiagnose(x),
    // The right digits with the point moved: a whole number, too few or too many places.
    advice: [100, 10, 0.1, 0.01].map((k): AdviceSpec => {
      const v = round(x * k, 6);
      return {
        value: v,
        say: Number.isInteger(v)
          ? say('g4.dec.adv.int', { v, frac: w(n, den) })
          : places(v) < (den === 10 ? 1 : 2)
            ? say('g4.dec.adv.oneDigit', { v })
            : say('g4.dec.adv.manyDigits', { v }),
        kind: 'decimalPoint',
      };
    }),
  });
}

function compareExercise(level: number, a: number, b: number): Exercise {
  return exercise({
    factId: `dcmp:${a},${b}`,
    topicId: ID,
    level,
    prompt: t('ex.bigger.prompt'),
    display: '', // the two numbers are the answer buttons
    spoken: say('ex.bigger.spoken', { a, b }),
    answer: a > b ? 0 : 1,
    input: labelledChoices([String(a), String(b)]),
    hints: [
      hint(say('ex.dec.compare.hint1')),
      hint(say('ex.dec.compare.hint2')),
      // Not this pair, in either order; the 0.5 / 0.45 trap only for the level about it.
      level === 4
        ? Math.max(a, b) === 2.35 && Math.min(a, b) === 2.31
          ? exampleHint('3.48 > 3.44', say('ex.bigger.solution', { w: 3.48, l: 3.44 }))
          : exampleHint('2.35 > 2.31', say('ex.bigger.solution', { w: 2.35, l: 2.31 }))
        : Math.max(a, b) === 0.5 && Math.min(a, b) === 0.45
          ? exampleHint('0.6 > 0.58', say('ex.bigger.solution', { w: 0.6, l: 0.58 }))
          : exampleHint('0.5 > 0.45', say('ex.bigger.solution', { w: 0.5, l: 0.45 })),
    ],
    solution: say('ex.bigger.solution', { w: Math.max(a, b), l: Math.min(a, b) }),
    // The smaller one picked: the wholes first, then after the point, in hundredths (8.7 is 8.70).
    advice: [{ value: a > b ? 1 : 0, say: compareAdvice(a, b), kind: 'placeValue' }],
  });
}

function compareAdvice(a: number, b: number) {
  if (Math.floor(a) !== Math.floor(b))
    return say('g4.dec.adv.wholes', { x: Math.floor(a), y: Math.floor(b) });
  if (places(a) !== places(b)) {
    const [s, o] = places(a) < places(b) ? [a, b] : [b, a];
    const t = hundredthsOf(s) / 10;
    return say('g4.dec.adv.pad', {
      s,
      t: { n: t, noun: TENTH },
      tt: hundredthsOf(s),
      h: hundredthsOf(o),
    });
  }
  return say('g4.dec.adv.hundredths', { x: hundredthsOf(a), y: hundredthsOf(b) });
}

/**
 * Adding or subtracting decimals: the numbers written with their last digits under
 * each other rather than point under point (1.25 + 2.5 → 1.5), and a carry (borrow)
 * forgotten between the hundredths and the tenths or the tenths and the wholes.
 */
function decimalSlips(a: number, op: '+' | '-', b: number, answer: number): AdviceSpec[] {
  const out: AdviceSpec[] = [];
  const pa = places(a);
  const pb = places(b);
  if (pa !== pb) {
    const m = Math.max(pa, pb);
    const A = Math.round(a * 10 ** pa);
    const B = Math.round(b * 10 ** pb);
    const v = round((op === '+' ? A + B : A - B) / 10 ** m, 2);
    if (v > 0) out.push({ value: v, say: say('g4.dec.adv.align'), kind: 'decimalPoint' });
  }
  const scale = Math.max(pa, pb) === 2 ? 100 : 10;
  let x = Math.round(a * scale);
  let y = Math.round(b * scale);
  let carry = 0;
  // Place 0 is the last digit after the point; carries into the wholes and no further.
  for (let p = 0; 10 ** p < scale; p++, x = Math.floor(x / 10), y = Math.floor(y / 10)) {
    const col = op === '+' ? (x % 10) + (y % 10) + carry : (x % 10) - (y % 10) - carry;
    carry = op === '+' ? (col >= 10 ? 1 : 0) : col < 0 ? 1 : 0;
    if (carry === 0) continue;
    const k = 10 ** (p + 1) / scale;
    const intoWholes = k === 1;
    out.push(
      op === '+'
        ? {
            value: round(answer - k, 2),
            say: say(intoWholes ? 'g4.dec.adv.carry' : 'g4.dec.adv.carry100'),
            kind: 'carry',
          }
        : {
            value: round(answer + k, 2),
            say: say(intoWholes ? 'g4.dec.adv.borrow' : 'g4.dec.adv.borrow100'),
            kind: 'borrow',
          },
    );
  }
  return out.filter((x) => x.value >= 0);
}

function compareSame(rng: Rng): Exercise {
  const whole = randInt(rng, 0, 9);
  // Now and then the wholes differ: they are compared first.
  const other = rng() < 0.25 ? (whole + randInt(rng, 1, 9)) % 10 : whole;
  const a = round(whole + randInt(rng, 1, 99) / 100, 2);
  const b = round(other + randInt(rng, 1, 99) / 100, 2);
  return a === b ? compareSame(rng) : compareExercise(4, a, b);
}

/** The trap: 0.5 vs 0.45, 2.3 vs 2.28. */
function compareTricky(rng: Rng): Exercise {
  const whole = randInt(rng, 0, 9);
  const tenths = randInt(rng, 2, 9);
  const a = round(whole + tenths / 10, 2);
  // Half the time the shorter number is bigger (0.5 > 0.45), half the time the longer
  // one (0.45 > 0.4): "pick the shorter one" must not pass the level.
  const b =
    rng() < 0.5
      ? round(whole + (tenths - 1) / 10 + randInt(rng, 1, 9) / 100, 2)
      : round(whole + tenths / 10 + randInt(rng, 1, 9) / 100, 2);
  return rng() < 0.5 ? compareExercise(5, a, b) : compareExercise(5, b, a);
}

function addSub(level: 6 | 7 | 8, rng: Rng): Exercise {
  const hundredths = level === 8;
  const scale = hundredths ? 100 : 10;
  const op = level === 7 || (level === 8 && rng() < 0.5) ? '-' : '+';
  let a = randInt(rng, scale + 1, 20 * scale) / scale;
  let b = randInt(rng, 1, 10 * scale) / scale;
  if (op === '-' && a < b) [a, b] = [b, a];
  a = round(a, 2);
  b = round(b, 2);
  // At least one decimal: 3 + 5 is not this world's.
  if (a === b || (Number.isInteger(a) && Number.isInteger(b))) return addSub(level, rng);
  const answer = round(op === '+' ? a + b : a - b, 2);
  return arith({
    topicId: ID,
    level,
    a,
    op,
    b,
    hints: [hint(say('ex.dec.addSub.hint1')), hint(say('ex.dec.addSub.hint2'))],
    example: hundredths
      ? op === '+'
        ? { a: 1.25, b: 2.5 }
        : { a: 3.4, b: 1.15 }
      : op === '+'
        ? { a: 1.5, b: 2.7 }
        : { a: 4.2, b: 1.6 },
    input: numpad(4, true),
    diagnose: decimalDiagnose(answer),
    advice: decimalSlips(a, op, b, answer),
  });
}

function roundToWhole(rng: Rng): Exercise {
  // x.5 too, now and then: "five and up" rounds it up, as hint 2 says.
  const x = round(randInt(rng, 1, 999) / 10, 1);
  if (Number.isInteger(x) || (Math.round(x * 10) % 10 === 5 && rng() < 0.6))
    return roundToWhole(rng);
  const answer = Math.round(x);
  const lo = Math.floor(x);
  return exercise({
    factId: `dround:${x}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.dec.round.prompt', { params: { x } }),
    display: String(x),
    spoken: say('ex.dec.round.prompt', { x }),
    answer,
    input: numpad(3),
    hints: [
      hint(say('ex.round.hint1', { n: x, lo, hi: lo + 1 })),
      hint(say('ex.dec.round.hint2')),
      exampleAvoiding(
        answer,
        [
          { x: 3.7, r: 4 },
          { x: 2.3, r: 2 },
        ].map((ex) => ({
          answer: ex.r,
          hint: () => exampleHint(`${ex.x} → ${ex.r}`, say('ex.dec.round.solution', ex)),
        })),
      ),
    ],
    solution: say('ex.dec.round.solution', { x, r: answer }),
    // Rounded the wrong way: the tenths digit decides.
    advice: [
      {
        value: answer === lo ? lo + 1 : lo,
        say: say('g4.dec.adv.round', { x, t: Math.round(x * 10) % 10 }),
      },
    ],
  });
}

/**
 * Measurement stories. The unit is said in the singular after a decimal
 * ("שלוש נקודה שתיים מטר"), as people say it, so no number has to agree with it.
 * `a` and `b` in tenths: the ranges of each story.
 */
const UNITS = [
  { key: 'wp.dec.flour', op: '+', a: [11, 99], b: [5, 50] },
  { key: 'g4.wp.dec.run', op: '+', a: [11, 99], b: [5, 50] },
  { key: 'g4.wp.dec.ribbon', op: '-', a: [11, 99], b: [5, 50] },
  { key: 'g4.wp.dec.bottle', op: '-', a: [15, 30], b: [2, 12] },
] as const;

/** A tenth that is not a whole number (2.0 would be read "שתיים", without the point). */
function tenths(rng: Rng, lo: number, hi: number): number {
  const n = randInt(rng, lo, hi);
  return n % 10 === 0 ? tenths(rng, lo, hi) : round(n / 10, 1);
}

/** Measurement stories with decimals; the character follows from the numbers. */
function story(rng: Rng): Exercise {
  const u = pick(rng, UNITS);
  const { key, op } = u;
  let a = tenths(rng, u.a[0], u.a[1]);
  let b = tenths(rng, u.b[0], u.b[1]);
  if (op === '-' && a < b) [a, b] = [b, a];
  const answer = round(op === '+' ? a + b : a - b, 1);
  if (answer === 0 || Number.isInteger(answer)) return story(rng);
  const who = CHARACTERS[Math.round(a * 10) % CHARACTERS.length] as Character;
  const spoken = say(`${key}.story`, { name: who.name, a, b }, who.gender);
  const sentence = op === '+' ? '{a} ועוד {b} זה {c}.' : '{a} פחות {b} זה {c}.';
  return exercise({
    factId: `dwp:${key}:${a}:${b}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: op === '+' ? 'add' : 'sub',
    input: numpad(3, true),
    hints: [
      hint(say(`${key}.hint1`)),
      {
        ...hint(say('hint.equation')),
        example: {
          display: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`,
          spoken: say('hint.equation').text,
        },
      },
      exampleAvoiding(
        answer,
        (op === '+'
          ? [
              { a: 1.5, b: 2.4 },
              { a: 2.4, b: 1.3 },
            ]
          : [
              { a: 3.5, b: 1.2 },
              { a: 2.6, b: 1.4 },
            ]
        ).map((ex) => {
          const c = round(op === '+' ? ex.a + ex.b : ex.a - ex.b, 1);
          return {
            answer: c,
            hint: () =>
              exampleHint(
                `${ex.a} ${op === '+' ? '+' : '−'} ${ex.b} = ${c}`,
                sayText(sentence, { a: ex.a, b: ex.b, c }),
              ),
          };
        }),
      ),
    ],
    solution: sayText(sentence, { a, b, c: answer }),
    diagnose: decimalDiagnose(answer),
    advice: decimalSlips(a, op, b, answer),
  });
}

/** Every literal piece of the stories, for every character. */
function storyBank(): string[] {
  const out: string[] = [];
  // "שתי עשיריות" is said with the words around it, one clip: every tenth, to be sure.
  for (let t = 1; t <= 9; t++) out.push(...compareAdvice(round(3 + t / 10, 1), 3.45).parts);
  for (const { key } of UNITS) {
    for (const who of CHARACTERS) {
      out.push(...say(`${key}.story`, { name: who.name, a: 1.5, b: 2.5 }, who.gender).parts);
      out.push(say(`${key}.hint1`).text);
    }
  }
  return out;
}

export const decimals = defineTopic({
  id: ID,
  labelKey: 'topic.decimals',
  // Grade 5 (moved from grade 4): kita4 has no decimals; the grade 5 program does.
  grades: [5],
  startLevel: () => 1,
  extraBank: storyBank,
  levels: [
    // Up to 1.9: more than one is ten tenths and more.
    closed(
      L(1),
      () => [...range(1, 9), ...range(11, 19)],
      (n) => toFraction(1, n),
    ),
    closed(
      L(2),
      () => range(1, 99).filter((n) => n % 10 !== 0),
      (n) => toFraction(2, n),
    ),
    closed(
      L(3),
      () => [
        ...range(1, 9).map((n) => ({ n, den: 10 as const })),
        ...range(1, 99)
          .filter((n) => n % 10 !== 0)
          .map((n) => ({ n, den: 100 as const })),
      ],
      (x) => fromFraction(x.n, x.den),
    ),
    open(L(4), compareSame),
    open(L(5), compareTricky),
    open(L(6), (rng) => addSub(6, rng)),
    open(L(7), (rng) => addSub(7, rng)),
    open(L(8), (rng) => addSub(8, rng)),
    open(L(9), roundToWhole),
    open(L(10), story),
  ],
});
