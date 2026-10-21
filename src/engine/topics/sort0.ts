import type { TranslationKey } from '@/i18n';
import { shown, type Slot } from '@/lang/compose';
import type { Noun } from '@/lang/hebrewNumbers';
import { closed, defineTopic, exercise, hint, pictureExample, say, windowChoices } from '../build';
import { seededRng, shuffle } from '../rng';
import type { Exercise, Rng, SceneItem, ShapeColor, ShapeItem, ShapeKind, Visual } from '../types';
import {
  at,
  COLOR_WORD,
  icon,
  pictureQuestion,
  shapeIcon,
  spread,
  thing,
  thingOption,
  things,
  type PictureOption,
  type Thing,
  type ThingId,
} from './ganKit';

/**
 * World "מיון והשוואה", gan hova. Sorting and comparing before numbers: what
 * does not belong, sorting by colour, by shape and by size, putting in order
 * from small to big, pairs that go together, what is missing from a group, more,
 * fewer or the same (matching one to one), how many in a group once sorted, and
 * two properties at once (big and red).
 *
 * Nothing to read: every question is spoken, every answer is a picture or a
 * very small number. Every level is closed, so every sentence is recorded whole.
 */

const ID = 'sort-0';
const L = (n: number) => `level.sort0.${n}`;
const K = (key: string) => `ex.sort0.${key}` as TranslationKey;

/** A thing at one place of a list, going round. */
const nth = <T>(xs: readonly T[], i: number): T =>
  xs[((i % xs.length) + xs.length) % xs.length] as T;

/** Things in a sorting hoop, in a row (`extra`: things beside it, outside). */
function hoop(inside: readonly Thing[], size = 15): Visual {
  const xs = spread(inside.length, 100, 24);
  return {
    type: 'scene',
    w: 100,
    h: 44,
    props: [{ kind: 'hoop', x: 50, y: 22, w: 88, h: 38 }],
    items: inside.map((t, i) => at(t, xs[i] as number, 22, size)),
  };
}

/* ---------- Level 1: what does not belong? ---------- */

type Family = 'fruit' | 'animal' | 'vehicle' | 'clothes';
const FAMILIES: Family[] = ['fruit', 'animal', 'vehicle', 'clothes'];
const FAMILY: Record<Family, ThingId[]> = {
  fruit: ['apple', 'banana', 'pear', 'strawberry', 'orange', 'lemon'],
  animal: ['dog', 'cat', 'rabbit', 'bear', 'monkey', 'lion'],
  vehicle: ['car', 'bus', 'plane', 'boat', 'rocket', 'tractor'],
  clothes: ['shirt', 'sock', 'dress', 'shoe', 'cap', 'glove'],
};

type OddFact = { many: Family; odd: Family; v: number };

function oddOut({ many, odd, v }: OddFact, rng: Rng): Exercise {
  const group = [0, 1, 2].map((k) => thing(nth(FAMILY[many], v * 3 + k)));
  const out = thing(nth(FAMILY[odd], v + FAMILIES.indexOf(many)));
  // The example: the two other families, so neither this answer nor its group appears.
  const [exMany, exOdd] = FAMILIES.filter((f) => f !== many && f !== odd) as [Family, Family];
  const exGroup = [0, 1, 2].map((k) => thing(nth(FAMILY[exMany], k + v)));
  const exOut = thing(nth(FAMILY[exOdd], v));
  const [a, b, c] = exGroup as [Thing, Thing, Thing];
  return pictureQuestion(
    {
      topicId: ID,
      level: 1,
      factId: `odd:${group.map((t) => t.id).join(',')}:${out.id}`,
      spoken: say(K('odd.ask')),
      options: [thingOption(out), ...group.map((t) => thingOption(t))] as [
        PictureOption,
        ...PictureOption[],
      ],
      hints: [
        hint(say(K('odd.hint1'))),
        hint(say(K('odd.hint2'), { family: say(K(`family.${many}`)).text })),
        pictureExample(
          say(
            K('odd.example'),
            {
              a: a.singular,
              b: b.singular,
              c: c.singular,
              d: exOut.singular,
              families: say(K(`families.${exMany}`)).text,
            },
            exOut.gender,
          ),
          {
            type: 'scene',
            w: 100,
            h: 26,
            items: [...exGroup, exOut].map((t, i) => at(t, spread(4, 100)[i] as number, 13, 15)),
          },
        ),
      ],
      solution: say(
        K('odd.solution'),
        { name: out.singular, families: say(K(`families.${many}`)).text },
        out.gender,
      ),
      advice: [1, 2, 3].map((option) => ({ option, say: say(K('odd.adv')) })),
    },
    rng,
  );
}

/* ---------- Level 2: sorting by colour ---------- */

type Color = 'red' | 'yellow' | 'green' | 'blue';
const COLORS: Color[] = ['red', 'yellow', 'green', 'blue'];
/** Things whose colour is the same on every phone; different kinds in every colour. */
const BY_COLOR: Record<Color, ThingId[]> = {
  red: ['apple', 'car', 'heart', 'strawberry', 'tomato'],
  yellow: ['lemon', 'star', 'chick', 'banana', 'sunflower'],
  green: ['frog', 'broccoli', 'dino', 'clover', 'cucumber'],
  // Not the butterfly: blue on an iPhone, orange on Android.
  blue: ['whale', 'cap', 'drop', 'jeans', 'blueberries'],
};
const colorWord = (c: Color) => COLOR_WORD[c].m;
const colorsWord = (c: Color) => COLOR_WORD[c].pl;

type ColorFact = { color: Color; v: number };

function byColor({ color, v }: ColorFact, rng: Rng): Exercise {
  const list = things(BY_COLOR[color]);
  const group = [0, 1, 2].map((k) => nth(list, v + k));
  const right = nth(list, v + 3);
  const ci = COLORS.indexOf(color);
  const c1 = nth(COLORS, ci + 1 + (v % 2));
  const c2 = nth(COLORS, ci + (v % 2 ? 1 : 3));
  const w1 = thing(nth(BY_COLOR[c1], v));
  const w2 = thing(nth(BY_COLOR[c2], v + 1));
  const exColor = nth(COLORS, ci + 2);
  const exList = things(BY_COLOR[exColor]);
  return pictureQuestion(
    {
      topicId: ID,
      level: 2,
      factId: `color:${color}:${v}`,
      spoken: say(K('group.ask')),
      visual: hoop(group),
      options: [thingOption(right), thingOption(w1), thingOption(w2)],
      hints: [
        hint(say(K('color.hint1'))),
        hint(say(K('color.hint2'), { color: colorWord(color) })),
        pictureExample(
          say(K('color.example'), {
            colors: colorsWord(exColor),
            name: nth(exList, v + 3).singular,
          }),
          hoop(
            [0, 1, 2, 3].map((k) => nth(exList, v + k)),
            13,
          ),
        ),
      ],
      solution: say(K('color.solution'), { name: right.singular, color: colorWord(color) }),
      advice: [
        [1, w1, c1],
        [2, w2, c2],
      ].map(([option, t, c]) => ({
        option: option as number,
        say: say(K('color.adv'), {
          name: (t as Thing).singular,
          its: colorWord(c as Color),
          color: colorWord(color),
        }),
      })),
    },
    rng,
  );
}

/* ---------- Level 3: sorting by shape ---------- */

const SHAPES: ShapeKind[] = ['circle', 'square', 'triangle', 'rectangle'];
const SHAPE_WORD: Record<ShapeKind, { sg: string; pl: string }> = {
  circle: { sg: 'עיגול', pl: 'עיגולים' },
  square: { sg: 'ריבוע', pl: 'ריבועים' },
  triangle: { sg: 'משולש', pl: 'משולשים' },
  rectangle: { sg: 'מלבן', pl: 'מלבנים' },
};
const SHAPE_COLORS: ShapeColor[] = ['red', 'blue', 'yellow', 'green'];
/** A square is a kind of rectangle: the two are never set against each other. */
const RIVALS: Record<ShapeKind, ShapeKind[]> = {
  circle: ['triangle', 'square', 'rectangle'],
  square: ['circle', 'triangle'],
  triangle: ['square', 'circle', 'rectangle'],
  rectangle: ['triangle', 'circle'],
};

const shapeOf = (shape: ShapeKind, color: ShapeColor, size = 1, turn = 0): ShapeItem => ({
  shape,
  color,
  size,
  turn: shape === 'circle' ? 0 : turn,
});

function shapeHoop(items: ShapeItem[]): Visual {
  const xs = spread(items.length, 100, 24);
  return {
    type: 'scene',
    w: 100,
    h: 44,
    props: [{ kind: 'hoop', x: 50, y: 22, w: 88, h: 38 }],
    items: items.map((shape, i) => ({ shape, x: xs[i] as number, y: 22, size: 16 })),
  };
}

type ShapeFact = { kind: ShapeKind; v: number };

function byShape({ kind, v }: ShapeFact, rng: Rng): Exercise {
  const cols = [0, 1, 2].map((k) => nth(SHAPE_COLORS, v + k));
  const group = cols.map((c, k) => shapeOf(kind, c, [1, 0.7, 0.85][k], [0, 25, 60][(k + v) % 3]));
  const rivals = RIVALS[kind];
  const r1 = nth(rivals, v);
  const r2 = nth(rivals, v + 1);
  // Every colour on the buttons is a colour of the group: only the shape tells.
  const right = shapeOf(kind, nth(cols, v + 1), 0.8, 40);
  const wrong1 = shapeOf(r1, nth(cols, v), 0.8);
  const wrong2 = shapeOf(r2, nth(cols, v + 2), 0.8);
  const exKind = nth(rivals, v + 2) === r1 ? r2 : nth(rivals, v + 2);
  const exColor = nth(SHAPE_COLORS, v + 3);
  const opt = (s: ShapeItem): PictureOption => ({
    label: `${SHAPE_WORD[s.shape].sg} ${COLOR_WORD[s.color].m}`,
    visual: shapeIcon(s),
  });
  return pictureQuestion(
    {
      topicId: ID,
      level: 3,
      factId: `shape:${kind}:${v}`,
      spoken: say(K('group.ask')),
      visual: shapeHoop(group),
      options: [opt(right), opt(wrong1), opt(wrong2)],
      hints: [
        hint(say(K('shape.hint1'))),
        hint(say(K('shape.hint2'), { kinds: SHAPE_WORD[kind].pl, kind: SHAPE_WORD[kind].sg })),
        pictureExample(
          say(K('shape.example'), {
            kinds: SHAPE_WORD[exKind].pl,
            kind: SHAPE_WORD[exKind].sg,
            color: COLOR_WORD[exColor].m,
          }),
          shapeHoop([
            shapeOf(exKind, nth(SHAPE_COLORS, v), 0.7, 30),
            shapeOf(exKind, nth(SHAPE_COLORS, v + 1), 1),
            shapeOf(exKind, exColor, 0.85, 60),
          ]),
        ),
      ],
      solution: say(K('shape.solution'), { kind: SHAPE_WORD[kind].sg }),
      advice: [
        {
          option: 1,
          say: say(K('shape.adv'), { kind: SHAPE_WORD[r1].sg, kinds: SHAPE_WORD[kind].pl }),
        },
        {
          option: 2,
          say: say(K('shape.adv'), { kind: SHAPE_WORD[r2].sg, kinds: SHAPE_WORD[kind].pl }),
        },
      ],
    },
    rng,
  );
}

/* ---------- Level 4: sorting by size ---------- */

const SIZE_THINGS: ThingId[] = [
  'apple',
  'ball',
  'star',
  'teddy',
  'car',
  'duck',
  'flower',
  'gift',
  'heart',
  'banana',
];
const BIG = 17;
const SMALL = 8;

type SizeFact = { ask: 'big' | 'small'; v: number };

function sizeHoops(big: Thing[], small: Thing[]): Visual {
  return {
    type: 'scene',
    w: 100,
    h: 46,
    props: [
      { kind: 'hoop', x: 74, y: 23, w: 46, h: 42 },
      { kind: 'hoop', x: 26, y: 23, w: 46, h: 42 },
    ],
    items: [
      ...big.map((t, i) => at(t, i ? 64 : 84, 23, BIG)),
      ...small.map((t, i) => at(t, i ? 19 : 33, 23, SMALL)),
    ],
  };
}

function bySize({ ask, v }: SizeFact, rng: Rng): Exercise {
  const pool = things(SIZE_THINGS);
  const big = [nth(pool, v), nth(pool, v + 1)];
  const small = [nth(pool, v + 2), nth(pool, v + 3)];
  const [right, w1, w2] = [nth(pool, v + 4), nth(pool, v + 5), nth(pool, v + 6)];
  const want = ask === 'big' ? BIG : SMALL;
  const other = ask === 'big' ? SMALL : BIG;
  const ex = nth(pool, v + 7);
  return pictureQuestion(
    {
      topicId: ID,
      level: 4,
      factId: `size:${ask}:${v}`,
      spoken: say(K(`size.ask.${ask}`)),
      visual: sizeHoops(big, small),
      options: [thingOption(right, want), thingOption(w1, other), thingOption(w2, other)],
      hints: [
        hint(say(K(`size.hint1.${ask}`))),
        hint(say(K(`size.hint2.${ask}`))),
        pictureExample(
          say(K(`size.example.${ask}`), { name: ex.singular }, ex.gender),
          icon(ex, want),
        ),
      ],
      solution: say(K(`size.solution.${ask}`), { name: right.singular }, right.gender),
      advice: [1, 2].map((option) => ({ option, say: say(K(`size.adv.${ask}`)) })),
    },
    rng,
  );
}

/* ---------- Level 5: from small to big ---------- */

const ORDER_THINGS: ThingId[] = ['teddy', 'ball', 'balloon', 'star', 'tree', 'apple'];
const SIZES3 = [
  { size: 8, label: 'קטן' },
  { size: 13, label: 'בינוני' },
  { size: 18, label: 'גדול' },
];
const SIZES4 = [
  { size: 6.5, label: 'הכי קטן' },
  { size: 10.5, label: 'קטן' },
  { size: 14, label: 'גדול' },
  { size: 18, label: 'הכי גדול' },
];

type OrderFact = { t: Thing; dir: 'up' | 'down'; four: boolean };

/** The row, first on the right; `gap`: the place left empty ("?"). */
function sizeRow(t: Thing, sizes: number[], gap: number | null, arrow = false): Visual {
  const xs = spread(sizes.length, 100, sizes.length === 4 ? 14 : 20);
  return {
    type: 'scene',
    w: 100,
    h: 30,
    props: [
      { kind: 'floor', y: 26 },
      ...(arrow
        ? [
            {
              kind: 'arrow' as const,
              from: [92, 4] as [number, number],
              to: [8, 4] as [number, number],
            },
          ]
        : []),
    ],
    items: sizes.map((s, i): SceneItem =>
      i === gap
        ? { blank: true, x: xs[i] as number, y: 17, size: 12 }
        : at(t, xs[i] as number, 25 - s / 2, s),
    ),
  };
}

function smallToBig({ t, dir, four }: OrderFact, rng: Rng): Exercise {
  const scale = four ? SIZES4 : SIZES3;
  const up = scale.map((_, i) => i);
  const order = dir === 'up' ? up : [...up].reverse();
  const gap = four ? 2 : 1;
  const missing = order[gap] as number;
  // The buttons: the missing size and its neighbours on the scale.
  const others = four ? [missing - 1, missing + 1] : up.filter((s) => s !== missing);
  const opt = (s: number): PictureOption => ({
    label: (scale[s] as { label: string }).label,
    visual: icon(t, (scale[s] as { size: number }).size),
  });
  const sizes = order.map((s) => (scale[s] as { size: number }).size);
  const ex = thing(nth(ORDER_THINGS, ORDER_THINGS.indexOf(t.id as ThingId) + 1));
  return pictureQuestion(
    {
      topicId: ID,
      level: 5,
      factId: `order:${t.id}:${dir}:${four ? 4 : 3}`,
      spoken: say(K(`order.ask.${dir}`)),
      visual: sizeRow(t, sizes, gap),
      options: [opt(missing), opt(others[0] as number), opt(others[1] as number)],
      hints: [
        hint(say(K(`order.hint1.${dir}`))),
        hint(say(K(`order.hint2.${dir}`)), { visual: sizeRow(t, sizes, gap, true) }),
        pictureExample(
          say(K(`order.example.${dir}`), { names: ex.plural }),
          sizeRow(
            ex,
            (dir === 'up' ? SIZES3 : [...SIZES3].reverse()).map((s) => s.size),
            null,
          ),
        ),
      ],
      solution: say(K('order.solution'), {
        name: t.singular,
        size: (scale[missing] as { label: string }).label,
      }),
    },
    rng,
  );
}

/* ---------- Level 6: pairs that go together ---------- */

type PairFact = { target: ThingId; match: ThingId; others: [ThingId, ThingId]; clue: string };

const PAIRS: PairFact[] = [
  { target: 'key', match: 'lock', others: ['ball', 'banana'], clue: 'key' },
  { target: 'lock', match: 'key', others: ['apple', 'sock'], clue: 'lock' },
  { target: 'sock', match: 'sock', others: ['cap', 'shirt'], clue: 'same' },
  { target: 'glove', match: 'glove', others: ['shirt', 'dress'], clue: 'same' },
  { target: 'shoe', match: 'shoe', others: ['cap', 'glove'], clue: 'same' },
  { target: 'dog', match: 'bone', others: ['carrot', 'key'], clue: 'dog' },
  { target: 'bone', match: 'dog', others: ['bee', 'baby'], clue: 'bone' },
  { target: 'rabbit', match: 'carrot', others: ['bone', 'bottle'], clue: 'rabbit' },
  { target: 'carrot', match: 'rabbit', others: ['monkey', 'bee'], clue: 'carrot' },
  { target: 'bee', match: 'flower', others: ['bone', 'spoon'], clue: 'bee' },
  { target: 'monkey', match: 'banana', others: ['bottle', 'key'], clue: 'monkey' },
  { target: 'baby', match: 'bottle', others: ['bone', 'lock'], clue: 'baby' },
  { target: 'umbrella', match: 'rain', others: ['spoon', 'flower'], clue: 'umbrella' },
  { target: 'spoon', match: 'bowl', others: ['rain', 'key'], clue: 'spoon' },
];
const EXAMPLE_PAIRS: [ThingId, ThingId][] = [
  ['key', 'lock'],
  ['dog', 'bone'],
  ['umbrella', 'rain'],
];

function pairs(f: PairFact, rng: Rng): Exercise {
  const target = thing(f.target);
  const match = thing(f.match);
  const [o1, o2] = things(f.others);
  const same = f.target === f.match;
  const [ea, eb] = things(
    EXAMPLE_PAIRS.find(
      // Nothing on this exercise's buttons: the example never names one of them.
      ([a, b]) => ![a, b].some((x) => x === f.target || x === f.match || f.others.includes(x)),
    ) as [ThingId, ThingId],
  ) as [Thing, Thing];
  const pairSaid = (a: Thing, b: Thing) =>
    a === b
      ? say(K('pair.solution.same'), { name: a.singular })
      : say(K('pair.solution'), { a: a.singular, b: b.singular });
  return pictureQuestion(
    {
      topicId: ID,
      level: 6,
      factId: `pair:${f.target}:${f.match}`,
      spoken: say(K('pair.ask'), { name: target.singular }),
      visual: {
        type: 'scene',
        w: 60,
        h: 30,
        items: [at(target, 42, 15, 20), { blank: true, x: 16, y: 15, size: 14 }],
      },
      options: [thingOption(match), thingOption(o1 as Thing), thingOption(o2 as Thing)],
      hints: [
        hint(same ? say(K('pair.hint1.same')) : say(K('pair.hint1'), { name: target.singular })),
        hint(say(K(`pair.clue.${f.clue}`))),
        pictureExample(pairSaid(ea, eb), {
          type: 'scene',
          w: 60,
          h: 30,
          items: [at(ea, 42, 15, 18), at(eb, 18, 15, 18)],
        }),
      ],
      solution: pairSaid(target, match),
    },
    rng,
  );
}

/* ---------- Level 7: what is missing from the group? ---------- */

const SETS: ThingId[][] = [
  ['apple', 'banana', 'pear'],
  ['ball', 'teddy', 'car'],
  ['cat', 'dog', 'rabbit'],
  ['shirt', 'sock', 'cap'],
  ['star', 'heart', 'balloon'],
  ['drum', 'book', 'robot'],
  ['bus', 'plane', 'boat'],
  ['lemon', 'cheese', 'chick'],
];

type MissFact = { set: number; miss: number };

/** The full group above, the same group without one below (in another order). */
function twoGroups(full: Thing[], miss: number): Visual {
  const xs = spread(3, 100, 26);
  const below = full.filter((_, i) => i !== miss).reverse();
  return {
    type: 'scene',
    w: 100,
    h: 72,
    props: [
      { kind: 'hoop', x: 50, y: 17, w: 84, h: 31 },
      { kind: 'hoop', x: 50, y: 54, w: 84, h: 31 },
    ],
    items: [
      ...full.map((t, i) => at(t, xs[i] as number, 17, 15)),
      ...below.map((t, i) => at(t, i ? 38 : 62, 54, 15)),
    ],
  };
}

function missing({ set, miss }: MissFact, rng: Rng): Exercise {
  const full = things(SETS[set] as ThingId[]);
  const ans = full[miss] as Thing;
  const present = full[(miss + 1) % 3] as Thing;
  const absent = thing(nth(SETS[(set + 3) % SETS.length] as ThingId[], miss));
  const exFull = things(SETS[(set + 1) % SETS.length] as ThingId[]);
  const [a, b, c] = exFull as [Thing, Thing, Thing];
  return pictureQuestion(
    {
      topicId: ID,
      level: 7,
      factId: `missing:${set}:${miss}`,
      spoken: say(K('missing.ask')),
      visual: twoGroups(full, miss),
      options: [thingOption(ans), thingOption(present), thingOption(absent)],
      hints: [
        hint(say(K('missing.hint1'))),
        hint(say(K('missing.hint2'))),
        pictureExample(
          say(K('missing.example'), { a: a.singular, b: b.singular, c: c.singular }),
          twoGroups(exFull, 0),
        ),
      ],
      solution: say(K('missing.solution'), { name: ans.singular }),
      advice: [
        { option: 1, say: say(K('missing.adv.both')) },
        { option: 2, say: say(K('missing.adv.none')) },
      ],
    },
    rng,
  );
}

/* ---------- Level 8: more, fewer or the same ---------- */

const COMPARE: [ThingId, ThingId][] = [
  ['dog', 'bone'],
  ['rabbit', 'carrot'],
  ['monkey', 'banana'],
  ['bee', 'flower'],
];
const COUNTS: [number, number][] = [
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [2, 3],
  [3, 2],
  [3, 5],
  [5, 3],
  [4, 5],
  [5, 4],
  [1, 3],
  [3, 1],
  [2, 4],
  [4, 2],
  [3, 4],
  [4, 3],
];

type CompareFact = { pair: number; a: number; b: number; ask: 'more' | 'fewer' };

/** Two rows lined up from the right, one thing above the other; `lines`: each pair joined. */
function rows(x: Thing, y: Thing, a: number, b: number, lines = false): Visual {
  const col = (i: number) => 86 - i * 15;
  return {
    type: 'scene',
    w: 100,
    h: 48,
    props: lines
      ? Array.from({ length: Math.min(a, b) }, (_, i) => ({
          kind: 'line' as const,
          from: [col(i), 20] as [number, number],
          to: [col(i), 30] as [number, number],
        }))
      : [],
    items: [
      ...Array.from({ length: a }, (_, i) => at(x, col(i), 11, 13)),
      ...Array.from({ length: b }, (_, i) => at(y, col(i), 38, 13)),
    ],
  };
}

const noun = (t: Thing): Noun => ({ singular: t.singular, plural: t.plural, gender: t.gender });

function compare({ pair, a, b, ask }: CompareFact, rng: Rng): Exercise {
  const [x, y] = things(COMPARE[pair] as [ThingId, ThingId]) as [Thing, Thing];
  const answer = a === b ? 'same' : a > b === (ask === 'more') ? 'x' : 'y';
  const sameOpt: PictureOption = {
    label: say(K('compare.same')).text,
    // Two of each, joined in pairs: everyone has a partner, as in the hint.
    visual: {
      type: 'scene',
      w: 22,
      h: 22,
      icon: true,
      props: [16, 6].map((cx) => ({
        kind: 'line' as const,
        from: [cx, 9] as [number, number],
        to: [cx, 13] as [number, number],
      })),
      items: [at(x, 16, 4.5, 8), at(x, 6, 4.5, 8), at(y, 16, 17.5, 8), at(y, 6, 17.5, 8)],
    },
  };
  const xOpt: PictureOption = { label: x.plural, visual: icon(x) };
  const yOpt: PictureOption = { label: y.plural, visual: icon(y) };
  const options: [PictureOption, PictureOption, PictureOption] =
    answer === 'same'
      ? [sameOpt, xOpt, yOpt]
      : answer === 'x'
        ? [xOpt, yOpt, sameOpt]
        : [yOpt, xOpt, sameOpt];
  const slots = { a: { n: a, noun: noun(x) }, b: { n: b, noun: noun(y) } };
  const winner = answer === 'x' ? x : y;
  // The example: other things; equal when this is not, and not equal when this is.
  const [ex, ey] = things(COMPARE[(pair + 1) % 3] as [ThingId, ThingId]) as [Thing, Thing];
  const exCounts: [number, number] =
    answer === 'same' ? (ask === 'more' ? [4, 3] : [3, 4]) : [3, 3];
  const exSlots = {
    a: { n: exCounts[0], noun: noun(ex) },
    b: { n: exCounts[1], noun: noun(ey) },
    xs: ex.plural,
    ys: ey.plural,
  };
  const other = (o: number) => (options[o] === sameOpt ? 'same' : options[o] === xOpt ? 'x' : 'y');
  return pictureQuestion(
    {
      topicId: ID,
      level: 8,
      factId: `compare:${pair}:${a},${b}:${ask}`,
      spoken: say(K(`compare.ask.${ask}`), { xs: x.plural, ys: y.plural }),
      visual: rows(x, y, a, b),
      options,
      hints: [
        hint(say(K('compare.hint1'))),
        hint(say(K(`compare.hint2.${ask}`)), { visual: rows(x, y, a, b, true) }),
        pictureExample(
          say(K(answer === 'same' ? `compare.example.${ask}` : 'compare.example.same'), exSlots),
          rows(ex, ey, exCounts[0], exCounts[1], true),
        ),
      ],
      solution:
        answer === 'same'
          ? say(K('compare.solution.same'), slots)
          : say(K(`compare.solution.${ask}`), { ...slots, w: winner.plural }),
      advice: [1, 2].map((o) => {
        const kind = other(o);
        const key =
          kind === 'same'
            ? 'compare.adv.notSame'
            : answer === 'same'
              ? 'compare.adv.same'
              : `compare.adv.${ask}`;
        return { option: o, say: say(K(key), { w: (kind === 'x' ? x : y).plural }) };
      }),
    },
    rng,
  );
}

/* ---------- Level 9: how many in the group once sorted? ---------- */

type Family2 = 'fruit' | 'animal';
type CountFact =
  { by: 'color'; color: Color; n: number } | { by: 'family'; family: Family2; n: number };

const PLACES: [number, number][] = [
  [86, 13],
  [62, 15],
  [38, 12],
  [14, 15],
  [86, 38],
  [62, 36],
  [38, 39],
  [14, 37],
];
const THING_NOUN: Noun = { singular: 'דבר', plural: 'דברים', gender: 'm' };
const FAMILY_NOUN: Record<Family2, Noun> = {
  fruit: { singular: 'פרי', plural: 'פירות', gender: 'm' },
  animal: { singular: 'חיה', plural: 'חיות', gender: 'f' },
};

/** A pile of eight: the `n` asked for and others, in places of chance (fixed by the fact). */
function pile(f: CountFact, ring = false): { visual: Visual; seed: number } {
  const seed =
    f.by === 'color'
      ? COLORS.indexOf(f.color) * 10 + f.n
      : 50 + (f.family === 'fruit' ? 0 : 10) + f.n;
  let wanted: Thing[];
  let rest: Thing[];
  if (f.by === 'color') {
    const ci = COLORS.indexOf(f.color);
    wanted = Array.from({ length: f.n }, (_, k) => thing(nth(BY_COLOR[f.color], k + f.n)));
    rest = Array.from({ length: 8 - f.n }, (_, k) =>
      thing(nth(BY_COLOR[nth(COLORS, ci + 1 + (k % 2))], k + seed)),
    );
  } else {
    const other: Family2 = f.family === 'fruit' ? 'animal' : 'fruit';
    wanted = Array.from({ length: f.n }, (_, k) => thing(nth(FAMILY[f.family], k + f.n)));
    rest = Array.from({ length: 8 - f.n }, (_, k) => thing(nth(FAMILY[other], k)));
  }
  const places = shuffle(seededRng(seed + 7), PLACES);
  const items: SceneItem[] = [...wanted, ...rest].map((t, i) => {
    const [x, y] = places[i] as [number, number];
    return i < f.n && ring ? { ...at(t, x, y, 14), ring: true } : at(t, x, y, 14);
  });
  return { seed, visual: { type: 'scene', w: 100, h: 50, items } };
}

function countSorted(f: CountFact, rng: Rng): Exercise {
  const slots: Record<string, Slot> =
    f.by === 'color'
      ? { colors: colorsWord(f.color), n: { n: f.n, noun: THING_NOUN } }
      : { family: FAMILY_NOUN[f.family].plural, n: { n: f.n, noun: FAMILY_NOUN[f.family] } };
  const exN = f.n === 3 ? 4 : 3;
  const ex: CountFact =
    f.by === 'color'
      ? { by: 'color', color: nth(COLORS, COLORS.indexOf(f.color) + 1), n: exN }
      : { by: 'family', family: f.family === 'fruit' ? 'animal' : 'fruit', n: exN };
  const exSlots: Record<string, Slot> =
    ex.by === 'color'
      ? { colors: colorsWord(ex.color), n: { n: exN, noun: THING_NOUN } }
      : { family: FAMILY_NOUN[ex.family].plural, n: { n: exN, noun: FAMILY_NOUN[ex.family] } };
  const spoken = say(K(`count.ask.${f.by}`), slots);
  return exercise({
    factId: `count:${f.by === 'color' ? f.color : f.family}:${f.n}`,
    topicId: ID,
    level: 9,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: pile(f).visual,
    answer: f.n,
    input: { type: 'choices', choices: windowChoices(rng, [1, 2, 3, 4, 5, 6, 7, 8], f.n) },
    hints: [
      hint(say(K(`count.hint1.${f.by}`), slots)),
      hint(say(K('count.hint2')), { visual: pile(f, true).visual }),
      pictureExample(say(K(`count.example.${ex.by}`), exSlots), pile(ex, true).visual),
    ],
    solution: say(K(`count.solution.${f.by}`), slots),
    diagnose: (v) => (Math.abs(v - f.n) === 1 ? 'offByOne' : null),
    advice: [
      { value: f.n + 1, say: say('adv.count.twice') },
      { value: f.n - 1, say: say('adv.count.skipped') },
    ],
  });
}

/* ---------- Level 10: two properties at once ---------- */

type TwoFact =
  | {
      by: 'sizeColor';
      shape: ShapeKind;
      colors: [ShapeColor, ShapeColor];
      big: boolean;
      first: boolean;
    }
  | {
      by: 'shapeColor';
      shapes: [ShapeKind, ShapeKind];
      colors: [ShapeColor, ShapeColor];
      firstShape: boolean;
      first: boolean;
    };

const SIZE_WORD = (big: boolean) => (big ? 'גדול' : 'קטן');

function twoProps(f: TwoFact, rng: Rng): Exercise {
  const color = f.first ? f.colors[0] : f.colors[1];
  const otherColor = f.first ? f.colors[1] : f.colors[0];
  if (f.by === 'sizeColor') {
    const shape = SHAPE_WORD[f.shape];
    const item = (big: boolean, c: ShapeColor) => shapeOf(f.shape, c, big ? 1 : 0.5);
    const opt = (big: boolean, c: ShapeColor): PictureOption => ({
      label: `${shape.sg} ${SIZE_WORD(big)} ${COLOR_WORD[c].m}`,
      visual: shapeIcon(item(big, c)),
    });
    const combos: [boolean, ShapeColor][] = [
      [f.big, color],
      [!f.big, color],
      [f.big, otherColor],
      [!f.big, otherColor],
    ];
    const advice = combos.slice(1).map(([big, c], i) => {
      const okColor = c === color;
      const okSize = big === f.big;
      return {
        option: i + 1,
        say:
          okColor || okSize
            ? say(K('two.adv.one'), {
                ok: okColor ? COLOR_WORD[c].m : SIZE_WORD(big),
                bad: okColor ? SIZE_WORD(big) : COLOR_WORD[c].m,
                want: okColor ? SIZE_WORD(f.big) : COLOR_WORD[color].m,
              })
            : say(K('two.adv.none'), { a: SIZE_WORD(f.big), b: COLOR_WORD[color].m }),
      };
    });
    return pictureQuestion(
      {
        topicId: ID,
        level: 10,
        factId: `two:${f.shape}:${f.big ? 'big' : 'small'}:${color}`,
        spoken: say(K('two.ask.size'), {
          shape: shape.sg,
          size: SIZE_WORD(f.big),
          color: COLOR_WORD[color].m,
        }),
        options: combos.map(([big, c]) => opt(big, c)) as [PictureOption, ...PictureOption[]],
        hints: [
          hint(say(K('two.hint1.size'))),
          hint(
            say(K('two.hint2.size'), {
              shapes: shape.pl,
              colors: COLOR_WORD[color].pl,
              size: SIZE_WORD(f.big),
            }),
          ),
          pictureExample(
            say(K('two.example.size'), {
              shape: shape.sg,
              size: SIZE_WORD(!f.big),
              color: COLOR_WORD[otherColor].m,
            }),
            shapeIcon(item(!f.big, otherColor)),
          ),
        ],
        solution: say(K('two.solution.size'), {
          shape: shape.sg,
          size: SIZE_WORD(f.big),
          color: COLOR_WORD[color].m,
        }),
        advice,
      },
      rng,
    );
  }
  const kind = f.firstShape ? f.shapes[0] : f.shapes[1];
  const otherKind = f.firstShape ? f.shapes[1] : f.shapes[0];
  const opt = (k: ShapeKind, c: ShapeColor): PictureOption => ({
    label: `${SHAPE_WORD[k].sg} ${COLOR_WORD[c].m}`,
    visual: shapeIcon(shapeOf(k, c, 0.85)),
  });
  const combos: [ShapeKind, ShapeColor][] = [
    [kind, color],
    [otherKind, color],
    [kind, otherColor],
    [otherKind, otherColor],
  ];
  const advice = combos.slice(1).map(([k, c], i) => {
    const okColor = c === color;
    const okShape = k === kind;
    return {
      option: i + 1,
      say:
        okColor || okShape
          ? say(K('two.adv.one'), {
              ok: okColor ? COLOR_WORD[c].m : SHAPE_WORD[k].sg,
              bad: okColor ? SHAPE_WORD[k].sg : COLOR_WORD[c].m,
              want: okColor ? SHAPE_WORD[kind].sg : COLOR_WORD[color].m,
            })
          : say(K('two.adv.none'), { a: SHAPE_WORD[kind].sg, b: COLOR_WORD[color].m }),
    };
  });
  return pictureQuestion(
    {
      topicId: ID,
      level: 10,
      factId: `two:${kind}:${otherKind}:${color}:${otherColor}`,
      spoken: say(K('two.ask.shape'), { shape: SHAPE_WORD[kind].sg, color: COLOR_WORD[color].m }),
      options: combos.map(([k, c]) => opt(k, c)) as [PictureOption, ...PictureOption[]],
      hints: [
        hint(say(K('two.hint1.shape'))),
        hint(
          say(K('two.hint2.shape'), { shapes: SHAPE_WORD[kind].pl, color: COLOR_WORD[color].m }),
        ),
        pictureExample(
          say(K('two.example.shape'), {
            shape: SHAPE_WORD[otherKind].sg,
            color: COLOR_WORD[otherColor].m,
          }),
          shapeIcon(shapeOf(otherKind, otherColor, 0.85)),
        ),
      ],
      solution: say(K('two.solution.shape'), {
        shape: SHAPE_WORD[kind].sg,
        color: COLOR_WORD[color].m,
      }),
      advice,
    },
    rng,
  );
}

const SIZE_COLOR: { shape: ShapeKind; colors: [ShapeColor, ShapeColor] }[] = [
  { shape: 'circle', colors: ['red', 'blue'] },
  { shape: 'square', colors: ['yellow', 'green'] },
  { shape: 'triangle', colors: ['blue', 'red'] },
];
const SHAPE_COLOR: { shapes: [ShapeKind, ShapeKind]; colors: [ShapeColor, ShapeColor] }[] = [
  { shapes: ['circle', 'triangle'], colors: ['blue', 'yellow'] },
  { shapes: ['square', 'circle'], colors: ['red', 'green'] },
  { shapes: ['triangle', 'square'], colors: ['green', 'blue'] },
];

export const sort0 = defineTopic({
  id: ID,
  labelKey: 'topic.sort0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () =>
        FAMILIES.flatMap((many) =>
          FAMILIES.filter((odd) => odd !== many).flatMap((odd) =>
            [0, 1].map((v) => ({ many, odd, v })),
          ),
        ),
      oddOut,
    ),
    closed(L(2), () => COLORS.flatMap((color) => [0, 1, 2, 3].map((v) => ({ color, v }))), byColor),
    closed(L(3), () => SHAPES.flatMap((kind) => [0, 1, 2, 3].map((v) => ({ kind, v }))), byShape),
    closed(
      L(4),
      () =>
        (['big', 'small'] as const).flatMap((ask) =>
          [0, 1, 2, 3, 4, 5, 6, 7].map((v) => ({ ask, v })),
        ),
      bySize,
    ),
    closed(
      L(5),
      () =>
        things(ORDER_THINGS).flatMap((t) =>
          [false, true].flatMap((four) =>
            (['up', 'down'] as const).map((dir) => ({ t, dir, four })),
          ),
        ),
      smallToBig,
    ),
    closed(L(6), () => PAIRS, pairs),
    closed(
      L(7),
      () => SETS.flatMap((_, set) => [set % 3, (set + 1) % 3].map((miss) => ({ set, miss }))),
      missing,
    ),
    closed(
      L(8),
      () =>
        COUNTS.flatMap(([a, b], i) =>
          (['more', 'fewer'] as const).map((ask) => ({ pair: i % COMPARE.length, a, b, ask })),
        ),
      compare,
    ),
    closed(
      L(9),
      () => [
        ...COLORS.flatMap((color) =>
          [2, 3, 4, 5].map((n): CountFact => ({ by: 'color', color, n })),
        ),
        ...(['fruit', 'animal'] as const).flatMap((family) =>
          [2, 3, 4, 5].map((n): CountFact => ({ by: 'family', family, n })),
        ),
      ],
      countSorted,
    ),
    closed(
      L(10),
      () => [
        ...SIZE_COLOR.flatMap(({ shape, colors }) =>
          [true, false].flatMap((big) =>
            [true, false].map((first): TwoFact => ({ by: 'sizeColor', shape, colors, big, first })),
          ),
        ),
        ...SHAPE_COLOR.flatMap(({ shapes, colors }) =>
          [true, false].flatMap((firstShape) =>
            [true, false].map((first): TwoFact => ({
              by: 'shapeColor',
              shapes,
              colors,
              firstShape,
              first,
            })),
          ),
        ),
      ],
      twoProps,
    ),
  ],
});
