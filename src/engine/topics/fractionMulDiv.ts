import { shown } from '@/lang/compose';
import { t } from '@/i18n';
import {
  displayFraction as f,
  displayMixed,
  FRACTION_NOUNS,
  fractionNoun,
  fractionWords,
} from '@/lang/fractions';
import { numberToWords, type Noun } from '@/lang/hebrewNumbers';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  gcd,
  hint,
  numpad,
  range,
  say,
  WORD_NOUNS,
  type Character,
  type WordNoun,
} from '../build';
import type { Exercise, Hint, Visual } from '../types';

/**
 * Grade 6: "כפל וחילוק בשברים". A whole times a fraction, finding
 * the whole from a part, a fraction times a fraction, dividing a fraction by
 * a whole and a whole by a unit fraction, a mixed number times a whole,
 * stories. Fractions are read with their Hebrew word (2–10: "שלושה רבעים"),
 * and a product with no word ("אחת חלקי שתים עשרה") with "חלקי".
 * All levels are closed, so every sentence is recorded whole.
 */

const ID = 'fraction-mul-div';
const L = (n: number) => `level.fractionMulDiv.${n}`;
const DENS = [2, 3, 4, 5, 6, 8, 9, 10];
const WHOLE: Noun = { singular: 'שלם', plural: 'שלמים', gender: 'm' };
const bar = (n: number, d: number): Visual => ({
  type: 'fraction',
  parts: d,
  shaded: Math.min(n, d),
});

/** A fraction read aloud: its word ("שלושה רבעים"), or "חמש חלקי שתים עשרה" when there is none. */
const w = (n: number, d: number): string =>
  FRACTION_NOUNS[d] ? fractionWords(n, d) : `${numberToWords(n)} חלקי ${numberToWords(d)}`;

/** "שלוש כפול רבע" */
const times = (k: number, n: number, d: number) => `${numberToWords(k)} כפול ${w(n, d)}`;

/** 6 × 1/3 = ?: a whole number of unit fractions that makes whole numbers (the answer is not on screen). */
function wholeTimesUnit(m: number, d: number): Exercise {
  const k = m * d;
  const noun = fractionNoun(d);
  return exercise({
    factId: `fwt1:${k}x1/${d}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.arith.prompt'),
    display: `${k} × ${f(1, d)} = ?`,
    spoken: say('ex.fmul.question', { q: times(k, 1, d) }),
    visual: bar(1, d),
    answer: m,
    operation: 'mul',
    input: numpad(2),
    hints: [
      // Repeated addition: k of these is k thirds; then how many wholes is that.
      hint(say('fmd.unit.hint1', { k, unit: w(1, d), units: { n: k, noun } })),
      hint(say('fmd.unit.hint2', { all: { n: d, noun }, units: { n: k, noun } })),
      exampleAvoiding(
        m,
        [
          { k: 6, d: 2 },
          { k: 8, d: 4 },
        ].map((ex) => ({
          answer: ex.k / ex.d,
          hint: () =>
            exampleHint(
              `${ex.k} × ${f(1, ex.d)} = ${ex.k / ex.d}`,
              say('fmd.unit.solution', {
                q: times(ex.k, 1, ex.d),
                units: { n: ex.k, noun: fractionNoun(ex.d) },
                r: ex.k / ex.d,
              }),
            ),
        })),
      ),
    ],
    solution: say('fmd.unit.solution', { q: times(k, 1, d), units: { n: k, noun }, r: m }),
    // The numerator written (k thirds), not the wholes it makes.
    diagnose: (v) => (v === k || v === k * d ? 'other' : null),
  });
}

/** 3 × 2/5 = ?/5 */
function wholeTimes(k: number, n: number, d: number): Exercise {
  const answer = k * n;
  return exercise({
    factId: `fwt:${k}x${n}/${d}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.frac.expand.prompt'),
    display: `${k} × ${f(n, d)} = ?/${d}`,
    spoken: say('ex.fmul.question', { q: times(k, n, d) }),
    visual: bar(n, d),
    answer,
    operation: 'mul',
    input: numpad(2),
    hints: [
      hint(say('fmd.wholeTimes.hint1', { a: w(n, d), k })),
      hint(say('ex.fmul.wholeTimes.hint2')),
      // A numerator other than one, as in the level; the example's numerator must not be the answer.
      exampleAvoiding(
        answer,
        [
          { k: 2, n: 3, d: 5 },
          { k: 4, n: 2, d: 9 },
        ].map((ex) => ({
          answer: ex.k * ex.n,
          hint: () =>
            exampleHint(
              `${ex.k} × ${f(ex.n, ex.d)} = ${f(ex.k * ex.n, ex.d)}`,
              say('ex.frac.equal.solution', {
                a: times(ex.k, ex.n, ex.d),
                b: w(ex.k * ex.n, ex.d),
              }),
            ),
        })),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: times(k, n, d), b: w(answer, d) }),
    diagnose: (v) => (v === n ? 'other' : null),
  });
}

/** The way from a part to the whole: one part first, then all the parts. */
function wholePath(n: number, d: number, part: number) {
  const one = part / n;
  return n === 1
    ? say('fmd.whole.unitPath', { a: w(1, d), part, d, whole: one * d })
    : say('fmd.whole.path', { a: w(n, d), part, n, one, d, whole: one * d });
}

/**
 * Hint 3 for "n/d × ? = part": a solved one that shows the way (one part, then
 * the whole), with a unit fraction or not, like the exercise; never this whole.
 */
function findWholeExample(whole: number, unit: boolean): Hint {
  return exampleAvoiding(
    whole,
    (unit
      ? [
          { n: 1, d: 4, part: 5 },
          { n: 1, d: 3, part: 4 },
        ]
      : [
          { n: 3, d: 4, part: 15 },
          { n: 2, d: 3, part: 8 },
        ]
    ).map((ex) => {
      const one = ex.part / ex.n;
      const exW = one * ex.d;
      return {
        answer: exW,
        hint: () =>
          exampleHint(
            unit
              ? `${f(ex.n, ex.d)} × ? = ${ex.part} → ${ex.d} × ${ex.part} = ${exW}`
              : `${f(ex.n, ex.d)} × ? = ${ex.part} → ${ex.part} ÷ ${ex.n} = ${one} → ${ex.d} × ${one} = ${exW}`,
            wholePath(ex.n, ex.d, ex.part),
          ),
      };
    }),
  );
}

/** 1/4 of ? is 5 (level 3), 3/4 of ? is 15 (level 4). */
function findWhole(level: 3 | 4, n: number, d: number, part: number): Exercise {
  const whole = (part / n) * d;
  return exercise({
    factId: `fwhole:${n}/${d}=${part}`,
    topicId: ID,
    level,
    prompt: t('ex.fmul.findWhole.prompt'),
    display: `${f(n, d)} × ? = ${part}`,
    spoken: say('ex.fmul.findWhole.spoken', { a: w(n, d), part }),
    visual: bar(n, d),
    answer: whole,
    operation: 'mul',
    input: numpad(3),
    hints: [
      hint(
        n === 1
          ? say('ex.fmul.findWhole.hint1unit', { d })
          : say('ex.fmul.findWhole.hint1', { n, d }),
      ),
      // The first step with these numbers (one part), or the check for a unit fraction.
      hint(n === 1 ? say('ex.fmul.findWhole.hint2') : say('fmd.whole.hint2', { part, n })),
      findWholeExample(whole, n === 1),
    ],
    solution: wholePath(n, d, part),
    diagnose: (v) => (v === part * n || v === part / n ? 'other' : null),
  });
}

/** 1/2 × 1/3 = 1/? (level 5, the denominator), 3/4 × 2/5 = ?/20 (level 6, the numerator). */
function fracTimes(
  level: 5 | 6,
  a: { n: number; d: number },
  b: { n: number; d: number },
): Exercise {
  const num = a.n * b.n;
  const den = a.d * b.d;
  const askDen = level === 5;
  // Level 5 hides the denominator, level 6 the numerator: each level's two
  // examples differ in the hidden part, so one of them is never this answer.
  const examples = askDen
    ? [
        { a: { n: 1, d: 2 }, b: { n: 1, d: 3 } },
        { a: { n: 1, d: 2 }, b: { n: 1, d: 4 } },
      ]
    : [
        { a: { n: 3, d: 4 }, b: { n: 2, d: 5 } },
        { a: { n: 2, d: 3 }, b: { n: 4, d: 5 } },
      ];
  const q = `${w(a.n, a.d)} כפול ${w(b.n, b.d)}`;
  return exercise({
    factId: `fxf${level}:${a.n}/${a.d}x${b.n}/${b.d}`,
    topicId: ID,
    level,
    prompt: t(askDen ? 'ex.fmul.denominator.prompt' : 'ex.frac.expand.prompt'),
    display: askDen
      ? `${f(a.n, a.d)} × ${f(b.n, b.d)} = ${num}/?`
      : `${f(a.n, a.d)} × ${f(b.n, b.d)} = ?/${den}`,
    spoken: say('ex.fmul.question', { q }),
    visual: bar(a.n, a.d),
    answer: askDen ? den : num,
    operation: 'mul',
    input: numpad(3),
    hints: [
      hint(say('ex.fmul.fracTimes.hint1')),
      hint(say('ex.fmul.fracTimes.hint2', { a: w(b.n, b.d), b: w(a.n, a.d) })),
      exampleAvoiding(
        askDen ? den : num,
        examples.map((ex) => {
          const exN = ex.a.n * ex.b.n;
          const exD = ex.a.d * ex.b.d;
          return {
            answer: askDen ? exD : exN,
            hint: () =>
              exampleHint(
                `${f(ex.a.n, ex.a.d)} × ${f(ex.b.n, ex.b.d)} = ${f(exN, exD)}`,
                say('ex.frac.equal.solution', {
                  a: `${w(ex.a.n, ex.a.d)} כפול ${w(ex.b.n, ex.b.d)}`,
                  b: w(exN, exD),
                }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: q, b: w(num, den) }),
    // Denominators added instead of multiplied.
    diagnose: (v) =>
      askDen && v === a.d + b.d ? 'wrongOperation' : !askDen && v === a.n + b.n ? 'wrongOperation' : null,
  });
}

/** 6/8 ÷ 3 = ?/8 */
function fracDivWhole(n: number, d: number, k: number): Exercise {
  const answer = n / k;
  const q = (x: number, y: number, z: number) => `${w(x, y)} חלקי ${numberToWords(z)}`;
  return exercise({
    factId: `fdw:${n}/${d}÷${k}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.frac.expand.prompt'),
    display: `${f(n, d)} ÷ ${k} = ?/${d}`,
    spoken: say('ex.fmul.question', { q: q(n, d, k) }),
    visual: bar(n, d),
    answer,
    operation: 'div',
    input: numpad(2),
    hints: [
      hint(say('ex.fmul.fracDiv.hint1', { k })),
      hint(say('ex.fmul.fracDiv.hint2')),
      exampleAvoiding(
        answer,
        [
          { n: 6, d: 8, k: 2 },
          { n: 4, d: 5, k: 2 },
        ].map((ex) => ({
          answer: ex.n / ex.k,
          hint: () =>
            exampleHint(
              `${f(ex.n, ex.d)} ÷ ${ex.k} = ${f(ex.n / ex.k, ex.d)}`,
              say('ex.frac.equal.solution', { a: q(ex.n, ex.d, ex.k), b: w(ex.n / ex.k, ex.d) }),
            ),
        })),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: q(n, d, k), b: w(answer, d) }),
    diagnose: (v) => (v === n * k ? 'wrongOperation' : null),
  });
}

/** 3 ÷ 1/4 = ?: how many quarters in three wholes. */
function wholeDivUnit(k: number, d: number): Exercise {
  const answer = k * d;
  const q = (x: number, y: number) => `${numberToWords(x)} חלקי ${w(1, y)}`;
  return exercise({
    factId: `fwdu:${k}÷1/${d}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.arith.prompt'),
    display: `${k} ÷ ${f(1, d)} = ?`,
    spoken: say('ex.fmul.question', { q: q(k, d) }),
    visual: bar(d, d),
    answer,
    operation: 'div',
    input: numpad(3),
    hints: [
      hint(
        say('ex.fmul.wholeDiv.hint1', {
          plural: fractionNoun(d).plural,
          wholes: { n: k, noun: WHOLE },
        }),
      ),
      hint(say('ex.fmul.wholeDiv.hint2', { all: { n: d, noun: fractionNoun(d) } })),
      exampleAvoiding(
        answer,
        [
          { k: 2, d: 3 },
          { k: 2, d: 4 },
        ].map((ex) => ({
          answer: ex.k * ex.d,
          hint: () =>
            exampleHint(
              `${ex.k} ÷ ${f(1, ex.d)} = ${ex.k * ex.d}`,
              say('ex.frac.equal.solution', { a: q(ex.k, ex.d), b: numberToWords(ex.k * ex.d) }),
            ),
        })),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: q(k, d), b: numberToWords(answer) }),
    diagnose: (v) => (v === k ? 'other' : null),
  });
}

/** (2 1/3) × 6 = ?: times the denominator or twice it, so the answer is a whole number. */
function mixedTimes(whole: number, n: number, d: number, m: number): Exercise {
  const answer = whole * m + (n * m) / d;
  const q = (x: number, y: number, z: number, k: number) =>
    `${numberToWords(x)} ו${w(y, z)} כפול ${numberToWords(k)}`;
  return exercise({
    factId: `fmt:${whole} ${n}/${d}x${m}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.arith.prompt'),
    display: `${displayMixed(whole, n, d)} × ${m} = ?`,
    spoken: say('ex.fmul.question', { q: q(whole, n, d, m) }),
    visual: bar(n, d),
    answer,
    operation: 'mul',
    input: numpad(2),
    hints: [
      hint(say('ex.fmul.mixed.hint1')),
      // The wholes with these numbers, then the fraction is left.
      hint(say('fmd.mixed.hint2', { whole, m, wm: whole * m, frac: w(n, d) })),
      exampleAvoiding(
        answer,
        [
          { whole: 1, n: 1, d: 2, m: 2 },
          { whole: 2, n: 1, d: 3, m: 6 },
        ].map((ex) => {
          const exA = ex.whole * ex.m + (ex.n * ex.m) / ex.d;
          return {
            answer: exA,
            hint: () =>
              exampleHint(
                `${displayMixed(ex.whole, ex.n, ex.d)} × ${ex.m} = ${exA}`,
                say('ex.frac.equal.solution', {
                  a: q(ex.whole, ex.n, ex.d, ex.m),
                  b: numberToWords(exA),
                }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: q(whole, n, d, m), b: numberToWords(answer) }),
    // The fraction forgotten, or its numerator added as it is.
    diagnose: (v) => (v === whole * m || v === whole * m + n ? 'other' : null),
  });
}

/** A story: a fraction of the class / of a collection. Character and noun follow from the fact. */
function story(i: number, n: number, d: number, total: number): Exercise {
  const who = CHARACTERS[i % CHARACTERS.length] as Character;
  const noun = WORD_NOUNS[(i * 3) % WORD_NOUNS.length] as WordNoun;
  const part = (total / d) * n;
  const findWholeStory = i % 2 === 1;
  const spoken = findWholeStory
    ? say(
        'wp.fwhole.story',
        { name: who.name, a: { n: part, noun }, frac: w(n, d), plural: noun.plural },
        who.gender,
      )
    : say(
        'wp.fraction.story',
        {
          name: who.name,
          other: (CHARACTERS[(i + 1) % CHARACTERS.length] as Character).name,
          a: { n: total, noun },
          frac: w(n, d),
          plural: noun.plural,
        },
        who.gender,
      );
  const answer = findWholeStory ? total : part;
  return exercise({
    factId: `fwp2:${i}:${n}/${d}:${total}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: findWholeStory ? 'div' : 'mul',
    input: numpad(3),
    hints: [
      hint(say(findWholeStory ? 'wp.fwhole.hint1' : 'wp.fraction.hint1', { frac: w(n, d) })),
      {
        ...hint(say('hint.equation')),
        example: {
          display: findWholeStory ? `${f(n, d)} × ? = ${part}` : `${f(n, d)} × ${total} = ?`,
          spoken: say('hint.equation').text,
        },
      },
      findWholeStory
        ? findWholeExample(answer, n === 1)
        : exampleAvoiding(
            answer,
            [
              { n: 2, d: 3, total: 12 },
              { n: 3, d: 4, total: 12 },
            ].map((ex) => {
              const r = (ex.total / ex.d) * ex.n;
              return {
                answer: r,
                hint: () =>
                  exampleHint(
                    `${f(ex.n, ex.d)} × ${ex.total} = ${r}`,
                    say('ex.frac.of.solution', { frac: w(ex.n, ex.d), whole: ex.total, r }),
                  ),
              };
            }),
          ),
    ],
    solution: findWholeStory
      ? say('ex.fmul.findWhole.solution', { a: w(n, d), whole: total, part })
      : say('ex.frac.of.solution', { frac: w(n, d), whole: total, r: part }),
  });
}

const PROPER = DENS.flatMap((d) => range(1, d - 1).map((n) => ({ n, d })));
/** Unit fractions times unit fractions: any two denominators (1/3 × 1/4 = 1/12, read "חלקי"). */
const UNIT_PAIRS = DENS.flatMap((a) =>
  DENS.filter((b) => b >= a).map((b) => ({
    a: { n: 1, d: a },
    b: { n: 1, d: b },
  })),
);
/** Fraction times fraction, not both unit fractions, the product up to thirtieths. */
const PAIRS = PROPER.flatMap((a) =>
  PROPER.filter((b) => a.d * b.d <= 30 && (a.n > 1 || b.n > 1)).map((b) => ({ a, b })),
);

export const fractionMulDiv = defineTopic({
  id: ID,
  labelKey: 'topic.fractionMulDiv',
  grades: [6],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => DENS.flatMap((d) => range(1, 4).map((m) => ({ m, d }))),
      (x) => wholeTimesUnit(x.m, x.d),
    ),
    closed(
      L(2),
      () =>
        PROPER.filter((x) => x.n > 1).flatMap((x) =>
          range(2, 5)
            .filter((k) => k * x.n <= 40)
            .map((k) => ({ k, ...x })),
        ),
      (x) => wholeTimes(x.k, x.n, x.d),
    ),
    closed(
      L(3),
      () => DENS.flatMap((d) => range(2, 12).map((part) => ({ d, part }))),
      (x) => findWhole(3, 1, x.d, x.part),
    ),
    closed(
      L(4),
      () =>
        PROPER.filter((x) => x.n > 1 && x.d <= 6).flatMap((x) =>
          range(2, 6).map((k) => ({ ...x, part: x.n * k })),
        ),
      (x) => findWhole(4, x.n, x.d, x.part),
    ),
    closed(
      L(5),
      () => UNIT_PAIRS,
      (x) => fracTimes(5, x.a, x.b),
    ),
    closed(
      L(6),
      () => PAIRS,
      (x) => fracTimes(6, x.a, x.b),
    ),
    closed(
      L(7),
      () =>
        PROPER.flatMap((x) =>
          [2, 3, 4].filter((k) => x.n % k === 0 && x.n / k >= 1).map((k) => ({ ...x, k })),
        ),
      (x) => fracDivWhole(x.n, x.d, x.k),
    ),
    closed(
      L(8),
      () => DENS.flatMap((d) => range(2, 6).map((k) => ({ k, d }))),
      (x) => wholeDivUnit(x.k, x.d),
    ),
    closed(
      L(9),
      // Times the denominator, and for small denominators times twice it (1 2/3 × 6).
      () =>
        DENS.flatMap((d) =>
          range(1, 4).flatMap((whole) =>
            range(1, d - 1).flatMap((n) =>
              (d <= 5 ? [d, 2 * d] : [d]).map((m) => ({ whole, n, d, m })),
            ),
          ),
        ),
      (x) => mixedTimes(x.whole, x.n, x.d, x.m),
    ),
    closed(
      L(10),
      () =>
        // Fractions in lowest terms only (not 2/4).
        [2, 3, 4, 5].flatMap((d) =>
          range(1, d - 1).filter((n) => gcd(n, d) === 1).flatMap((n) =>
            range(3, 6).map((k, j) => ({ i: d * 11 + n * 5 + j, n, d, total: d * k })),
          ),
        ),
      (x) => story(x.i, x.n, x.d, x.total),
    ),
  ],
});
