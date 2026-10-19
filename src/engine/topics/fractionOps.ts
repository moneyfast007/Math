import { shown } from '@/lang/compose';
import { t } from '@/i18n';
import {
  displayFraction as f,
  displayMixed,
  fractionNoun,
  fractionWords as w,
} from '@/lang/fractions';
import { numberToWords } from '@/lang/hebrewNumbers';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  range,
  say,
  WORD_NOUNS,
} from '../build';
import type { Exercise, Visual } from '../types';

/**
 * World 11, grade 4: "פעולות בשברים". Expanding and simplifying, comparing
 * with different denominators, adding and subtracting with related
 * denominators, improper fractions and mixed numbers, a fraction of a quantity,
 * word problems. Denominators are those with a Hebrew word (2–10), so every
 * fraction can be read aloud. All levels are closed, so everything is recorded whole.
 */

const ID = 'fraction-ops';
const L = (n: number) => `level.fractionOps.${n}`;
const DENS = [2, 3, 4, 5, 6, 8, 9, 10];

const bar = (num: number, den: number): Visual => ({
  type: 'fraction',
  parts: den,
  shaded: Math.min(num, den),
});

/** Pairs d < D with D a multiple of d, both with a Hebrew word. */
const RELATED = DENS.flatMap((d) =>
  DENS.filter((D) => D > d && D % d === 0).map((D) => ({ d, D })),
);

/** A mixed number in words: "שתיים ושלושה רבעים". */
function mixedWords(whole: number, num: number, den: number): string {
  return `${numberToWords(whole)} ו${w(num, den)}`;
}

/** 1/2 = ?/8 */
function expand(n: number, d: number, D: number): Exercise {
  const k = D / d;
  const answer = n * k;
  return exercise({
    factId: `fexp:${n}/${d}=?/${D}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.frac.expand.prompt'),
    display: `${f(n, d)} = ?/${D}`,
    spoken: say('ex.frac.expand.spoken', { a: w(n, d), plural: fractionNoun(D).plural }),
    visual: bar(n, d),
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.expand.hint1', { k })),
      // Not a picture with the answer already coloured in: what to do with the parts.
      hint(say('ex.frac.expand.split', { k })),
      // The examples' numerators differ, so one of them is never this answer.
      exampleAvoiding(
        answer,
        [
          { n: 1, d: 2, D: 4 },
          { n: 1, d: 2, D: 6 },
        ].map((ex) => {
          const exAns = ex.n * (ex.D / ex.d);
          return {
            answer: exAns,
            hint: () =>
              exampleHint(
                `${f(ex.n, ex.d)} = ${f(exAns, ex.D)}`,
                say('ex.frac.equal.solution', { a: w(ex.n, ex.d), b: w(exAns, ex.D) }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: w(n, d), b: w(answer, D) }),
  });
}

/** 6/8 = ?/4 */
function simplify(N: number, D: number, d: number): Exercise {
  const answer = N / (D / d);
  return exercise({
    factId: `fsimp:${N}/${D}=?/${d}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.frac.expand.prompt'),
    display: `${f(N, D)} = ?/${d}`,
    spoken: say('ex.frac.expand.spoken', { a: w(N, D), plural: fractionNoun(d).plural }),
    visual: bar(N, D),
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.simplify.hint1', { k: D / d })),
      hint(say('ex.frac.simplify.join', { k: D / d })),
      exampleAvoiding(
        answer,
        [
          { N: 2, D: 4, d: 2 },
          { N: 4, D: 6, d: 3 },
        ].map((ex) => {
          const exAns = ex.N / (ex.D / ex.d);
          return {
            answer: exAns,
            hint: () =>
              exampleHint(
                `${f(ex.N, ex.D)} = ${f(exAns, ex.d)}`,
                say('ex.frac.equal.solution', { a: w(ex.N, ex.D), b: w(exAns, ex.d) }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: w(N, D), b: w(answer, d) }),
  });
}

/** 2/3 or 3/4: which is bigger? */
function compare(a: { n: number; d: number }, b: { n: number; d: number }): Exercise {
  const answer = a.n * b.d > b.n * a.d ? 0 : 1;
  const big = answer === 0 ? a : b;
  const small = answer === 0 ? b : a;
  const common = (a.d * b.d) / gcdOf(a.d, b.d);
  return exercise({
    factId: `fcmp2:${a.n}/${a.d},${b.n}/${b.d}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.frac.bigger.prompt'),
    display: `${f(a.n, a.d)}   ${f(b.n, b.d)}`,
    spoken: say('ex.frac.bigger.spoken', { a: w(a.n, a.d), b: w(b.n, b.d) }),
    visual: bar(a.n, a.d),
    answer,
    input: labelledChoices([f(a.n, a.d), f(b.n, b.d)]),
    hints: [
      hint(say('ex.frac.common.hint1', { d: common })),
      hint(say('ex.frac.bigger.hint2'), { visual: bar(b.n, b.d) }),
      a.n === 2 && a.d === 3 && b.n === 3 && b.d === 4
        ? exampleHint('3/5 < 2/3', say('ex.frac.bigger.solution', { w: w(2, 3), l: w(3, 5) }))
        : exampleHint('3/4 > 2/3', say('ex.frac.bigger.solution', { w: w(3, 4), l: w(2, 3) })),
    ],
    solution: say('ex.frac.bigger.solution', { w: w(big.n, big.d), l: w(small.n, small.d) }),
  });
}

function gcdOf(a: number, b: number): number {
  return b === 0 ? a : gcdOf(b, a % b);
}

/** 1/2 + 1/4 = ?/4, 3/4 − 1/2 = ?/4 */
function relatedSum(level: 4 | 5, a: number, d: number, b: number, D: number): Exercise {
  const add = level === 4;
  const k = D / d;
  const answer = add ? a * k + b : a * k - b;
  const opWord = add ? 'ועוד' : 'פחות';
  const sym = add ? '+' : '−';
  // Two examples with different answers: the one used never has this answer.
  const examples = add
    ? [
        { a: 1, d: 2, b: 1, D: 4, r: 3 },
        { a: 1, d: 3, b: 2, D: 6, r: 4 },
      ]
    : [
        { a: 1, d: 2, b: 1, D: 4, r: 1 },
        { a: 2, d: 3, b: 1, D: 6, r: 3 },
      ];
  const solved = (x: number, xd: number, y: number, yd: number, r: number) =>
    say('ex.frac.same.solution', { a: w(x, xd), op: opWord, b: w(y, yd), r: w(r, yd) });
  return exercise({
    factId: `frel:${a}/${d}${sym}${b}/${D}`,
    topicId: ID,
    level,
    prompt: t('ex.frac.same.prompt'),
    display: `${f(a, d)} ${sym} ${f(b, D)} = ?/${D}`,
    spoken: say('ex.frac.same.spoken', { a: w(a, d), op: opWord, b: w(b, D) }),
    visual: bar(a * k, D),
    answer,
    operation: add ? 'add' : 'sub',
    input: numpad(2),
    hints: [
      hint(say('ex.frac.related.hint1', { a: w(a, d), b: w(a * k, D) })),
      hint(
        say(add ? 'ex.frac.same.hintAdd' : 'ex.frac.same.hintSub', {
          plural: fractionNoun(D).plural,
        }),
      ),
      exampleAvoiding(
        answer,
        examples.map((e) => ({
          answer: e.r,
          hint: () =>
            exampleHint(
              `${f(e.a, e.d)} ${sym} ${f(e.b, e.D)} = ${f(e.r, e.D)}`,
              solved(e.a, e.d, e.b, e.D, e.r),
            ),
        })),
      ),
    ],
    solution: solved(a, d, b, D, answer),
    diagnose: (v) => (v === (add ? a + b : Math.abs(a - b)) ? 'other' : null),
  });
}

/** 11/4: how many wholes (level 6), what is left (level 7). */
function improper(level: 6 | 7, N: number, d: number): Exercise {
  const whole = Math.floor(N / d);
  const rest = N % d;
  const askWhole = level === 6;
  return exercise({
    factId: `fimp${level}:${N}/${d}`,
    topicId: ID,
    level,
    prompt: t(askWhole ? 'ex.frac.improper.wholes' : 'ex.frac.improper.rest'),
    display: askWhole ? `${f(N, d)} = ? ${f(rest, d)}` : `${f(N, d)} = ${whole} ?/${d}`,
    spoken: say(askWhole ? 'ex.frac.improper.spokenWholes' : 'ex.frac.improper.spokenRest', {
      a: w(N, d),
    }),
    visual: bar(d, d),
    answer: askWhole ? whole : rest,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.improper.hint1', { all: { n: d, noun: fractionNoun(d) } })),
      hint(say('ex.frac.improper.hint2'), { visual: bar(d, d) }),
      // 7/4 = 1 3/4 and 8/3 = 2 2/3 differ in both the wholes and the rest.
      exampleAvoiding(
        askWhole ? whole : rest,
        [
          { N: 7, d: 4 },
          { N: 8, d: 3 },
        ].map((ex) => {
          const exW = Math.floor(ex.N / ex.d);
          const exR = ex.N % ex.d;
          return {
            answer: askWhole ? exW : exR,
            hint: () =>
              exampleHint(
                `${f(ex.N, ex.d)} = ${displayMixed(exW, exR, ex.d)}`,
                say('ex.frac.equal.solution', { a: w(ex.N, ex.d), b: mixedWords(exW, exR, ex.d) }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: w(N, d), b: mixedWords(whole, rest, d) }),
  });
}

/** 2 1/3 = ?/3 */
function mixedToImproper(whole: number, n: number, d: number): Exercise {
  const answer = whole * d + n;
  return exercise({
    factId: `fmix:${whole} ${n}/${d}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.frac.expand.prompt'),
    display: `${displayMixed(whole, n, d)} = ?/${d}`,
    spoken: say('ex.frac.expand.spoken', {
      a: mixedWords(whole, n, d),
      plural: fractionNoun(d).plural,
    }),
    visual: bar(d, d),
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.mixed.hint1', { all: { n: d, noun: fractionNoun(d) } })),
      hint(say('ex.frac.mixed.hint2')),
      exampleAvoiding(
        answer,
        [
          { whole: 1, n: 3, d: 4 },
          { whole: 1, n: 2, d: 3 },
        ].map((ex) => {
          const exA = ex.whole * ex.d + ex.n;
          return {
            answer: exA,
            hint: () =>
              exampleHint(
                `${displayMixed(ex.whole, ex.n, ex.d)} = ${f(exA, ex.d)}`,
                say('ex.frac.equal.solution', {
                  a: mixedWords(ex.whole, ex.n, ex.d),
                  b: w(exA, ex.d),
                }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: mixedWords(whole, n, d), b: w(answer, d) }),
    diagnose: (v) => (v === whole + n ? 'other' : null),
  });
}

/** A fraction of a quantity, solved: 2/3 × 12 = 8, or 3/4 × 12 = 9 when the answer is 8. */
function ofExample(answer: number) {
  return exampleAvoiding(
    answer,
    [
      { n: 2, d: 3, total: 12 },
      { n: 3, d: 4, total: 12 },
    ].map((ex) => {
      const exA = (ex.total / ex.d) * ex.n;
      return {
        answer: exA,
        hint: () =>
          // What is done, in whole numbers: split into d equal parts, take n of them.
          exampleHint(
            `${ex.total} ÷ ${ex.d} × ${ex.n} = ${exA}`,
            say('ex.frac.of.solution', { frac: w(ex.n, ex.d), whole: ex.total, r: exA }),
          ),
      };
    }),
  );
}

/** 3/4 of 20 */
function ofQuantity(n: number, d: number, total: number): Exercise {
  const answer = (total / d) * n;
  return exercise({
    factId: `fof2:${n}/${d}:${total}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.frac.of.prompt', { params: { frac: w(n, d), whole: total } }),
    // No "6/8 × 16": in grade 4 a part of a quantity is found by splitting it, not by
    // multiplying by a fraction. The question is in the title and the picture.
    display: '',
    spoken: say('ex.frac.of.spoken', { frac: w(n, d), whole: total }),
    visual: { type: 'array', rows: d, cols: total / d },
    answer,
    operation: 'mul',
    input: numpad(3),
    hints: [
      hint(say('ex.frac.of.hint1', { d, n })),
      hint(say('ex.frac.of.hint2', { d })),
      ofExample(answer),
    ],
    solution: say('ex.frac.of.solution', { frac: w(n, d), whole: total, r: answer }),
    diagnose: (v) => (v === total / d ? 'other' : null),
  });
}

/** A story: someone gives away a fraction of what they have. The character and noun follow from the fact. */
function story(i: number, n: number, d: number, total: number): Exercise {
  const who = CHARACTERS[i % CHARACTERS.length] ?? CHARACTERS[0];
  const other = CHARACTERS[(i + 1) % CHARACTERS.length] ?? CHARACTERS[1];
  const noun = WORD_NOUNS[(i * 5) % WORD_NOUNS.length] ?? WORD_NOUNS[0];
  if (!who || !other || !noun) throw new Error('characters and nouns are not empty');
  const answer = (total / d) * n;
  const spoken = say(
    'wp.fraction.story',
    {
      name: who.name,
      other: other.name,
      a: { n: total, noun },
      frac: w(n, d),
      plural: noun.plural,
    },
    who.gender,
  );
  return exercise({
    factId: `fwp:${i}:${n}/${d}:${total}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: 'mul',
    input: numpad(3),
    hints: [
      hint(say('wp.fraction.hint1', { frac: w(n, d) })),
      {
        ...hint(say('hint.equation')),
        example: { display: `${total} ÷ ${d} × ${n} = ?`, spoken: say('hint.equation').text },
      },
      ofExample(answer),
    ],
    solution: say('ex.frac.of.solution', { frac: w(n, d), whole: total, r: answer }),
  });
}

/** Proper fractions n/d whose value equals N/D for a related D. */
const EXPAND_FACTS = RELATED.flatMap(({ d, D }) => range(1, d - 1).map((n) => ({ n, d, D })));
/** Pairs of different fractions with different denominators, not equal in value. */
const COMPARE_FACTS = DENS.flatMap((d1) =>
  DENS.filter((d2) => d2 > d1).flatMap((d2) =>
    range(1, d1 - 1).flatMap((n1) =>
      range(1, d2 - 1)
        .filter((n2) => n1 * d2 !== n2 * d1)
        .map((n2) => ({ a: { n: n1, d: d1 }, b: { n: n2, d: d2 } })),
    ),
  ),
).filter((_, i) => i % 3 === 0);

export const fractionOps = defineTopic({
  id: ID,
  labelKey: 'topic.fractionOps',
  grades: [4],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => EXPAND_FACTS,
      (x) => expand(x.n, x.d, x.D),
    ),
    closed(
      L(2),
      () => EXPAND_FACTS.map((x) => ({ N: x.n * (x.D / x.d), D: x.D, d: x.d })),
      (x) => simplify(x.N, x.D, x.d),
    ),
    closed(
      L(3),
      () => COMPARE_FACTS,
      (x) => compare(x.a, x.b),
    ),
    closed(
      L(4),
      () =>
        RELATED.flatMap(({ d, D }) =>
          range(1, d - 1).flatMap((a) =>
            range(1, D - 1)
              .filter((b) => a * (D / d) + b < D)
              .map((b) => ({ a, d, b, D })),
          ),
        ),
      (x) => relatedSum(4, x.a, x.d, x.b, x.D),
    ),
    closed(
      L(5),
      () =>
        RELATED.flatMap(({ d, D }) =>
          range(1, d - 1).flatMap((a) =>
            range(1, D - 1)
              .filter((b) => a * (D / d) - b > 0)
              .map((b) => ({ a, d, b, D })),
          ),
        ),
      (x) => relatedSum(5, x.a, x.d, x.b, x.D),
    ),
    closed(
      L(6),
      () =>
        DENS.flatMap((d) =>
          range(d + 1, 3 * d - 1)
            .filter((N) => N % d !== 0)
            .map((N) => ({ N, d })),
        ),
      (x) => improper(6, x.N, x.d),
    ),
    closed(
      L(7),
      () =>
        DENS.flatMap((d) =>
          range(d + 1, 3 * d - 1)
            .filter((N) => N % d !== 0)
            .map((N) => ({ N, d })),
        ),
      (x) => improper(7, x.N, x.d),
    ),
    closed(
      L(8),
      () =>
        [1, 2, 3].flatMap((whole) =>
          DENS.flatMap((d) => range(1, d - 1).map((n) => ({ whole, n, d }))),
        ),
      (x) => mixedToImproper(x.whole, x.n, x.d),
    ),
    closed(
      L(9),
      () =>
        [2, 3, 4, 5, 8, 10]
          .flatMap((d) =>
            range(2, d - 1).flatMap((n) => range(2, 6).map((k) => ({ n, d, total: d * k }))),
          )
          .filter((x) => x.total <= 60),
      (x) => ofQuantity(x.n, x.d, x.total),
    ),
    closed(
      L(10),
      () =>
        [2, 3, 4, 5].flatMap((d) =>
          range(1, d - 1).flatMap((n) =>
            range(3, 6).map((k, j) => ({ i: d * 7 + n * 3 + j, n, d, total: d * k })),
          ),
        ),
      (x) => story(x.i, x.n, x.d, x.total),
    ),
  ],
});
