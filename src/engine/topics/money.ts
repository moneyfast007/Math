import { t, type TranslationKey } from '@/i18n';
import { compose, shown, type Slot } from '@/lang/compose';
import type { Gender } from '@/lang/gender';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  CHARACTERS,
  closed,
  defineTopic,
  diagnoseArith,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  pictureChoices,
  pictureExample,
  say,
  spokenEquationSolved,
  type Character,
  type Said,
} from '../build';
import { pick, randInt, shuffle } from '../rng';
import type { Exercise, Hint, Rng, Visual } from '../types';

/**
 * World "כסף", grade 2 (phase 6). Knowing the coins and notes, counting money,
 * having enough, comparing wallets, paying exactly, change from 10 to 100,
 * shopping problems. Shekels only: agorot are grade 3.
 *
 * The amounts children count are always at least three shekels where they are
 * read with the noun ("שלושה שקלים"), so the construct forms of one and two
 * never need recordings of their own; levels where one or two shekels can be
 * said are closed and recorded whole.
 */

const ID = 'money';
const L = (n: number) => `level.money.${n}`;
const SHEKEL: Noun = { singular: 'שקל', plural: 'שקלים', gender: 'm' };
export const COINS = [1, 2, 5, 10] as const;
const NOTES = [20, 50, 100] as const;

const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
const money = (items: readonly number[], price?: number): Visual =>
  price === undefined
    ? { type: 'money', items: [...items] }
    : { type: 'money', items: [...items], price };
const shekels = (n: number): Slot => ({ n, noun: SHEKEL });
const plusAll = (items: readonly number[]) => [...items].sort((a, b) => b - a).join(' + ');

/* ---------- Level 1: knowing the coins and notes ---------- */

export type KnowFact = { kind: 'value' | 'pick'; v: number };

export function know({ kind, v }: KnowFact): Exercise {
  const isNote = v >= 20;
  const family: readonly number[] = isNote ? NOTES : COINS;
  const others = family.filter((x) => x !== v);
  // Deterministic distractors (closed level): the neighbours in the family.
  const i = family.indexOf(v);
  const near = [family[i - 1], family[i + 1], ...others].filter(
    (x): x is number => x !== undefined,
  );
  const options = [v, ...[...new Set(near)].slice(0, 2)].sort((a, b) => a - b);
  const exV = v === 5 ? 10 : 5;
  const solved = say('ex.money.value.solution', { v: shekelsWhole(v) });
  const hints: [Hint, Hint, Hint] = [
    hint(say('ex.money.value.hint1')),
    hint(say('ex.money.value.hint2'), { visual: money([...COINS]) }),
    pictureExample(say('ex.money.value.solution', { v: shekelsWhole(exV) }), money([exV])),
  ];
  if (kind === 'value') {
    return exercise({
      factId: `mval:${v}`,
      topicId: ID,
      level: 1,
      prompt: t('ex.money.value.prompt'),
      display: '',
      spoken: say('ex.money.value.prompt'),
      visual: money([v]),
      answer: v,
      input: { type: 'choices', choices: options },
      hints,
      solution: solved,
    });
  }
  return exercise({
    factId: `mpick:${v}`,
    topicId: ID,
    level: 1,
    prompt: t(isNote ? 'ex.money.pickNote.prompt' : 'ex.money.pickCoin.prompt', {
      params: { v },
    }),
    display: '',
    spoken: say(isNote ? 'ex.money.pickNote.spoken' : 'ex.money.pickCoin.spoken', {
      v: shekelsWhole(v),
    }),
    answer: options.indexOf(v),
    input: pictureChoices(
      options.map((x) => `${x} ₪`),
      options.map((x) => money([x])),
    ),
    hints,
    solution: solved,
  });
}

/** One or two shekels read as words with the noun ("שקל אחד", "שני שקלים"): closed levels only. */
function shekelsWhole(n: number): Slot {
  return n === 1 ? 'שקל אחד' : n === 2 ? 'שני שקלים' : shekels(n);
}

/* ---------- Levels 2–4: counting money ---------- */

/** Every handful of `items` made of at most `max[i]` of each value, `minCount`–`maxCount` pieces. */
function handfuls(
  values: readonly number[],
  max: readonly number[],
  ok: (items: number[]) => boolean,
): number[][] {
  const out: number[][] = [];
  const walk = (i: number, acc: number[]) => {
    if (i === values.length) {
      if (ok(acc)) out.push(acc);
      return;
    }
    for (let k = 0; k <= (max[i] ?? 0); k++)
      walk(i + 1, [...acc, ...Array.from({ length: k }, () => values[i] as number)]);
  };
  walk(0, []);
  return out;
}

const COUNT_SETS: Record<2 | 3 | 4, () => number[][]> = {
  2: () => handfuls([2, 1], [4, 4], (xs) => xs.length >= 2 && xs.length <= 6 && sum(xs) >= 3),
  3: () =>
    handfuls(
      [10, 5, 2, 1],
      [3, 2, 1, 2],
      (xs) =>
        xs.length >= 2 && xs.length <= 6 && xs.some((x) => x >= 5) && sum(xs) <= 50 && sum(xs) >= 6,
    ),
  4: () =>
    handfuls(
      [50, 20, 10, 5, 2, 1],
      [1, 2, 2, 1, 1, 1],
      (xs) => xs.length >= 2 && xs.length <= 6 && xs.some((x) => x >= 20) && sum(xs) <= 100,
    ),
};

const memo = <T>(f: () => T): (() => T) => {
  let v: T | undefined;
  return () => (v ??= f());
};

const countSets = {
  2: memo(COUNT_SETS[2]),
  3: memo(COUNT_SETS[3]),
  4: memo(COUNT_SETS[4]),
};

/** Grade 1: up to twenty shekels, with a five or a ten in every handful. */
export const smallCoinSets = memo(() =>
  handfuls(
    [10, 5, 2, 1],
    [1, 2, 2, 3],
    (xs) =>
      xs.length >= 2 && xs.length <= 6 && xs.some((x) => x >= 5) && sum(xs) <= 20 && sum(xs) >= 6,
  ),
);

export const tinyCoinSets = countSets[2];

export function count(level: number, from: () => number[][] = countSets[level as 2 | 3 | 4]) {
  return (items: number[]): Exercise => {
    const n = sum(items);
    const sets = from();
    const ex = sets.find((s) => sum(s) !== n && s.length === items.length) ?? sets[0] ?? [5, 2];
    return exercise({
      factId: `mcount${level}:${plusAll(items)}`,
      topicId: ID,
      level,
      prompt: t('ex.money.count.prompt'),
      display: '',
      spoken: say('ex.money.count.prompt'),
      visual: money(items),
      answer: n,
      input: numpad(level === 4 ? 3 : 2),
      hints: [
        hint(say('ex.money.count.hint1')),
        hint(say('ex.money.count.hint2'), {
          example: { display: `${plusAll(items)} = ?`, spoken: say('ex.money.count.hint2') },
        }),
        pictureExample(
          say('ex.money.count.solution', { n: shekels(sum(ex)) }),
          money(ex),
          `${plusAll(ex)} = ${sum(ex)}`,
        ),
      ],
      solution: say('ex.money.count.solution', { n: shekels(n) }),
      // Five coins worth 9 shekels, answered "5": the coins were counted, not their worth.
      diagnose: (v) =>
        v === items.length && v !== n ? 'countedCoins' : Math.abs(v - n) === 1 ? 'offByOne' : null,
    });
  };
}

/* ---------- Stories: characters, things to buy ---------- */

const ITEMS = ['מחברת', 'כדור', 'ספר', 'בובה', 'משחק'] as const;

/** How a child paid: the literal phrase, so the story's pieces stay a finite list. */
const PAID_WITH: Record<number, string> = {
  10: 'במטבע של עשרה שקלים',
  20: 'בשטר של עשרים שקלים',
  50: 'בשטר של חמישים שקלים',
  100: 'בשטר של מאה שקלים',
};

function story(key: TranslationKey, who: Character, slots: Record<string, Slot>): Said {
  return compose(t(key, { gender: who.gender }), { name: who.name, ...slots });
}

/** Every literal piece of the shopping stories, for every character, item and payment. */
export function storyBank(): string[] {
  const out = new Set<string>();
  const keys: TranslationKey[] = [
    'ex.money.enough.story',
    'ex.money.change.story',
    'ex.money.total.story',
    'ex.money.totalChange.story',
  ];
  for (const who of CHARACTERS)
    for (const key of keys)
      for (const item of ITEMS)
        for (const item2 of ITEMS)
          for (const paid of Object.values(PAID_WITH)) {
            const s = story(key, who, {
              item,
              item2,
              paid,
              p: shekels(3),
              a: shekels(3),
              b: shekels(3),
            });
            for (const p of s.parts) out.add(p);
          }
  for (const g of ['f', 'm'] as Gender[]) {
    out.add(say('ex.money.enough.hint1', {}, g).text);
    out.add(say('ex.money.change.hint1', {}, g).text);
  }
  return [...out];
}

/* ---------- Level 5: is there enough money? ---------- */

export const enough = enoughFrom(() => countSets[3]());

/** "Is there enough money?" with handfuls from `sets`. */
export function enoughFrom(sets: () => number[][]) {
  return (rng: Rng): Exercise => enoughWith(rng, pick(rng, sets()));
}

function enoughWith(rng: Rng, items: number[]): Exercise {
  const have = sum(items);
  const price = Math.max(3, have + pick(rng, [-5, -3, -2, -1, 0, 1, 2, 3, 5]));
  const yes = have >= price;
  const who = pick(rng, CHARACTERS);
  const item = pick(rng, ITEMS);
  const spoken = story('ex.money.enough.story', who, { item, p: shekels(price) });
  const exHave = have === 20 && price === 15 ? 30 : 20;
  return exercise({
    factId: `menough:${plusAll(items)}:${price}`,
    topicId: ID,
    level: 5,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: money(items, price),
    // The buttons run left to right: "לא" on the left, "כן" on the right, where a Hebrew reader starts.
    answer: yes ? 1 : 0,
    input: { type: 'choices', choices: [0, 1], labels: [t('ex.money.no'), t('ex.money.yes')] },
    hints: [
      hint(say('ex.money.enough.hint1', {}, who.gender)),
      hint(say('ex.money.count.hint2'), {
        example: { display: `${plusAll(items)} = ?`, spoken: say('ex.money.count.hint2') },
      }),
      exampleHint(
        `${exHave} > 15`,
        say('ex.money.enough.example', { have: shekels(exHave), p: shekels(15) }),
      ),
    ],
    solution: say(yes ? 'ex.money.enough.yes' : 'ex.money.enough.no', {
      have: shekels(have),
      p: shekels(price),
    }),
  });
}

/* ---------- Level 6: which wallet has more? ---------- */

const wallets = walletsWith([5, 10, 10, 20]);

/** Which wallet has more: many small coins against one or two of `big`. */
export function walletsWith(big: readonly number[]) {
  return (rng: Rng): Exercise => walletPair(rng, big);
}

function walletPair(rng: Rng, bigValues: readonly number[]): Exercise {
  // One wallet of many small coins, one of a few big ones: more coins is not more money.
  let small: number[];
  let big: number[];
  do {
    small = Array.from({ length: randInt(rng, 4, 6) }, () => pick(rng, [1, 2, 2, 5]));
    big = Array.from({ length: randInt(rng, 1, 2) }, () => pick(rng, bigValues));
  } while (sum(small) === sum(big) || sum(small) < 3 || sum(big) < 3);
  const pair = shuffle(rng, [small, big]);
  const [a, b] = pair as [number[], number[]];
  const answer = sum(a) > sum(b) ? 0 : 1;
  const more = Math.max(sum(a), sum(b));
  const less = Math.min(sum(a), sum(b));
  const moreCoins = a.length > b.length ? 0 : 1;
  return exercise({
    factId: `mwallet:${plusAll(a)}|${plusAll(b)}`,
    topicId: ID,
    level: 6,
    prompt: t('ex.money.wallet.prompt'),
    display: '',
    spoken: say('ex.money.wallet.prompt'),
    answer,
    input: pictureChoices([`${sum(a)} ₪`, `${sum(b)} ₪`], [money(a), money(b)]),
    hints: [
      hint(say('ex.money.wallet.hint1')),
      hint(say('ex.money.wallet.hint2')),
      exampleHint(
        '10 > 1 + 1 + 1 + 1',
        say('ex.money.wallet.example', { more: shekels(10), less: shekels(4) }),
      ),
    ],
    solution: say('ex.money.wallet.solution', { more: shekels(more), less: shekels(less) }),
    diagnose: (v) => (v === moreCoins ? 'countedCoins' : null),
  });
}

/* ---------- Level 7: paying exactly ---------- */

/** The fewest coins (and a 20 note) that make `n`. */
function makeUp(n: number): number[] {
  const out: number[] = [];
  let left = n;
  for (const v of [20, 10, 5, 2, 1]) {
    while (left >= v) {
      out.push(v);
      left -= v;
    }
  }
  return out;
}

/** Another way to pay `n`: one big coin broken into smaller ones, so the right answer is not always the fewest coins. */
function brokenUp(items: number[]): number[] {
  const i = items.findIndex((v) => v === 10 || v === 5);
  if (i < 0) return items;
  const v = items[i] as number;
  return [...items.slice(0, i), ...(v === 10 ? [5, 5] : [2, 2, 1]), ...items.slice(i + 1)];
}

function payExactly(rng: Rng): Exercise {
  const n = randInt(rng, 6, 39);
  let right = makeUp(n);
  if (rng() < 0.4) right = brokenUp(right);
  const wrong = [
    ...new Set([n + 1, n - 1, n + 5, n - 5, n + 2, n + 10].filter((x) => x >= 3 && x !== n)),
  ];
  const others = shuffle(rng, wrong)
    .slice(0, 2)
    .map((x) => makeUp(x));
  const options = shuffle(rng, [right, ...others]);
  const answer = options.indexOf(right);
  const ex = n === 17 ? 23 : 17;
  return exercise({
    factId: `mpay:${n}:${plusAll(right)}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.money.pay.prompt', { params: { n } }),
    display: '',
    spoken: say('ex.money.pay.spoken', { n: shekels(n) }),
    answer,
    input: pictureChoices(
      options.map((o) => `${plusAll(o)} = ${sum(o)} ₪`),
      options.map((o) => money(o)),
    ),
    hints: [
      hint(say('ex.money.pay.hint1', { n: shekels(n) })),
      hint(say('ex.money.count.hint1')),
      pictureExample(
        say('ex.money.pay.solution', { n: shekels(ex) }),
        money(makeUp(ex)),
        `${plusAll(makeUp(ex))} = ${ex}`,
      ),
    ],
    solution: say('ex.money.pay.solution', { n: shekels(n) }),
  });
}

/* ---------- Levels 8–9: change ---------- */

/** Change from what was paid; level 8 pays with 10 or 20, level 9 with 50 or 100 (or `paids`). */
export function change(level: number, paids?: readonly number[]) {
  return (rng: Rng): Exercise => {
    const small = paids ? paids.every((x) => x <= 20) : level === 8;
    const paid = pick(rng, paids ?? (small ? [10, 20] : [50, 100]));
    const p = small ? randInt(rng, 3, paid - 1) : randInt(rng, paid === 50 ? 12 : 23, paid - 3);
    const c = paid - p;
    const who = pick(rng, CHARACTERS);
    const item = pick(rng, ITEMS);
    const spoken = story('ex.money.change.story', who, {
      item,
      p: shekels(p),
      paid: PAID_WITH[paid] ?? '',
    });
    const ex = changeExample(small, paid, p);
    const hint2: Hint = small
      ? hint(say('ex.money.change.hint2'), {
          visual: { type: 'numberLine', from: p, to: paid, start: p, hops: 0, target: paid },
        })
      : {
          ...hint(say('ex.money.change.hint3', { paid })),
          example: {
            display: `${p} + ? = ${paid}`,
            spoken: say('ex.money.change.hint3', { paid }).text,
          },
        };
    return exercise({
      factId: `mchange:${p}/${paid}`,
      topicId: ID,
      level,
      prompt: shown(spoken),
      display: '',
      spoken,
      visual: money([paid], p),
      answer: c,
      operation: 'sub',
      input: numpad(2),
      hints: [
        hint(say('ex.money.change.hint1', {}, who.gender)),
        hint2,
        exampleHint(
          `${ex.paid} − ${ex.p} = ${ex.paid - ex.p}`,
          spokenEquationSolved(ex.paid, '-', ex.p, ex.paid - ex.p),
        ),
      ],
      solution: spokenEquationSolved(paid, '-', p, c),
      diagnose: (v) => diagnoseArith(v, { a: paid, op: '-', b: p, answer: c }),
    });
  };
}

/**
 * The worked example for change: never one with this exercise's change, nor
 * this exercise turned around (10 − 7 = 3 for paying 3 out of 10), since either
 * gives the answer away. Three examples, so one is always left.
 */
function changeExample(small: boolean, paid: number, p: number): { p: number; paid: number } {
  const c = paid - p;
  const options: [{ p: number; paid: number }, ...{ p: number; paid: number }[]] = small
    ? [
        { p: 7, paid: 10 },
        { p: 6, paid: 10 },
        { p: 8, paid: 10 },
      ]
    : [
        { p: 36, paid: 50 },
        { p: 64, paid: 100 },
        { p: 27, paid: 50 },
      ];
  return options.find((o) => o.paid - o.p !== c && !(o.paid === paid && o.p === c)) ?? options[0];
}

/* ---------- Level 10: shopping ---------- */

function shopping(rng: Rng): Exercise {
  const who = pick(rng, CHARACTERS);
  const [item, item2] = shuffle(rng, [...ITEMS]) as [string, string];
  const withChange = rng() < 0.5;
  const a = randInt(rng, 3, 30);
  const b = randInt(rng, 3, 30);
  const total = a + b;
  // The change is at least three shekels, so it is always read with the noun from clips.
  const paid = total <= 47 && rng() < 0.6 ? 50 : 100;
  const answer = withChange ? paid - total : total;
  const spoken = story(withChange ? 'ex.money.totalChange.story' : 'ex.money.total.story', who, {
    item,
    item2,
    a: shekels(a),
    b: shekels(b),
    paid: PAID_WITH[paid] ?? '',
  });
  // Not an example whose sum is this exercise's answer, or its total before the change:
  // either gives it away. Three examples, so one is always left.
  const exs: [{ a: number; b: number }, ...{ a: number; b: number }[]] = [
    { a: 12, b: 9 },
    { a: 14, b: 8 },
    { a: 13, b: 5 },
  ];
  const ex = exs.find((x) => x.a + x.b !== answer && x.a + x.b !== total) ?? exs[0];
  return exercise({
    factId: `mshop:${a}+${b}${withChange ? `/${paid}` : ''}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: withChange ? 'sub' : 'add',
    input: numpad(withChange ? 2 : 2),
    hints: [
      hint(say(withChange ? 'ex.money.totalChange.hint1' : 'ex.money.total.hint1')),
      {
        ...hint(say('hint.equation')),
        example: {
          display: withChange ? `${paid} − (${a} + ${b}) = ?` : `${a} + ${b} = ?`,
          spoken: say('hint.equation').text,
        },
      },
      exampleHint(
        `${ex.a} + ${ex.b} = ${ex.a + ex.b}`,
        spokenEquationSolved(ex.a, '+', ex.b, ex.a + ex.b),
      ),
    ],
    solution: withChange
      ? say('ex.money.totalChange.solution', {
          total: shekels(total),
          c: shekels(answer),
        })
      : spokenEquationSolved(a, '+', b, total),
    diagnose: (v) =>
      withChange && v === total
        ? 'other'
        : diagnoseArith(
            v,
            withChange ? { a: paid, op: '-', b: total, answer } : { a, op: '+', b, answer },
          ),
  });
}

export const moneyTopic = defineTopic({
  id: ID,
  labelKey: 'topic.money',
  grades: [2],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () =>
        [...COINS, ...NOTES].flatMap((v): KnowFact[] => [
          { kind: 'value', v },
          { kind: 'pick', v },
        ]),
      know,
    ),
    closed(L(2), countSets[2], count(2)),
    closed(L(3), countSets[3], count(3)),
    closed(L(4), countSets[4], count(4)),
    open(L(5), enough),
    open(L(6), wallets),
    open(L(7), payExactly),
    open(L(8), change(8)),
    open(L(9), change(9)),
    open(L(10), shopping),
  ],
  extraBank: storyBank,
});
