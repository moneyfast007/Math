import { closed, defineTopic, hint, open, pictureExample, say, spreadChoices } from '../build';
import type { LevelDef } from '../build';
import type { Noun } from '@/lang/hebrewNumbers';
import type { Exercise, Rng, Visual } from '../types';
import { pictureQuestion, type PictureOption } from './ganKit';
import {
  change,
  COINS,
  count,
  enoughFrom,
  know,
  smallCoinSets,
  storyBank,
  tinyCoinSets,
  walletsWith,
  type KnowFact,
} from './money';

/**
 * World 14, gan hova: "כסף ומטבעות". The coins, counting shekels (ones, ones
 * and twos, with a five, with a ten), which wallet has more, is there enough,
 * paying exactly, and change from ten and twenty. Mostly the money exercises
 * of grades 1 and 2 with small sums, recorded already; a sum is answered with
 * three big number buttons instead of the pad.
 */

const ID = 'money-0';
const L = (n: number) => `level.money0.${n}`;
const SHEKEL: Noun = { singular: 'שקל', plural: 'שקלים', gender: 'm' };

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
const money = (items: readonly number[], price?: number): Visual =>
  price === undefined
    ? { type: 'money', items: [...items] }
    : { type: 'money', items: [...items], price };

/** The same exercise, filed under this world's station; a sum on three buttons, not the pad. */
const here =
  (level: number, rng?: Rng) =>
  (e: Exercise): Exercise => {
    const pad = e.input.type === 'numpad';
    return {
      ...e,
      topicId: ID,
      level,
      ...(pad && rng
        ? {
            input: {
              type: 'choices' as const,
              choices: spreadChoices(rng, e.answer, { deltas: [1, 2], min: 0, max: 22 }),
            },
          }
        : {}),
    };
  };

function closedHere<F>(
  level: number,
  facts: () => readonly F[],
  build: (f: F, rng: Rng) => Exercise,
): LevelDef {
  return closed(L(level), facts, (f: F, rng) => here(level, rng)(build(f, rng)));
}

function openHere(level: number, gen: (rng: Rng) => Exercise): LevelDef {
  return open(L(level), (rng) => here(level, rng)(gen(rng)));
}

const memo = <T>(f: () => T): (() => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};

/**
 * Coins of one kind: three to five twos, three to eight ones. (The twos come first, the most
 * first: a worked example is a handful as long as this one with another sum, or
 * else the first, ten shekels.)
 */
const sameKind = memo(() => [
  ...Array.from({ length: 3 }, (_, i) => Array.from({ length: 5 - i }, () => 2)),
  ...Array.from({ length: 6 }, (_, i) => Array.from({ length: i + 3 }, () => 1)),
]);
/** Ones and twos, up to ten. */
const onesTwos = memo(() =>
  tinyCoinSets().filter((s) => s.length >= 3 && sum(s) <= 10 && s.includes(2) && s.includes(1)),
);
/** With a five, up to ten. */
const withFive = memo(() =>
  smallCoinSets().filter((s) => sum(s) <= 10 && s.includes(5) && !s.includes(10)),
);
/** With a ten, up to twenty. */
const withTen = memo(() => smallCoinSets().filter((s) => s.includes(10)));

/* ---------- 8: paying exactly ---------- */

const ITEMS = ['מדבקה', 'סוכרייה', 'מחברת', 'כדור', 'בלון'] as const;

/** The fewest coins (5, 2, 1) that make `n`. */
function coinsFor(n: number): number[] {
  const out: number[] = [];
  let left = n;
  for (const v of [10, 5, 2, 1])
    while (left >= v) {
      out.push(v);
      left -= v;
    }
  return out;
}

/** The same sum in other coins (twos and ones), so the wallets are not told apart at a glance. */
function otherCoins(n: number): number[] {
  const twos = Math.floor(n / 2);
  return [
    ...Array.from({ length: Math.min(twos, 3) }, () => 2),
    ...Array.from({ length: n - 2 * Math.min(twos, 3) }, () => 1),
  ];
}

type Exact = { p: number; v: 0 | 1 };

function exact(level: number, { p, v }: Exact, rng: Rng): Exercise {
  const item = ITEMS[(p + v) % ITEMS.length] as string;
  const shekels = { n: p, noun: SHEKEL };
  const right = v === 0 ? coinsFor(p) : otherCoins(p);
  const less = coinsFor(p - 1);
  const more = v === 0 ? otherCoins(p + 1) : coinsFor(p + 2);
  const opt = (items: number[]): PictureOption => ({
    label: `${sum(items)} ₪`,
    visual: money(items),
  });
  const exP = p === 6 ? 7 : 6;
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `m0exact:${p}${v ? ':b' : ''}`,
      spoken: say('ex.m0.exact.spoken', { item, p: shekels }),
      visual: money([], p),
      options: [opt(right), opt(less), opt(more)],
      hints: [
        hint(say('ex.m0.exact.hint1')),
        hint(say('ex.m0.exact.hint2')),
        pictureExample(
          say('ex.m0.exact.solution', { p: { n: exP, noun: SHEKEL } }),
          money(coinsFor(exP)),
        ),
      ],
      solution: say('ex.m0.exact.solution', { p: shekels }),
      advice: [
        { option: 1, say: say('adv.m0.exact.less', { n: { n: sum(less), noun: SHEKEL } }) },
        { option: 2, say: say('adv.m0.exact.more', { n: { n: sum(more), noun: SHEKEL } }) },
      ],
    },
    rng,
  );
}

/* ---------- The world ---------- */

export const money0 = defineTopic({
  id: ID,
  labelKey: 'topic.money0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closedHere(
      1,
      () =>
        COINS.flatMap((v): KnowFact[] => [
          { kind: 'value', v },
          { kind: 'pick', v },
        ]),
      (f) => know(f),
    ),
    closedHere(2, sameKind, count(2, sameKind)),
    closedHere(3, onesTwos, count(2, onesTwos)),
    closedHere(4, withFive, count(3, withFive)),
    closedHere(5, withTen, count(3, withTen)),
    openHere(6, walletsWith([5, 10])),
    openHere(7, enoughFrom(onesTwos)),
    closedHere(
      8,
      () =>
        Array.from({ length: 8 }, (_, i) => i + 3).flatMap((p): Exact[] => [
          { p, v: 0 },
          { p, v: 1 },
        ]),
      (f, rng) => exact(8, f, rng),
    ),
    openHere(9, change(8, [10])),
    openHere(10, change(8, [10, 20])),
  ],
  extraBank: storyBank,
});
