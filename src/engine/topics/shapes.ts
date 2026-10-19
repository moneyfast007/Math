import { shown } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exercise,
  hint,
  pictureChoices,
  pictureExample,
  say,
  type Said,
  windowChoices,
} from '../build';
import { seededRng, shuffle } from '../rng';
import type { Exercise, Hint, Rng, ShapeColor, ShapeItem, ShapeKind, Visual } from '../types';

/**
 * World "צורות ודגמים", gan hova (phase 6). Finding a circle, square,
 * triangle and rectangle; the same shape turned or in another colour;
 * corners; biggest and smallest; longest and shortest; colour and shape
 * patterns (what comes next, what is missing); counting one shape among others.
 *
 * Nothing to read: every question is spoken and every answer is a picture or
 * a number. Every level is closed, so every sentence is recorded whole.
 */

const ID = 'shapes';
const L = (n: number) => `level.shapes.${n}`;

const NAME: Record<ShapeKind, string> = {
  circle: 'עיגול',
  square: 'ריבוע',
  triangle: 'משולש',
  rectangle: 'מלבן',
};
const NOUN: Record<ShapeKind, Noun> = {
  circle: { singular: 'עיגול', plural: 'עיגולים', gender: 'm' },
  square: { singular: 'ריבוע', plural: 'ריבועים', gender: 'm' },
  triangle: { singular: 'משולש', plural: 'משולשים', gender: 'm' },
  rectangle: { singular: 'מלבן', plural: 'מלבנים', gender: 'm' },
};
const ABOUT: Record<ShapeKind, TranslationKey> = {
  circle: 'ex.shapes.about.circle',
  square: 'ex.shapes.about.square',
  triangle: 'ex.shapes.about.triangle',
  rectangle: 'ex.shapes.about.rectangle',
};
const CORNERS: Record<ShapeKind, number> = { circle: 0, square: 4, triangle: 3, rectangle: 4 };
const COLOR_NAME: Record<ShapeColor, string> = {
  red: 'אדום',
  blue: 'כחול',
  yellow: 'צהוב',
  green: 'ירוק',
};
const COLORS: ShapeColor[] = ['red', 'blue', 'yellow', 'green'];
/**
 * In shape patterns every shape has the same colour: with a colour of its own,
 * the pattern could be followed by colour alone, and the level would repeat level 7.
 */
const PATTERN_SHAPE_COLOR: ShapeColor = 'blue';
const BASIC: ShapeKind[] = ['circle', 'square', 'triangle'];
const ALL: ShapeKind[] = ['circle', 'square', 'triangle', 'rectangle'];

const one = (item: ShapeItem): Visual => ({ type: 'shapes', items: [item] });
const row = (items: (ShapeItem | null)[]): Visual => ({ type: 'shapes', items });
const item = (shape: ShapeKind, color: ShapeColor, size = 1, turn = 0): ShapeItem => ({
  shape,
  color,
  size,
  turn,
});
/** A colour for a shape that is not the one asked about, so colour never gives it away. */
const colorOf = (i: number): ShapeColor => COLORS[i % COLORS.length] as ShapeColor;

interface Pick {
  options: ShapeItem[];
  labels: string[];
  answer: number;
}

function shuffled(
  rng: Rng,
  right: ShapeItem,
  rightLabel: string,
  wrong: [ShapeItem, string][],
): Pick {
  const all = shuffle(rng, [[right, rightLabel] as [ShapeItem, string], ...wrong]);
  return {
    options: all.map(([s]) => s),
    labels: all.map(([, l]) => l),
    answer: all.findIndex(([s]) => s === right),
  };
}

function pickExercise(
  level: number,
  factId: string,
  spoken: Said,
  pick: Pick,
  hints: [Hint, Hint, Hint],
  solution: Said,
  visual?: Visual,
): Exercise {
  return exercise({
    factId,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    ...(visual ? { visual } : {}),
    answer: pick.answer,
    input: pictureChoices(pick.labels, pick.options.map(one)),
    hints,
    solution,
  });
}

/* ---------- Levels 1–2: where is the …? ---------- */

type WhereFact = { target: ShapeKind; others: ShapeKind[]; turn: number };

const whereFacts =
  (targets: ShapeKind[], pool: (t: ShapeKind) => ShapeKind[][]) => (): WhereFact[] =>
    targets.flatMap((target) =>
      pool(target).flatMap((others) => [0, 20].map((turn) => ({ target, others, turn }))),
    );

function where(level: number) {
  return ({ target, others, turn }: WhereFact, rng: Rng): Exercise => {
    const right = item(target, colorOf(ALL.indexOf(target) + 1), 1, target === 'circle' ? 0 : turn);
    const wrong = others.map((o, i): [ShapeItem, string] => [item(o, colorOf(i + 2)), NAME[o]]);
    const name = NAME[target];
    // The model is not a copy of the button: another colour and size.
    const model = item(target, COLORS.find((c) => c !== right.color) as ShapeColor, 0.75);
    return pickExercise(
      level,
      `where${level}:${target}:${others.join(',')}:${turn}`,
      say('ex.shapes.where', { name }),
      shuffled(rng, right, name, wrong),
      [
        hint(say(ABOUT[target])),
        // Square and rectangle both have four corners: what tells them apart is the sides.
        hint(say(level === 2 ? 'ex.shapes.sides.hint' : 'ex.shapes.corners.countThem')),
        // A model of the shape, not a solved exercise: titled so.
        {
          ...pictureExample(say('ex.shapes.this', { name }), one(model)),
          text: t('ex.shapes.looksLike', { params: { name } }),
        },
      ],
      say('ex.shapes.this', { name }),
    );
  };
}

/* ---------- Level 3: the same shape, turned or in another colour ---------- */

type SameFact = { target: ShapeKind; turn: number };

function same({ target, turn }: SameFact, rng: Rng): Exercise {
  const shown = item(target, 'blue', 1, 0);
  const right = item(target, 'red', 0.8, target === 'circle' ? 0 : turn);
  const others = ALL.filter((s) => s !== target).slice(0, 2);
  const wrong = others.map((o): [ShapeItem, string] => [item(o, 'blue'), NAME[o]]);
  const name = NAME[target];
  const exShape: ShapeKind = target === 'square' ? 'triangle' : 'square';
  return pickExercise(
    3,
    `same:${target}:${turn}`,
    say('ex.shapes.same.prompt'),
    shuffled(rng, right, name, wrong),
    [
      hint(say('ex.shapes.same.hint1')),
      hint(say(ABOUT[target])),
      pictureExample(
        say('ex.shapes.same.example2', { names: NOUN[exShape].plural }),
        row([item(exShape, 'green'), item(exShape, 'yellow', 0.7, 30)]),
      ),
    ],
    say('ex.shapes.same.solution', { name }),
    one(shown),
  );
}

/* ---------- Level 4: how many corners? ---------- */

type CornerFact = { shape: ShapeKind; turn: number };

function cornersSaid(shape: ShapeKind): Said {
  return shape === 'circle'
    ? say('ex.shapes.corners.none')
    : say('ex.shapes.corners.solution', { name: NAME[shape], n: CORNERS[shape] });
}

function corners({ shape, turn }: CornerFact, rng: Rng): Exercise {
  const ex: ShapeKind = shape === 'triangle' ? 'square' : 'triangle';
  return exercise({
    factId: `corners:${shape}:${turn}`,
    topicId: ID,
    level: 4,
    prompt: t('ex.shapes.corners.prompt'),
    display: '',
    spoken: say('ex.shapes.corners.prompt'),
    visual: one(item(shape, colorOf(turn / 15), 1, shape === 'circle' ? 0 : turn)),
    answer: CORNERS[shape],
    // 0, 3, 4 or 5 corners, three of them in order, the answer at any place.
    input: { type: 'choices', choices: windowChoices(rng, [0, 3, 4, 5], CORNERS[shape]) },
    // First what a corner is, then how to count them.
    hints: [
      hint(say('ex.shapes.corners.hint2')),
      hint(say('ex.shapes.corners.hint1')),
      pictureExample(cornersSaid(ex), one(item(ex, 'yellow'))),
    ],
    solution: cornersSaid(shape),
  });
}

/* ---------- Level 5: biggest, smallest ---------- */

const SIZES = [
  { size: 1, label: 'גדול' },
  { size: 0.7, label: 'בינוני' },
  { size: 0.42, label: 'קטן' },
];

type SizeFact = { shape: ShapeKind; ask: 'big' | 'small' };

function size({ shape, ask }: SizeFact, rng: Rng): Exercise {
  const items = SIZES.map(
    (s, i) => [item(shape, colorOf(i), s.size), s.label] as [ShapeItem, string],
  );
  const [right, ...wrong] = ask === 'big' ? items : [items[2], items[0], items[1]];
  const name = NAME[shape];
  const ex: ShapeKind = shape === 'circle' ? 'square' : 'circle';
  return pickExercise(
    5,
    `size:${shape}:${ask}`,
    say(ask === 'big' ? 'ex.shapes.biggest' : 'ex.shapes.smallest', { name }),
    shuffled(
      rng,
      (right as [ShapeItem, string])[0],
      (right as [ShapeItem, string])[1],
      wrong as [ShapeItem, string][],
    ),
    [
      hint(say('ex.shapes.size.hint1')),
      hint(say(ask === 'big' ? 'ex.shapes.size.hintBig' : 'ex.shapes.size.hintSmall')),
      pictureExample(
        say('ex.shapes.size.example', { name: NAME[ex] }),
        row(SIZES.map((s) => item(ex, 'green', s.size))),
      ),
    ],
    say(ask === 'big' ? 'ex.shapes.size.solutionBig' : 'ex.shapes.size.solutionSmall'),
  );
}

/* ---------- Level 6: longest, shortest ---------- */

const TRIPLES = [
  [1, 3, 5],
  [2, 3, 5],
  [1, 2, 4],
  [2, 4, 5],
  [3, 4, 5],
  [1, 4, 5],
];

type PencilFact = { lengths: number[]; ask: 'long' | 'short' };

function pencils({ lengths, ask }: PencilFact, rng: Rng): Exercise {
  const [s, m, l] = lengths as [number, number, number];
  const labelled: [number, string][] = [
    [l, 'ארוך'],
    [m, 'בינוני'],
    [s, 'קצר'],
  ];
  const order = shuffle(rng, labelled);
  const want = ask === 'long' ? l : s;
  return exercise({
    factId: `pencils:${lengths.join(',')}:${ask}`,
    topicId: ID,
    level: 6,
    prompt: t(ask === 'long' ? 'ex.pencils.longest' : 'ex.pencils.shortest'),
    display: '',
    spoken: say(ask === 'long' ? 'ex.pencils.longest' : 'ex.pencils.shortest'),
    answer: order.findIndex(([len]) => len === want),
    input: pictureChoices(
      order.map(([, label]) => label),
      order.map(([len]) => ({ type: 'pencils', lengths: [len] })),
    ),
    hints: [
      hint(say('ex.pencils.hint1')),
      hint(say(ask === 'long' ? 'ex.pencils.hintLong' : 'ex.pencils.hintShort')),
      pictureExample(say(ask === 'long' ? 'ex.pencils.example' : 'ex.pencils.exampleShort'), {
        type: 'pencils',
        lengths: [1, 5, 3],
      }),
    ],
    solution: say(ask === 'long' ? 'ex.pencils.solutionLong' : 'ex.pencils.solutionShort'),
  });
}

/* ---------- Levels 7–9: patterns ---------- */

const PATTERNS = ['AB', 'AAB', 'ABB', 'ABC'] as const;
type Pattern = (typeof PATTERNS)[number];

/** A pattern drawn from `units` (two or three things), long enough to see it repeat twice. */
function sequence(pattern: Pattern, length: number): number[] {
  const unit = [...pattern].map((c) => c.charCodeAt(0) - 65);
  return Array.from({ length }, (_, i) => unit[i % unit.length] as number);
}

type PatternFact = {
  pattern: Pattern;
  /** Colours (level 7) or shapes (level 8) for A, B, C. */
  things: string[];
  kind: 'color' | 'shape';
  /** Where the gap is: the end (what comes next) or a place in the middle. */
  gap: 'end' | number;
};

function thingItem(kind: 'color' | 'shape', thing: string): ShapeItem {
  return kind === 'color'
    ? item('circle', thing as ShapeColor, 0.85)
    : item(thing as ShapeKind, PATTERN_SHAPE_COLOR, 0.85);
}

function thingName(kind: 'color' | 'shape', thing: string): string {
  return kind === 'color' ? `עיגול ${COLOR_NAME[thing as ShapeColor]}` : NAME[thing as ShapeKind];
}

function patternFacts(kind: 'color' | 'shape', gaps: ('end' | number)[]) {
  const pool = kind === 'color' ? COLORS : ALL;
  return (): PatternFact[] =>
    PATTERNS.flatMap((pattern) => {
      const n = new Set(pattern).size;
      const picks: string[][] = [];
      for (const a of pool)
        for (const b of pool)
          for (const c of pool) {
            const tuple = [a, b, c].slice(0, n);
            if (new Set(tuple).size === n && !picks.some((p) => p.join() === tuple.join()))
              picks.push(tuple);
          }
      // A handful of colourings per pattern is plenty, and keeps the recordings few.
      return picks
        .filter((_, i) => i % 3 === 0)
        .flatMap((things) => gaps.map((gap) => ({ pattern, things, kind, gap })));
    });
}

function patternExercise(level: number) {
  return ({ pattern, things, kind, gap }: PatternFact, rng: Rng): Exercise => {
    const length = 6;
    const seq = sequence(pattern, gap === 'end' ? length + 1 : length);
    const at = gap === 'end' ? length : gap;
    const right = seq[at] as number;
    const shown = seq
      .slice(0, length)
      .map((k, i) => (i === at ? null : thingItem(kind, things[k] as string)));
    if (gap === 'end') shown.push(null);
    // The choices: everything in the pattern, plus one thing that is not in it.
    const pool = kind === 'color' ? COLORS : ALL;
    const extra = pool.find((p) => !things.includes(p)) as string;
    const choices = [...things, extra].slice(0, 3);
    if (!choices.includes(things[right] as string)) choices[2] = things[right] as string;
    const rightThing = things[right] as string;
    const pick = shuffled(
      rng,
      thingItem(kind, rightThing),
      thingName(kind, rightThing),
      choices
        .filter((c) => c !== rightThing)
        .map((c): [ShapeItem, string] => [thingItem(kind, c), thingName(kind, c)]),
    );
    const said = (thing: string) =>
      kind === 'color' ? COLOR_NAME[thing as ShapeColor] : NAME[thing as ShapeKind];
    const sayIt = seq
      .slice(0, length)
      .map((k, i) => (i === at ? 'מה?' : said(things[k] as string)))
      .join(', ');
    // One repeat of the pattern (AB, AAB, ABB or ABC); the second one when the gap is in the first.
    const unit = pattern.length;
    const unitFrom = at < unit ? unit : 0;
    return pickExercise(
      level,
      `pattern${level}:${pattern}:${things.join(',')}:${gap}`,
      say(gap === 'end' ? 'ex.pattern.next' : 'ex.pattern.missing.model'),
      pick,
      [
        hint(say('ex.pattern.sayIt.model', { seq: gap === 'end' ? `${sayIt}...` : sayIt })),
        // The part that repeats, drawn once.
        hint(say('ex.pattern.hint2'), {
          visual: row(
            seq.slice(unitFrom, unitFrom + unit).map((k) => thingItem(kind, things[k] as string)),
          ),
        }),
        patternExample(kind, pattern, rightThing),
      ],
      say(gap === 'end' ? 'ex.pattern.solutionNext' : 'ex.pattern.solutionMissing', {
        thing: thingName(kind, rightThing),
      }),
      row(shown),
    );
  };
}

/**
 * Hint 3: a pattern solved, of another kind (AB for the others, ABC for AB) and
 * in things whose answer is not this one's: "blue, green, blue, green, blue, what?
 * Blue and green repeat, so now comes green."
 */
function patternExample(kind: 'color' | 'shape', pattern: Pattern, avoid: string): Hint {
  const exPattern: Pattern = pattern === 'AB' ? 'ABC' : 'AB';
  const size = exPattern.length;
  const pool: string[] = (kind === 'color' ? COLORS : ALL).filter((p) => p !== avoid);
  const things = pool.slice(0, size);
  const seq = sequence(exPattern, 6).map((k) => things[k] as string);
  const said = (thing: string) =>
    kind === 'color' ? COLOR_NAME[thing as ShapeColor] : NAME[thing as ShapeKind];
  const names = things.map(said);
  const unit = `${names.slice(0, -1).join(', ')} ו${names.at(-1) ?? ''}`;
  return pictureExample(
    say('ex.pattern.exampleSolved', {
      seq: seq.slice(0, 5).map(said).join(', '),
      unit,
      next: thingName(kind, seq[5] as string),
    }),
    row(seq.map((thing) => thingItem(kind, thing))),
  );
}

/* ---------- Level 10: how many triangles? ---------- */

type CountFact = { target: ShapeKind; n: number };

function scene(target: ShapeKind, n: number, seed: number): ShapeItem[] {
  const rng = seededRng(seed);
  const others = ALL.filter((s) => s !== target);
  const items = [
    ...Array.from({ length: n }, (_, i) =>
      item(target, colorOf(i + seed), 0.55 + (i % 3) * 0.15, (i * 40) % 90),
    ),
    ...Array.from({ length: 9 - n }, (_, i) =>
      item(
        others[i % others.length] as ShapeKind,
        colorOf(i + 1),
        0.5 + (i % 2) * 0.25,
        (i * 25) % 60,
      ),
    ),
  ];
  return shuffle(rng, items);
}

function countShapes({ target, n }: CountFact, rng: Rng): Exercise {
  const noun = NOUN[target];
  // Not this exercise's number: "three squares" would answer "how many circles?" with three.
  const exN = n === 3 ? 4 : 3;
  const ex: CountFact =
    target === 'circle' ? { target: 'square', n: exN } : { target: 'circle', n: exN };
  const choices = windowChoices(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], n);
  return exercise({
    factId: `count:${target}:${n}`,
    topicId: ID,
    level: 10,
    prompt: shown(say('ex.shapes.count.prompt', { names: noun.plural })),
    display: '',
    spoken: say('ex.shapes.count.prompt', { names: noun.plural }),
    visual: row(scene(target, n, n * 7 + ALL.indexOf(target))),
    answer: n,
    input: { type: 'choices', choices },
    hints: [
      hint(say('ex.shapes.count.hint1', { names: noun.plural })),
      hint(say('ex.shapes.count.hint2')),
      pictureExample(
        say('ex.shapes.count.solution', { n: { n: ex.n, noun: NOUN[ex.target] } }),
        row(scene(ex.target, ex.n, 99)),
      ),
    ],
    solution: say('ex.shapes.count.solution', { n: { n, noun } }),
    diagnose: (v) => (Math.abs(v - n) === 1 ? 'offByOne' : null),
  });
}

export const shapesTopic = defineTopic({
  id: ID,
  labelKey: 'topic.shapes.patterns',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      whereFacts(BASIC, (t) => [BASIC.filter((s) => s !== t)]),
      where(1),
    ),
    closed(
      L(2),
      // A square is also a rectangle: "where is the rectangle?" never offers a square,
      // so there is one right answer; "where is the square?" sets it against a long rectangle.
      whereFacts(['square', 'rectangle'], (t) =>
        t === 'square'
          ? [
              ['rectangle', 'circle'],
              ['rectangle', 'triangle'],
            ]
          : [
              ['circle', 'triangle'],
              ['triangle', 'circle'],
            ],
      ),
      where(2),
    ),
    closed(L(3), () => ALL.flatMap((target) => [30, 90].map((turn) => ({ target, turn }))), same),
    closed(
      L(4),
      () => ALL.flatMap((shape) => [0, 30].map((turn) => ({ shape, turn }))),
      (f: CornerFact, rng) => corners(f, rng),
    ),
    closed(
      L(5),
      () => ALL.flatMap((shape) => (['big', 'small'] as const).map((ask) => ({ shape, ask }))),
      size,
    ),
    closed(
      L(6),
      () =>
        TRIPLES.flatMap((lengths) => (['long', 'short'] as const).map((ask) => ({ lengths, ask }))),
      pencils,
    ),
    // "דגם", the curriculum's word, in the labels of the pattern levels.
    closed('level.shapes.colorPattern', patternFacts('color', ['end']), patternExercise(7)),
    closed('level.shapes.shapePattern', patternFacts('shape', ['end']), patternExercise(8)),
    closed(
      'level.shapes.missingInPattern',
      () => [...patternFacts('color', [2, 3])(), ...patternFacts('shape', [2, 4])()],
      patternExercise(9),
    ),
    closed(
      L(10),
      () =>
        (['triangle', 'circle', 'square'] as ShapeKind[]).flatMap((target) =>
          [2, 3, 4, 5, 6].map((n) => ({ target, n })),
        ),
      (f: CountFact, rng) => countShapes(f, rng),
    ),
  ],
});
