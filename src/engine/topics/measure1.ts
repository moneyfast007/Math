import { t, type TranslationKey } from '@/i18n';
import { shown } from '@/lang/compose';
import type { Gender } from '@/lang/gender';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  pictureChoices,
  pictureExample,
  range,
  say,
  spokenEquationSolved,
  type AdviceSpec,
  windowChoices,
} from '../build';
import { shuffle } from '../rng';
import type { Exercise, MeasureThing, Rng, Visual } from '../types';

/**
 * World "מדידה ראשונה", grade 1: comparing lengths (lying from one start line)
 * and heights (standing on one floor), measuring with paper clips and comparing
 * two measures, the middle one of three; heavy and light on a balance, and
 * weighing with cubes; the days of the week, yesterday and tomorrow; and short
 * spoken word problems with clips, cubes and days.
 *
 * Every level is closed: every sentence is recorded whole. The things compared
 * are named, so a child who barely reads hears the question and taps a picture.
 */

const ID = 'measure-1';
const L = (n: number) => `level.measure1.${n}`;
/** A text of this world. */
const K = (k: string) => `ex.m1.${k}` as TranslationKey;

const CLIP: Noun = { singular: 'אטב', plural: 'אטבים', gender: 'm' };
const CUBE: Noun = { singular: 'קובייה', plural: 'קוביות', gender: 'f' };
const DAY: Noun = { singular: 'יום', plural: 'ימים', gender: 'm' };

/* ---------- Things ---------- */

const LYING = ['pencil', 'ribbon', 'snake', 'brush'] as const satisfies readonly MeasureThing[];
const STANDING = ['tower', 'tree', 'flower', 'bottle'] as const satisfies readonly MeasureThing[];
type Pose = 'lie' | 'stand';
const THINGS: Record<Pose, readonly MeasureThing[]> = { lie: LYING, stand: STANDING };

/** Every thing's name is masculine, so "ארוך", "גבוה" need no agreement. */
const NAME: Record<MeasureThing, string> = {
  pencil: 'עיפרון',
  ribbon: 'סרט',
  snake: 'נחש',
  brush: 'מכחול',
  tower: 'מגדל',
  tree: 'עץ',
  flower: 'פרח',
  bottle: 'בקבוק',
};

type Item = { thing: MeasureThing; len: number };

const picture = (
  pose: Pose,
  items: Item[],
  extra: Partial<Extract<Visual, { type: 'lengths' }>> = {},
): Visual => ({
  type: 'lengths',
  items,
  ...(pose === 'stand' ? { stand: true } : {}),
  ...extra,
});

/** A small picture of one thing, for an answer button (not to scale). */
const icon = (pose: Pose, thing: MeasureThing): Visual =>
  picture(pose, [{ thing, len: 3 }], { icon: true });

/** Picture buttons for these things, in a random order; the answer is the index of `right`. */
function thingButtons(rng: Rng, pose: Pose, things: MeasureThing[], right: MeasureThing) {
  const order = shuffle(rng, things);
  return {
    input: pictureChoices(
      order.map((x) => NAME[x]),
      order.map((x) => icon(pose, x)),
    ),
    answer: order.indexOf(right),
  };
}

/** The things not in this list (for a worked example about other things). */
const others = (pose: Pose, used: readonly MeasureThing[]) =>
  THINGS[pose].filter((x) => !used.includes(x));

/* ---------- Levels 1–2: which is longer, which is taller ---------- */

type CompareFact = {
  pose: Pose;
  a: MeasureThing;
  b: MeasureThing;
  la: number;
  lb: number;
  ask: 'more' | 'less';
};

const PAIR_LENGTHS: [number, number][] = [
  [3, 7],
  [6, 5],
  [2, 4],
  [8, 6],
  [4, 5],
  [7, 3],
];

function pairsOf(things: readonly MeasureThing[]): [MeasureThing, MeasureThing][] {
  const out: [MeasureThing, MeasureThing][] = [];
  for (let i = 0; i < things.length; i++)
    for (let j = i + 1; j < things.length; j++)
      out.push([things[i] as MeasureThing, things[j] as MeasureThing]);
  return out;
}

const compareFacts = (pose: Pose) => (): CompareFact[] =>
  pairsOf(THINGS[pose]).flatMap(([a, b], p) =>
    [p, p + 3].flatMap((k) => {
      const [la, lb] = PAIR_LENGTHS[k % PAIR_LENGTHS.length] as [number, number];
      return (['more', 'less'] as const).map((ask) => ({ pose, a, b, la, lb, ask }));
    }),
  );

/** Text keys by pose and ask: longer / shorter, taller / lower. */
const WORD = {
  lie: { more: 'long', less: 'short' },
  stand: { more: 'tall', less: 'low' },
} as const;

function compare(level: number) {
  return (f: CompareFact, rng: Rng, gender: Gender): Exercise => {
    const w = WORD[f.pose][f.ask];
    const aWins = f.ask === 'more' ? f.la > f.lb : f.la < f.lb;
    const [win, lose] = aWins ? [f.a, f.b] : [f.b, f.a];
    const items: Item[] = [
      { thing: f.a, len: f.la },
      { thing: f.b, len: f.lb },
    ];
    const { input, answer } = thingButtons(rng, f.pose, [f.a, f.b], win);
    const [x, y] = others(f.pose, [f.a, f.b]) as [MeasureThing, MeasureThing];
    // The example: the first of the other two wins, at lengths of their own.
    const ex: Item[] =
      f.ask === 'more'
        ? [
            { thing: x, len: 6 },
            { thing: y, len: 3 },
          ]
        : [
            { thing: x, len: 3 },
            { thing: y, len: 6 },
          ];
    const spoken = say(K(`cmp.${w}.prompt`), { a: NAME[f.a], b: NAME[f.b] });
    return exercise({
      factId: `cmp:${f.pose}:${f.a}${f.la}:${f.b}${f.lb}:${f.ask}`,
      topicId: ID,
      level,
      prompt: shown(spoken),
      display: '',
      spoken,
      visual: picture(f.pose, items),
      answer,
      input,
      hints: [
        hint(say(K(`cmp.${f.pose}.hint1`), {}, gender)),
        hint(say(K(`cmp.${w}.hint2`), {}, gender), {
          visual: picture(f.pose, items, { guide: Math.min(f.la, f.lb) }),
        }),
        pictureExample(
          say(K(`cmp.${w}.solution`), { a: NAME[x], b: NAME[y] }),
          picture(f.pose, ex),
        ),
      ],
      solution: say(K(`cmp.${w}.solution`), { a: NAME[win], b: NAME[lose] }),
    });
  };
}

/* ---------- Level 3: measuring with paper clips ---------- */

type MeasureFact = { thing: MeasureThing; len: number };

const measureFacts = (): MeasureFact[] =>
  LYING.flatMap((thing) => range(2, 8).map((len) => ({ thing, len })));

function measure(f: MeasureFact, rng: Rng, gender: Gender): Exercise {
  const items = [{ thing: f.thing, len: f.len }];
  const [x] = others('lie', [f.thing]) as [MeasureThing];
  const exLen = f.len === 4 ? 6 : 4;
  const spoken = say(K('clips.prompt'), { a: NAME[f.thing] });
  return exercise({
    factId: `clips:${f.thing}:${f.len}`,
    topicId: ID,
    level: 3,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: picture('lie', items, { clips: true }),
    answer: f.len,
    input: { type: 'choices', choices: windowChoices(rng, range(1, 10), f.len) },
    hints: [
      hint(say(K('clips.hint1'), { a: NAME[f.thing] }, gender)),
      hint(say(K('clips.hint2'), {}, gender), {
        visual: picture('lie', items, { clips: true, alt: true }),
      }),
      pictureExample(
        say(K('clips.solution'), { a: NAME[x], n: { n: exLen, noun: CLIP } }),
        picture('lie', [{ thing: x, len: exLen }], { clips: true }),
      ),
    ],
    solution: say(K('clips.solution'), { a: NAME[f.thing], n: { n: f.len, noun: CLIP } }),
  });
}

/* ---------- Level 4: by how many clips longer? ---------- */

type DiffFact = { a: MeasureThing; b: MeasureThing; la: number; lb: number };

const DIFF_LENGTHS: [number, number][] = [
  [5, 3],
  [7, 4],
  [6, 2],
  [8, 5],
  [4, 3],
  [9, 6],
  [7, 6],
  [8, 3],
  [6, 4],
];

const diffFacts = (): DiffFact[] =>
  pairsOf(LYING)
    .flatMap(([a, b]): [MeasureThing, MeasureThing][] => [
      [a, b],
      [b, a],
    ])
    .flatMap(([a, b], k) =>
      [k, k + 3, k + 6].map((i) => {
        const [la, lb] = DIFF_LENGTHS[i % DIFF_LENGTHS.length] as [number, number];
        return { a, b, la, lb };
      }),
    );

function diff(f: DiffFact, rng: Rng, gender: Gender): Exercise {
  const d = f.la - f.lb;
  // The longer one on top or below: the picture alone must not tell which is asked about.
  const top = rng() < 0.5;
  const items: Item[] = top
    ? [
        { thing: f.a, len: f.la },
        { thing: f.b, len: f.lb },
      ]
    : [
        { thing: f.b, len: f.lb },
        { thing: f.a, len: f.la },
      ];
  const marked: Item[] = [
    { thing: f.a, len: f.la },
    { thing: f.b, len: f.lb },
  ];
  // A worked example with another difference, about the other two things.
  const [ea, eb] = DIFF_LENGTHS.find(([p, q]) => p - q !== d && p !== f.la) as [number, number];
  const [x, y] = others('lie', [f.a, f.b]) as [MeasureThing, MeasureThing];
  const slots = { a: NAME[f.a], b: NAME[f.b] };
  const spoken = say(K('diff.prompt'), slots);
  const advice: AdviceSpec[] = [
    { value: f.la, say: say(K('diff.adv.long'), slots, gender) },
    { value: f.lb, say: say(K('diff.adv.short'), slots, gender) },
  ];
  return exercise({
    factId: `diff:${f.a}${f.la}:${f.b}${f.lb}`,
    topicId: ID,
    level: 4,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: picture('lie', items, { clips: true }),
    answer: d,
    operation: 'sub',
    input: { type: 'choices', choices: windowChoices(rng, range(1, 7), d) },
    hints: [
      hint(say(K('diff.hint1'), slots, gender)),
      hint(
        say(
          K('diff.hint2'),
          { ...slots, x: { n: f.la, noun: CLIP }, y: { n: f.lb, noun: CLIP } },
          gender,
        ),
        {
          visual: picture('lie', marked, { clips: true, extra: f.lb }),
        },
      ),
      {
        ...pictureExample(
          say(K('diff.example'), {
            a: NAME[x],
            b: NAME[y],
            x: { n: ea, noun: CLIP },
            y: { n: eb, noun: CLIP },
            d: { n: ea - eb, noun: CLIP },
          }),
          picture(
            'lie',
            [
              { thing: x, len: ea },
              { thing: y, len: eb },
            ],
            { clips: true },
          ),
          `${ea} − ${eb} = ${ea - eb}`,
        ),
      },
    ],
    solution: say(K('diff.solution'), { ...slots, d: { n: d, noun: CLIP } }),
    advice,
  });
}

/* ---------- Level 5: the middle one of three ---------- */

type MiddleFact = { pose: Pose; things: MeasureThing[]; lens: number[] };

const PERMS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

const middleFacts = (): MiddleFact[] =>
  (['lie', 'stand'] as const).flatMap((pose) =>
    THINGS[pose].flatMap((_, skip) => {
      const things = THINGS[pose].filter((__, i) => i !== skip);
      const triple = skip % 2 === 0 ? [3, 5, 7] : [4, 6, 8];
      return PERMS.map((p) => ({ pose, things, lens: p.map((i) => triple[i] as number) }));
    }),
  );

function middle(f: MiddleFact, rng: Rng, gender: Gender): Exercise {
  const items: Item[] = f.things.map((thing, i) => ({ thing, len: f.lens[i] as number }));
  const sorted = [...items].sort((p, q) => p.len - q.len);
  const [s, m, l] = sorted.map((i) => i.thing) as [MeasureThing, MeasureThing, MeasureThing];
  const { input, answer } = thingButtons(rng, f.pose, f.things, m);
  // The example: the thing left out is the middle one, between two of the others.
  const [x] = others(f.pose, f.things) as [MeasureThing];
  const exItems: Item[] = [
    { thing: l, len: 7 },
    { thing: x, len: 5 },
    { thing: s, len: 2 },
  ];
  const w = f.pose === 'lie' ? 'long' : 'tall';
  const spoken = say(K(`mid.${w}.prompt`));
  return exercise({
    factId: `mid:${f.pose}:${items.map((i) => `${i.thing}${i.len}`).join(',')}`,
    topicId: ID,
    level: 5,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: picture(f.pose, items),
    answer,
    input,
    hints: [
      hint(say(K(`mid.${w}.hint1`), {}, gender)),
      hint(say(K(`mid.${w}.hint2`), {}, gender), { visual: picture(f.pose, sorted) }),
      pictureExample(
        say(K(`mid.${w}.solution`), { m: NAME[x], s: NAME[s], l: NAME[l] }),
        picture(f.pose, exItems),
      ),
    ],
    solution: say(K(`mid.${w}.solution`), { m: NAME[m], s: NAME[s], l: NAME[l] }),
  });
}

/* ---------- Levels 6–7: the balance ---------- */

interface Obj {
  id: string;
  emoji: string;
  name: string;
  gender: Gender;
}

const OBJ = {
  apple: { id: 'apple', emoji: '🍎', name: 'תפוח', gender: 'm' },
  pear: { id: 'pear', emoji: '🍐', name: 'אגס', gender: 'm' },
  banana: { id: 'banana', emoji: '🍌', name: 'בננה', gender: 'f' },
  orange: { id: 'orange', emoji: '🍊', name: 'תפוז', gender: 'm' },
  teddy: { id: 'teddy', emoji: '🧸', name: 'דובי', gender: 'm' },
  ball: { id: 'ball', emoji: '⚽', name: 'כדור', gender: 'm' },
  shoe: { id: 'shoe', emoji: '👟', name: 'נעל', gender: 'f' },
  book: { id: 'book', emoji: '📘', name: 'ספר', gender: 'm' },
} as const satisfies Record<string, Obj>;
const OBJECTS: readonly Obj[] = Object.values(OBJ);

/**
 * Pairs of things about the same size, so only the balance tells which is
 * heavier (either way round is believable).
 */
const PAIRS: [Obj, Obj][] = [
  [OBJ.apple, OBJ.pear],
  [OBJ.banana, OBJ.orange],
  [OBJ.teddy, OBJ.ball],
  [OBJ.shoe, OBJ.book],
  [OBJ.apple, OBJ.banana],
  [OBJ.pear, OBJ.orange],
  [OBJ.ball, OBJ.shoe],
  [OBJ.book, OBJ.teddy],
];

const objPicture = (o: Obj): Visual => ({
  type: 'objects',
  kind: { id: o.id, emoji: o.emoji },
  groups: [1],
});

type HeavyFact = { a: Obj; b: Obj; heavy: 'a' | 'b'; ask: 'heavy' | 'light' };

const heavyFacts = (): HeavyFact[] =>
  PAIRS.flatMap(([a, b]) =>
    (['a', 'b'] as const).flatMap((heavy) =>
      (['heavy', 'light'] as const).map((ask) => ({ a, b, heavy, ask })),
    ),
  );

function tipped(heavy: Obj, light: Obj, heavyLeft: boolean, arrows = false): Visual {
  const h = { emoji: heavy.emoji };
  const l = { emoji: light.emoji };
  return {
    type: 'balance',
    left: heavyLeft ? h : l,
    right: heavyLeft ? l : h,
    down: heavyLeft ? 'left' : 'right',
    ...(arrows ? { arrows: true } : {}),
  };
}

function heavy(f: HeavyFact, rng: Rng, gender: Gender): Exercise {
  const [hv, lt] = f.heavy === 'a' ? [f.a, f.b] : [f.b, f.a];
  const [win, lose] = f.ask === 'heavy' ? [hv, lt] : [lt, hv];
  const heavyLeft = rng() < 0.5;
  const order = shuffle(rng, [f.a, f.b]);
  // The example: another pair, the other way round.
  const [ex1, ex2] = PAIRS.find(([p, q]) => ![p, q].some((o) => o === f.a || o === f.b)) as [
    Obj,
    Obj,
  ];
  const [exWin, exLose] = f.ask === 'heavy' ? [ex1, ex2] : [ex2, ex1];
  const spoken = say(K(`bal.${f.ask}.prompt`), { a: f.a.name, b: f.b.name });
  return exercise({
    factId: `bal:${f.a.id}:${f.b.id}:${f.heavy}:${f.ask}`,
    topicId: ID,
    level: 6,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: tipped(hv, lt, heavyLeft),
    answer: order.indexOf(win),
    input: pictureChoices(
      order.map((o) => o.name),
      order.map(objPicture),
    ),
    hints: [
      hint(say(K('bal.hint1'), {}, gender)),
      hint(say(K(`bal.${f.ask}.hint2`), {}, gender), { visual: tipped(hv, lt, heavyLeft, true) }),
      pictureExample(
        say(K(`bal.${f.ask}.solution`), { a: exWin.name, b: exLose.name }, exWin.gender),
        tipped(ex1, ex2, !heavyLeft),
      ),
    ],
    solution: say(K(`bal.${f.ask}.solution`), { a: win.name, b: lose.name }, win.gender),
  });
}

type WeighFact = { obj: Obj; n: number };

const weighFacts = (): WeighFact[] => {
  const counts = range(2, 9);
  return OBJECTS.flatMap((obj, i) =>
    [i, i + 3, i + 5].map((k) => ({ obj, n: counts[k % counts.length] as number })),
  );
};

const even = (o: Obj, n: number, objLeft: boolean): Visual => ({
  type: 'balance',
  left: objLeft ? { emoji: o.emoji } : { cubes: n },
  right: objLeft ? { cubes: n } : { emoji: o.emoji },
});

function weigh(f: WeighFact, rng: Rng, gender: Gender): Exercise {
  const objLeft = rng() < 0.5;
  const ex = OBJECTS[(OBJECTS.indexOf(f.obj) + 3) % OBJECTS.length] as Obj;
  const exN = f.n === 3 ? 5 : 3;
  const spoken = say(K('weigh.prompt'), { a: f.obj.name }, f.obj.gender);
  return exercise({
    factId: `weigh:${f.obj.id}:${f.n}`,
    topicId: ID,
    level: 7,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: even(f.obj, f.n, objLeft),
    answer: f.n,
    input: { type: 'choices', choices: windowChoices(rng, range(1, 10), f.n) },
    hints: [
      hint(say(K('weigh.hint1'), {}, gender)),
      hint(say(K('weigh.hint2'), {}, gender), {
        visual: {
          type: 'objects',
          kind: { id: 'cube', emoji: '🟨' },
          groups: [f.n],
          arranged: true,
        },
      }),
      pictureExample(
        say(K('weigh.solution'), { a: ex.name, n: { n: exN, noun: CUBE } }, ex.gender),
        even(ex, exN, !objLeft),
      ),
    ],
    solution: say(K('weigh.solution'), { a: f.obj.name, n: { n: f.n, noun: CUBE } }, f.obj.gender),
  });
}

/* ---------- Levels 8–9: the days of the week ---------- */

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const mod7 = (d: number) => ((d % 7) + 7) % 7;
/** "יום שלישי", "שבת". */
const dayName = (d: number) => (mod7(d) === 6 ? 'שבת' : `יום ${DAYS[mod7(d)] as string}`);
/** "שבת" is feminine, every "יום" masculine: the verb agrees ("באה שבת", "היה יום שני"). */
const dayGender = (d: number): Gender => (mod7(d) === 6 ? 'f' : 'm');

/** Buttons with day names, in a random order; the answer is the index of `right`. */
function dayButtons(rng: Rng, right: number, wrong: number[]) {
  const order = shuffle(rng, [right, ...wrong].map(mod7));
  // On the buttons the day's own name, as on the week's cards ("שלישי", "שבת").
  return {
    input: labelledChoices(
      order.map((d) => DAYS[d] as string),
      true,
    ),
    answer: order.indexOf(mod7(right)),
    order,
  };
}

const week = (mark: number, tag?: string): Visual => ({
  type: 'weekDays',
  mark: mod7(mark),
  ...(tag ? { tags: [{ day: mod7(mark), text: tag }] } : {}),
});

type OrderFact = { day: number; dir: 'after' | 'before' };

const orderFacts = (): OrderFact[] =>
  range(0, 6).flatMap((day) => (['after', 'before'] as const).map((dir) => ({ day, dir })));

function dayOrder(f: OrderFact, rng: Rng, gender: Gender): Exercise {
  const step = f.dir === 'after' ? 1 : -1;
  const ans = f.day + step;
  const opposite = f.day - step;
  const { input, answer, order } = dayButtons(rng, ans, [opposite, f.day + 2 * step]);
  const ex = f.day + 3;
  const spoken = say(K(`days.${f.dir}.prompt`), { day: dayName(f.day) });
  return exercise({
    factId: `days:${f.dir}:${f.day}`,
    topicId: ID,
    level: 8,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    input,
    hints: [
      hint(say(K('days.hint1'), {}, gender)),
      hint(say(K(`days.${f.dir}.hint2`), { day: dayName(f.day) }, gender), { visual: week(f.day) }),
      pictureExample(
        say(
          K(`days.${f.dir}.solution`),
          { day: dayName(ex), ans: dayName(ex + step) },
          dayGender(ex + step),
        ),
        week(ex),
      ),
    ],
    solution: say(
      K(`days.${f.dir}.solution`),
      { day: dayName(f.day), ans: dayName(ans) },
      dayGender(ans),
    ),
    advice: [
      {
        value: order.indexOf(mod7(opposite)),
        say: say(
          K(`days.${f.dir}.adv`),
          { v: dayName(opposite), day: dayName(f.day) },
          dayGender(opposite),
        ),
      },
    ],
  });
}

type RelKind = 'tomorrow' | 'yesterday' | 'fromTomorrow' | 'fromYesterday';
type RelFact = { day: number; kind: RelKind };

/** How far the answer is from the day said, and the tag under that day in the hint's week. */
const REL: Record<RelKind, { step: number; tag: TranslationKey }> = {
  tomorrow: { step: 1, tag: K('rel.today') },
  yesterday: { step: -1, tag: K('rel.today') },
  fromTomorrow: { step: -1, tag: K('rel.tomorrow') },
  fromYesterday: { step: 1, tag: K('rel.yesterday') },
};

const relFacts = (): RelFact[] =>
  range(0, 6).flatMap((day) =>
    (['tomorrow', 'yesterday', 'fromTomorrow', 'fromYesterday'] as const).map((kind) => ({
      day,
      kind,
    })),
  );

/** The gender a sentence of this kind agrees with: the day after "אתמול היה / הייתה". */
function relGender(kind: RelKind, day: number, ans: number): Gender {
  if (kind === 'yesterday') return dayGender(ans);
  if (kind === 'fromYesterday') return dayGender(day);
  return 'm';
}

function relative(f: RelFact, rng: Rng, gender: Gender): Exercise {
  const { step, tag } = REL[f.kind];
  const ans = f.day + step;
  const { input, answer, order } = dayButtons(rng, ans, [f.day, f.day - step]);
  const ex = f.day + 3;
  const slots = (day: number) => ({ day: dayName(day), ans: dayName(day + step) });
  const spoken = say(K(`rel.${f.kind}.prompt`), slots(f.day), relGender(f.kind, f.day, ans));
  return exercise({
    factId: `rel:${f.kind}:${f.day}`,
    topicId: ID,
    level: 9,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    input,
    hints: [
      hint(say(K('rel.hint1'), {}, gender)),
      hint(say(K(`rel.${f.kind}.hint2`), slots(f.day), gender), { visual: week(f.day, t(tag)) }),
      pictureExample(
        say(K(`rel.${f.kind}.solution`), slots(ex), relGender(f.kind, ex, ex + step)),
        week(ex, t(tag)),
      ),
    ],
    solution: say(K(`rel.${f.kind}.solution`), slots(f.day), relGender(f.kind, f.day, ans)),
    advice: [
      {
        value: order.indexOf(mod7(f.day)),
        say: say(K('rel.adv.same'), {}, gender),
      },
    ],
  });
}

/* ---------- Level 10: word problems ---------- */

type StoryFact =
  | { kind: 'longer'; a: number; b: number; who: number }
  | { kind: 'shorter'; a: number; b: number; who: number }
  | { kind: 'weights'; x: Obj; y: Obj; a: number; b: number }
  | { kind: 'later'; day: number; k: number; who: number }
  | { kind: 'shabbat'; day: number; who: number };

const STORY_LONGER: [number, number][] = [
  [4, 2],
  [5, 3],
  [3, 1],
  [6, 2],
  [5, 1],
  [3, 3],
];
const STORY_SHORTER: [number, number][] = [
  [7, 2],
  [6, 3],
  [8, 5],
  [5, 1],
  [9, 4],
  [4, 2],
];
/** Only masculine things, so "שוקל" agrees with both. */
const STORY_WEIGHTS: [Obj, Obj, number, number][] = [
  [OBJ.apple, OBJ.pear, 3, 2],
  [OBJ.teddy, OBJ.ball, 4, 3],
  [OBJ.book, OBJ.orange, 5, 2],
  [OBJ.ball, OBJ.apple, 2, 6],
  [OBJ.pear, OBJ.book, 4, 4],
  [OBJ.orange, OBJ.teddy, 3, 5],
];
const STORY_LATER: [number, number][] = [
  [0, 2],
  [1, 3],
  [2, 2],
  [3, 3],
  [4, 2],
  [5, 3],
];

const storyFacts = (): StoryFact[] => [
  ...STORY_LONGER.map(([a, b], who): StoryFact => ({ kind: 'longer', a, b, who })),
  ...STORY_SHORTER.map(([a, b], i): StoryFact => ({ kind: 'shorter', a, b, who: i + 1 })),
  ...STORY_WEIGHTS.map(([x, y, a, b]): StoryFact => ({ kind: 'weights', x, y, a, b })),
  ...STORY_LATER.map(([day, k], i): StoryFact => ({ kind: 'later', day, k, who: i + 2 })),
  ...range(0, 4).map((day, i): StoryFact => ({ kind: 'shabbat', day, who: i + 3 })),
];

const who = (i: number) => CHARACTERS[i % CHARACTERS.length] as (typeof CHARACTERS)[number];

/** A story with a number answer: the sum or difference, and its worked example. */
function numberStory(
  f: Extract<StoryFact, { kind: 'longer' | 'shorter' | 'weights' }>,
  rng: Rng,
  gender: Gender,
): Exercise {
  const op = f.kind === 'shorter' ? '-' : '+';
  const ans = op === '+' ? f.a + f.b : f.a - f.b;
  const list: [number, number][] =
    f.kind === 'longer'
      ? STORY_LONGER
      : f.kind === 'shorter'
        ? STORY_SHORTER
        : STORY_WEIGHTS.map(([, , a, b]) => [a, b]);
  const [ea, eb] = list.find(([p, q]) => (op === '+' ? p + q : p - q) !== ans) as [number, number];
  const noun = f.kind === 'weights' ? CUBE : CLIP;
  const slots =
    f.kind === 'weights'
      ? { x: f.x.name, y: f.y.name, a: { n: f.a, noun }, b: { n: f.b, noun } }
      : { name: who(f.who).name, a: { n: f.a, noun }, b: { n: f.b, noun } };
  const spoken = say(K(`story.${f.kind}`), slots);
  const sign = op === '+' ? '+' : '−';
  const visual: Visual =
    f.kind === 'weights'
      ? { type: 'objects', kind: { id: 'cube', emoji: '🟨' }, groups: [f.a, f.b] }
      : f.kind === 'longer'
        ? picture('lie', [{ thing: 'brush', len: ans }], { clips: true, extra: f.a })
        : picture(
            'lie',
            [
              { thing: 'ribbon', len: f.a },
              { thing: 'ribbon', len: ans },
            ],
            { clips: true, extra: ans },
          );
  return exercise({
    factId: `story:${f.kind}:${f.a}:${f.b}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer: ans,
    operation: op === '+' ? 'add' : 'sub',
    input: { type: 'choices', choices: windowChoices(rng, range(0, 10), ans) },
    hints: [
      hint(say(K(`story.${f.kind}.hint1`), {}, gender)),
      {
        ...hint(say(K(`story.${f.kind}.hint2`), {}, gender), { visual }),
        example: {
          display: `${f.a} ${sign} ${f.b} = ?`,
          spoken: say(K(`story.${f.kind}.hint2`), {}, gender).text,
        },
      },
      exampleHint(
        `${ea} ${sign} ${eb} = ${op === '+' ? ea + eb : ea - eb}`,
        spokenEquationSolved(ea, op, eb, op === '+' ? ea + eb : ea - eb),
      ),
    ],
    solution: say(K(`story.${f.kind}.solution`), { c: { n: ans, noun } }),
  });
}

function story(f: StoryFact, rng: Rng, gender: Gender): Exercise {
  if (f.kind === 'longer' || f.kind === 'shorter' || f.kind === 'weights')
    return numberStory(f, rng, gender);
  const person = who(f.who);
  if (f.kind === 'later') {
    const ans = f.day + f.k;
    const { input, answer } = dayButtons(rng, ans, [ans - 1, ans + 1]);
    const ex = f.day + 1;
    const exK = f.k === 2 ? 3 : 2;
    const spoken = say(
      K('story.later'),
      { day: dayName(f.day), k: { n: f.k, noun: DAY }, name: person.name },
      person.gender,
    );
    return exercise({
      factId: `story:later:${f.day}:${f.k}`,
      topicId: ID,
      level: 10,
      prompt: shown(spoken),
      display: '',
      spoken,
      answer,
      input,
      hints: [
        hint(say(K('story.later.hint1'), { k: { n: f.k, noun: DAY } }, gender)),
        hint(say(K('story.later.hint2'), { day: dayName(f.day) }, gender), {
          visual: week(f.day, t(K('rel.today'))),
        }),
        pictureExample(
          say(K('story.later.solution'), {
            day: dayName(ex),
            k: { n: exK, noun: DAY },
            ans: dayName(ex + exK),
          }),
          week(ex, t(K('rel.today'))),
        ),
      ],
      solution: say(K('story.later.solution'), {
        day: dayName(f.day),
        k: { n: f.k, noun: DAY },
        ans: dayName(ans),
      }),
    });
  }
  const ans = 6 - f.day;
  const ex = f.day === 3 ? 1 : 3;
  const spoken = say(K('story.shabbat'), { day: dayName(f.day), name: person.name });
  return exercise({
    factId: `story:shabbat:${f.day}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer: ans,
    input: { type: 'choices', choices: windowChoices(rng, range(1, 7), ans) },
    hints: [
      hint(say(K('story.shabbat.hint1'), {}, gender)),
      hint(say(K('story.shabbat.hint2'), { day: dayName(f.day) }, gender), {
        visual: week(f.day, t(K('rel.today'))),
      }),
      pictureExample(
        say(K('story.shabbat.solution'), { day: dayName(ex), k: { n: 6 - ex, noun: DAY } }),
        week(ex, t(K('rel.today'))),
      ),
    ],
    solution: say(K('story.shabbat.solution'), { day: dayName(f.day), k: { n: ans, noun: DAY } }),
  });
}

/* ---------- The world ---------- */

export const measure1 = defineTopic({
  id: ID,
  labelKey: 'topic.measure1',
  grades: [1],
  startLevel: () => 1,
  levels: [
    closed(L(1), compareFacts('lie'), compare(1)),
    closed(L(2), compareFacts('stand'), compare(2)),
    closed(L(3), measureFacts, measure),
    closed(L(4), diffFacts, diff),
    closed(L(5), middleFacts, middle),
    closed(L(6), heavyFacts, heavy),
    closed(L(7), weighFacts, weigh),
    closed(L(8), orderFacts, dayOrder),
    closed(L(9), relFacts, relative),
    closed(L(10), storyFacts, story),
  ],
});

/** For tests: the facts of every level. */
export const measure1Facts = {
  compareFacts,
  measureFacts,
  diffFacts,
  middleFacts,
  heavyFacts,
  weighFacts,
  orderFacts,
  relFacts,
  storyFacts,
} as const;
