import { shown } from '@/lang/compose';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  pictureExample,
  range,
  say,
  spreadChoices,
  type AdviceSpec,
  type Said,
} from '../build';
import { NOUNS, type CountableNoun } from '../nouns';
import type { Exercise, Rng, SceneItem, Visual } from '../types';
import { pictureQuestion, type PictureOption } from './ganKit';

/**
 * World 11, gan hova: "פירוק מספרים". A number is two numbers together: some
 * outside and the rest hidden in a box (to five, to ten), five fingers on one
 * hand and the rest on the other, pairs of dice that make a number (and the one
 * that does not), the number's house (its two parts under one roof), the
 * friends of ten, and what is missing. Every level is a closed list, so every
 * sentence is recorded whole; answers are three big number buttons or three
 * pairs of dice.
 */

const ID = 'bonds-0';
const L = (n: number) => `level.bonds0.${n}`;

const DOT: Noun = { singular: 'נקודה', plural: 'נקודות', gender: 'f' };

/** The object of a fact comes from the fact, so the bank knows every sentence (see count10). */
function nounFor(seed: number): CountableNoun {
  return NOUNS[Math.abs(seed) % NOUNS.length] as CountableNoun;
}

/** Three buttons near the answer, within 0 and the whole. */
function near(rng: Rng, answer: number, max: number): number[] {
  return spreadChoices(rng, answer, { deltas: [1, 2], min: 0, max });
}

const offByOne = (answer: number) => (v: number) =>
  Math.abs(v - answer) === 1 ? 'offByOne' : null;

/** A number line from the part to the whole: the hops are what is missing. */
const gapLine = (from: number, to: number): Visual => ({
  type: 'numberLine',
  from: 0,
  to: Math.max(10, to),
  start: from,
  hops: 0,
  target: to,
});

/** "3 ועוד 2 זה 5": a worked example of the same kind, with none of this exercise's numbers. */
function otherSplit(total: number, part: number): { t: number; a: number } {
  const wholes = total <= 5 ? [5, 4, 3, 6] : [8, 7, 9, 6, 10];
  for (const w of wholes)
    for (const a of [2, 3, 1, 4, 5])
      if (
        a < w &&
        w !== total &&
        w !== total - part &&
        a !== part &&
        w - a !== total - part &&
        a !== total - part
      )
        return { t: w, a };
  return { t: total === 5 ? 4 : 5, a: 1 };
}

/* ---------- 1, 2: what hides in the box ---------- */

type Hide = { t: number; v: number };

/** `v` things outside, beside a closed box with "?" on it. */
function hideScene(noun: CountableNoun, v: number): Visual {
  // Wide things (a fish) side by side need room: never closer than their size.
  const step = 12;
  const items: SceneItem[] = Array.from({ length: v }, (_, i) => ({
    emoji: noun.emoji,
    x: 96 - (i % 5) * step,
    y: v > 5 ? (i < 5 ? 22 : 40) : 32,
    size: 11,
  }));
  return {
    type: 'scene',
    w: 110,
    h: 56,
    props: [
      { kind: 'floor', y: 50 },
      { kind: 'box', x: 4, y: 14, w: 34, h: 36 },
    ],
    items: [...items, { blank: true, x: 21, y: 32, size: 20 }],
  };
}

function hide(level: number, { t: total, v }: Hide, rng: Rng): Exercise {
  const noun = nounFor(total * 3 + v);
  const h = total - v;
  const spoken = say(
    'ex.b0.hide.spoken',
    { t: { n: total, noun }, v: { n: v, gender: noun.gender } },
    noun.gender,
  );
  const ex = otherSplit(total, v);
  const exSolved = say('ex.b0.hide.solution', { v: ex.a, h: ex.t - ex.a, t: ex.t });
  const advice: AdviceSpec[] = [
    { value: total, say: say('adv.b0.hide.all') },
    ...(v !== h ? [{ value: v, say: say('adv.b0.hide.out') }] : []),
  ];
  return exercise({
    factId: `hide:${total}-${v}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: hideScene(noun, v),
    answer: h,
    operation: 'sub',
    input: { type: 'choices', choices: near(rng, h, total) },
    hints: [
      hint(say('ex.b0.hide.hint1', { t: total })),
      hint(say('hint.numberLineGap'), { visual: gapLine(v, total) }),
      exampleHint(`${ex.a} + ${ex.t - ex.a} = ${ex.t}`, exSolved),
    ],
    solution: say('ex.b0.hide.solution', { v, h, t: total }),
    diagnose: offByOne(h),
    advice,
  });
}

/* ---------- 3: one hand of five, and the other ---------- */

type Hand = { t: number; left: boolean };

function handScene(left: boolean): Visual {
  const five = { emoji: '✋', x: left ? 72 : 28, y: 26, size: 30 };
  const other = { blank: true, x: left ? 28 : 72, y: 26, size: 22 };
  return { type: 'scene', w: 100, h: 52, items: left ? [five, other] : [other, five] };
}

function hand(level: number, { t: total, left }: Hand, rng: Rng): Exercise {
  const h = total - 5;
  const spoken = say('ex.b0.hand.spoken', { t: { n: total, gender: 'f' } });
  const exT = total === 7 ? 8 : 7;
  return exercise({
    factId: `hand:${total}${left ? '' : ':b'}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: handScene(left),
    answer: h,
    operation: 'sub',
    input: { type: 'choices', choices: near(rng, h, 5) },
    hints: [
      hint(say('ex.b0.hand.hint1', { t: total })),
      hint(say('ex.b0.hand.hint2', { t: total }), { visual: gapLine(5, total) }),
      exampleHint(`5 + ${exT - 5} = ${exT}`, say('ex.b0.hand.solution', { h: exT - 5, t: exT })),
    ],
    solution: say('ex.b0.hand.solution', { h, t: total }),
    diagnose: offByOne(h),
    advice: [{ value: total, say: say('adv.b0.hand.all') }],
  });
}

/* ---------- 4, 5, 6: pairs of dice ---------- */

type Pair = [number, number];
const sum = ([a, b]: Pair) => a + b;
const pairOption = (p: Pair): PictureOption => ({
  label: `${p[0]} + ${p[1]}`,
  visual: { type: 'dice', dice: [...p] },
});

/** Every pair of dice (1–6 each) whose sum is `s`. */
const pairsOf = (s: number): Pair[] =>
  range(1, 6)
    .filter((a) => s - a >= 1 && s - a <= 6)
    .map((a): Pair => [a, s - a]);

/**
 * Two wrong pairs, one more and one less than the sum (or two more, at the edge).
 * Chosen from the pair itself, not by chance: what is said about each is recorded.
 */
function wrongPairs(right: Pair): [Pair, Pair] {
  const s = sum(right);
  const near1 = s - 1 >= 2 ? s - 1 : s + 2;
  const near2 = s + 1 <= 12 ? s + 1 : s - 2;
  const pickOne = (target: number): Pair => {
    // Keep one die of the right pair where it can, so the child has to count, not glance.
    const keep = pairsOf(target).filter((p) => p[0] === right[0] || p[1] === right[1]);
    const from = keep.length > 0 ? keep : pairsOf(target);
    return from[(right[0] + 2 * right[1]) % from.length] as Pair;
  };
  return [pickOne(near1), pickOne(near2)];
}

function pairQuestion(level: number, right: Pair, rng: Rng): Exercise {
  const s = sum(right);
  const [w1, w2] = wrongPairs(right);
  const spoken = say('ex.b0.pair.spoken', { t: { n: s, noun: DOT } });
  const ex: Pair = s === 5 ? [3, 3] : [2, 3];
  const advice = (p: Pair, option: number) => ({
    option,
    say: say('adv.b0.pair', { a: p[0], b: p[1], s: sum(p), t: s }),
  });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `pair:${right[0]}+${right[1]}`,
      spoken,
      options: [pairOption(right), pairOption(w1), pairOption(w2)],
      hints: [
        hint(say('ex.b0.pair.hint1')),
        hint(say('ex.b0.pair.hint2')),
        pictureExample(say('ex.b0.pair.solution', { a: ex[0], b: ex[1], t: sum(ex) }), {
          type: 'dice',
          dice: [...ex],
          tone: 1,
        }),
      ],
      solution: say('ex.b0.pair.solution', { a: right[0], b: right[1], t: s }),
      advice: [advice(w1, 1), advice(w2, 2)],
    },
    rng,
  );
}

type Odd = { t: number; wrong: Pair };

function oddQuestion(level: number, { t: total, wrong }: Odd, rng: Rng): Exercise {
  // Two pairs that make it, not the same two numbers turned round. Chosen from the
  // fact, not by chance: what is said about each is recorded.
  const kinds = pairsOf(total).filter((p) => p[0] <= p[1]);
  const seed = wrong[0] * 3 + wrong[1];
  const k1 = seed % kinds.length;
  const k2 = (k1 + 1) % kinds.length;
  const turn = (p: Pair, flip: boolean): Pair => (flip ? [p[1], p[0]] : p);
  const r1 = turn(kinds[k1] ?? [1, total - 1], seed % 2 === 0);
  const r2 = turn(kinds[k2] ?? [2, total - 2], seed % 3 === 0);
  const spoken = say('ex.b0.odd.spoken', { t: { n: total, noun: DOT } });
  const ex: Pair = total === 6 ? [3, 3] : [4, 2];
  const okAdvice = (p: Pair, option: number) => ({
    option,
    say: say('adv.b0.odd', { a: p[0], b: p[1], t: total }),
  });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `odd:${total}:${wrong[0]}+${wrong[1]}`,
      spoken,
      options: [pairOption(wrong), pairOption(r1), pairOption(r2)],
      hints: [
        hint(say('ex.b0.odd.hint1', { t: { n: total, noun: DOT } })),
        hint(say('ex.b0.pair.hint2')),
        pictureExample(say('ex.b0.pair.solution', { a: ex[0], b: ex[1], t: sum(ex) }), {
          type: 'dice',
          dice: [...ex],
          tone: 1,
        }),
      ],
      solution: say('ex.b0.odd.solution', { a: wrong[0], b: wrong[1], s: sum(wrong), t: total }),
      advice: [okAdvice(r1, 1), okAdvice(r2, 2)],
    },
    rng,
  );
}

/* ---------- 7, 8: the number's house ---------- */

type House = { t: number; a: number };

/** The whole under the roof, one part in a window, "?" in the other (read from the right), or `h` in it (solved). */
function houseScene(total: number, a: number, h?: number): Visual {
  return {
    type: 'scene',
    w: 100,
    h: 66,
    items: [
      { emoji: '🏠', x: 50, y: 14, size: 20 },
      { text: String(total), x: 50, y: 34, size: 14 },
      { text: String(a), x: 66, y: 54, size: 14 },
      h === undefined
        ? { blank: true, x: 34, y: 54, size: 14 }
        : { text: String(h), x: 34, y: 54, size: 14 },
    ],
  };
}

function house(level: number, { t: total, a }: House, rng: Rng): Exercise {
  const h = total - a;
  const spoken = say('ex.b0.house.spoken', { t: total, a });
  const ex = otherSplit(total, a);
  return exercise({
    factId: `house:${total}-${a}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: houseScene(total, a),
    answer: h,
    operation: 'sub',
    input: { type: 'choices', choices: near(rng, h, total) },
    hints: [
      hint(say('ex.b0.house.hint1', { a, t: total })),
      hint(say('hint.numberLineGap'), { visual: gapLine(a, total) }),
      pictureExample(
        say('ex.b0.house.solution', { a: ex.a, h: ex.t - ex.a, t: ex.t }),
        houseScene(ex.t, ex.a, ex.t - ex.a),
      ),
    ],
    solution: say('ex.b0.house.solution', { a, h, t: total }),
    diagnose: offByOne(h),
    advice: [{ value: total, say: say('adv.b0.missing.whole', { a }) }],
  });
}

/* ---------- 9, 10: the friends of ten, and what is missing ---------- */

type Missing = { t: number; a: number };

function missing(level: number, { t: total, a }: Missing, rng: Rng): Exercise {
  const h = total - a;
  const ten = total === 10;
  const spoken: Said = ten
    ? say('ex.b0.ten.spoken', { a })
    : say('ex.b0.missing.spoken', { a, t: total });
  const ex = otherSplit(total, a);
  return exercise({
    factId: `miss:${total}-${a}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: `${a} + ? = ${total}`,
    spoken,
    ...(ten ? { visual: { type: 'objects', kind: nounFor(a), groups: [a], frame: 10 } } : {}),
    answer: h,
    operation: 'sub',
    input: { type: 'choices', choices: near(rng, h, total) },
    hints: [
      hint(ten ? say('ex.b0.ten.hint1', { a }) : say('ex.b0.missing.hint1', { a, t: total })),
      hint(say('hint.numberLineGap'), { visual: gapLine(a, total) }),
      exampleHint(
        `${ex.a} + ${ex.t - ex.a} = ${ex.t}`,
        say('ex.b0.house.solution', { a: ex.a, h: ex.t - ex.a, t: ex.t }),
      ),
    ],
    solution: say('ex.b0.house.solution', { a, h, t: total }),
    diagnose: offByOne(h),
    advice: [{ value: total, say: say('adv.b0.missing.whole', { a }) }],
  });
}

/* ---------- The world ---------- */

const splits = (wholes: number[], min = 1): { t: number; a: number }[] =>
  wholes.flatMap((w) => range(min, w - 1).map((a) => ({ t: w, a })));

export const bonds0 = defineTopic({
  id: ID,
  labelKey: 'topic.bonds0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => splits([3, 4, 5]).map(({ t: w, a }): Hide => ({ t: w, v: a })),
      (f, rng) => hide(1, f, rng),
    ),
    closed(
      L(2),
      () => splits([6, 7, 8, 9, 10], 2).map(({ t: w, a }): Hide => ({ t: w, v: a })),
      (f, rng) => hide(2, f, rng),
    ),
    closed(
      L(3),
      () =>
        range(6, 10).flatMap((w): Hand[] => [
          { t: w, left: true },
          { t: w, left: false },
        ]),
      (f, rng) => hand(3, f, rng),
    ),
    closed(
      L(4),
      () => [...pairsOf(4), ...pairsOf(5)],
      (p, rng) => pairQuestion(4, p, rng),
    ),
    closed(
      L(5),
      () => [...pairsOf(6), ...pairsOf(7), ...pairsOf(8)],
      (p, rng) => pairQuestion(5, p, rng),
    ),
    closed(
      L(6),
      () =>
        [5, 6].flatMap((w) =>
          [w - 1, w + 1].flatMap((s) => pairsOf(s).map((wrong): Odd => ({ t: w, wrong }))),
        ),
      (f, rng) => oddQuestion(6, f, rng),
    ),
    closed(
      L(7),
      () => splits([2, 3, 4, 5]),
      (f, rng) => house(7, f, rng),
    ),
    closed(
      L(8),
      () => splits([6, 7, 8, 9, 10]),
      (f, rng) => house(8, f, rng),
    ),
    closed(
      L(9),
      () => splits([10]),
      (f, rng) => missing(9, f, rng),
    ),
    closed(
      L(10),
      () => splits([5, 6, 7, 8, 9]),
      (f, rng) => missing(10, f, rng),
    ),
  ],
});
