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

/**
 * World 8, grade 3: "שברים: היכרות". Following the curriculum (grade 3: unit
 * fractions with concrete models, a fraction of a quantity, intuitive
 * comparison, adding and subtracting with the same denominator).
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
  const ex = den === 4 ? { n: 1, d: 3 } : { n: 1, d: 4 };
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
      exampleHint(
        f(ex.n, ex.d),
        say('ex.frac.name.solution', {
          parts: { n: ex.d, gender: 'm' },
          shaded: { n: ex.n, gender: 'm' },
          frac: w(ex.n, ex.d),
        }),
      ),
    ],
    solution: say('ex.frac.name.solution', {
      parts: { n: den, gender: 'm' },
      shaded: { n: num, gender: 'm' },
      frac: w(num, den),
    }),
  });
}

/** "?/8 is coloured": the numerator. */
function numerator(level: number, num: number, den: number): Exercise {
  const plural = fractionNoun(den).plural;
  return exercise({
    factId: `fnum:${num}/${den}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.numerator.prompt', { params: { plural } }),
    display: `?/${den}`,
    spoken: say('ex.frac.numerator.prompt', { plural }),
    visual: picture(num, den),
    answer: num,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.numerator.hint1')),
      hint(say('ex.frac.numerator.hint2', { d: den })),
      exampleHint(
        f(3, den === 5 ? 4 : 5),
        say('ex.frac.numerator.solution', { frac: w(3, den === 5 ? 4 : 5) }),
      ),
    ],
    solution: say('ex.frac.numerator.solution', { frac: w(num, den) }),
    diagnose: (v) => (v === den - num ? 'other' : v === den ? 'other' : null),
  });
}

/** "1/4 of 12" or "3/4 of 12". */
function ofQuantity(level: number, num: number, den: number, whole: number): Exercise {
  const part = whole / den;
  const answer = part * num;
  // The fraction in words inside the Hebrew sentence; the digits live in the LTR expression.
  const prompt = t('ex.frac.of.prompt', { params: { frac: w(num, den), whole } });
  const spoken = say('ex.frac.of.spoken', { frac: w(num, den), whole });
  const ex = den === 3 ? { n: 1, d: 4, whole: 8 } : { n: 1, d: 3, whole: 9 };
  return exercise({
    factId: `fof:${num}/${den}:${whole}`,
    topicId: ID,
    level,
    prompt,
    display: `${f(num, den)} × ${whole} = ?`,
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
      exampleHint(
        `${f(ex.n, ex.d)} × ${ex.whole} = ${ex.whole / ex.d}`,
        say('ex.frac.of.solution', { frac: w(ex.n, ex.d), whole: ex.whole, r: ex.whole / ex.d }),
      ),
    ],
    solution: say('ex.frac.of.solution', { frac: w(num, den), whole, r: answer }),
    diagnose: (v) =>
      v === part && num !== 1 ? 'other' : v === whole * num ? 'wrongOperation' : null,
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
  return exercise({
    factId: `fcmp:${a.n}/${a.d},${b.n}/${b.d}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.bigger.prompt'),
    display: `${f(a.n, a.d)}   ${f(b.n, b.d)}`,
    spoken: say('ex.frac.bigger.spoken', { a: w(a.n, a.d), b: w(b.n, b.d) }),
    visual: picture(a.n, a.d),
    answer,
    input: labelledChoices([f(a.n, a.d), f(b.n, b.d)]),
    hints: [
      hint(say(sameDen ? 'ex.frac.bigger.hintSame' : 'ex.frac.bigger.hintUnit')),
      hint(say('ex.frac.bigger.hint2'), { visual: picture(b.n, b.d) }),
      sameDen
        ? exampleHint('3/5 > 2/5', say('ex.frac.bigger.solution', { w: w(3, 5), l: w(2, 5) }))
        : exampleHint('1/3 > 1/6', say('ex.frac.bigger.solution', { w: w(1, 3), l: w(1, 6) })),
    ],
    solution: say('ex.frac.bigger.solution', { w: w(big.n, big.d), l: w(small.n, small.d) }),
  });
}

/** 2/7 + 3/7 = ?/7, 5/8 − 2/8 = ?/8. */
function sameDen(level: number, a: number, op: '+' | '-', b: number, den: number): Exercise {
  const answer = op === '+' ? a + b : a - b;
  const opWord = op === '+' ? 'ועוד' : 'פחות';
  const display = `${f(a, den)} ${op === '+' ? '+' : '−'} ${f(b, den)} = ?/${den}`;
  // Same denominator as the exercise would be too close; fifths, or sevenths when the exercise is in fifths.
  const exD = den === 5 ? 7 : 5;
  const ex = op === '+' ? { a: 1, b: 2, d: exD } : { a: 4, b: 1, d: exD };
  const exR = 3;
  const solvedText = (x: number, y: number, d: number, r: number) =>
    say('ex.frac.same.solution', { a: w(x, d), op: opWord, b: w(y, d), r: w(r, d) });
  return exercise({
    factId: `fsame:${a}${op}${b}/${den}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.same.prompt'),
    display,
    spoken: say('ex.frac.same.spoken', { a: w(a, den), op: opWord, b: w(b, den) }),
    visual: { type: 'fraction', parts: den, shaded: a },
    answer,
    operation: op === '+' ? 'add' : 'sub',
    input: numpad(2),
    hints: [
      hint(
        say(op === '+' ? 'ex.frac.same.hintAdd' : 'ex.frac.same.hintSub', {
          plural: fractionNoun(den).plural,
        }),
      ),
      hint(say('ex.frac.same.hint2'), {
        visual: { type: 'fraction', parts: den, shaded: op === '+' ? a + b : a },
      }),
      exampleHint(
        `${f(ex.a, ex.d)} ${op === '+' ? '+' : '−'} ${f(ex.b, ex.d)} = ${f(exR, ex.d)}`,
        solvedText(ex.a, ex.b, ex.d, exR),
      ),
    ],
    solution: solvedText(a, b, den, answer),
    diagnose: (v) => (v === (op === '+' ? a - b : a + b) ? 'wrongOperation' : null),
  });
}

/** How many quarters in a whole, in two wholes. */
function wholes(level: number, den: number, count: 1 | 2 | 3): Exercise {
  const answer = den * count;
  const plural = fractionNoun(den).plural;
  const wholesWords = count === 1 ? 'שלם אחד' : countNoun(count, WHOLE);
  return exercise({
    factId: `fwhole:${den}x${count}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.wholes.prompt', { params: { plural, wholes: wholesWords } }),
    display: `${count} = ?/${den}`,
    spoken: say('ex.frac.wholes.prompt', { plural, wholes: wholesWords }),
    visual: { type: 'fraction', parts: den, shaded: den },
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.whole.hint1', { plural })),
      hint(say('ex.frac.whole.hint2'), { visual: { type: 'fraction', parts: den, shaded: den } }),
      exampleHint(
        den === 4 ? '1 = 3/3' : '1 = 4/4',
        say('ex.frac.whole.solution', { frac: den === 4 ? w(3, 3) : w(4, 4) }),
      ),
    ],
    solution: say('ex.frac.whole.solution', { frac: w(answer, den) }),
    diagnose: (v) => (count > 1 && v === den ? 'other' : null),
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
      L(1),
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
      L(8),
      () =>
        DENS.filter((d) => d > 2).flatMap((d) =>
          range(1, d - 2).flatMap((a) => range(1, d - 1 - a).map((b) => ({ a, b, d }))),
        ),
      (x) => sameDen(8, x.a, '+', x.b, x.d),
    ),
    closed(
      L(9),
      () =>
        DENS.filter((d) => d > 2).flatMap((d) =>
          range(2, d - 1).flatMap((a) => range(1, a - 1).map((b) => ({ a, b, d }))),
        ),
      (x) => sameDen(9, x.a, '-', x.b, x.d),
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
