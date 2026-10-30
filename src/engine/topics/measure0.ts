import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exercise,
  hint,
  pictureExample,
  range,
  say,
  spreadChoices,
} from '../build';
import type { Exercise, MeasureThing, Rng, SceneItem, Visual } from '../types';
import {
  pictureQuestion,
  spread,
  thing,
  thingOption,
  type PictureOption,
  type Thing,
  type ThingId,
} from './ganKit';

/**
 * World 7, gan hova: "מודדים ומשווים". Heavy and light (from what we know, then
 * on a balance), more and less water in glasses, full, empty and half, the
 * tallest and the lowest, and measuring with something that repeats: steps
 * along a path, cubes in a tower. Every answer is a picture or a small number.
 */

const ID = 'measure-0';
const L = (n: number) => `level.measure0.${n}`;
const K = (k: string) => `ex.m0.${k}` as TranslationKey;
const A = (k: string) => `adv.m0.${k}` as TranslationKey;

const STEP: Noun = { singular: 'צעד', plural: 'צעדים', gender: 'm' };
const CUBE: Noun = { singular: 'קובייה', plural: 'קוביות', gender: 'f' };

/* ---------- 1, 2: heavy and light, from what we know ---------- */

/** Heavy first: pairs no child doubts. */
const LIFE: [ThingId, ThingId][] = [
  ['elephant', 'mouse'],
  ['car', 'ball'],
  ['watermelon', 'strawberry'],
  ['horse', 'chick'],
  ['bear', 'bee'],
  ['truck', 'balloon'],
  ['whale', 'duck'],
  ['house', 'feather'],
  ['tree', 'leaf'],
  ['bus', 'cap'],
];

type LifeFact = { pair: number; heavyFirst: boolean; ask: 'heavy' | 'light' };

const lifeFacts = (ask: 'heavy' | 'light') => (): LifeFact[] =>
  LIFE.flatMap((_, pair) => [true, false].map((heavyFirst) => ({ pair, heavyFirst, ask })));

function life(level: number, f: LifeFact, rng: Rng): Exercise {
  const [hv, lt] = (LIFE[f.pair] as [ThingId, ThingId]).map(thing) as [Thing, Thing];
  const [a, b] = f.heavyFirst ? [hv, lt] : [lt, hv];
  const [win, lose] = f.ask === 'heavy' ? [hv, lt] : [lt, hv];
  const [exH, exL] = (LIFE[(f.pair + 3) % LIFE.length] as [ThingId, ThingId]).map(thing) as [
    Thing,
    Thing,
  ];
  const [exWin, exLose] = f.ask === 'heavy' ? [exH, exL] : [exL, exH];
  const spoken = say(K(`life.${f.ask}.prompt`), { a: a.singular, b: b.singular });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `life:${hv.id}:${f.heavyFirst ? 'h' : 'l'}:${f.ask}`,
      spoken,
      options: [thingOption(win), thingOption(lose)],
      hints: [
        hint(say(K(`life.${f.ask}.hint1`))),
        hint(say(K('life.hint2'))),
        pictureExample(
          say(K(`life.${f.ask}.solution`), { w: exWin.singular, l: exLose.singular }, exWin.gender),
          {
            type: 'scene',
            w: 60,
            h: 26,
            items: [
              { emoji: exH.emoji, x: 44, y: 13, size: 20 },
              { emoji: exL.emoji, x: 16, y: 13, size: 12 },
            ],
          },
        ),
      ],
      solution: say(K(`life.${f.ask}.solution`), { w: win.singular, l: lose.singular }, win.gender),
      advice: [{ option: 1, say: say(A(`life.${f.ask}`)) }],
    },
    rng,
  );
}

/* ---------- 3, 4: heavy and light on a balance ---------- */

/** About the same size: only the balance can tell (either way round is believable). */
const SAME_SIZE: [ThingId, ThingId][] = [
  ['apple', 'pear'],
  ['banana', 'orange'],
  ['teddy', 'ball'],
  ['shoe', 'book'],
  ['apple', 'banana'],
  ['pear', 'orange'],
  ['ball', 'shoe'],
  ['book', 'teddy'],
];

type BalFact = { pair: number; heavy: 0 | 1; ask: 'heavy' | 'light' };

const balFacts = (ask: 'heavy' | 'light') => (): BalFact[] =>
  SAME_SIZE.flatMap((_, pair) => ([0, 1] as const).map((heavy) => ({ pair, heavy, ask })));

function tipped(heavy: Thing, light: Thing, heavyLeft: boolean, arrows = false): Visual {
  return {
    type: 'balance',
    left: { emoji: heavyLeft ? heavy.emoji : light.emoji },
    right: { emoji: heavyLeft ? light.emoji : heavy.emoji },
    down: heavyLeft ? 'left' : 'right',
    ...(arrows ? { arrows: true } : {}),
  };
}

function balance(level: number, f: BalFact, rng: Rng): Exercise {
  const pair = (SAME_SIZE[f.pair] as [ThingId, ThingId]).map(thing) as [Thing, Thing];
  const [a, b] = pair;
  const hv = pair[f.heavy];
  const lt = pair[1 - f.heavy] as Thing;
  const [win, lose] = f.ask === 'heavy' ? [hv, lt] : [lt, hv];
  // Which side goes down follows the fact, so the pictures of a fact never change.
  const heavyLeft = (f.pair + f.heavy) % 2 === 0;
  const [ex1, ex2] = (
    SAME_SIZE.find(([p, q]) => ![p, q].some((x) => x === a.id || x === b.id)) as [ThingId, ThingId]
  ).map(thing) as [Thing, Thing];
  const [exWin, exLose] = f.ask === 'heavy' ? [ex1, ex2] : [ex2, ex1];
  const spoken = say(K(`bal.${f.ask}.prompt`), { a: a.singular, b: b.singular });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `bal:${a.id}:${b.id}:${f.heavy}:${f.ask}`,
      spoken,
      visual: tipped(hv, lt, heavyLeft),
      options: [thingOption(win), thingOption(lose)],
      hints: [
        hint(say(K('bal.hint1'))),
        hint(say(K(`bal.${f.ask}.hint2`)), { visual: tipped(hv, lt, heavyLeft, true) }),
        pictureExample(
          say(K(`bal.${f.ask}.solution`), { w: exWin.singular, l: exLose.singular }, exWin.gender),
          tipped(ex1, ex2, !heavyLeft),
        ),
      ],
      solution: say(K(`bal.${f.ask}.solution`), { w: win.singular, l: lose.singular }, win.gender),
      advice: [{ option: 1, say: say(A(`bal.${f.ask}`)) }],
    },
    rng,
  );
}

/* ---------- 5, 6, 7: glasses of water ---------- */

/** How full: empty, a little, half, almost full, full. */
const FILLS = [0, 0.25, 0.5, 0.75, 1] as const;

const cupOption = (k: number): PictureOption => ({
  label: t(K(`cup.${k}`)),
  visual: { type: 'cups', levels: [FILLS[k] as number], icon: true },
});

type CupsFact = { hi: number; lo: number; ask: 'more' | 'less' };

const cupsFacts = (ask: 'more' | 'less') => (): CupsFact[] =>
  range(0, 4).flatMap((lo) =>
    range(lo + 1, 4).flatMap((hi) =>
      // Empty against a little water is too close to call by eye.
      lo === 0 && hi === 1 ? [] : [{ hi, lo, ask }],
    ),
  );

function cups(level: number, f: CupsFact, rng: Rng): Exercise {
  const [win, lose] = f.ask === 'more' ? [f.hi, f.lo] : [f.lo, f.hi];
  const ex = f.hi === 4 && f.lo === 2 ? { hi: 3, lo: 1 } : { hi: 4, lo: 2 };
  const exWin = f.ask === 'more' ? ex.hi : ex.lo;
  const inCup = (k: number) => t(K(`cupIn.${k}`));
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `cups:${f.hi}${f.lo}:${f.ask}`,
      spoken: say(K(`cups.${f.ask}.prompt`)),
      options: [cupOption(win), cupOption(lose)],
      hints: [
        hint(say(K('cups.hint1'))),
        hint(say(K(`cups.${f.ask}.hint2`))),
        pictureExample(say(K(`cups.${f.ask}.solution`), { d: inCup(exWin) }), {
          type: 'cups',
          levels: [FILLS[ex.hi] as number, FILLS[ex.lo] as number],
        }),
      ],
      solution: say(K(`cups.${f.ask}.solution`), { d: inCup(win) }),
      advice: [{ option: 1, say: say(A(`cups.${f.ask}`)) }],
    },
    rng,
  );
}

type FillAsk = 'full' | 'empty' | 'half';
const FILL_OF: Record<FillAsk, number> = { empty: 0, half: 2, full: 4 };
type FillFact = { ask: FillAsk; extra: number | null };

/** Full, empty and half among the buttons, sometimes with a little or almost full beside them. */
const fillFacts = (): FillFact[] =>
  (['full', 'empty', 'half'] as const).flatMap((ask) =>
    [null, 1, 3].map((extra) => ({ ask, extra })),
  );

function fill(level: number, f: FillFact, rng: Rng): Exercise {
  const right = FILL_OF[f.ask];
  const wrong = [0, 2, 4].filter((k) => k !== right);
  if (f.extra !== null) wrong.push(f.extra);
  const exAsk: FillAsk = f.ask === 'full' ? 'half' : 'full';
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `fill:${f.ask}:${f.extra ?? '-'}`,
      spoken: say(K(`fill.${f.ask}.prompt`)),
      options: [cupOption(right), ...wrong.map(cupOption)] as [PictureOption, ...PictureOption[]],
      hints: [
        hint(say(K(`fill.${f.ask}.hint1`))),
        hint(say(K('fill.hint2'))),
        pictureExample(say(K(`fill.${exAsk}.solution`)), {
          type: 'cups',
          levels: [FILLS[FILL_OF[exAsk]] as number],
        }),
      ],
      solution: say(K(`fill.${f.ask}.solution`)),
      advice: wrong.map((_, i) => ({ option: i + 1, say: say(A('fill')) })),
    },
    rng,
  );
}

/* ---------- 8: the tallest and the lowest ---------- */

const STANDING = ['tower', 'tree', 'flower', 'bottle'] as const satisfies readonly MeasureThing[];
const NAME: Record<(typeof STANDING)[number], string> = {
  tower: 'מגדל',
  tree: 'עץ',
  flower: 'פרח',
  bottle: 'בקבוק',
};
type Standing = (typeof STANDING)[number];

/** Heights for the three, by their place (never two the same). */
const HEIGHTS: [number, number, number][] = [
  [6, 3, 8],
  [4, 7, 2],
  [8, 5, 3],
  [3, 8, 6],
];

type TallFact = { leave: number; h: number; ask: 'most' | 'least' };

const tallFacts = (): TallFact[] =>
  range(0, 3).flatMap((leave) =>
    range(0, 2).flatMap((h) => (['most', 'least'] as const).map((ask) => ({ leave, h, ask }))),
  );

const standIcon = (x: Standing): Visual => ({
  type: 'lengths',
  items: [{ thing: x, len: 3 }],
  stand: true,
  icon: true,
});

function tall(level: number, f: TallFact, rng: Rng): Exercise {
  const three = STANDING.filter((_, i) => i !== f.leave) as Standing[];
  const hs = HEIGHTS[(f.leave + f.h) % HEIGHTS.length] as [number, number, number];
  const items = three.map((x, i) => ({ thing: x, len: hs[i] as number }));
  const sorted = [...items].sort((p, q) => p.len - q.len);
  const win = (f.ask === 'most' ? sorted[2] : sorted[0]) as { thing: Standing; len: number };
  // The line at the middle one: the tallest goes above it, the lowest stays below.
  const guide = sorted[1]?.len ?? 0;
  const ex = STANDING[f.leave] as Standing;
  const option = (x: Standing): PictureOption => ({ label: NAME[x], visual: standIcon(x) });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `tall:${f.leave}:${f.h}:${f.ask}`,
      spoken: say(K(`tall.${f.ask}.prompt`)),
      visual: { type: 'lengths', items, stand: true },
      options: [option(win.thing), ...three.filter((x) => x !== win.thing).map(option)] as [
        PictureOption,
        ...PictureOption[],
      ],
      hints: [
        hint(say(K('tall.hint1'))),
        hint(say(K(`tall.${f.ask}.hint2`)), {
          visual: { type: 'lengths', items, stand: true, guide },
        }),
        // The example names the thing that is not on the buttons.
        pictureExample(say(K(`tall.${f.ask}.solution`), { w: NAME[ex] }), {
          type: 'lengths',
          items: [ex, ...three.slice(0, 2)].map((x, i) => ({
            thing: x,
            len: (f.ask === 'most' ? [8, 3, 5] : [2, 6, 4])[i] as number,
          })),
          stand: true,
        }),
      ],
      solution: say(K(`tall.${f.ask}.solution`), { w: NAME[win.thing] }),
    },
    rng,
  );
}

/* ---------- 9: steps along a path ---------- */

const PLACES: [ThingId, ThingId][] = [
  ['house', 'tree'],
  ['tent', 'flower'],
  ['castle', 'carousel'],
];

type StepsFact = { place: number; n: number };

const stepsFacts = (): StepsFact[] =>
  range(0, 2).flatMap((place) => range(2, 8).map((n) => ({ place, n })));

function path(place: number, n: number): Visual {
  const [from, to] = (PLACES[place] as [ThingId, ThingId]).map(thing) as [Thing, Thing];
  const w = 100;
  // From the right (where we start) to the left, the steps evenly between.
  const xs = spread(n + 2, w, 8);
  const items: SceneItem[] = [
    { emoji: from.emoji, x: xs[0] as number, y: 14, size: 18 },
    ...xs.slice(1, -1).map((x, i) => ({ emoji: '👣', x, y: i % 2 ? 17 : 13, size: 9 })),
    { emoji: to.emoji, x: xs.at(-1) as number, y: 14, size: 18 },
  ];
  return { type: 'scene', w, h: 26, items };
}

function steps(level: number, f: StepsFact, rng: Rng): Exercise {
  const [from, to] = (PLACES[f.place] as [ThingId, ThingId]).map(thing) as [Thing, Thing];
  const exPlace = (f.place + 1) % PLACES.length;
  const [exFrom, exTo] = (PLACES[exPlace] as [ThingId, ThingId]).map(thing) as [Thing, Thing];
  const exN = f.n === 3 ? 5 : 3;
  const names = { a: from.singular, b: to.singular };
  return exercise({
    factId: `steps:${from.id}:${f.n}`,
    topicId: ID,
    level,
    prompt: t(K('steps.prompt'), { params: names }),
    display: '',
    spoken: say(K('steps.prompt'), names),
    visual: path(f.place, f.n),
    answer: f.n,
    input: {
      type: 'choices',
      choices: spreadChoices(rng, f.n, { deltas: [1, 2], min: 1, max: 10 }),
    },
    hints: [
      hint(say(K('steps.hint1'))),
      hint(say(K('steps.hint2'), names)),
      pictureExample(
        say(K('steps.solution'), {
          a: exFrom.singular,
          b: exTo.singular,
          n: { n: exN, noun: STEP },
        }),
        path(exPlace, exN),
      ),
    ],
    solution: say(K('steps.solution'), { ...names, n: { n: f.n, noun: STEP } }),
    diagnose: (v) => (Math.abs(v - f.n) === 1 ? 'offByOne' : null),
    advice: [
      { value: f.n + 1, say: say(A('steps.twice')) },
      { value: f.n - 1, say: say(A('steps.skipped')) },
    ],
  });
}

/* ---------- 10: cubes in a tower ---------- */

function tower(level: number, n: number, rng: Rng): Exercise {
  const exN = n === 4 ? 6 : 4;
  return exercise({
    factId: `tower:${n}`,
    topicId: ID,
    level,
    prompt: t(K('tower.prompt')),
    display: '',
    spoken: say(K('tower.prompt')),
    visual: { type: 'cubeStack', columns: [n] },
    answer: n,
    input: { type: 'choices', choices: spreadChoices(rng, n, { deltas: [1, 2], min: 1, max: 10 }) },
    hints: [
      hint(say(K('tower.hint1'))),
      hint(say(K('tower.hint2'))),
      pictureExample(say(K('tower.solution'), { n: { n: exN, noun: CUBE } }), {
        type: 'cubeStack',
        columns: [exN],
      }),
    ],
    solution: say(K('tower.solution'), { n: { n, noun: CUBE } }),
    diagnose: (v) => (Math.abs(v - n) === 1 ? 'offByOne' : null),
    advice: [
      { value: n + 1, say: say(A('tower.twice')) },
      { value: n - 1, say: say(A('tower.skipped')) },
    ],
  });
}

export const measure0 = defineTopic({
  id: ID,
  labelKey: 'topic.measure0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(L(1), lifeFacts('heavy'), (f, rng) => life(1, f, rng)),
    closed(L(2), lifeFacts('light'), (f, rng) => life(2, f, rng)),
    closed(L(3), balFacts('heavy'), (f, rng) => balance(3, f, rng)),
    closed(L(4), balFacts('light'), (f, rng) => balance(4, f, rng)),
    closed(L(5), cupsFacts('more'), (f, rng) => cups(5, f, rng)),
    closed(L(6), cupsFacts('less'), (f, rng) => cups(6, f, rng)),
    closed(L(7), fillFacts, (f, rng) => fill(7, f, rng)),
    closed(L(8), tallFacts, (f, rng) => tall(8, f, rng)),
    closed(L(9), stepsFacts, (f, rng) => steps(9, f, rng)),
    closed(
      L(10),
      () => range(2, 8),
      (n, rng) => tower(10, n, rng),
    ),
  ],
});
