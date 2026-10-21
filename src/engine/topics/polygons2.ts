import { t, type TranslationKey } from '@/i18n';
import { shown, type Slot } from '@/lang/compose';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  pictureChoices,
  pictureExample,
  range,
  say,
  windowChoices,
} from '../build';
import { pick, randInt, shuffle } from '../rng';
import type { Exercise, FigurePart, Rng, Visual } from '../types';
import { poly, SIDES, type Name } from './polygons';

/**
 * World "מצולעים, זוויות ומדידה", grade 2: the right angle, how many right
 * angles, which angle is right, all sides equal, the perimeter by adding the
 * sides (levels 1–5, open; until grade 2 got its own world they were stations
 * 6–10 of "מצולעים"); measuring with a ruler in centimetres, area by counting
 * squares, perimeter on squared paper, which area is larger, and short
 * perimeter and area problems (levels 6–10, closed: every sentence is recorded
 * whole).
 */

const ID = 'polygons-2';
const L = (n: number) => `level.polygons2.${n}`;
/** A text of the new levels. */
const K = (k: string) => `ex.poly2.${k}` as TranslationKey;

/** Level 1: is this a right angle? */
function isRight(rng: Rng): Exercise {
  const yes = rng() < 0.5;
  const deg = yes ? 90 : pick(rng, [35, 50, 60, 120, 135, 150]);
  const turn = pick(rng, [0, 20, 45, 70]);
  return exercise({
    factId: `pright:${deg}:${turn}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.poly.right.prompt'),
    display: '',
    spoken: say('ex.poly.right.prompt'),
    visual: { type: 'angle', deg, turn },
    answer: yes ? 1 : 0,
    input: labelledChoices([t('ex.div.no'), t('ex.div.yes')]),
    hints: [
      hint(say('ex.poly.right.hint1')),
      hint(say('ex.poly.right.hint2')),
      pictureExample(say(yes ? 'ex.poly.right.exampleNo' : 'ex.poly.right.exampleYes'), {
        type: 'angle',
        deg: yes ? 50 : 90,
      }),
    ],
    solution: say(yes ? 'ex.poly.right.yes' : 'ex.poly.right.no'),
  });
}

const RIGHTS: [Name, number][] = [
  ['square', 4],
  ['rectangle', 4],
  ['rightTri', 1],
  ['trapezoid', 2],
  ['triangle', 0],
  ['parallelogram', 0],
  ['pentagon', 0],
];

/** Level 2: how many right angles in the shape? (The trapezoid here has two.) */
function rightAngles(rng: Rng): Exercise {
  const [shape, n] = pick(rng, RIGHTS);
  return exercise({
    factId: `prights:${shape}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.angles.rights.prompt'),
    display: '',
    spoken: say('ex.angles.rights.prompt'),
    visual: poly(shape),
    answer: n,
    input: { type: 'choices', choices: shuffle(rng, windowChoices(rng, [0, 1, 2, 3, 4, 5], n)) },
    hints: [
      hint(say('ex.poly.rights.hint1')),
      hint(say('ex.poly.right.hint2')),
      // Never this shape's answer: a square (four) for the others, the trapezoid (two) for four.
      n === 4
        ? pictureExample(
            say('ex.poly.rights.exampleTwo'),
            poly('trapezoid', { rightAngles: [0, 3] }),
          )
        : pictureExample(
            say('ex.poly.rights.example'),
            poly('square', { rightAngles: [0, 1, 2, 3] }),
          ),
    ],
    solution:
      n === 0
        ? say('ex.poly.rights.solution0')
        : n === 1
          ? say('ex.poly.rights.solution1')
          : say('ex.poly.rights.solution', { n }),
  });
}

/** Level 3: which of three angles is the right one? */
function whichRight(rng: Rng): Exercise {
  const degs = shuffle(rng, [90, pick(rng, [40, 55, 65]), pick(rng, [115, 130, 150])]);
  return exercise({
    factId: `pwhich:${degs.join(',')}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.poly.whichRight.prompt'),
    display: '',
    spoken: say('ex.poly.whichRight.prompt'),
    answer: degs.indexOf(90),
    input: pictureChoices(
      degs.map((d) =>
        d === 90
          ? t('ex.poly.angleRight')
          : d < 90
            ? t('ex.poly.angleSmall')
            : t('ex.poly.angleBig'),
      ),
      degs.map((d): Visual => ({ type: 'angle', deg: d, turn: 0 })),
    ),
    hints: [
      hint(say('ex.poly.right.hint1')),
      hint(say('ex.poly.right.hint2')),
      hint(say('ex.poly.whichRight.hint3')),
    ],
    solution: say('ex.poly.right.yes'),
  });
}

/** Level 4: which shape has all its sides equal? */
function allEqual(rng: Rng): Exercise {
  const right: Name = pick(rng, ['square', 'triangle']);
  const rightVisual =
    right === 'square'
      ? poly('square', { ticks: [1, 1, 1, 1] })
      : ({
          type: 'polygon',
          points: [
            [10, 88],
            [90, 88],
            [50, 18],
          ],
          ticks: [1, 1, 1],
        } as Visual);
  const wrong: Visual[] = [poly('rectangle', { ticks: [1, 2, 1, 2] }), poly('rightTri')];
  const order = shuffle(rng, [0, 1, 2]);
  const visuals = [rightVisual, ...wrong];
  const names = [right === 'square' ? 'ריבוע' : 'משולש שווה צלעות', 'מלבן', 'משולש ישר זווית'];
  return exercise({
    factId: `pequal:${right}:${order.join('')}`,
    topicId: ID,
    level: 4,
    prompt: t('ex.poly.equal.prompt'),
    display: '',
    spoken: say('ex.poly.equal.prompt'),
    answer: order.indexOf(0),
    input: pictureChoices(
      order.map((i) => names[i] as string),
      order.map((i) => visuals[i] as Visual),
    ),
    hints: [
      hint(say('ex.poly.equal.hint1')),
      hint(say('ex.poly.equal.hint2')),
      // A rhombus, which is never one of the choices: the same mark on every side.
      pictureExample(say('ex.poly.equal.example'), {
        type: 'polygon',
        points: [
          [50, 8],
          [90, 50],
          [50, 92],
          [10, 50],
        ],
        ticks: [1, 1, 1, 1],
      }),
    ],
    solution: say('ex.poly.equal.solution', { name: names[0] as string }),
  });
}

/** Level 5: the perimeter, by adding the sides. */
function perimeter(rng: Rng): Exercise {
  const shape = pick(rng, ['triangle', 'rectangle', 'square', 'pentagon', 'quad'] as Name[]);
  const n = SIDES[shape];
  const sides =
    shape === 'square'
      ? (() => {
          const a = randInt(rng, 2, 9);
          return [a, a, a, a];
        })()
      : shape === 'rectangle'
        ? (() => {
            const a = randInt(rng, 3, 9);
            const b = randInt(rng, 2, a - 1);
            return [a, b, a, b];
          })()
        : Array.from({ length: n }, () => randInt(rng, 2, 9));
  const total = sides.reduce((s, x) => s + x, 0);
  return exercise({
    factId: `pperim:${shape}:${sides.join(',')}`,
    topicId: ID,
    level: 5,
    prompt: t('ex.poly.perim.prompt'),
    display: '',
    spoken: say('ex.poly.perim.prompt'),
    visual: poly(shape, { sideLabels: sides.map((x) => `${x} ס״מ`) }),
    answer: total,
    operation: 'add',
    input: numpad(2),
    hints: [
      hint(say('ex.poly.perim.hint1')),
      hint(say('ex.poly.perim.hint2'), {
        example: { display: `${sides.join(' + ')} = ?`, spoken: say('ex.poly.perim.hint2') },
      }),
      exampleAvoiding(total, [
        {
          answer: 12,
          hint: () =>
            exampleHint(
              '3 + 4 + 5 = 12',
              say('ex.poly.perim.solution', { r: { n: 12, noun: CM } }),
            ),
        },
        {
          answer: 14,
          hint: () =>
            exampleHint(
              '5 + 2 + 5 + 2 = 14',
              say('ex.poly.perim.solution', { r: { n: 14, noun: CM } }),
            ),
        },
      ]),
    ],
    solution: say('ex.poly.perim.solution', { r: { n: total, noun: CM } }),
    // Forgot a side (the classic slip with rectangles: only two sides added).
    diagnose: (v) => (sides.some((x) => v === total - x) || v === total / 2 ? 'other' : null),
  });
}

const CM = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' } as const;

const SQUARE_UNIT: Noun = { singular: 'משבצת', plural: 'משבצות', gender: 'f' };
const UNIT: Noun = { singular: 'יחידה', plural: 'יחידות', gender: 'f' };
const METER: Noun = { singular: 'מטר', plural: 'מטרים', gender: 'm' };
const TILE: Noun = { singular: 'מרצפת', plural: 'מרצפות', gender: 'f' };
const ROW: Noun = { singular: 'שורה', plural: 'שורות', gender: 'f' };

/* ---------- Level 6: measuring with a ruler ---------- */

const RULER = 12;
type RulerFact = { from: number; len: number };

/** From the zero mark, and (harder) from one or two: then the end mark is not the length. */
const rulerFacts = (): RulerFact[] => [
  ...range(2, 10).map((len) => ({ from: 0, len })),
  ...range(3, 9).map((len) => ({ from: 1, len })),
  ...range(3, 8).map((len) => ({ from: 2, len })),
];

function ruler(f: RulerFact): Exercise {
  const to = f.from + f.len;
  const exLen = f.len === 5 ? 4 : 5;
  const exFrom = f.from === 1 ? 2 : 1;
  return exercise({
    factId: `p2ruler:${f.from}:${f.len}`,
    topicId: ID,
    level: 6,
    prompt: t(K('ruler.prompt')),
    display: '',
    spoken: say(K('ruler.prompt')),
    visual: { type: 'ruler', from: f.from, to, length: RULER },
    answer: f.len,
    input: numpad(2),
    hints: [
      hint(say(K('ruler.hint1'))),
      hint(say(K('ruler.hint2'))),
      pictureExample(
        say(K('ruler.example'), { a: exFrom, b: exFrom + exLen, r: { n: exLen, noun: CM } }),
        { type: 'ruler', from: exFrom, to: exFrom + exLen, length: RULER },
      ),
    ],
    solution:
      f.from === 0
        ? say(K('ruler.solution0'), { r: { n: f.len, noun: CM } })
        : say(K('ruler.solution'), { a: f.from, b: to, r: { n: f.len, noun: CM } }),
    advice: f.from > 0 ? [{ value: to, say: say(K('ruler.advice'), { a: f.from }) }] : [],
  });
}

/* ---------- Shapes on squared paper (levels 7–9) ---------- */

/** Shapes drawn row by row, "#" a square. */
const AREA_SHAPES: string[][] = [
  ['###', '###'],
  ['####'],
  ['#..', '#..', '###'],
  ['###', '.#.', '.#.'],
  ['.#.', '###', '.#.'],
  ['####', '####'],
  ['##..', '####', '##..'],
  ['###', '###', '###'],
  ['#...', '##..', '###.', '####'],
  ['####', '#..#', '####'],
  ['#####', '#####'],
  ['.##.', '####', '####', '.##.'],
  ['###', '#.#', '###'],
  ['#.#', '###'],
  ['.###', '###.'],
  ['#####', '#...#'],
  ['##', '##', '##', '##'],
  ['#.', '##', '##', '#.'],
];

const PERIMETER_SHAPES: string[][] = [
  ['##'],
  ['###'],
  ['##', '##'],
  ['###', '###'],
  ['####'],
  ['#.', '##'],
  ['#..', '###'],
  ['##.', '###'],
  ['####', '####'],
  ['###', '###', '###'],
  ['#...', '####'],
  ['#..', '#..', '###'],
  ['.#.', '###'],
  ['#####'],
  ['##', '##', '##'],
  ['###', '#..', '#..'],
];

type Cells = [number, number][];
const cellsOf = (rows: string[]): Cells =>
  rows.flatMap((row, y) =>
    [...row].flatMap((c, x) => (c === '#' ? [[x, y] as [number, number]] : [])),
  );
const areaOf = (rows: string[]) => cellsOf(rows).length;

/** Unit sides on the outline: each square's sides that no other square shares. */
function perimeterOf(rows: string[]): number {
  const on = (x: number, y: number) => rows[y]?.[x] === '#';
  return cellsOf(rows).reduce(
    (s, [x, y]) =>
      s + [on(x - 1, y), on(x + 1, y), on(x, y - 1), on(x, y + 1)].filter((b) => !b).length,
    0,
  );
}

const width = (rows: string[]) => Math.max(...rows.map((r) => r.length));

/** The shape's outline, as one path of unit sides (each side its own short line). */
function outlinePath(rows: string[], dx: number, dy: number): string {
  const on = (x: number, y: number) => rows[y]?.[x] === '#';
  const segs: string[] = [];
  for (const [x, y] of cellsOf(rows)) {
    const X = x + dx;
    const Y = y + dy;
    if (!on(x, y - 1)) segs.push(`M${X} ${Y} L${X + 1} ${Y}`);
    if (!on(x, y + 1)) segs.push(`M${X} ${Y + 1} L${X + 1} ${Y + 1}`);
    if (!on(x - 1, y)) segs.push(`M${X} ${Y} L${X} ${Y + 1}`);
    if (!on(x + 1, y)) segs.push(`M${X + 1} ${Y} L${X + 1} ${Y + 1}`);
  }
  return segs.join(' ');
}

/**
 * Shapes on squared paper, a square of margin around them. `rowColours`: every
 * other row in another colour (counting row by row); `outline`: the outline drawn
 * thick (counting the sides around).
 */
function paperPicture(
  shapes: string[][],
  o: { rowColours?: boolean; outline?: boolean; size?: { w: number; h: number } } = {},
): Visual {
  const parts: FigurePart[] = [];
  // Centred on paper at least `size` big: two shapes compared on the same paper, at one scale.
  const cw = shapes.reduce((s, r) => s + width(r), 0) + 2 * (shapes.length - 1);
  const ch = Math.max(...shapes.map((r) => r.length));
  const w = Math.max(o.size?.w ?? 0, cw + 2);
  const h = Math.max(o.size?.h ?? 0, ch + 2);
  let x0 = Math.floor((w - cw) / 2);
  for (const rows of shapes) {
    const y0 = Math.floor((h - rows.length) / 2);
    for (const [x, y] of cellsOf(rows))
      parts.push({
        d: `M${x + x0} ${y + y0} h1 v1 h-1 Z`,
        color: o.rowColours && y % 2 === 1 ? 'yellow' : 'blue',
      });
    if (o.outline) parts.push({ d: outlinePath(rows, x0, y0), line: true, color: 'red' });
    x0 += width(rows) + 2;
  }
  return { type: 'figure', w, h, parts, paper: true };
}

/* ---------- Level 7: area by counting squares ---------- */

/** The worked example: a shape not in the level, with an area of its own. */
const AREA_EXAMPLES: string[][] = [
  ['##', '##', '#.'],
  ['###', '###', '##.'],
];

function area(rows: string[]): Exercise {
  const n = areaOf(rows);
  const ex = AREA_EXAMPLES.find((r) => areaOf(r) !== n) as string[];
  return exercise({
    factId: `p2area:${rows.join('/')}`,
    topicId: ID,
    level: 7,
    prompt: t(K('area.prompt')),
    display: '',
    spoken: say(K('area.prompt')),
    visual: paperPicture([rows]),
    answer: n,
    input: numpad(2),
    hints: [
      hint(say(K('area.hint1'))),
      hint(say(K('area.hint2')), { visual: paperPicture([rows], { rowColours: true }) }),
      pictureExample(
        say(K('area.solution'), { r: { n: areaOf(ex), noun: SQUARE_UNIT } }),
        paperPicture([ex], { rowColours: true }),
      ),
    ],
    solution: say(K('area.solution'), { r: { n, noun: SQUARE_UNIT } }),
  });
}

/* ---------- Level 8: perimeter on squared paper ---------- */

const PERIMETER_EXAMPLES: string[][] = [
  ['##', '#.'],
  ['####', '##..'],
];

function perimeterGrid(rows: string[]): Exercise {
  const n = perimeterOf(rows);
  const ex = PERIMETER_EXAMPLES.find((r) => perimeterOf(r) !== n) as string[];
  const cells = areaOf(rows);
  return exercise({
    factId: `p2pgrid:${rows.join('/')}`,
    topicId: ID,
    level: 8,
    prompt: t(K('pgrid.prompt')),
    display: '',
    spoken: say(K('pgrid.prompt')),
    visual: paperPicture([rows]),
    answer: n,
    input: numpad(2),
    hints: [
      hint(say(K('pgrid.hint1'))),
      hint(say(K('pgrid.hint2')), { visual: paperPicture([rows], { outline: true }) }),
      pictureExample(
        say(K('pgrid.solution'), { r: { n: perimeterOf(ex), noun: UNIT } }),
        paperPicture([ex], { outline: true }),
      ),
    ],
    solution: say(K('pgrid.solution'), { r: { n, noun: UNIT } }),
    // Counted the squares instead of the sides around them.
    advice: cells !== n ? [{ value: cells, say: say(K('pgrid.advice')) }] : [],
  });
}

/* ---------- Level 9: which area is larger (smaller)? ---------- */

/** Pairs of different areas; in several the larger area does not look larger. */
const AREA_PAIRS: [string[], string[]][] = [
  [['#####'], ['##', '##']],
  [['#####'], ['###', '###']],
  [['##', '##', '##'], ['####']],
  [
    ['#..', '#..', '###'],
    ['###', '###'],
  ],
  [
    ['.#.', '###', '.#.'],
    ['##', '##'],
  ],
  [
    ['#####', '#...#'],
    ['###', '###', '###'],
  ],
  [
    ['###', '#.#', '###'],
    ['#####', '#####'],
  ],
  [
    ['#.#', '###'],
    ['###', '###'],
  ],
  [
    ['####', '####'],
    ['#.', '##', '##', '#.'],
  ],
  [['.###', '###.'], ['#######']],
];

type CompareFact = { a: string[]; b: string[]; ask: 'more' | 'less' };

const compareFacts = (): CompareFact[] =>
  AREA_PAIRS.flatMap(([a, b]) => (['more', 'less'] as const).map((ask) => ({ a, b, ask })));

function compareAreas(f: CompareFact, rng: Rng): Exercise {
  const [na, nb] = [areaOf(f.a), areaOf(f.b)];
  const aWins = f.ask === 'more' ? na > nb : na < nb;
  const [win, lose] = aWins ? [na, nb] : [nb, na];
  const order = shuffle(rng, [f.a, f.b]);
  // One paper size for both, so the squares are the same size in both pictures.
  const size = {
    w: Math.max(width(f.a), width(f.b)) + 2,
    h: Math.max(f.a.length, f.b.length) + 2,
  };
  return exercise({
    factId: `p2cmp:${f.a.join('/')}:${f.b.join('/')}:${f.ask}`,
    topicId: ID,
    level: 9,
    prompt: t(K(`cmp.${f.ask}.prompt`)),
    display: '',
    spoken: say(K(`cmp.${f.ask}.prompt`)),
    answer: order.indexOf(aWins ? f.a : f.b),
    input: pictureChoices(
      order.map((r) => t(K('cmp.label'), { params: { n: areaOf(r) } })),
      order.map((r) => paperPicture([r], { size })),
    ),
    hints: [
      hint(say(K('cmp.hint1'))),
      hint(say(K('cmp.hint2'))),
      // Six in a row against nine in a square: never one of the pairs.
      pictureExample(say(K('cmp.example')), paperPicture([['######'], ['###', '###', '###']])),
    ],
    solution: say(K(`cmp.${f.ask}.solution`), {
      a: { n: win, noun: SQUARE_UNIT },
      b: { n: lose, noun: SQUARE_UNIT },
    }),
  });
}

/* ---------- Level 10: perimeter and area problems ---------- */

type Problem =
  | { kind: 'fence'; a: number; b: number }
  | { kind: 'frame'; a: number }
  | { kind: 'tiles'; rows: number; cols: number };

const problemFacts = (): Problem[] => [
  ...[
    [4, 2],
    [5, 3],
    [6, 2],
    [6, 4],
    [7, 3],
    [8, 5],
    [9, 4],
    [10, 6],
  ].map(([a, b]) => ({ kind: 'fence', a, b }) as Problem),
  ...range(3, 9).map((a): Problem => ({ kind: 'frame', a })),
  ...[
    [2, 3],
    [2, 5],
    [3, 3],
    [3, 4],
    [3, 5],
    [4, 4],
    [4, 5],
    [2, 6],
  ].map(([rows, cols]) => ({ kind: 'tiles', rows, cols }) as Problem),
];

const answerOf = (p: Problem) =>
  p.kind === 'fence' ? 2 * (p.a + p.b) : p.kind === 'frame' ? 4 * p.a : p.rows * p.cols;

function problem(p: Problem): Exercise {
  const answer = answerOf(p);
  const rect = (w: number, h: number, unit: string): Visual => ({
    type: 'polygon',
    points: [
      [0, 20],
      [100, 20],
      [100, 20 + (60 * h) / w],
      [0, 20 + (60 * h) / w],
    ],
    sideLabels: [`${w} ${unit}`, `${h} ${unit}`, null, null],
  });
  if (p.kind === 'tiles') {
    const tiles = say(K('prob.tiles.prompt'), {
      rows: { n: p.rows, noun: ROW },
      cols: { n: p.cols, noun: TILE },
    });
    const ex = p.rows === 2 && p.cols === 4 ? [3, 2] : [2, 4];
    return exercise({
      factId: `p2prob:tiles:${p.rows}x${p.cols}`,
      topicId: ID,
      level: 10,
      prompt: shown(tiles),
      display: '',
      spoken: tiles,
      visual: { type: 'grid', rows: p.rows, cols: p.cols },
      answer,
      input: numpad(2),
      hints: [
        hint(say(K('prob.tiles.hint1'))),
        hint(say(K('prob.tiles.hint2'), { cols: { n: p.cols, noun: TILE } })),
        exampleAvoiding(answer, [
          {
            answer: (ex[0] as number) * (ex[1] as number),
            hint: () =>
              exampleHint(
                `${ex[1]} + ${ex[1]}${ex[0] === 3 ? ` + ${ex[1]}` : ''} = ${(ex[0] as number) * (ex[1] as number)}`,
                say(K('prob.tiles.example'), {
                  rows: { n: ex[0] as number, noun: ROW },
                  cols: { n: ex[1] as number, noun: TILE },
                  r: { n: (ex[0] as number) * (ex[1] as number), noun: TILE },
                }),
              ),
          },
          {
            answer: 10,
            hint: () =>
              exampleHint(
                '5 + 5 = 10',
                say(K('prob.tiles.example'), {
                  rows: { n: 2, noun: ROW },
                  cols: { n: 5, noun: TILE },
                  r: { n: 10, noun: TILE },
                }),
              ),
          },
        ]),
      ],
      solution: say(K('prob.tiles.solution'), { r: { n: answer, noun: TILE } }),
      // Added a row and a column instead of counting all the tiles.
      advice:
        p.rows + p.cols !== answer
          ? [{ value: p.rows + p.cols, say: say(K('prob.tiles.advice')) }]
          : [],
    });
  }
  const isFence = p.kind === 'fence';
  const sides = isFence ? [p.a, p.b, p.a, p.b] : [p.a, p.a, p.a, p.a];
  const noun = isFence ? METER : CM;
  const key = isFence ? 'fence' : 'frame';
  const slots: Record<string, Slot> = isFence
    ? { a: { n: p.a, noun: METER }, b: { n: p.b, noun: METER } }
    : { a: { n: p.a, noun: CM } };
  const spoken = say(K(`prob.${key}.prompt`), slots);
  return exercise({
    factId: `p2prob:${key}:${sides.join(',')}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: isFence ? rect(p.a, p.b, 'מטר') : rect(p.a, p.a, 'ס״מ'),
    answer,
    operation: 'add',
    input: numpad(2),
    hints: [
      hint(say(K(`prob.${key}.hint1`))),
      hint(say(K('prob.hint2')), {
        example: { display: `${sides.join(' + ')} = ?`, spoken: say(K('prob.hint2')) },
      }),
      exampleAvoiding(answer, [
        {
          answer: 14,
          hint: () =>
            exampleHint(
              '5 + 2 + 5 + 2 = 14',
              say('ex.poly.perim.solution', { r: { n: 14, noun } }),
            ),
        },
        {
          answer: 16,
          hint: () =>
            exampleHint(
              '4 + 4 + 4 + 4 = 16',
              say('ex.poly.perim.solution', { r: { n: 16, noun } }),
            ),
        },
      ]),
    ],
    solution: say('ex.poly.perim.solution', { r: { n: answer, noun } }),
    // Two sides only (the length and the width once), or one side.
    advice: [
      { value: answer / 2, say: say(K('prob.adviceHalf')) },
      ...(isFence ? [] : [{ value: p.a, say: say(K('prob.adviceOne')) }]),
    ],
  });
}

export const polygons2 = defineTopic({
  id: ID,
  labelKey: 'topic.polygons2',
  grades: [2],
  startLevel: () => 1,
  levels: [
    open(L(1), isRight),
    open(L(2), rightAngles),
    open(L(3), whichRight),
    open(L(4), allEqual),
    open(L(5), perimeter),
    closed(L(6), rulerFacts, ruler),
    closed(L(7), () => AREA_SHAPES, area),
    closed(L(8), () => PERIMETER_SHAPES, perimeterGrid),
    closed(L(9), compareFacts, compareAreas),
    closed(L(10), problemFacts, problem),
  ],
});
