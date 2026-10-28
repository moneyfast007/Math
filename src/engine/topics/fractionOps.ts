import { shown } from '@/lang/compose';
import { t } from '@/i18n';
import {
  displayFraction as f,
  displayMixed,
  fractionNoun,
  fractionWords as w,
} from '@/lang/fractions';
import { numberToWords } from '@/lang/hebrewNumbers';
import type { Noun } from '@/lang/hebrewNumbers';
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
  type AdviceSpec,
  type Said,
  WORD_NOUNS,
} from '../build';
import { shuffle } from '../rng';
import type { Exercise, Hint, Rng, Visual } from '../types';

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

/**
 * An improper fraction drawn as itself: a row of `den` cells for every whole and
 * the rest in a row below (23/9: two full rows of nine, then five).
 */
const wholes = (whole: number, rest: number, den: number): Visual => ({
  type: 'array',
  rows: whole,
  cols: den,
  squares: true,
  ...(rest > 0 ? { extra: rest } : {}),
});

const WHOLE: Noun = { singular: 'שלם', plural: 'שלמים', gender: 'm' };

/** Pairs d < D with D a multiple of d, both with a Hebrew word. */
const RELATED = DENS.flatMap((d) =>
  DENS.filter((D) => D > d && D % d === 0).map((D) => ({ d, D })),
);

/** A mixed number in words: "שתיים ושלושה רבעים". */
function mixedWords(whole: number, num: number, den: number): string {
  return `${numberToWords(whole)} ו${w(num, den)}`;
}

/**
 * Different names for the same fraction (grade 4 finds them on a picture, not by
 * the rule of multiplying both numbers): 1/2 = ?/8 (`from` 2, `to` 8: smaller
 * parts, level 1) or 6/8 = ?/4 (bigger parts, level 2). `askDen`: the numerator
 * is given and the number of parts is asked (1/2 = 4/?).
 */
function equalName(level: 1 | 2, n: number, from: number, to: number, askDen: boolean): Exercise {
  const finer = to > from;
  const k = finer ? to / from : from / to;
  const m = finer ? n * k : n / k;
  const answer = askDen ? to : m;
  const display = askDen ? `${f(n, from)} = ${m}/?` : `${f(n, from)} = ?/${to}`;
  const spoken = askDen
    ? say('g4.frac.den.spoken', { a: w(n, from), n: m })
    : say('ex.frac.expand.spoken', { a: w(n, from), plural: fractionNoun(to).plural });
  const examples = finer
    ? [
        { n: 1, d: 2, D: 4 },
        { n: 1, d: 3, D: 6 },
        { n: 1, d: 2, D: 6 },
      ]
    : [
        { n: 2, d: 4, D: 2 },
        { n: 4, d: 6, D: 3 },
        { n: 2, d: 6, D: 3 },
      ];
  const exAnswer = (ex: { n: number; d: number; D: number }) => {
    const exM = finer ? ex.n * (ex.D / ex.d) : ex.n / (ex.d / ex.D);
    return { exM, asked: askDen ? ex.D : exM };
  };
  return exercise({
    factId: `${finer ? 'fexp' : 'fsimp'}${askDen ? 'd' : ''}:${n}/${from}=${askDen ? `${m}/?` : `?/${to}`}`,
    topicId: ID,
    level,
    prompt: t(askDen ? 'ex.fmul.denominator.prompt' : 'ex.frac.expand.prompt'),
    display,
    spoken,
    visual: bar(n, from),
    answer,
    input: numpad(2),
    hints: [
      // On the picture first: the same part of the whole, cut differently.
      hint(
        askDen
          ? say('g4.frac.den.look', { n: m })
          : say(finer ? 'g4.frac.expand.look' : 'g4.frac.simplify.look', {
              plural: fractionNoun(to).plural,
            }),
      ),
      hint(
        askDen
          ? say(finer ? 'g4.frac.den.split' : 'g4.frac.den.join', { k })
          : say(finer ? 'ex.frac.expand.split' : 'ex.frac.simplify.join', { k }),
      ),
      // Examples whose asked number differs, so one of them is never this answer.
      exampleAvoiding(
        answer,
        examples.map((ex) => {
          const { exM, asked } = exAnswer(ex);
          return {
            answer: asked,
            hint: () =>
              exampleHint(
                `${f(ex.n, ex.d)} = ${f(exM, ex.D)}`,
                say('ex.frac.equal.solution', { a: w(ex.n, ex.d), b: w(exM, ex.D) }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: w(n, from), b: w(m, to) }),
  });
}

type Frac = { n: number; d: number };

/**
 * How a pair is compared without a common-denominator algorithm (grade 4): one is
 * more than a half and the other less; the same numerator; each one part short of
 * a whole; or one denominator a multiple of the other (then one of them is renamed).
 */
type CompareWay = 'half' | 'sameNum' | 'nearOne' | 'related';

function compareWay(a: Frac, b: Frac): CompareWay | null {
  // More than a half, less than a half (or exactly a half).
  const side = (x: Frac) => Math.sign(2 * x.n - x.d);
  if (side(a) !== side(b)) return 'half';
  if (a.n === b.n) return 'sameNum';
  if (a.n === a.d - 1 && b.n === b.d - 1) return 'nearOne';
  if (b.d % a.d === 0 || a.d % b.d === 0) return 'related';
  return null;
}

/** A solved pair compared the same way (and a second one, when the first is this pair). */
const COMPARE_EXAMPLES: Record<CompareWay, [Frac, Frac][]> = {
  half: [
    [
      { n: 4, d: 6 },
      { n: 2, d: 5 },
    ],
    [
      { n: 5, d: 8 },
      { n: 1, d: 3 },
    ],
  ],
  sameNum: [
    [
      { n: 3, d: 5 },
      { n: 3, d: 8 },
    ],
    [
      { n: 2, d: 3 },
      { n: 2, d: 9 },
    ],
  ],
  nearOne: [
    [
      { n: 9, d: 10 },
      { n: 4, d: 5 },
    ],
    [
      { n: 7, d: 8 },
      { n: 5, d: 6 },
    ],
  ],
  related: [
    [
      { n: 3, d: 4 },
      { n: 5, d: 8 },
    ],
    [
      { n: 2, d: 3 },
      { n: 5, d: 9 },
    ],
  ],
};

function compare(a: Frac, b: Frac): Exercise {
  const answer = a.n * b.d > b.n * a.d ? 0 : 1;
  const big = answer === 0 ? a : b;
  const small = answer === 0 ? b : a;
  const way = compareWay(a, b) ?? 'related';
  const same = (x: [Frac, Frac]) =>
    [x[0], x[1]].every((y) => (y.n === a.n && y.d === a.d) || (y.n === b.n && y.d === b.d));
  const [exBig, exSmall] = COMPARE_EXAMPLES[way].find((x) => !same(x)) ?? COMPARE_EXAMPLES[way][0]!;
  return exercise({
    factId: `fcmp2:${a.n}/${a.d},${b.n}/${b.d}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.frac.bigger.prompt'),
    // The two to choose between, "or" between them.
    display: `${f(a.n, a.d)} ${t('math.or')} ${f(b.n, b.d)}`,
    spoken: say('ex.frac.bigger.spoken', { a: w(a.n, a.d), b: w(b.n, b.d) }),
    visual: bar(a.n, a.d),
    answer,
    input: labelledChoices([f(a.n, a.d), f(b.n, b.d)]),
    hints: [
      way === 'related'
        ? hint(say('ex.frac.common.hint1', { d: Math.max(a.d, b.d) }))
        : hint(say(`g4.frac.cmp.${way}` as const)),
      hint(say('ex.frac.bigger.hint2'), { visual: bar(b.n, b.d) }),
      exampleHint(
        `${f(exBig.n, exBig.d)} > ${f(exSmall.n, exSmall.d)}`,
        say('ex.frac.bigger.solution', { w: w(exBig.n, exBig.d), l: w(exSmall.n, exSmall.d) }),
      ),
    ],
    solution: say('ex.frac.bigger.solution', { w: w(big.n, big.d), l: w(small.n, small.d) }),
    // The smaller one picked: what decides, for this way of comparing.
    advice: [{ value: 1 - answer, say: compareAdvice(way, small, big) }],
  });
}

/** Why the picked fraction is the smaller: against a half, a whole, the size of the parts. */
function compareAdvice(way: CompareWay, small: Frac, big: Frac): Said {
  const s = w(small.n, small.d);
  switch (way) {
    case 'half':
      return say(
        2 * small.n === small.d
          ? 'g4.frac.adv.isHalf'
          : 2 * big.n === big.d
            ? 'g4.frac.adv.lessThanHalf'
            : 'g4.frac.adv.lessHalf',
        { s, o: w(big.n, big.d) },
      );
    case 'sameNum':
      return say('g4.frac.adv.sameNum', { s });
    case 'nearOne':
      return say('g4.frac.adv.nearOne', { s, miss: w(1, small.d) });
    case 'related': {
      // The one with the bigger parts, renamed in the smaller ones.
      const [x, y] = small.d < big.d ? [small, big] : [big, small];
      const k = y.d / x.d;
      return say('g4.frac.adv.related', { x: w(x.n, x.d), y: w(x.n * k, y.d) });
    }
  }
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
    // The numerators added (taken away) as they are: first the parts must be the same size.
    advice: [
      {
        value: add ? a + b : Math.abs(a - b),
        say: say(add ? 'g4.frac.adv.addNums' : 'g4.frac.adv.subNums', {
          x: w(a, d),
          plural: fractionNoun(D).plural,
        }),
      },
    ],
  });
}

/** 7/4 = 1 3/4 and 8/3 = 2 2/3 differ in both the wholes and the rest. */
const IMPROPER_EXAMPLES = [
  { N: 7, d: 4 },
  { N: 8, d: 3 },
];

function improperExample(N: number, d: number): Hint {
  const exW = Math.floor(N / d);
  const exR = N % d;
  return exampleHint(
    `${f(N, d)} = ${displayMixed(exW, exR, d)}`,
    say('ex.frac.equal.solution', { a: w(N, d), b: mixedWords(exW, exR, d) }),
  );
}

/** 23/9: how many wholes? Drawn as itself, whole after whole, so it can be counted. */
function improperWholes(N: number, d: number): Exercise {
  const whole = Math.floor(N / d);
  const rest = N % d;
  return exercise({
    factId: `fimp6:${N}/${d}`,
    topicId: ID,
    level: 6,
    prompt: t('ex.frac.improper.wholes'),
    display: `${f(N, d)} = ? ${f(rest, d)}`,
    spoken: say('ex.frac.improper.spokenWholes', { a: w(N, d) }),
    visual: wholes(whole, rest, d),
    answer: whole,
    input: numpad(2),
    hints: [
      hint(say('g4.frac.improper.hint1', { all: { n: d, noun: fractionNoun(d) }, a: w(N, d) })),
      hint(say('ex.frac.improper.hint2'), { visual: bar(d, d) }),
      exampleAvoiding(
        whole,
        IMPROPER_EXAMPLES.map((ex) => ({
          answer: Math.floor(ex.N / ex.d),
          hint: () => improperExample(ex.N, ex.d),
        })),
      ),
    ],
    solution: say('ex.frac.equal.solution', { a: w(N, d), b: mixedWords(whole, rest, d) }),
  });
}

/**
 * 23/9 as a mixed number, all of it (the wholes and the rest), picked among three
 * close ones: the usual slips are one whole too many or a part too few.
 */
function improperToMixed(N: number, d: number, rng: Rng): Exercise {
  const whole = Math.floor(N / d);
  const rest = N % d;
  const right = displayMixed(whole, rest, d);
  const near = [
    [whole + 1, rest],
    [whole, rest > 1 ? rest - 1 : rest + 1],
    [whole - 1, rest],
    [whole, rest + 1],
    [whole, d - rest],
    [whole + 2, rest],
  ]
    .filter(([x, y]) => x !== undefined && y !== undefined && x >= 1 && y >= 1 && y < d)
    .map(([x, y]) => displayMixed(x as number, y as number, d))
    .filter((l, i, all) => l !== right && all.indexOf(l) === i);
  const labels = shuffle(rng, [right, ...near.slice(0, 2)]);
  const code = (x: number, y: number) => x * 100 + y;
  return exercise({
    factId: `fimp7:${N}/${d}`,
    topicId: ID,
    level: 7,
    prompt: t('g4.frac.toMixed.prompt'),
    display: `${f(N, d)} = ?`,
    spoken: say('g4.frac.toMixed.spoken', { a: w(N, d) }),
    answer: labels.indexOf(right),
    input: labelledChoices(labels),
    hints: [
      // The wholes first, in the parts of this fraction; then what is left.
      hint(
        say('g4.frac.toMixed.hint1', {
          wholes: { n: whole, noun: WHOLE },
          all: { n: whole * d, noun: fractionNoun(d) },
          plural: fractionNoun(d).plural,
          a: w(N, d),
        }),
      ),
      hint(say('g4.frac.wholes.hint2'), { visual: wholes(whole, rest, d) }),
      exampleAvoiding(
        code(whole, rest),
        IMPROPER_EXAMPLES.map((ex) => ({
          answer: code(Math.floor(ex.N / ex.d), ex.N % ex.d),
          hint: () => improperExample(ex.N, ex.d),
        })),
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
    // The mixed number itself: a row for every whole, and the part after them.
    visual: wholes(whole, n, d),
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.frac.mixed.hint1', { all: { n: d, noun: fractionNoun(d) } })),
      // With this exercise's numbers: the wholes in parts, then the part on top.
      hint(
        say('g4.frac.mixed.hint2', {
          wholes: { n: whole, noun: WHOLE },
          all: { n: whole * d, noun: fractionNoun(d) },
          rest: w(n, d),
        }),
      ),
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
    // The wholes counted as single parts.
    advice: [
      {
        value: whole + n,
        say: say('g4.frac.adv.mixed', {
          all: { n: d, noun: fractionNoun(d) },
          plural: fractionNoun(d).plural,
          wholes: { n: whole, noun: WHOLE },
          rest: w(n, d),
        }),
      },
    ],
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
    advice: ofAdvice(n, d, total),
  });
}

/**
 * A part of a quantity: one part found and not taken n times (6/8 of 16 → 2), or
 * the part that was not taken (6/8 of 16 → 4).
 */
function ofAdvice(n: number, d: number, total: number): AdviceSpec[] {
  const one = total / d;
  return [
    {
      value: one,
      say: say('g4.frac.adv.ofOne', { v: one, one: w(1, d), total, n }),
    },
    {
      value: total - one * n,
      say: say('g4.frac.adv.ofRest', { v: total - one * n, frac: w(n, d), total }),
    },
  ];
}

type StoryKind = 'give' | 'left' | 'eatAdd' | 'eatSub';

interface StoryFact {
  kind: StoryKind;
  /** Picks the characters and the noun, so every fact always reads the same. */
  i: number;
  n: number;
  d: number;
  /** give / left: the quantity; eatAdd / eatSub: the second fraction's numerator. */
  m: number;
}

/**
 * Stories with a fraction (in lowest terms, as stories say them): what part was
 * given, what is left after giving a part, and two parts of one cake added or taken
 * away (same denominators). The characters and the noun follow from the fact.
 */
function story(x: StoryFact): Exercise {
  const who = CHARACTERS[x.i % CHARACTERS.length] ?? CHARACTERS[0];
  // The next character is always of the other gender, which the eat stories rely on.
  const other = CHARACTERS[(x.i + 1) % CHARACTERS.length] ?? CHARACTERS[1];
  const noun = WORD_NOUNS[(x.i * 5) % WORD_NOUNS.length] ?? WORD_NOUNS[0];
  if (!who || !other || !noun) throw new Error('characters and nouns are not empty');
  const { kind, n, d, m } = x;
  const plural = fractionNoun(d).plural;
  let spoken: Said;
  let answer: number;
  let equation: string;
  let hint1: Said;
  let solution: Said;
  let example: Hint;
  let advice: AdviceSpec[] = [];
  if (kind === 'give' || kind === 'left') {
    const total = m;
    const part = (total / d) * n;
    answer = kind === 'give' ? part : total - part;
    spoken = say(
      kind === 'give' ? 'wp.fraction.story' : 'g4.wp.frac.left.story',
      {
        name: who.name,
        other: other.name,
        a: { n: total, noun },
        frac: w(n, d),
        plural: noun.plural,
      },
      who.gender,
    );
    // "× 1" says nothing: a third of 12 is 12 ÷ 3.
    const part1 = n === 1 ? `${total} ÷ ${d}` : `${total} ÷ ${d} × ${n}`;
    equation = kind === 'give' ? `${part1} = ?` : `${total} − ${part1} = ?`;
    hint1 =
      kind === 'give'
        ? say('g4.wp.fraction.hint1', { frac: w(n, d), d, total, n })
        : say('g4.wp.frac.left.hint1', { frac: w(n, d), plural: noun.plural });
    advice =
      kind === 'give'
        ? n > 1
          ? ofAdvice(n, d, total).slice(0, 1)
          : []
        : [{ value: part, say: say('g4.frac.adv.leftPart', { v: part }) }];
    solution =
      kind === 'give'
        ? say('ex.frac.of.solution', { frac: w(n, d), whole: total, r: answer })
        : say('g4.wp.frac.left.solution', { frac: w(n, d), whole: total, part, r: answer });
    example =
      kind === 'give'
        ? ofExample(answer)
        : exampleAvoiding(
            answer,
            [
              { n: 2, d: 3, total: 12 },
              { n: 3, d: 4, total: 20 },
            ].map((ex) => {
              const exPart = (ex.total / ex.d) * ex.n;
              const r = ex.total - exPart;
              return {
                answer: r,
                hint: () =>
                  exampleHint(
                    `${ex.total} − ${ex.total} ÷ ${ex.d} × ${ex.n} = ${r}`,
                    say('g4.wp.frac.left.solution', {
                      frac: w(ex.n, ex.d),
                      whole: ex.total,
                      part: exPart,
                      r,
                    }),
                  ),
              };
            }),
          );
  } else {
    const add = kind === 'eatAdd';
    answer = add ? n + m : n - m;
    spoken = say(
      add ? 'g4.wp.frac.eat.story' : 'g4.wp.frac.cake.story',
      { name: who.name, other: other.name, a: w(n, d), b: w(m, d), plural },
      who.gender,
    );
    const sym = add ? '+' : '−';
    equation = `${f(n, d)} ${sym} ${f(m, d)} = ?/${d}`;
    hint1 = say(add ? 'ex.frac.same.hintAdd' : 'ex.frac.same.hintSub', { plural });
    const solved = (a: number, b: number, r: number, den: number) =>
      say('ex.frac.same.solution', {
        a: w(a, den),
        op: add ? 'ועוד' : 'פחות',
        b: w(b, den),
        r: w(r, den),
      });
    solution = solved(n, m, answer, d);
    example = exampleAvoiding(
      answer,
      (add
        ? [
            { a: 1, b: 3, d: 8 },
            { a: 2, b: 1, d: 5 },
          ]
        : [
            { a: 7, b: 3, d: 8 },
            { a: 4, b: 3, d: 5 },
          ]
      ).map((ex) => {
        const r = add ? ex.a + ex.b : ex.a - ex.b;
        return {
          answer: r,
          hint: () =>
            exampleHint(
              `${f(ex.a, ex.d)} ${sym} ${f(ex.b, ex.d)} = ${f(r, ex.d)}`,
              solved(ex.a, ex.b, r, ex.d),
            ),
        };
      }),
    );
  }
  return exercise({
    factId: `fwp:${kind}:${x.i}:${n}/${d}:${m}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: kind === 'give' ? 'mul' : kind === 'eatAdd' ? 'add' : 'sub',
    input: numpad(3),
    hints: [
      hint(hint1),
      {
        ...hint(say('hint.equation')),
        example: { display: equation, spoken: say('hint.equation').text },
      },
      example,
    ],
    solution,
    advice,
  });
}

/** Improper fractions with one to four wholes and a part left over. */
const IMPROPER_FACTS = DENS.flatMap((d) =>
  range(d + 1, 5 * d - 1)
    .filter((N) => N % d !== 0)
    .map((N) => ({ N, d })),
);

/** Fractions in lowest terms (stories say "two thirds", not "two sixths"). */
const lowest = (n: number, d: number) => gcdOf(n, d) === 1;

const STORY_FACTS: StoryFact[] = [
  ...(['give', 'left'] as const).flatMap((kind) =>
    [2, 3, 4, 5].flatMap((d) =>
      range(1, d - 1)
        .filter((n) => lowest(n, d))
        .flatMap((n) =>
          range(3, 6).map((k, j) => ({
            kind,
            i: d * 7 + n * 3 + j + (kind === 'left' ? 1 : 0),
            n,
            d,
            m: d * k,
          })),
        ),
    ),
  ),
  ...[5, 8, 10].flatMap((d) =>
    range(1, d - 1).flatMap((n) =>
      range(1, d - 1)
        .filter((m) => lowest(n, d) && lowest(m, d))
        .flatMap((m): StoryFact[] => [
          ...(n + m < d ? [{ kind: 'eatAdd' as const, i: d + n * 2 + m, n, d, m }] : []),
          ...(n > m ? [{ kind: 'eatSub' as const, i: d + n + m * 2, n, d, m }] : []),
        ]),
    ),
  ),
];

/** Proper fractions n/d whose value equals N/D for a related D. */
const EXPAND_FACTS = RELATED.flatMap(({ d, D }) => range(1, d - 1).map((n) => ({ n, d, D })));
/**
 * Pairs of different fractions with different denominators, not equal in value,
 * that can be compared without a common-denominator algorithm (see compareWay).
 * One in five "more than a half / less than a half" pairs, which are by far the most.
 */
const COMPARE_FACTS = DENS.flatMap((d1) =>
  DENS.filter((d2) => d2 > d1).flatMap((d2) =>
    range(1, d1 - 1).flatMap((n1) =>
      range(1, d2 - 1)
        .filter((n2) => n1 * d2 !== n2 * d1)
        .map((n2) => ({ a: { n: n1, d: d1 }, b: { n: n2, d: d2 } })),
    ),
  ),
)
  .filter((x) => compareWay(x.a, x.b) !== null)
  .filter((x, i) => compareWay(x.a, x.b) !== 'half' || i % 5 === 0);

export const fractionOps = defineTopic({
  id: ID,
  labelKey: 'topic.fractionOps',
  // Grade 5's fractions too (names of a fraction, comparing, adding and subtracting, mixed
  // numbers): the curriculum puts them in grade 5; grade 4 meets them informally.
  grades: [4, 5],
  startLevel: () => 1,
  levels: [
    // The number of parts asked as well as the numerator: the same pictures, twice the facts.
    closed(
      'level.fractionOps.equal1',
      () => [false, true].flatMap((askDen) => EXPAND_FACTS.map((x) => ({ ...x, askDen }))),
      (x) => equalName(1, x.n, x.d, x.D, x.askDen),
    ),
    closed(
      'level.fractionOps.equal2',
      () =>
        [false, true].flatMap((askDen) =>
          EXPAND_FACTS.map((x) => ({ N: x.n * (x.D / x.d), D: x.D, d: x.d, askDen })),
        ),
      (x) => equalName(2, x.N, x.D, x.d, x.askDen),
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
    // Up to four wholes, so the answer is not always one or two.
    closed(
      L(6),
      () => IMPROPER_FACTS,
      (x) => improperWholes(x.N, x.d),
    ),
    closed(
      'level.fractionOps.toMixed',
      () => IMPROPER_FACTS,
      (x: { N: number; d: number }, rng) => improperToMixed(x.N, x.d, rng),
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
    closed(L(10), () => STORY_FACTS, story),
  ],
});
