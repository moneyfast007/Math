import { t } from '@/i18n';
import { displayFraction, fractionNoun, fractionWords } from '@/lang/fractions';
import { countNoun, type Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  range,
  say,
} from '../build';
import { shuffle } from '../rng';
import type { Exercise, Rng, Visual } from '../types';

const WHOLE: Noun = { singular: 'שלם', plural: 'שלמים', gender: 'm' };
const PART: Noun = { singular: 'חלק', plural: 'חלקים', gender: 'm' };

/**
 * World 8, grade 3: "שברים: היכרות". Following the curriculum (grade 3: unit
 * fractions with concrete models, a fraction of a quantity, intuitive
 * comparison, simple equal fractions such as two quarters and a half). Adding
 * and subtracting fractions is grade 4 (fractionOps).
 * Denominators 2–10. All levels are closed, so every sentence is recorded whole.
 */

const ID = 'fractions-1';
const L = (n: number) => `level.fractions1.${n}`;
const DENS = [2, 3, 4, 5, 6, 8, 10];

/** A circle for the familiar pizza-like denominators, a bar for the rest; fixed per fact. */
function picture(num: number, den: number): Visual {
  const circle = [2, 3, 4, 6, 8].includes(den) && (num + den) % 2 === 0;
  return circle
    ? { type: 'fraction', parts: den, shaded: num, shape: 'circle' }
    : { type: 'fraction', parts: den, shaded: num };
}

const w = fractionWords;
const f = displayFraction;

/** A bar: the same shape and length whatever the denominator, for comparing. */
function bar(num: number, den: number): Visual {
  return { type: 'fraction', parts: den, shaded: num };
}

/**
 * "צבועות שתי חמישיות", "צבוע רבע": the verb agrees with the fraction noun
 * (its gender picks the form) and with one or more.
 */
function coloured(num: number, den: number) {
  return say(
    num === 1 ? 'ex.frac.numerator.solution1' : 'ex.frac.numerator.solution2',
    { frac: w(num, den) },
    fractionNoun(den).gender,
  );
}

/** "What part is coloured?" with three fraction buttons. */
function name(level: number, num: number, den: number, rng: Rng): Exercise {
  const others =
    num === 1
      ? DENS.filter((d) => d !== den).map((d) => ({ n: 1, d }))
      : [
          { n: num, d: den === 10 ? 8 : den + 1 },
          { n: den - num, d: den },
          { n: num + 1 <= den ? num + 1 : num - 1, d: den },
        ].filter((x) => x.n >= 1 && x.n <= x.d && !(x.n === num && x.d === den));
  const distinct = [...new Map(others.map((x) => [`${x.n}/${x.d}`, x])).values()];
  const options = shuffle(rng, [{ n: num, d: den }, ...shuffle(rng, distinct).slice(0, 2)]);
  const answer = options.findIndex((x) => x.n === num && x.d === den);
  // An example of the level's own kind: a unit fraction, or one with more parts coloured.
  const ex =
    num === 1
      ? den === 4
        ? { n: 1, d: 3 }
        : { n: 1, d: 4 }
      : den === 5
        ? { n: 2, d: 3 }
        : { n: 3, d: 5 };
  return exercise({
    factId: `fname:${num}/${den}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.name.prompt'),
    display: '',
    spoken: say('ex.frac.name.prompt'),
    visual: picture(num, den),
    answer,
    input: labelledChoices(options.map((x) => f(x.n, x.d))),
    hints: [
      hint(say('ex.frac.name.hint1')),
      hint(say('ex.frac.name.hint2')),
      exampleHint(f(ex.n, ex.d), nameSolution(ex.n, ex.d)),
    ],
    solution: nameSolution(num, den),
  });
}

/** "Split into five parts, and two of them are coloured": "one of them is coloured" for one. */
function nameSolution(num: number, den: number) {
  return num === 1
    ? say('ex.frac.name.solution1', { parts: den, frac: w(num, den) })
    : say('ex.frac.name.solution', {
        parts: den,
        shaded: { n: num, gender: 'm' },
        frac: w(num, den),
      });
}

/** "?/8 is coloured": the numerator. */
function numerator(level: number, num: number, den: number): Exercise {
  const plural = fractionNoun(den).plural;
  // The texts agree with the fraction noun: "כמה חמישיות צבועות", "כמה רבעים צבועים".
  const g = fractionNoun(den).gender;
  const exD = den === 5 ? 4 : 5;
  return exercise({
    factId: `fnum:${num}/${den}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.numerator.prompt2', { gender: g, params: { plural } }),
    display: `?/${den}`,
    spoken: say('ex.frac.numerator.prompt2', { plural }, g),
    visual: picture(num, den),
    answer: num,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.numerator.hint1')),
      hint(say('ex.frac.numerator.hint2', { d: den })),
      exampleHint(f(3, exD), coloured(3, exD)),
    ],
    solution: coloured(num, den),
    diagnose: (v) => (v === den - num ? 'other' : v === den ? 'other' : null),
    // All the parts counted, or the parts left white.
    advice: [
      { value: den, say: say('ex.frac.advice.countedAll', { v: den }) },
      { value: den - num, say: say('ex.frac.advice.unshaded', { v: den - num }) },
    ],
  });
}

type Ex = { n: number; d: number; whole: number };

/** "1/4 of 12" or "3/4 of 12". */
function ofQuantity(level: number, num: number, den: number, whole: number): Exercise {
  const part = whole / den;
  const answer = part * num;
  // The fraction in words inside the Hebrew sentence; the digits live in the LTR expression.
  const prompt = t('ex.frac.of.prompt', { params: { frac: w(num, den), whole } });
  const spoken = say('ex.frac.of.spoken', { frac: w(num, den), whole });
  // The example gives the answer away if it ends in this exercise's answer, or
  // splits the same whole (1/3 × 12 = 4 for 1/4 × 12); in the exercise's own
  // denominator it is too close. Four examples, so one is always left.
  // With more than one part, the example takes more than one part too (2/5 of 10).
  const exs: [Ex, ...Ex[]] =
    num === 1
      ? [
          { n: 1, d: 3, whole: 9 },
          { n: 1, d: 4, whole: 8 },
          { n: 1, d: 5, whole: 20 },
          { n: 1, d: 2, whole: 12 },
        ]
      : [
          { n: 2, d: 5, whole: 10 },
          { n: 2, d: 3, whole: 9 },
          { n: 3, d: 4, whole: 8 },
          { n: 3, d: 5, whole: 15 },
        ];
  const exAnswer = (x: Ex) => (x.whole / x.d) * x.n;
  const ex =
    exs.find(
      (x) => x.d !== den && x.whole !== whole && x.whole / x.d !== answer && exAnswer(x) !== answer,
    ) ?? exs[0];
  const exPart = ex.whole / ex.d;
  return exercise({
    factId: `fof:${num}/${den}:${whole}`,
    topicId: ID,
    level,
    prompt,
    // No "1/5 × 15": grade 3 finds a part of a quantity without a multiplication
    // exercise (the curriculum says so). The question is in the title and the picture.
    display: '',
    spoken,
    visual: { type: 'array', rows: den, cols: part },
    answer,
    operation: 'div',
    input: numpad(2),
    hints: [
      hint(
        num === 1
          ? say('ex.frac.of.hint1unit', { d: den })
          : say('ex.frac.of.hint1', { d: den, n: num }),
      ),
      hint(say('ex.frac.of.hint2', { d: den })),
      // Shown as what is done: split the whole into equal parts.
      // One part, then as many parts as the numerator says: added, not multiplied.
      exampleHint(
        ex.n === 1
          ? `${ex.whole} ÷ ${ex.d} = ${exPart}`
          : `${ex.whole} ÷ ${ex.d} = ${exPart} → ${Array.from({ length: ex.n }, () => exPart).join(' + ')} = ${exAnswer(ex)}`,
        say('ex.frac.of.solution', { frac: w(ex.n, ex.d), whole: ex.whole, r: exAnswer(ex) }),
      ),
    ],
    solution: say('ex.frac.of.solution', { frac: w(num, den), whole, r: answer }),
    diagnose: (v) =>
      v === part && num !== 1 ? 'other' : v === whole * num ? 'wrongOperation' : null,
    advice: [
      // One part found, the numerator's parts not yet taken ("found a third, now take two").
      ...(num !== 1
        ? [
            {
              value: part,
              say: say(
                'ex.frac.advice.onePart',
                { unit: w(1, den), whole, part, frac: w(num, den) },
                fractionNoun(den).gender,
              ),
            },
          ]
        : []),
      // The number of parts given as the answer: the whole still to be split.
      {
        value: den,
        say: say('ex.frac.advice.partsCount', { parts: { n: den, noun: PART }, whole }),
      },
    ],
  });
}

/** Which fraction is bigger? */
function compare(
  level: number,
  a: { n: number; d: number },
  b: { n: number; d: number },
): Exercise {
  const answer = a.n / a.d > b.n / b.d ? 0 : 1;
  const big = answer === 0 ? a : b;
  const small = answer === 0 ? b : a;
  const sameDen = a.d === b.d;
  const both: Visual = {
    type: 'fraction',
    parts: a.d,
    shaded: a.n,
    below: { parts: b.d, shaded: b.n },
  };
  // The smaller one chosen: in unit fractions, more parts taken for a bigger part;
  // with the same parts, fewer of them coloured.
  const wrongPick = 1 - answer;
  const advice = sameDen
    ? say('ex.frac.advice.sameDen')
    : say('ex.frac.advice.unitBigger', {
        more: { n: small.d, noun: PART },
        fewer: { n: big.d, noun: PART },
      });
  return exercise({
    factId: `fcmp:${a.n}/${a.d},${b.n}/${b.d}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.bigger.prompt'),
    display: `${f(a.n, a.d)}   ${f(b.n, b.d)}`,
    spoken: say('ex.frac.bigger.spoken', { a: w(a.n, a.d), b: w(b.n, b.d) }),
    // Both fractions as bars of the same length, one under the other, in the main
    // picture: a circle beside a bar is no comparison.
    visual: both,
    answer,
    input: labelledChoices([f(a.n, a.d), f(b.n, b.d)]),
    hints: [
      hint(say(sameDen ? 'ex.frac.bigger.hintSame' : 'ex.frac.bigger.hintUnit')),
      hint(say('ex.frac.bigger.hint2both'), { visual: both }),
      sameDen
        ? exampleHint('3/5 > 2/5', say('ex.frac.bigger.solution2', { w: w(3, 5), l: w(2, 5) }))
        : exampleHint('1/3 > 1/6', say('ex.frac.bigger.solution2', { w: w(1, 3), l: w(1, 6) })),
    ],
    solution: say('ex.frac.bigger.solution2', { w: w(big.n, big.d), l: w(small.n, small.d) }),
    advice: [{ value: wrongPick, say: advice }],
  });
}

const GROUP: Noun = { singular: 'קבוצה', plural: 'קבוצות', gender: 'f' };

type Equal = { num: number; small: number; den: number };

/** Simple equal fractions, drawn: a half is two quarters, a third is three ninths. */
const EQUALS: readonly [Equal, ...Equal[]] = [
  { num: 1, small: 2, den: 4 },
  { num: 1, small: 2, den: 6 },
  { num: 1, small: 2, den: 8 },
  { num: 1, small: 2, den: 10 },
  { num: 1, small: 4, den: 8 },
  { num: 3, small: 4, den: 8 },
  { num: 1, small: 3, den: 6 },
  { num: 2, small: 3, den: 6 },
  { num: 1, small: 3, den: 9 },
  { num: 1, small: 5, den: 10 },
  { num: 2, small: 5, den: 10 },
];

const equalAnswer = (x: Equal) => (x.den / x.small) * x.num;

/**
 * "כמה שמיניות הן חצי?": a fraction and the same amount in smaller parts
 * (the curriculum's "two quarters are a half"). The hint splits the whole
 * into equal groups and takes as many as the numerator.
 */
function equalParts(level: number, x: Equal): Exercise {
  const { num, small, den } = x;
  const answer = equalAnswer(x);
  const noun = fractionNoun(den);
  const g = noun.gender;
  const params = { plural: noun.plural, frac: w(num, small) };
  // Another fact: another denominator and another answer.
  const ex = EQUALS.find((e) => e.den !== den && equalAnswer(e) !== answer) ?? EQUALS[0];
  const solved = (e: Equal) =>
    say(
      'ex.frac.halfq.solution',
      { a: w(equalAnswer(e), e.den), b: w(e.num, e.small) },
      fractionNoun(e.den).gender,
    );
  return exercise({
    factId: `fequal:${num}/${small}=?/${den}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.halfq.prompt', { gender: g, params }),
    display: `${f(num, small)} = ?/${den}`,
    spoken: say('ex.frac.halfq.prompt', params, g),
    visual: bar(num, small),
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.halfq.hint1', { all: w(den, den) })),
      hint(
        say('ex.frac.halfq.hint2', {
          groups: { n: small, noun: GROUP },
          take: num === 1 ? 'קבוצה אחת' : countNoun(num, GROUP),
        }),
        { visual: { type: 'fraction', parts: den, shaded: 0 } },
      ),
      exampleHint(`${f(ex.num, ex.small)} = ${f(equalAnswer(ex), ex.den)}`, solved(ex)),
    ],
    solution: solved(x),
    // The whole's parts, or the numerator copied: not yet the same amount.
    diagnose: (v) => (v === den || v === num ? 'other' : null),
    advice: [
      {
        value: den,
        say: say('ex.frac.advice.equalWhole', { all: w(den, den), frac: w(num, small) }),
      },
      { value: num, say: say('ex.frac.advice.equalNum') },
    ],
  });
}

/** How many quarters in a whole, in two wholes. */
function wholes(level: number, den: number, count: 1 | 2 | 3): Exercise {
  const answer = den * count;
  const noun = fractionNoun(den);
  const plural = noun.plural;
  const wholesWords = (c: number) => (c === 1 ? 'שלם אחד' : countNoun(c, WHOLE));
  // An example of the same kind (one whole, or several), in another denominator and with another answer.
  const exs =
    count === 1
      ? [
          [1, 4],
          [1, 3],
          [1, 5],
        ]
      : [
          [2, 3],
          [2, 4],
          [3, 2],
          [2, 5],
        ];
  const [exC, exD] = (exs.find(([c, d]) => d !== den && (c ?? 0) * (d ?? 0) !== answer) ?? [
    1, 4,
  ]) as [number, number];
  const solved = (c: number, d: number) =>
    c === 1
      ? say('ex.frac.whole.solution.one', { frac: w(d, d) })
      : say('ex.frac.whole.solution.many', { wholes: wholesWords(c), frac: w(c * d, d) });
  return exercise({
    factId: `fwhole:${den}x${count}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.wholes.prompt', { params: { plural, wholes: wholesWords(count) } }),
    display: `${count} = ?/${den}`,
    spoken: say('ex.frac.wholes.prompt', { plural, wholes: wholesWords(count) }),
    // As many wholes as asked about, all coloured: one whole drawn for three counts as one.
    visual:
      count === 1
        ? { type: 'fraction', parts: den, shaded: den }
        : { type: 'fraction', parts: den, shaded: den * count, wholes: count },
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.whole.hint1b', { plural }, noun.gender)),
      // For several wholes, the step between: so many in one whole, and in all of them?
      count === 1
        ? hint(say('ex.frac.whole.hint2'), {
            visual: { type: 'fraction', parts: den, shaded: den },
          })
        : hint(say('ex.frac.whole.hint2many', { all: w(den, den), wholes: wholesWords(count) }), {
            visual: { type: 'fraction', parts: den, shaded: den },
          }),
      exampleHint(`${exC} = ${exC * exD}/${exD}`, solved(exC, exD)),
    ],
    solution: solved(count, den),
    diagnose: (v) => (count > 1 && v === den ? 'other' : null),
    advice:
      count > 1
        ? [
            {
              value: den,
              say: say('ex.frac.advice.oneWhole', {
                all: w(den, den),
                wholes: wholesWords(count),
              }),
            },
          ]
        : [],
  });
}

const properFractions = (dens: number[], minNum = 1) =>
  dens.flatMap((d) => range(minNum, d - 1).map((n) => ({ n, d })));

export const fractions1 = defineTopic({
  id: ID,
  labelKey: 'topic.fractions1',
  grades: [3],
  startLevel: () => 1,
  levels: [
    closed(
      // Halves to tenths: "unit fractions", not only "half, third, quarter".
      'level.fractions1.unit',
      () => DENS.map((d) => ({ n: 1, d })),
      (x, rng) => name(1, x.n, x.d, rng),
    ),
    closed(
      L(2),
      () => properFractions(DENS, 2),
      (x, rng) => name(2, x.n, x.d, rng),
    ),
    closed(
      L(3),
      () => properFractions(DENS),
      (x) => numerator(3, x.n, x.d),
    ),
    closed(
      L(4),
      () =>
        DENS.flatMap((d) =>
          range(2, 5)
            .map((k) => ({ d, whole: d * k }))
            .filter((x) => x.whole <= 40),
        ),
      (x) => ofQuantity(4, 1, x.d, x.whole),
    ),
    closed(
      L(5),
      () =>
        [2, 3, 4, 5]
          .flatMap((d) =>
            range(2, d - 1).flatMap((n) => range(2, 6).map((k) => ({ n, d, whole: d * k }))),
          )
          .filter((x) => x.whole <= 30),
      (x) => ofQuantity(5, x.n, x.d, x.whole),
    ),
    closed(
      L(6),
      () => DENS.flatMap((a) => DENS.filter((b) => b !== a).map((b) => ({ a, b }))),
      (x) => compare(6, { n: 1, d: x.a }, { n: 1, d: x.b }),
    ),
    closed(
      L(7),
      () =>
        DENS.flatMap((d) =>
          range(1, d - 1).flatMap((a) =>
            range(1, d - 1)
              .filter((b) => b !== a)
              .map((b) => ({ a, b, d })),
          ),
        ),
      (x) => compare(7, { n: x.a, d: x.d }, { n: x.b, d: x.d }),
    ),
    closed(
      'level.fractions1.equal',
      () => EQUALS,
      (x) => equalParts(8, x),
    ),
    closed(
      // Sevenths and ninths: unit fractions and more parts, in the denominators not met yet.
      'level.fractions1.sevenths',
      () => properFractions([7, 9]),
      (x, rng) => name(9, x.n, x.d, rng),
    ),
    closed(
      L(10),
      () =>
        DENS.flatMap((d) =>
          [1, 2, 3]
            .map((count) => ({ d, count: count as 1 | 2 | 3 }))
            .filter((x) => x.d * x.count <= 20),
        ),
      (x) => wholes(10, x.d, x.count),
    ),
  ],
});
