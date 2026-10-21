import { t, type TranslationKey } from '@/i18n';
import type { Gender } from '@/lang/gender';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exercise,
  hint,
  labelledChoices,
  open,
  pictureChoices,
  pictureExample,
  say,
  windowChoices,
} from '../build';
import { pick, shuffle } from '../rng';
import type { Exercise, FigurePart, Polygon, Rng, ShapeColor, Visual } from '../types';

/**
 * World "מצולעים", grade 1: sides and vertices, naming polygons, which has more
 * sides (levels 1–5, open); the square and the rectangle among quadrilaterals,
 * straight, curved and broken lines, counting the shapes in a picture, the half
 * that completes a symmetric shape, and which two shapes build a shape (levels
 * 6–10, closed: every sentence is recorded whole). Grade 2 goes on in its own
 * world, "מצולעים, זוויות ומדידה" (polygons2.ts).
 */

const ID = 'polygons';
const L = (n: number) => `level.polygons.${n}`;

type P = [number, number];
export type Name =
  | 'triangle'
  | 'square'
  | 'rectangle'
  | 'quad'
  | 'pentagon'
  | 'hexagon'
  | 'rightTri'
  | 'trapezoid'
  | 'parallelogram';

/** Shapes in a 100 × 100 box (y down). */
export const SHAPES: Record<Name, P[]> = {
  triangle: [
    [10, 88],
    [90, 88],
    [42, 12],
  ],
  square: [
    [15, 15],
    [85, 15],
    [85, 85],
    [15, 85],
  ],
  rectangle: [
    [4, 28],
    [96, 28],
    [96, 72],
    [4, 72],
  ],
  quad: [
    [12, 20],
    [80, 8],
    [92, 86],
    [24, 74],
  ],
  pentagon: [
    [50, 6],
    [93, 37],
    [77, 90],
    [23, 90],
    [7, 37],
  ],
  hexagon: [
    [27, 10],
    [73, 10],
    [96, 50],
    [73, 90],
    [27, 90],
    [4, 50],
  ],
  rightTri: [
    [12, 10],
    [12, 90],
    [88, 90],
  ],
  trapezoid: [
    [12, 20],
    [60, 20],
    [92, 82],
    [12, 82],
  ],
  parallelogram: [
    [30, 22],
    [96, 22],
    [70, 80],
    [4, 80],
  ],
};

export const poly = (name: Name, extra: Omit<Polygon, 'points'> = {}): Visual => ({
  type: 'polygon',
  points: SHAPES[name],
  ...extra,
});

export const SIDES: Record<Name, number> = {
  triangle: 3,
  rightTri: 3,
  square: 4,
  rectangle: 4,
  quad: 4,
  trapezoid: 4,
  parallelogram: 4,
  pentagon: 5,
  hexagon: 6,
};

/** The polygon's name by its number of sides. */
const NAME_BY_SIDES: Record<number, string> = { 3: 'משולש', 4: 'מרובע', 5: 'מחומש', 6: 'משושה' };

const MANY: Name[] = [
  'triangle',
  'rightTri',
  'square',
  'rectangle',
  'quad',
  'trapezoid',
  'pentagon',
  'hexagon',
];

/** Levels 1–2: how many sides, how many vertices. */
function count(level: 1 | 2) {
  return (rng: Rng): Exercise => {
    // The number of sides first, then a shape: four-sided shapes are most of MANY,
    // and the answer's button would mostly sit in the same place.
    const sides = pick(rng, [3, 4, 5, 6]);
    const name = pick(
      rng,
      MANY.filter((m) => SIDES[m] === sides),
    );
    const n = SIDES[name];
    const key = level === 1 ? 'ex.poly.sides' : 'ex.poly.vertices';
    const ex: Name = n === 5 ? 'hexagon' : 'pentagon';
    return exercise({
      factId: `${key}:${name}`,
      topicId: ID,
      level,
      prompt: t(`${key}.prompt`),
      display: '',
      spoken: say(`${key}.prompt`),
      visual: poly(name),
      answer: n,
      input: { type: 'choices', choices: windowChoices(rng, [2, 3, 4, 5, 6, 7, 8], n) },
      hints: [
        hint(say(`${key}.hint1`)),
        hint(say('ex.poly.hint2')),
        pictureExample(say(`${key}.example`, { n: SIDES[ex] }), poly(ex)),
      ],
      solution: say(`${key}.solution`, { n }),
    });
  };
}

/** Level 3: the polygon's name (משולש, מרובע, מחומש, משושה). */
function name(rng: Rng): Exercise {
  const shape = pick(rng, MANY);
  const n = SIDES[shape];
  const labels = shuffle(
    rng,
    [3, 4, 5, 6].map((k) => NAME_BY_SIDES[k] as string),
  );
  const right = NAME_BY_SIDES[n] as string;
  return exercise({
    factId: `pname:${shape}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.poly.name.prompt'),
    display: '',
    spoken: say('ex.poly.name.prompt'),
    visual: poly(shape),
    answer: labels.indexOf(right),
    input: labelledChoices(labels, true),
    hints: [
      hint(say('ex.poly.name.hint1')),
      hint(say('ex.poly.name.hint2')),
      pictureExample(
        say(n === 5 ? 'ex.poly.name.exampleHex' : 'ex.poly.name.examplePent'),
        poly(n === 5 ? 'hexagon' : 'pentagon'),
      ),
    ],
    solution: say('ex.poly.name.solution', { name: right }),
  });
}

/** Level 4: where is the quadrilateral / triangle / pentagon? Three pictures. */
function where(rng: Rng): Exercise {
  const want = pick(rng, [3, 4, 5, 6]);
  const pickOf = (k: number) =>
    pick(
      rng,
      MANY.filter((s) => SIDES[s] === k),
    );
  const others = shuffle(
    rng,
    [3, 4, 5, 6].filter((k) => k !== want),
  ).slice(0, 2);
  const shapes = shuffle(rng, [want, ...others]).map((k) => ({ k, s: pickOf(k) }));
  const wanted = NAME_BY_SIDES[want] as string;
  return exercise({
    factId: `pwhere:${want}:${shapes.map((x) => x.s).join(',')}`,
    topicId: ID,
    level: 4,
    prompt: t('ex.poly.where.prompt', { params: { name: wanted } }),
    display: '',
    spoken: say('ex.poly.where.prompt', { name: wanted }),
    answer: shapes.findIndex((x) => x.k === want),
    input: pictureChoices(
      shapes.map((x) => NAME_BY_SIDES[x.k] as string),
      shapes.map((x) => poly(x.s)),
    ),
    hints: [
      hint(say('ex.poly.where.hint1', { name: wanted, n: want })),
      hint(say('ex.poly.hint2')),
      pictureExample(say('ex.poly.name.examplePent'), poly('pentagon')),
    ],
    solution: say('ex.poly.name.solution', { name: wanted }),
  });
}

/** Level 5: which of two has more sides? */
function moreSides(rng: Rng): Exercise {
  const [a, b] = shuffle(rng, [3, 4, 5, 6]).slice(0, 2) as [number, number];
  const sa = pick(
    rng,
    MANY.filter((s) => SIDES[s] === a),
  );
  const sb = pick(
    rng,
    MANY.filter((s) => SIDES[s] === b),
  );
  return exercise({
    factId: `pmore:${sa},${sb}`,
    topicId: ID,
    level: 5,
    prompt: t('ex.poly.more.prompt'),
    display: '',
    spoken: say('ex.poly.more.prompt'),
    answer: a > b ? 0 : 1,
    input: pictureChoices(
      [NAME_BY_SIDES[a] as string, NAME_BY_SIDES[b] as string],
      [poly(sa), poly(sb)],
    ),
    hints: [
      hint(say('ex.poly.sides.hint1')),
      hint(say('ex.poly.more.hint2')),
      hint(say('ex.poly.more.hint3')),
    ],
    solution: say('ex.poly.more.solution', { name: NAME_BY_SIDES[Math.max(a, b)] as string }),
  });
}

/** A text of the new grade 1 levels. */
const K = (k: string) => `ex.poly1.${k}` as TranslationKey;

/** An SVG path through these points, closed. */
export const pathOf = (pts: readonly P[]): string =>
  `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;

const circlePath = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

const rectPath = (x1: number, y1: number, x2: number, y2: number): string =>
  pathOf([
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
  ]);

/* ---------- Level 6: the square and the rectangle among quadrilaterals ---------- */

const TALL_RECT: P[] = [
  [30, 4],
  [70, 4],
  [70, 96],
  [30, 96],
];
const RHOMBUS: P[] = [
  [50, 6],
  [86, 50],
  [50, 94],
  [14, 50],
];
const OTHER_QUADS = ['quad', 'trapezoid', 'parallelogram', 'rhombus'] as const;
type OtherQuad = (typeof OTHER_QUADS)[number];
const quadPicture = (q: OtherQuad): Visual =>
  q === 'rhombus' ? { type: 'polygon', points: RHOMBUS } : poly(q);

type QuadFact = { want: 'square' | 'rectangle'; other: OtherQuad; tall: boolean };

const quadFacts = (): QuadFact[] =>
  (['square', 'rectangle'] as const).flatMap((want) =>
    OTHER_QUADS.flatMap((other) => [false, true].map((tall) => ({ want, other, tall }))),
  );

function squareRect(f: QuadFact, rng: Rng): Exercise {
  const rect: Visual = f.tall ? { type: 'polygon', points: TALL_RECT } : poly('rectangle');
  const items = shuffle(rng, [
    { k: 'square', v: poly('square'), label: 'ריבוע' },
    { k: 'rectangle', v: rect, label: 'מלבן' },
    { k: 'other', v: quadPicture(f.other), label: 'מרובע' },
  ]);
  const wanted = f.want === 'square' ? 'ריבוע' : 'מלבן';
  return exercise({
    factId: `p1quad:${f.want}:${f.other}:${f.tall ? 'tall' : 'wide'}`,
    topicId: ID,
    level: 6,
    prompt: t('ex.poly.where.prompt', { params: { name: wanted } }),
    display: '',
    spoken: say('ex.poly.where.prompt', { name: wanted }),
    answer: items.findIndex((x) => x.k === f.want),
    input: pictureChoices(
      items.map((x) => x.label),
      items.map((x) => x.v),
    ),
    hints: [
      hint(say(K(`quad.${f.want}.hint1`))),
      hint(say(K('quad.hint2'))),
      // The other of the two, named: never the shape asked for.
      f.want === 'square'
        ? pictureExample(
            say(K('quad.rectangle.example')),
            poly('rectangle', { ticks: [1, 2, 1, 2] }),
          )
        : pictureExample(say(K('quad.square.example')), poly('square', { ticks: [1, 1, 1, 1] })),
    ],
    solution: say('ex.poly.name.solution', { name: wanted }),
  });
}

/* ---------- Level 7: straight, curved and broken lines ---------- */

const LINE_KINDS = ['straight', 'curved', 'broken'] as const;
type LineKind = (typeof LINE_KINDS)[number];

/** Four drawings of each kind of line, in a 100 × 60 box. */
const LINES: Record<LineKind, string[]> = {
  straight: ['M8 30 L92 30', 'M12 54 L88 6', 'M8 44 L92 18', 'M14 8 L86 52'],
  curved: [
    'M8 44 C28 0 60 70 92 16',
    'M8 52 Q50 -16 92 52',
    'M6 30 Q22 4 38 30 T70 30 T94 22',
    'M10 10 C10 60 60 60 90 34',
  ],
  broken: [
    'M8 50 L34 10 L60 50 L90 12',
    'M8 44 L46 44 L46 12 L92 12',
    'M8 14 L40 52 L92 22',
    'M6 46 L26 14 L48 40 L70 8 L94 44',
  ],
};
const ADJ: Record<LineKind, string> = { straight: 'ישר', curved: 'עקום', broken: 'שבור' };
const lineFigure = (kind: LineKind, i: number): Visual => ({
  type: 'figure',
  w: 100,
  h: 60,
  parts: [{ d: LINES[kind][i % 4] as string, line: true }],
});

type LineFact = { ask: LineKind; v: number };

const lineFacts = (): LineFact[] =>
  LINE_KINDS.flatMap((ask) => [0, 1, 2, 3].map((v) => ({ ask, v })));

/** For the example: another kind than the one asked, explained. */
const LINE_EXAMPLE: Record<LineKind, LineKind> = {
  straight: 'broken',
  curved: 'straight',
  broken: 'curved',
};

function lines(f: LineFact, rng: Rng): Exercise {
  const items = shuffle(
    rng,
    LINE_KINDS.map((k, j) => ({ k, v: k === f.ask ? f.v : (f.v + 1 + j) % 4 })),
  );
  const ex = LINE_EXAMPLE[f.ask];
  return exercise({
    factId: `p1line:${f.ask}:${f.v}`,
    topicId: ID,
    level: 7,
    prompt: t(K(`line.${f.ask}.prompt`)),
    display: '',
    spoken: say(K(`line.${f.ask}.prompt`)),
    answer: items.findIndex((x) => x.k === f.ask),
    input: pictureChoices(
      items.map((x) => `קו ${ADJ[x.k]}`),
      items.map((x) => lineFigure(x.k, x.v)),
    ),
    hints: [
      hint(say(K(`line.${f.ask}.hint1`))),
      hint(say(K('line.hint2'))),
      pictureExample(say(K(`line.${ex}.example`)), lineFigure(ex, f.v + 3)),
    ],
    solution: say(K('line.solution'), { adj: ADJ[f.ask] }),
  });
}

/* ---------- Level 8: how many triangles (squares, circles) in the picture? ---------- */

type Kind = 'tri' | 'sq' | 'circle' | 'other';
type Piece = { kind: Kind; d: string; color: ShapeColor };
const tri = (a: P, b: P, c: P, color: ShapeColor): Piece => ({
  kind: 'tri',
  d: pathOf([a, b, c]),
  color,
});
const sq = (x: number, y: number, s: number, color: ShapeColor): Piece => ({
  kind: 'sq',
  d: rectPath(x, y, x + s, y + s),
  color,
});
const rect = (x1: number, y1: number, x2: number, y2: number, color: ShapeColor): Piece => ({
  kind: 'other',
  d: rectPath(x1, y1, x2, y2),
  color,
});
const circ = (cx: number, cy: number, r: number, color: ShapeColor): Piece => ({
  kind: 'circle',
  d: circlePath(cx, cy, r),
  color,
});

/** Pictures built of shapes, in a 100 × 100 box; a piece drawn later lies on top. */
const PICTURES: Record<string, Piece[]> = {
  house: [
    circ(88, 14, 8, 'yellow'),
    tri([18, 50], [82, 50], [50, 16], 'red'),
    sq(25, 50, 50, 'yellow'),
    rect(44, 72, 56, 100, 'blue'),
    sq(30, 57, 10, 'blue'),
    sq(60, 57, 10, 'blue'),
  ],
  tree: [
    rect(44, 76, 56, 98, 'yellow'),
    tri([50, 40], [16, 80], [84, 80], 'green'),
    tri([50, 22], [22, 58], [78, 58], 'green'),
    tri([50, 4], [28, 36], [72, 36], 'green'),
    circ(38, 68, 5, 'red'),
    circ(60, 48, 5, 'red'),
    circ(56, 72, 5, 'red'),
  ],
  rocket: [
    tri([42, 80], [58, 80], [50, 98], 'yellow'),
    tri([38, 56], [38, 82], [22, 82], 'red'),
    tri([62, 56], [62, 82], [78, 82], 'red'),
    rect(38, 22, 62, 82, 'blue'),
    tri([38, 22], [62, 22], [50, 2], 'red'),
    circ(50, 42, 7, 'yellow'),
  ],
  robot: [
    sq(35, 6, 30, 'blue'),
    circ(43, 18, 4, 'yellow'),
    circ(57, 18, 4, 'yellow'),
    rect(26, 40, 74, 76, 'red'),
    sq(45, 48, 10, 'yellow'),
    circ(50, 67, 5, 'yellow'),
    rect(32, 76, 44, 98, 'blue'),
    rect(56, 76, 68, 98, 'blue'),
  ],
  boat: [
    circ(86, 14, 8, 'yellow'),
    rect(48, 12, 52, 70, 'yellow'),
    tri([52, 12], [52, 24], [66, 18], 'red'),
    tri([46, 26], [46, 66], [14, 66], 'red'),
    tri([54, 30], [54, 66], [82, 66], 'green'),
    {
      kind: 'other',
      d: pathOf([
        [8, 70],
        [92, 70],
        [76, 92],
        [24, 92],
      ]),
      color: 'blue',
    },
  ],
  kite: [
    tri([50, 4], [82, 40], [18, 40], 'red'),
    tri([18, 40], [82, 40], [50, 72], 'yellow'),
    tri([38, 80], [50, 86], [38, 92], 'blue'),
    tri([62, 80], [50, 86], [62, 92], 'blue'),
  ],
  cat: [
    tri([22, 40], [30, 6], [46, 30], 'yellow'),
    tri([78, 40], [70, 6], [54, 30], 'yellow'),
    circ(50, 56, 36, 'yellow'),
    circ(37, 50, 6, 'green'),
    circ(63, 50, 6, 'green'),
    tri([44, 64], [56, 64], [50, 72], 'red'),
  ],
};
const PICTURE_IDS = Object.keys(PICTURES);

/** The kite's tail: a line, not a shape to count. */
const KITE_TAIL = 'M50 72 C40 76 60 80 50 86 C42 90 56 96 50 99';

const COUNTED = ['tri', 'sq', 'circle'] as const;
type Counted = (typeof COUNTED)[number];
const KIND_NAME: Record<Counted, Noun> = {
  tri: { singular: 'משולש', plural: 'משולשים', gender: 'm' },
  sq: { singular: 'ריבוע', plural: 'ריבועים', gender: 'm' },
  circle: { singular: 'עיגול', plural: 'עיגולים', gender: 'm' },
};

const countOf = (pic: string, kind: Kind) =>
  (PICTURES[pic] ?? []).filter((p) => p.kind === kind).length;

/** The picture; `only`: just these pieces coloured, the rest left plain (a hint). */
function picture(pic: string, only?: Kind): Visual {
  const parts: FigurePart[] = (PICTURES[pic] ?? []).map((p) => ({
    d: p.d,
    color: only === undefined || p.kind === only ? p.color : 'plain',
  }));
  if (pic === 'kite') parts.push({ d: KITE_TAIL, line: true, color: 'plain' });
  return { type: 'figure', w: 100, h: 100, parts };
}

type CountFact = { pic: string; kind: Counted };

/** Every picture with each kind of shape it has (at least one). */
const countFacts = (): CountFact[] =>
  PICTURE_IDS.flatMap((pic) =>
    COUNTED.filter((kind) => countOf(pic, kind) > 0).map((kind) => ({ pic, kind })),
  );

function countShapes(f: CountFact, rng: Rng): Exercise {
  const n = countOf(f.pic, f.kind);
  const noun = KIND_NAME[f.kind];
  // The example: another picture with a different number of these shapes.
  const ex = PICTURE_IDS.find(
    (p) => p !== f.pic && countOf(p, f.kind) > 0 && countOf(p, f.kind) !== n,
  ) as string;
  return exercise({
    factId: `p1count:${f.pic}:${f.kind}`,
    topicId: ID,
    level: 8,
    prompt: t(K(`count.${f.kind}.prompt`)),
    display: '',
    spoken: say(K(`count.${f.kind}.prompt`)),
    visual: picture(f.pic),
    answer: n,
    input: { type: 'choices', choices: windowChoices(rng, [0, 1, 2, 3, 4, 5, 6, 7], n) },
    hints: [
      hint(say(K('count.hint1'), { kinds: noun.plural })),
      hint(say(K('count.hint2'), { kinds: noun.plural }), { visual: picture(f.pic, f.kind) }),
      pictureExample(
        say(K('count.example'), { r: { n: countOf(ex, f.kind), noun } }),
        picture(ex, f.kind),
      ),
    ],
    solution: say(K('count.solution'), { r: { n, noun } }),
  });
}

/* ---------- Level 9: which half completes the shape (symmetry)? ---------- */

/** Path commands with absolute coordinates only, so a half can be mirrored. */
type Cmd = [string, ...number[]];

/** Left halves of symmetric shapes, against a line of symmetry at x = 50, in a 100 × 100 box. */
const HALVES: Record<string, { cmds: Cmd[]; color: ShapeColor }> = {
  house: {
    cmds: [['M', 50, 6], ['L', 8, 46], ['L', 18, 46], ['L', 18, 94], ['L', 50, 94], ['Z']],
    color: 'red',
  },
  tree: {
    cmds: [
      ['M', 50, 4],
      ['L', 22, 34],
      ['L', 34, 34],
      ['L', 14, 60],
      ['L', 28, 60],
      ['L', 8, 84],
      ['L', 44, 84],
      ['L', 44, 97],
      ['L', 50, 97],
      ['Z'],
    ],
    color: 'green',
  },
  heart: {
    cmds: [['M', 50, 28], ['C', 40, 4, 4, 8, 8, 40], ['C', 10, 60, 34, 76, 50, 92], ['Z']],
    color: 'red',
  },
  arrow: {
    cmds: [['M', 50, 4], ['L', 10, 46], ['L', 32, 46], ['L', 32, 96], ['L', 50, 96], ['Z']],
    color: 'blue',
  },
  vase: {
    cmds: [
      ['M', 50, 6],
      ['L', 38, 6],
      ['L', 38, 26],
      ['C', 8, 36, 8, 88, 30, 94],
      ['L', 50, 94],
      ['Z'],
    ],
    color: 'yellow',
  },
  crown: {
    cmds: [
      ['M', 50, 30],
      ['L', 34, 8],
      ['L', 24, 40],
      ['L', 6, 14],
      ['L', 8, 90],
      ['L', 50, 90],
      ['Z'],
    ],
    color: 'yellow',
  },
  rocket: {
    cmds: [
      ['M', 50, 4],
      ['C', 36, 16, 34, 40, 36, 64],
      ['L', 14, 90],
      ['L', 38, 82],
      ['L', 50, 82],
      ['Z'],
    ],
    color: 'blue',
  },
};
const HALF_IDS = Object.keys(HALVES);

/** A path, its x coordinates mapped (a mirror). */
function pathFrom(cmds: Cmd[], fx: (x: number) => number): string {
  return cmds
    .map(([c, ...xy]) => c + xy.map((v, i) => (i % 2 === 0 ? fx(v) : v)).join(' '))
    .join(' ');
}

/** The half on its own, for a button: the left half as it is, or mirrored (a right half). */
function halfButton(id: string, mirrored: boolean): Visual {
  const h = HALVES[id] as (typeof HALVES)[string];
  return {
    type: 'figure',
    w: 50,
    h: 100,
    parts: [{ d: pathFrom(h.cmds, mirrored ? (x) => 50 - x : (x) => x), color: h.color }],
  };
}

/** The left half beside its line, the right side empty; `whole`: both halves. */
function halfPicture(id: string, whole = false): Visual {
  const h = HALVES[id] as (typeof HALVES)[string];
  const parts: FigurePart[] = [{ d: pathFrom(h.cmds, (x) => x), color: h.color }];
  if (whole) parts.push({ d: pathFrom(h.cmds, (x) => 100 - x), color: h.color });
  return { type: 'figure', w: 100, h: 100, parts, axis: 50 };
}

type HalfFact = { id: string; other: string };

const halfFacts = (): HalfFact[] =>
  HALF_IDS.flatMap((id, i) =>
    [1, 2].map((d) => ({ id, other: HALF_IDS[(i + d) % HALF_IDS.length] as string })),
  );

function symmetry(f: HalfFact, rng: Rng): Exercise {
  const items = shuffle(rng, [
    { k: 'right', v: halfButton(f.id, true), label: t(K('half.right')) },
    { k: 'same', v: halfButton(f.id, false), label: t(K('half.same')) },
    { k: 'other', v: halfButton(f.other, true), label: t(K('half.other')) },
  ]);
  // The example is a whole shape that is neither this one nor the other half offered.
  const ex = HALF_IDS.find((x) => x !== f.id && x !== f.other) as string;
  return exercise({
    factId: `p1half:${f.id}:${f.other}`,
    topicId: ID,
    level: 9,
    prompt: t(K('half.prompt')),
    display: '',
    spoken: say(K('half.prompt')),
    visual: halfPicture(f.id),
    answer: items.findIndex((x) => x.k === 'right'),
    input: pictureChoices(
      items.map((x) => x.label),
      items.map((x) => x.v),
    ),
    hints: [
      hint(say(K('half.hint1'))),
      hint(say(K('half.hint2'))),
      pictureExample(say(K('half.example')), halfPicture(ex, true)),
    ],
    solution: say(K('half.solution')),
  });
}

/* ---------- Level 10: which two shapes build this shape? ---------- */

const TARGETS = ['square', 'wideRect', 'house', 'tallTri', 'trapezoid'] as const;
type Target = (typeof TARGETS)[number];

const TARGET_SHAPE: Record<Target, P[]> = {
  square: [
    [20, 20],
    [80, 20],
    [80, 80],
    [20, 80],
  ],
  wideRect: [
    [8, 30],
    [92, 30],
    [92, 72],
    [8, 72],
  ],
  house: [
    [25, 46],
    [50, 10],
    [75, 46],
    [75, 94],
    [25, 94],
  ],
  tallTri: [
    [28, 92],
    [50, 8],
    [72, 92],
  ],
  trapezoid: [
    [14, 20],
    [52, 20],
    [90, 80],
    [14, 80],
  ],
};

/** Where the target is cut into its two pieces (the worked example). */
const TARGET_CUT: Record<Target, string> = {
  square: 'M20 20 L80 80',
  wideRect: 'M50 30 L50 72',
  house: 'M25 46 L75 46',
  tallTri: 'M50 8 L50 92',
  trapezoid: 'M52 20 L52 80',
};

const PAIRS = ['twoTri', 'twoRect', 'twoSq', 'sqTri', 'twoThin', 'rectTri'] as const;
type Pair = (typeof PAIRS)[number];

/** The two pieces, apart, in a 100 × 60 box. */
const PAIR_PIECES: Record<Pair, [P[], P[]]> = {
  twoTri: [
    [
      [6, 10],
      [44, 10],
      [6, 48],
    ],
    [
      [94, 12],
      [94, 50],
      [56, 50],
    ],
  ],
  twoRect: [
    [
      [6, 20],
      [44, 20],
      [44, 40],
      [6, 40],
    ],
    [
      [56, 20],
      [94, 20],
      [94, 40],
      [56, 40],
    ],
  ],
  twoSq: [
    [
      [8, 12],
      [42, 12],
      [42, 46],
      [8, 46],
    ],
    [
      [58, 12],
      [92, 12],
      [92, 46],
      [58, 46],
    ],
  ],
  sqTri: [
    [
      [8, 20],
      [40, 20],
      [40, 52],
      [8, 52],
    ],
    [
      [58, 50],
      [90, 50],
      [74, 26],
    ],
  ],
  twoThin: [
    [
      [30, 6],
      [30, 54],
      [14, 54],
    ],
    [
      [70, 6],
      [70, 54],
      [86, 54],
    ],
  ],
  rectTri: [
    [
      [8, 10],
      [32, 10],
      [32, 50],
      [8, 50],
    ],
    [
      [50, 10],
      [50, 50],
      [76, 50],
    ],
  ],
};
const PAIR_COLORS: [ShapeColor, ShapeColor] = ['blue', 'yellow'];

/** The target each pair of pieces builds. */
const BUILDS: Record<Pair, Target[]> = {
  twoTri: ['square'],
  twoRect: ['square'],
  twoSq: ['wideRect'],
  sqTri: ['house'],
  twoThin: ['tallTri'],
  rectTri: ['trapezoid'],
};
/**
 * Pairs never offered for a target although they do not build it exactly: two
 * thin triangles make a rectangle like the wide one, two right triangles a flat
 * triangle like the tall one. And the two kinds of triangle pairs are never
 * offered together.
 */
const NOT_FOR: Partial<Record<Target, Pair[]>> = { wideRect: ['twoThin'], tallTri: ['twoTri'] };

const pairPicture = (pair: Pair): Visual => ({
  type: 'figure',
  w: 100,
  h: 60,
  parts: PAIR_PIECES[pair].map((pts, i) => ({ d: pathOf(pts), color: PAIR_COLORS[i] ?? 'blue' })),
});
const targetPicture = (target: Target, cut = false): Visual => ({
  type: 'figure',
  w: 100,
  h: 100,
  parts: [
    { d: pathOf(TARGET_SHAPE[target]), color: 'plain' },
    ...(cut ? [{ d: TARGET_CUT[target], line: true, color: 'red' } as FigurePart] : []),
  ],
});

type BuildFact = { target: Target; right: Pair; others: [Pair, Pair] };

const buildFacts = (): BuildFact[] =>
  TARGETS.flatMap((target) => {
    const rights = PAIRS.filter((p) => BUILDS[p].includes(target));
    const wrong = PAIRS.filter((p) => !rights.includes(p) && !NOT_FOR[target]?.includes(p));
    return rights.flatMap((right) => {
      const out: BuildFact[] = [];
      for (let i = 0; i < wrong.length; i++)
        for (let j = i + 1; j < wrong.length; j++) {
          const others: [Pair, Pair] = [wrong[i] as Pair, wrong[j] as Pair];
          const set = [right, ...others];
          if (set.includes('twoTri') && set.includes('twoThin')) continue;
          out.push({ target, right, others });
        }
      return out;
    });
  });

function buildShape(f: BuildFact, rng: Rng, gender: Gender): Exercise {
  const items = shuffle(rng, [f.right, ...f.others]);
  const ex: Target = f.target === 'wideRect' ? 'square' : 'wideRect';
  return exercise({
    factId: `p1build:${f.target}:${f.right}:${f.others.join(',')}`,
    topicId: ID,
    level: 10,
    prompt: t(K('build.prompt')),
    display: '',
    spoken: say(K('build.prompt')),
    visual: targetPicture(f.target),
    answer: items.indexOf(f.right),
    input: pictureChoices(
      items.map((p) => t(K(`build.pair.${p}`))),
      items.map(pairPicture),
    ),
    hints: [
      hint(say(K('build.hint1'), {}, gender)),
      hint(say(K('build.hint2'))),
      pictureExample(say(K(`build.example.${ex}`)), targetPicture(ex, true)),
    ],
    solution: say(K('build.solution'), { pair: t(K(`build.pair.${f.right}`)) }),
  });
}

export const polygons = defineTopic({
  id: ID,
  labelKey: 'topic.polygons',
  grades: [1],
  startLevel: () => 1,
  levels: [
    open(L(1), count(1)),
    open(L(2), count(2)),
    open(L(3), name),
    open(L(4), where),
    open(L(5), moreSides),
    closed(L(6), quadFacts, squareRect),
    closed(L(7), lineFacts, lines),
    closed(L(8), countFacts, countShapes),
    closed(L(9), halfFacts, symmetry),
    closed(L(10), buildFacts, buildShape),
  ],
});
