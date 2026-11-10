import { t, type TranslationKey } from '@/i18n';
import { compose, shown, type Slot } from '@/lang/compose';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  pictureExample,
  range,
  say,
  spreadChoices,
  type Character,
  type Said,
} from '../build';
import { NOUNS, type CountableNoun } from '../nouns';
import type { Exercise, Rng } from '../types';
import { pictureQuestion, type PictureOption } from './ganKit';

/**
 * World 13, gan hova: "חלוקה שווה וחצי". Sharing fairly between two children
 * and between three, whether a sharing is fair, which plate was shared evenly,
 * half of a group, how many pairs, which numbers two children can share with
 * nothing left over, half of a cake and of a bar, and half of a number with no
 * picture. Every level is a closed list, so every sentence is recorded whole.
 */

const ID = 'share-0';
const L = (n: number) => `level.share0.${n}`;

const nounFor = (seed: number): CountableNoun =>
  NOUNS[Math.abs(seed) % NOUNS.length] as CountableNoun;
const childFor = (seed: number): Character =>
  CHARACTERS[Math.abs(seed) % CHARACTERS.length] as Character;
/** The other child: of the other gender, so the sentence's verbs are plural and right. */
const otherFor = (who: Character, seed: number): Character => {
  const others = CHARACTERS.filter((c) => c.gender !== who.gender);
  return others[Math.abs(seed) % others.length] as Character;
};

/** Things that come in pairs. */
const PAIRED: readonly CountableNoun[] = [
  { id: 'sock', emoji: '🧦', singular: 'גרב', plural: 'גרביים', gender: 'm' },
  { id: 'shoe', emoji: '👟', singular: 'נעל', plural: 'נעליים', gender: 'f' },
  { id: 'glove', emoji: '🧤', singular: 'כפפה', plural: 'כפפות', gender: 'f' },
];

function story(key: string, who: Character, slots: Record<string, Slot>): Said {
  return compose(t(key as TranslationKey, { gender: who.gender }), { name: who.name, ...slots });
}

function near(rng: Rng, answer: number, max: number): number[] {
  return spreadChoices(rng, answer, { deltas: [1, 2], min: 0, max });
}

const offByOne = (answer: number) => (v: number) =>
  Math.abs(v - answer) === 1 ? 'offByOne' : null;

const YES_NO = () => labelledChoices([t('ex.money.no'), t('ex.money.yes')]);

/* ---------- 1, 2, 5: sharing between children, half of a group ---------- */

/** `v`: a second telling of the same numbers, with another thing (and other children). */
type Share = { n: number; ways: 2 | 3; half?: boolean; v: 0 | 1 };

function share(level: number, { n, ways, half, v }: Share, rng: Rng): Exercise {
  const k = n / ways;
  const noun = nounFor(n * 5 + ways + (half ? 1 : 0) + v * 3);
  const who = childFor(n + ways + v);
  const other = otherFor(who, n);
  const spoken = half
    ? say('ex.h0.half.spoken', { a: { n, noun } })
    : story(ways === 2 ? 'ex.h0.two.story' : 'ex.h0.three.story', who, {
        other: other.name,
        a: { n, noun },
        plural: noun.plural,
      });
  const solved = (x: number, kk: number): Said =>
    half
      ? say('ex.h0.half.solution', { a: x, k: kk })
      : say(ways === 2 ? 'ex.h0.two.solution' : 'ex.h0.three.solution', { a: x, k: kk });
  const exN = ways === 2 ? (n === 6 ? 8 : 6) : n === 6 ? 9 : 6;
  return exercise({
    factId: `${half ? 'half' : `share${ways}`}:${n}${v ? ':b' : ''}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: { type: 'objects', kind: noun, groups: [n], arranged: true },
    answer: k,
    operation: 'div',
    input: { type: 'choices', choices: near(rng, k, n) },
    hints: [
      hint(say(half ? 'ex.h0.half.hint1' : 'ex.h0.deal.hint1')),
      hint(say('ex.h0.deal.hint2'), { visual: { type: 'array', rows: ways, cols: k } }),
      pictureExample(solved(exN, exN / ways), { type: 'array', rows: ways, cols: exN / ways }),
    ],
    solution: solved(n, k),
    diagnose: offByOne(k),
    advice: [{ value: n, say: say('adv.h0.all') }],
  });
}

/* ---------- 3: is it fair? ---------- */

type Fair = { a: number; b: number };

function fair(level: number, { a, b }: Fair): Exercise {
  const seed = a * 7 + b;
  const noun = nounFor(seed);
  const who = childFor(seed);
  const other = otherFor(who, seed);
  const yes = a === b;
  const spoken = story('ex.h0.fair.story', who, {
    other: other.name,
    a: { n: a, noun },
    b: { n: b, noun },
  });
  return exercise({
    factId: `fair:${a},${b}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: { type: 'objects', kind: noun, groups: [a, b] },
    answer: yes ? 1 : 0,
    input: YES_NO(),
    hints: [
      hint(say('ex.h0.fair.hint1')),
      hint(say('ex.h0.fair.hint2'), {
        visual: { type: 'objects', kind: noun, groups: [a, b], arranged: true },
      }),
      exampleHint('3 = 3', say('ex.h0.fair.yes', { a: { n: a === 3 ? 4 : 3, noun } })),
    ],
    solution: yes
      ? say('ex.h0.fair.yes', { a: { n: a, noun } })
      : story('ex.h0.fair.no', who, { other: other.name, a: { n: a, noun }, b: { n: b, noun } }),
    advice: [{ value: yes ? 0 : 1, say: say('adv.h0.fair.no') }],
  });
}

/* ---------- 4: which plate was shared evenly ---------- */

function pick(level: number, n: number, rng: Rng): Exercise {
  const noun = nounFor(n * 3);
  const k = n / 2;
  const option = (x: number, y: number): PictureOption => ({
    label: `${x} | ${y}`,
    visual: { type: 'objects', kind: noun, groups: [x, y] },
  });
  const w1: [number, number] = [k + 1, k - 1];
  const w2: [number, number] = k >= 3 ? [k - 2, k + 2] : [k - 1, k + 1];
  const spoken = say('ex.h0.pick.spoken', { plural: noun.plural });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `pick:${n}`,
      spoken,
      options: [option(k, k), option(...w1), option(...w2)],
      hints: [
        hint(say('ex.h0.fair.hint1')),
        hint(say('ex.h0.fair.hint2')),
        exampleHint('3 = 3', say('ex.h0.pick.solution', { k: k === 3 ? 4 : 3 })),
      ],
      solution: say('ex.h0.pick.solution', { k }),
      advice: [
        { option: 1, say: say('adv.h0.pick', { a: w1[0], b: w1[1] }) },
        { option: 2, say: say('adv.h0.pick', { a: w2[0], b: w2[1] }) },
      ],
    },
    rng,
  );
}

/* ---------- 6: pairs ---------- */

function pairs(level: number, { n, v }: { n: number; v: 0 | 1 }, rng: Rng): Exercise {
  const noun = PAIRED[(n + v) % PAIRED.length] as CountableNoun;
  const k = n / 2;
  const spoken = say('ex.h0.pairs.spoken', { a: { n, noun } });
  const exN = n === 6 ? 8 : 6;
  return exercise({
    factId: `pairs:${n}${v ? ':b' : ''}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: { type: 'objects', kind: noun, groups: [n] },
    answer: k,
    operation: 'div',
    input: { type: 'choices', choices: near(rng, k, n) },
    hints: [
      hint(say('ex.h0.pairs.hint1')),
      hint(say('ex.h0.deal.hint2'), { visual: { type: 'array', rows: 2, cols: k } }),
      pictureExample(say('ex.h0.pairs.solution', { a: exN, k: exN / 2 }), {
        type: 'array',
        rows: 2,
        cols: exN / 2,
      }),
    ],
    solution: say('ex.h0.pairs.solution', { a: n, k }),
    diagnose: offByOne(k),
    advice: [{ value: n, say: say('ex.h0.pairs.hint1') }],
  });
}

/* ---------- 7: can two children share it? ---------- */

function even(level: number, n: number): Exercise {
  const noun = nounFor(n * 11);
  const yes = n % 2 === 0;
  const k = Math.floor(n / 2);
  const spoken = say('ex.h0.even.spoken', { a: { n, noun } });
  return exercise({
    factId: `even:${n}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: { type: 'objects', kind: noun, groups: [n] },
    answer: yes ? 1 : 0,
    input: YES_NO(),
    hints: [
      hint(say('ex.h0.even.hint1')),
      hint(say('ex.h0.deal.hint2'), {
        visual: { type: 'objects', kind: noun, groups: [k, n - k], arranged: true },
      }),
      exampleHint(
        n === 4 ? '6 = 3 + 3' : '4 = 2 + 2',
        say('ex.h0.even.yes', { a: n === 4 ? 6 : 4, k: n === 4 ? 3 : 2 }),
      ),
    ],
    solution: say(yes ? 'ex.h0.even.yes' : 'ex.h0.even.no', { a: n, k }),
  });
}

/* ---------- 8, 9: half of a cake, of a bar ---------- */

function shapeHalf(level: number, shape: 'circle' | 'bar', wrong: [number, number], rng: Rng) {
  const frac = (parts: number): PictureOption => ({
    label: `1/${parts}`,
    visual: { type: 'fraction', parts, shaded: 1, shape },
  });
  const [p1, p2] = wrong;
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `${shape}:${p1},${p2}`,
      spoken: say(shape === 'circle' ? 'ex.h0.cake.spoken' : 'ex.h0.bar.spoken'),
      options: [frac(2), frac(p1), frac(p2)],
      hints: [
        hint(say('ex.h0.shape.hint1')),
        hint(say('ex.h0.shape.hint2')),
        pictureExample(say('ex.h0.shape.solution'), {
          type: 'fraction',
          parts: 2,
          shaded: 1,
          shape: shape === 'circle' ? 'bar' : 'circle',
        }),
      ],
      solution: say('ex.h0.shape.solution'),
      advice: [
        { option: 1, say: say('adv.h0.shape', { n: p1 }) },
        { option: 2, say: say('adv.h0.shape', { n: p2 }) },
      ],
    },
    rng,
  );
}

/* ---------- 10: half of a number ---------- */

function halfNumber(level: number, n: number, rng: Rng): Exercise {
  const k = n / 2;
  const spoken = say('ex.h0.halfn.spoken', { a: n });
  const exN = n === 8 ? 6 : 8;
  return exercise({
    factId: `halfn:${n}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer: k,
    operation: 'div',
    input: { type: 'choices', choices: near(rng, k, n) },
    hints: [
      hint(say('ex.h0.half.hint1')),
      hint(say('ex.h0.deal.hint2'), { visual: { type: 'array', rows: 2, cols: k } }),
      exampleHint(
        `${exN / 2} + ${exN / 2} = ${exN}`,
        say('ex.h0.half.solution', { a: exN, k: exN / 2 }),
      ),
    ],
    solution: say('ex.h0.half.solution', { a: n, k }),
    diagnose: offByOne(k),
    advice: [{ value: n, say: say('adv.h0.all') }],
  });
}

/* ---------- The world ---------- */

const EVEN = [2, 4, 6, 8, 10];
const twice = <T>(xs: readonly T[]): { x: T; v: 0 | 1 }[] =>
  xs.flatMap((x) => [
    { x, v: 0 as const },
    { x, v: 1 as const },
  ]);
/** Every ordered pair of two different numbers of parts, 3 to 6: the wrong pictures. */
const WRONG_PARTS = [3, 4, 5, 6].flatMap((p1) =>
  [3, 4, 5, 6].filter((p2) => p2 !== p1).map((p2): [number, number] => [p1, p2]),
);

export const share0 = defineTopic({
  id: ID,
  labelKey: 'topic.share0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => twice(EVEN).map(({ x, v }): Share => ({ n: x, ways: 2, v })),
      (f, rng) => share(1, f, rng),
    ),
    closed(
      L(2),
      () => twice([3, 6, 9]).map(({ x, v }): Share => ({ n: x, ways: 3, v })),
      (f, rng) => share(2, f, rng),
    ),
    closed(
      L(3),
      () =>
        // As many fair as unfair: "yes" and "no" are each the answer half the time.
        range(1, 7).flatMap((a): Fair[] => [
          { a, b: a },
          { a, b: a % 2 === 0 ? a - 1 : a + 1 },
        ]),
      (f) => fair(3, f),
    ),
    closed(
      L(4),
      () => [4, 6, 8, 10],
      (n, rng) => pick(4, n, rng),
    ),
    closed(
      L(5),
      () => twice(EVEN).map(({ x, v }): Share => ({ n: x, ways: 2, half: true, v })),
      (f, rng) => share(5, f, rng),
    ),
    closed(
      L(6),
      () => twice(EVEN).map(({ x, v }) => ({ n: x, v })),
      (f, rng) => pairs(6, f, rng),
    ),
    // Five that can be shared and five that cannot.
    closed(
      L(7),
      () => range(2, 11),
      (n) => even(7, n),
    ),
    closed(
      L(8),
      () => WRONG_PARTS,
      (w, rng) => shapeHalf(8, 'circle', w, rng),
    ),
    closed(
      L(9),
      () => WRONG_PARTS,
      (w, rng) => shapeHalf(9, 'bar', w, rng),
    ),
    closed(
      L(10),
      () => EVEN,
      (n, rng) => halfNumber(10, n, rng),
    ),
  ],
});
