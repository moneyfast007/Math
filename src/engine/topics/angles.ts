import { shown } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  windowChoices,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  pictureExample,
  say,
  type Said,
} from '../build';
import { randInt, shuffle } from '../rng';
import type { Exercise, Hint, Polygon, Rng, Visual } from '../types';

/**
 * World "זוויות וצורות", grade 4 (phase 6). Right, acute and obtuse angles;
 * right angles in a shape; parallel and perpendicular lines; triangles by
 * their sides and by their angles; quadrilaterals; the angles of a triangle
 * add up to 180°; diagonals; lines of symmetry; true or false.
 */

const ID = 'angles';
const L = (n: number) => `level.angles.${n}`;
const DEGREE: Noun = { singular: 'מעלה', plural: 'מעלות', gender: 'f' };
const RIGHT_ANGLE: Noun = { singular: 'זווית ישרה', plural: 'זוויות ישרות', gender: 'f' };
const DIAGONAL: Noun = { singular: 'אלכסון', plural: 'אלכסונים', gender: 'm' };
const SYM_LINE: Noun = { singular: 'קו סימטריה', plural: 'קווי סימטריה', gender: 'm' };

type P = [number, number];
const poly = (points: P[], extra: Omit<Polygon, 'points'> = {}): Visual => ({
  type: 'polygon',
  points,
  ...extra,
});

const SHAPES = {
  square: [
    [15, 15],
    [85, 15],
    [85, 85],
    [15, 85],
  ],
  rectangle: [
    [3, 25],
    [97, 25],
    [97, 75],
    [3, 75],
  ],
  rhombus: [
    [50, 3],
    [88, 50],
    [50, 97],
    [12, 50],
  ],
  parallelogram: [
    [28, 25],
    [97, 25],
    [72, 75],
    [3, 75],
  ],
  trapezoid: [
    [30, 25],
    [70, 25],
    [97, 75],
    [3, 75],
  ],
  rightTrapezoid: [
    [5, 25],
    [60, 25],
    [95, 75],
    [5, 75],
  ],
  equilateral: [
    [50, 8],
    [95, 86],
    [5, 86],
  ],
  isosceles: [
    [50, 3],
    [80, 92],
    [20, 92],
  ],
  scalene: [
    [30, 10],
    [97, 85],
    [3, 70],
  ],
  right: [
    [10, 8],
    [10, 92],
    [90, 92],
  ],
  obtuse: [
    [3, 80],
    [97, 80],
    [22, 48],
  ],
  acute: [
    [42, 8],
    [95, 88],
    [5, 82],
  ],
  lShape: [
    [5, 5],
    [50, 5],
    [50, 50],
    [95, 50],
    [95, 95],
    [5, 95],
  ],
  pentagon: regular(5),
  hexagon: regular(6),
} satisfies Record<string, P[]>;

type ShapeName = keyof typeof SHAPES;

function regular(n: number): P[] {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [Math.round(50 + 46 * Math.cos(a)), Math.round(52 + 46 * Math.sin(a))] as P;
  });
}

/** A word for an exercise built from fixed facts: the factId, prompt and answer index. */
function choiceExercise(o: {
  level: number;
  factId: string;
  promptKey: TranslationKey;
  visual: Visual;
  labels: string[];
  answer: number;
  hints: [Hint, Hint, Hint];
  solution: Said;
}): Exercise {
  return exercise({
    factId: o.factId,
    topicId: ID,
    level: o.level,
    prompt: t(o.promptKey),
    display: '',
    spoken: say(o.promptKey),
    visual: o.visual,
    answer: o.answer,
    input: labelledChoices(o.labels),
    hints: o.hints,
    solution: o.solution,
  });
}

/** Labels shuffled with the right one tracked. */
function shuffledLabels(rng: Rng, right: string, wrong: string[]) {
  const labels = shuffle(rng, [right, ...wrong]);
  return { labels, answer: labels.indexOf(right) };
}

/* ---------- Level 1: what kind of angle? ---------- */

type AngleKind = 'acute' | 'right' | 'obtuse';
const ANGLE_WORD: Record<AngleKind, string> = { acute: 'חדה', right: 'ישרה', obtuse: 'קהה' };
const kindOf = (deg: number): AngleKind => (deg < 90 ? 'acute' : deg === 90 ? 'right' : 'obtuse');

function angleKind({ deg, turn }: { deg: number; turn: number }, rng: Rng): Exercise {
  const kind = kindOf(deg);
  const { labels, answer } = shuffledLabels(
    rng,
    ANGLE_WORD[kind],
    (Object.keys(ANGLE_WORD) as AngleKind[]).filter((k) => k !== kind).map((k) => ANGLE_WORD[k]),
  );
  const ex: AngleKind = kind === 'right' ? 'acute' : 'right';
  return choiceExercise({
    level: 1,
    factId: `angle:${deg}:${turn}`,
    promptKey: 'ex.angles.kind.prompt',
    visual: { type: 'angle', deg, turn },
    labels,
    answer,
    hints: [
      hint(say('ex.angles.kind.hint1')),
      hint(say('ex.angles.kind.hint2')),
      pictureExample(say(`ex.angles.kind.${ex}`), {
        type: 'angle',
        deg: ex === 'right' ? 90 : 40,
      }),
    ],
    solution: say(`ex.angles.kind.${kind}`),
  });
}

/* ---------- Level 2: right angles in a shape ---------- */

const RIGHT_ANGLES: [ShapeName, number][] = [
  ['square', 4],
  ['rectangle', 4],
  ['right', 1],
  ['rightTrapezoid', 2],
  ['isosceles', 0],
  ['rhombus', 0],
  ['lShape', 5],
  ['parallelogram', 0],
];

/**
 * Three neighbouring counts, not in order: many answers are 0, which in order
 * would always be the first button.
 */
function numberChoices(n: number, rng: Rng): number[] {
  return shuffle(rng, windowChoices(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], n));
}

function rightAngles([shape, n]: [ShapeName, number], rng: Rng): Exercise {
  return exercise({
    factId: `right:${shape}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.angles.rights.prompt'),
    display: '',
    spoken: say('ex.angles.rights.prompt'),
    visual: poly(SHAPES[shape]),
    answer: n,
    input: { type: 'choices', choices: numberChoices(n, rng) },
    hints: [
      hint(say('ex.angles.rights.hint1')),
      hint(say('ex.angles.rights.hint2')),
      pictureExample(
        say('ex.angles.rights.example'),
        poly(SHAPES.rectangle, { rightAngles: [0, 1, 2, 3] }),
      ),
    ],
    solution:
      n === 0
        ? say('ex.angles.rights.none')
        : say('ex.angles.rights.solution', { n: { n, noun: RIGHT_ANGLE } }),
  });
}

/* ---------- Level 3: parallel or perpendicular ---------- */

type LinesKind = 'parallel' | 'perpendicular' | 'crossing';
const LINES_WORD: Record<LinesKind, string> = {
  parallel: 'מקבילים',
  perpendicular: 'מאונכים',
  // Perpendicular lines cross too: the label says it is the other kind of crossing.
  crossing: 'נחתכים, לא בזווית ישרה',
};

function linesKind({ kind, turn }: { kind: LinesKind; turn: number }, rng: Rng): Exercise {
  const { labels, answer } = shuffledLabels(
    rng,
    LINES_WORD[kind],
    (Object.keys(LINES_WORD) as LinesKind[]).filter((k) => k !== kind).map((k) => LINES_WORD[k]),
  );
  const ex: LinesKind = kind === 'parallel' ? 'perpendicular' : 'parallel';
  return choiceExercise({
    level: 3,
    factId: `lines:${kind}:${turn}`,
    promptKey: 'ex.angles.lines.prompt',
    visual: { type: 'lines', kind, turn },
    labels,
    answer,
    hints: [
      hint(say('ex.angles.lines.hint1')),
      hint(say('ex.angles.lines.hint2')),
      pictureExample(say(`ex.angles.lines.${ex}`), { type: 'lines', kind: ex }),
    ],
    solution: say(`ex.angles.lines.${kind}`),
  });
}

/* ---------- Levels 4–5: kinds of triangles ---------- */

type SideKind = 'equilateral' | 'isosceles' | 'scalene';
const SIDE_WORD: Record<SideKind, string> = {
  equilateral: 'שווה צלעות',
  isosceles: 'שווה שוקיים',
  scalene: 'שונה צלעות',
};
const SIDE_FACTS: { kind: SideKind; sides: [number, number, number] }[] = [
  { kind: 'equilateral', sides: [5, 5, 5] },
  { kind: 'equilateral', sides: [8, 8, 8] },
  { kind: 'equilateral', sides: [12, 12, 12] },
  { kind: 'isosceles', sides: [7, 7, 4] },
  { kind: 'isosceles', sides: [6, 6, 9] },
  { kind: 'isosceles', sides: [10, 10, 6] },
  { kind: 'scalene', sides: [5, 7, 9] },
  { kind: 'scalene', sides: [6, 8, 10] },
  { kind: 'scalene', sides: [4, 6, 7] },
];

function bySides({ kind, sides }: (typeof SIDE_FACTS)[number], rng: Rng): Exercise {
  // Side i joins point i to i+1. The isosceles triangle stands on its unequal side.
  const order: [number, number, number] =
    kind === 'isosceles' ? [sides[2], sides[0], sides[1]] : sides;
  const { labels, answer } = shuffledLabels(
    rng,
    SIDE_WORD[kind],
    // An equilateral triangle is also isosceles: that name is right too, so it is not offered.
    (Object.keys(SIDE_WORD) as SideKind[])
      .filter((k) => k !== kind && !(kind === 'equilateral' && k === 'isosceles'))
      .map((k) => SIDE_WORD[k]),
  );
  return choiceExercise({
    level: 4,
    factId: `sides:${sides.join(',')}`,
    promptKey: 'ex.angles.sides.prompt',
    // Drawn to its own side lengths: the longest side is the one with the biggest number.
    visual: poly(triangleFromSides(...order), { sideLabels: order.map((n) => `${n} ס״מ`) }),
    labels,
    answer,
    hints: [
      hint(say('ex.angles.sides.hint1')),
      hint(say('ex.angles.sides.hint2')),
      pictureExample(
        say(kind === 'isosceles' ? 'ex.angles.sides.equilateral' : 'ex.angles.sides.isosceles'),
        kind === 'isosceles'
          ? poly(SHAPES.equilateral, { ticks: [1, 1, 1] })
          : poly(SHAPES.isosceles, { ticks: [1, 0, 1] }),
      ),
    ],
    solution: say(`ex.angles.sides.${kind}`),
  });
}

type AngleTriKind = 'acute' | 'right' | 'obtuse';
const TRI_WORD: Record<AngleTriKind, string> = {
  acute: 'חד זווית',
  right: 'ישר זווית',
  obtuse: 'קהה זווית',
};
const ANGLE_FACTS: { kind: AngleTriKind; angles: [number, number, number] }[] = [
  { kind: 'acute', angles: [60, 60, 60] },
  { kind: 'acute', angles: [50, 70, 60] },
  { kind: 'acute', angles: [80, 45, 55] },
  { kind: 'right', angles: [30, 90, 60] },
  { kind: 'right', angles: [45, 90, 45] },
  { kind: 'right', angles: [20, 90, 70] },
  { kind: 'obtuse', angles: [30, 30, 120] },
  { kind: 'obtuse', angles: [20, 50, 110] },
  { kind: 'obtuse', angles: [25, 15, 140] },
];

function byAngles({ kind, angles }: (typeof ANGLE_FACTS)[number], rng: Rng): Exercise {
  const { labels, answer } = shuffledLabels(
    rng,
    TRI_WORD[kind],
    (Object.keys(TRI_WORD) as AngleTriKind[]).filter((k) => k !== kind).map((k) => TRI_WORD[k]),
  );
  return choiceExercise({
    level: 5,
    factId: `angles:${angles.join(',')}`,
    promptKey: 'ex.angles.tri.prompt',
    // Drawn with its own angles, so the labels match the corners.
    visual: poly(triangleFromAngles(angles[0], angles[1]), {
      angleLabels: angles.map((a) => `${a}°`),
      ...(kind === 'right' ? { rightAngles: [angles.indexOf(90)] } : {}),
    }),
    labels,
    answer,
    hints: [
      hint(say('ex.angles.tri.hint1')),
      hint(say('ex.angles.tri.hint2')),
      pictureExample(
        say(kind === 'right' ? 'ex.angles.tri.obtuse' : 'ex.angles.tri.right'),
        kind === 'right'
          ? poly(SHAPES.obtuse, { angleLabels: ['20°', '40°', '120°'] })
          : poly(SHAPES.right, { angleLabels: ['50°', '90°', '40°'], rightAngles: [1] }),
      ),
    ],
    solution: say(`ex.angles.tri.${kind}`),
  });
}

/* ---------- Level 6: quadrilaterals ---------- */

type Quad = 'square' | 'rectangle' | 'rhombus' | 'parallelogram' | 'trapezoid';
const QUAD_WORD: Record<Quad, string> = {
  square: 'ריבוע',
  rectangle: 'מלבן',
  rhombus: 'מעוין',
  parallelogram: 'מקבילית',
  trapezoid: 'טרפז',
};
/** The two names a child most often confuses each shape with. */
/**
 * Wrong names only: a square is also a rectangle, a rhombus and a parallelogram;
 * a rectangle and a rhombus are parallelograms. So each shape is offered only
 * names that are not true of it.
 */
const QUAD_CONFUSED: Record<Quad, Quad[]> = {
  square: ['trapezoid'],
  rectangle: ['rhombus', 'trapezoid'],
  rhombus: ['rectangle', 'trapezoid'],
  parallelogram: ['rhombus', 'trapezoid'],
  trapezoid: ['parallelogram', 'rectangle'],
};
const QUAD_MARKS: Record<Quad, Omit<Polygon, 'points'>> = {
  square: { ticks: [1, 1, 1, 1], rightAngles: [0, 1, 2, 3] },
  rectangle: { ticks: [1, 2, 1, 2], rightAngles: [0, 1, 2, 3] },
  rhombus: { ticks: [1, 1, 1, 1] },
  parallelogram: { ticks: [1, 2, 1, 2] },
  trapezoid: {},
};

function quad({ shape }: { shape: Quad }, rng: Rng): Exercise {
  const { labels, answer } = shuffledLabels(
    rng,
    QUAD_WORD[shape],
    QUAD_CONFUSED[shape].map((q) => QUAD_WORD[q]),
  );
  const ex: Quad = shape === 'square' ? 'rectangle' : 'square';
  return choiceExercise({
    level: 6,
    factId: `quad:${shape}`,
    promptKey: 'ex.angles.quad.prompt',
    visual: poly(SHAPES[shape], QUAD_MARKS[shape]),
    labels,
    answer,
    hints: [
      hint(say('ex.angles.quad.hint1')),
      // A question that leads to the name, not the name itself.
      hint(say('ex.angles.quad.ask')),
      pictureExample(say(`ex.angles.quad.about.${ex}`), poly(SHAPES[ex], QUAD_MARKS[ex])),
    ],
    solution: say('ex.angles.quad.solution', { name: QUAD_WORD[shape] }),
  });
}

/**
 * Triangles drawn to the numbers on them (a 120° label on a 120° corner):
 * points in the drawing box (0–100, y down), base at the bottom, aspect kept.
 */
function fitTriangle(pts: [number, number][]): [number, number][] {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const k = 90 / Math.max(w, h);
  const dx = (100 - w * k) / 2;
  const dy = (100 - h * k) / 2;
  return pts.map(([x, y]): [number, number] => [
    Math.round((x - Math.min(...xs)) * k + dx),
    Math.round(100 - ((y - Math.min(...ys)) * k + dy)),
  ]);
}

/** Vertex 0 has angle a, vertex 1 angle b (degrees), vertex 2 the rest. */
function triangleFromAngles(a: number, b: number): [number, number][] {
  const rad = (d: number) => (d * Math.PI) / 180;
  const c = 180 - a - b;
  const l = Math.sin(rad(b)) / Math.sin(rad(c));
  return fitTriangle([
    [0, 0],
    [1, 0],
    [l * Math.cos(rad(a)), l * Math.sin(rad(a))],
  ]);
}

/** Side i joins vertex i to i + 1: sides 0–1, 1–2, 2–0. */
function triangleFromSides(s0: number, s1: number, s2: number): [number, number][] {
  const x = (s0 * s0 + s2 * s2 - s1 * s1) / (2 * s0);
  return fitTriangle([
    [0, 0],
    [s0, 0],
    [x, Math.sqrt(Math.max(0, s2 * s2 - x * x))],
  ]);
}

/* ---------- Level 7: the third angle ---------- */

function thirdAngle(rng: Rng): Exercise {
  let a: number;
  let b: number;
  do {
    a = randInt(rng, 4, 24) * 5;
    b = randInt(rng, 4, 24) * 5;
  } while (180 - a - b < 15);
  const c = 180 - a - b;
  const deg = (n: number) => ({ n, noun: DEGREE });
  return exercise({
    factId: `third:${a}:${b}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.angles.third.prompt'),
    display: '',
    spoken: say('ex.angles.third.spoken', { a: deg(a), b: deg(b) }),
    visual: poly(triangleFromAngles(a, b), { angleLabels: [`${a}°`, `${b}°`, '?'] }),
    answer: c,
    input: numpad(3),
    hints: [
      hint(say('ex.angles.third.hint1')),
      hint(say('ex.angles.third.hint2'), {
        example: { display: `180 − ${a} − ${b} = ?`, spoken: say('ex.angles.third.hint2') },
      }),
      // The two examples' third angles differ (50°, 60°): one is never this answer.
      exampleAvoiding(
        c,
        [
          { a: 60, b: 70 },
          { a: 50, b: 70 },
        ].map((ex) => ({
          answer: 180 - ex.a - ex.b,
          hint: () =>
            exampleHint(
              `180 − ${ex.a} − ${ex.b} = ${180 - ex.a - ex.b}`,
              say('ex.angles.third.solution', { a: ex.a, b: ex.b, c: deg(180 - ex.a - ex.b) }),
            ),
        })),
      ),
    ],
    solution: say('ex.angles.third.solution', { a, b, c: deg(c) }),
    diagnose: (v) => (v === a + b ? 'wrongOperation' : Math.abs(v - c) === 10 ? 'offByTen' : null),
  });
}

/* ---------- Levels 8–9: diagonals, symmetry ---------- */

const DIAGONALS: [ShapeName, string, number][] = [
  ['equilateral', 'משולש', 0],
  ['square', 'ריבוע', 2],
  ['rectangle', 'מלבן', 2],
  ['trapezoid', 'טרפז', 2],
  ['pentagon', 'מחומש', 5],
  ['hexagon', 'משושה', 9],
];

function diagonals([shape, name, n]: [ShapeName, string, number], rng: Rng): Exercise {
  const ex: [ShapeName, string] = shape === 'square' ? ['pentagon', 'מחומש'] : ['square', 'ריבוע'];
  return exercise({
    factId: `diag:${shape}`,
    topicId: ID,
    level: 8,
    prompt: shown(say('ex.angles.diag.prompt', { name })),
    display: '',
    spoken: say('ex.angles.diag.prompt', { name }),
    visual: poly(SHAPES[shape]),
    answer: n,
    input: { type: 'choices', choices: numberChoices(n, rng) },
    hints: [
      hint(say('ex.angles.diag.hint1')),
      hint(say('ex.angles.diag.hint2')),
      pictureExample(
        say('ex.angles.diag.example', { name: ex[1] }),
        poly(SHAPES[ex[0]], { diagonals: true }),
      ),
    ],
    solution:
      n === 0
        ? say('ex.angles.diag.none', { name })
        : say('ex.angles.diag.solution', { name, n: { n, noun: DIAGONAL } }),
  });
}

const SYMMETRY: [ShapeName, string, number, Omit<Polygon, 'points'>][] = [
  ['square', 'ריבוע', 4, { ticks: [1, 1, 1, 1], rightAngles: [0, 1, 2, 3] }],
  ['rectangle', 'מלבן', 2, { rightAngles: [0, 1, 2, 3] }],
  ['equilateral', 'משולש שווה צלעות', 3, { ticks: [1, 1, 1] }],
  ['isosceles', 'משולש שווה שוקיים', 1, { ticks: [1, 0, 1] }],
  ['rhombus', 'מעוין', 2, { ticks: [1, 1, 1, 1] }],
  ['parallelogram', 'מקבילית', 0, {}],
  ['scalene', 'משולש שונה צלעות', 0, {}],
];

function symmetry([shape, name, n, marks]: (typeof SYMMETRY)[number], rng: Rng): Exercise {
  return exercise({
    factId: `sym:${shape}`,
    topicId: ID,
    level: 9,
    prompt: shown(say('ex.angles.sym.prompt', { name })),
    display: '',
    spoken: say('ex.angles.sym.prompt', { name }),
    visual: poly(SHAPES[shape], marks),
    answer: n,
    input: { type: 'choices', choices: numberChoices(n, rng) },
    hints: [
      hint(say('ex.angles.sym.hint1')),
      hint(say('ex.angles.sym.hint2')),
      // Never the shape that is asked about: for the isosceles triangle, a rectangle.
      shape === 'isosceles'
        ? pictureExample(
            say('ex.angles.sym.exampleRect'),
            poly(SHAPES.rectangle, { rightAngles: [0, 1, 2, 3] }),
          )
        : pictureExample(
            say('ex.angles.sym.example'),
            poly(SHAPES.isosceles, { ticks: [1, 0, 1], height: { from: [50, 3], to: [50, 92] } }),
          ),
    ],
    solution:
      n === 0
        ? say('ex.angles.sym.none', { name })
        : say('ex.angles.sym.solution', { name, n: { n, noun: SYM_LINE } }),
  });
}

/* ---------- Level 10: true or false ---------- */

const STATEMENTS: { key: TranslationKey; truth: boolean; why?: TranslationKey }[] = [
  { key: 'ex.angles.tf.s1', truth: true },
  { key: 'ex.angles.tf.s2', truth: true },
  { key: 'ex.angles.tf.s3', truth: false, why: 'ex.angles.tf.w3' },
  { key: 'ex.angles.tf.s4', truth: true },
  { key: 'ex.angles.tf.s5', truth: false, why: 'ex.angles.tf.w5' },
  { key: 'ex.angles.tf.s6', truth: true },
  { key: 'ex.angles.tf.s7', truth: false, why: 'ex.angles.tf.w7' },
  { key: 'ex.angles.tf.s8', truth: true },
  { key: 'ex.angles.tf.s9', truth: false, why: 'ex.angles.tf.w9' },
  { key: 'ex.angles.tf.s10', truth: true },
  { key: 'ex.angles.tf.s11', truth: true },
  { key: 'ex.angles.tf.s12', truth: false, why: 'ex.angles.tf.w12' },
  { key: 'ex.angles.tf.s13', truth: true },
  { key: 'ex.angles.tf.s14', truth: false, why: 'ex.angles.tf.w14' },
];

function trueFalse({ key, truth, why }: (typeof STATEMENTS)[number]): Exercise {
  const statement = say(key);
  return exercise({
    factId: `tf:${key}`,
    topicId: ID,
    level: 10,
    prompt: shown(statement),
    display: '',
    spoken: say('ex.angles.tf.spoken', { s: statement.text }),
    // Left to right: "לא נכון", then "נכון" on the right, where a Hebrew reader starts.
    answer: truth ? 1 : 0,
    input: labelledChoices([t('ex.angles.tf.false'), t('ex.angles.tf.true')]),
    hints: [
      hint(say('ex.angles.tf.hint1')),
      hint(say('ex.angles.tf.hint2')),
      hint(say('ex.angles.tf.hint3')),
    ],
    solution: truth ? say('ex.angles.tf.yes') : say(why ?? 'ex.angles.tf.no'),
  });
}

export const anglesTopic = defineTopic({
  id: ID,
  labelKey: 'topic.angles',
  grades: [4],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () =>
        [20, 35, 45, 60, 75, 90, 105, 120, 135, 150, 165].flatMap((deg) =>
          [0, 25].map((turn) => ({ deg, turn })),
        ),
      angleKind,
    ),
    closed(
      L(2),
      () => RIGHT_ANGLES,
      (f: [ShapeName, number], rng) => rightAngles(f, rng),
    ),
    closed(
      L(3),
      () =>
        (['parallel', 'perpendicular', 'crossing'] as LinesKind[]).flatMap((kind) =>
          [0, 30, -20, 60].map((turn) => ({ kind, turn })),
        ),
      linesKind,
    ),
    closed(L(4), () => SIDE_FACTS, bySides),
    closed(L(5), () => ANGLE_FACTS, byAngles),
    closed(L(6), () => (Object.keys(QUAD_WORD) as Quad[]).map((shape) => ({ shape })), quad),
    open(L(7), thirdAngle),
    closed(
      L(8),
      () => DIAGONALS,
      (f: [ShapeName, string, number], rng) => diagonals(f, rng),
    ),
    closed(
      L(9),
      () => SYMMETRY,
      (f: (typeof SYMMETRY)[number], rng) => symmetry(f, rng),
    ),
    closed(
      L(10),
      () => STATEMENTS,
      (f: (typeof STATEMENTS)[number]) => trueFalse(f),
    ),
  ],
});
