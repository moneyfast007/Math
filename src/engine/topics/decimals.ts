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
  type Character,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';

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

/** 0.7 = ?/10, 0.35 = ?/100 */
function toFraction(level: 1 | 2, n: number): Exercise {
  const den = level === 1 ? 10 : 100;
  const x = round(n / den, 2);
  const ex = level === 1 ? (n === 3 ? 7 : 3) : n === 25 ? 75 : 25;
  return exercise({
    factId: `dfrac:${x}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.expand.prompt'),
    display: `${x} = ?/${den}`,
    spoken: sayText(`{x} ${t(level === 1 ? 'ex.dec.toFrac.tenths' : 'ex.dec.toFrac.hundredths')}`, {
      x,
    }),
    // A bar of ten for tenths; a hundred cells would be too small to see, so no picture for hundredths.
    ...(level === 1 ? { visual: { type: 'fraction' as const, parts: 10, shaded: n } } : {}),
    answer: n,
    input: numpad(2),
    hints: [
      hint(say(level === 1 ? 'ex.dec.tenths.hint1' : 'ex.dec.hundredths.hint1')),
      hint(say('ex.dec.place.hint2')),
      exampleHint(
        `${round(ex / den, 2)} = ${f(ex, den)}`,
        say('eq.isWords', { x: round(ex / den, 2), words: w(ex, den) }),
      ),
    ],
    solution: say('eq.isWords', { x, words: w(n, den) }),
    diagnose: (v) => (level === 2 && v * 10 === n ? 'placeValue' : null),
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
      hint(say('ex.dec.place.hint2')),
      exampleHint(
        `${f(ex.n, ex.den)} = ${round(ex.n / ex.den, 2)}`,
        say('eq.wordsIs', { words: w(ex.n, ex.den), x: round(ex.n / ex.den, 2) }),
      ),
    ],
    solution: say('eq.wordsIs', { words: w(n, den), x }),
    diagnose: decimalDiagnose(x),
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
      // Not this pair, in either order.
      Math.max(a, b) === 0.5 && Math.min(a, b) === 0.45
        ? exampleHint('0.6 > 0.58', say('ex.bigger.solution', { w: 0.6, l: 0.58 }))
        : exampleHint('0.5 > 0.45', say('ex.bigger.solution', { w: 0.5, l: 0.45 })),
    ],
    solution: say('ex.bigger.solution', { w: Math.max(a, b), l: Math.min(a, b) }),
  });
}

function compareSame(rng: Rng): Exercise {
  const whole = randInt(rng, 0, 9);
  const a = round(whole + randInt(rng, 1, 99) / 100, 2);
  const b = round(whole + randInt(rng, 1, 99) / 100, 2);
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
  if (a === b) return addSub(level, rng);
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
  });
}

function roundToWhole(rng: Rng): Exercise {
  const x = round(randInt(rng, 1, 999) / 10, 1);
  if (Math.round(x * 10) % 10 === 5 || Number.isInteger(x)) return roundToWhole(rng);
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
  });
}

const UNITS = [
  { key: 'wp.dec.flour', op: '+' as const },
  { key: 'wp.dec.ribbon', op: '-' as const },
];

/** Measurement stories with decimals; the character follows from the numbers. */
function story(rng: Rng): Exercise {
  const { key, op } = pick(rng, UNITS);
  let a = round(randInt(rng, 11, 99) / 10, 1);
  let b = round(randInt(rng, 5, 50) / 10, 1);
  if (op === '-' && a <= b) [a, b] = [round(b + 1, 1), a];
  const who = CHARACTERS[Math.round(a * 10) % CHARACTERS.length] as Character;
  const answer = round(op === '+' ? a + b : a - b, 1);
  const spoken = say(`${key}.story` as 'wp.dec.flour.story', { name: who.name, a, b }, who.gender);
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
      hint(say(`${key}.hint1` as 'wp.dec.flour.hint1')),
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
              { a: 1.5, b: 2.5 },
              { a: 2.4, b: 1.3 },
            ]
          : [
              { a: 3.5, b: 1.2 },
              { a: 4.6, b: 1.4 },
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
  });
}

/** Every literal piece of the stories, for every character. */
function storyBank(): string[] {
  const out: string[] = [];
  for (const { key } of UNITS) {
    for (const who of CHARACTERS) {
      out.push(
        ...say(
          `${key}.story` as 'wp.dec.flour.story',
          { name: who.name, a: 1.5, b: 2.5 },
          who.gender,
        ).parts,
      );
      out.push(say(`${key}.hint1` as 'wp.dec.flour.hint1').text);
    }
  }
  return out;
}

export const decimals = defineTopic({
  id: ID,
  labelKey: 'topic.decimals',
  grades: [4],
  startLevel: () => 1,
  extraBank: storyBank,
  levels: [
    closed(
      L(1),
      () => range(1, 9),
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
