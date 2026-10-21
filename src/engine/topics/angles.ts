import type { Slot } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  windowChoices,
  exercise,
  hint,
  labelledChoices,
  pictureExample,
  say,
  sayText,
  type AdviceSpec,
  type Said,
} from '../build';
import { shuffle } from '../rng';
import type { ClockTime, Exercise, Hint, Polygon, Rng, Visual } from '../types';

/**
 * World "זוויות וצורות", grade 3 (phase 6). Right, acute and obtuse angles;
 * right angles in a shape; parallel and perpendicular lines; triangles by
 * their sides and by their angles; quadrilaterals; angles on a clock and in
 * shapes; what is true of a square, a rectangle and a rhombus; is this line
 * a line of symmetry? Grade 4 goes on in its own world, "angles-4" (angles4.ts),
 * which shares the shapes and helpers below.
 */

const ID = 'angles';
const L = (n: number) => `level.angles.${n}`;
export const DEGREE: Noun = { singular: 'מעלה', plural: 'מעלות', gender: 'f' };
const RIGHT_ANGLE: Noun = { singular: 'זווית ישרה', plural: 'זוויות ישרות', gender: 'f' };

type P = [number, number];
export const poly = (points: P[], extra: Omit<Polygon, 'points'> = {}): Visual => ({
  type: 'polygon',
  points,
  ...extra,
});

export const SHAPES = {
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
  // Angles of about 60° and 120°: clearly not a turned square.
  rhombus: [
    [50, 3],
    [77, 50],
    [50, 97],
    [23, 50],
  ],
  // Two pairs of equal neighbouring sides (top ones short, bottom ones long), no right angle.
  kite: [
    [50, 5],
    [78, 38],
    [50, 95],
    [22, 38],
  ],
  // A pentagon with a right angle at each bottom corner.
  house: [
    [50, 5],
    [95, 40],
    [95, 95],
    [5, 95],
    [5, 40],
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

export type ShapeName = keyof typeof SHAPES;

function regular(n: number): P[] {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [Math.round(50 + 46 * Math.cos(a)), Math.round(52 + 46 * Math.sin(a))] as P;
  });
}

/** A word for an exercise built from fixed facts: the factId, prompt and answer index. */
export function choiceExercise(o: {
  topicId?: string;
  level: number;
  factId: string;
  promptKey: TranslationKey;
  visual: Visual;
  labels: string[];
  answer: number;
  hints: [Hint, Hint, Hint];
  solution: Said;
  advice?: AdviceSpec[];
}): Exercise {
  return exercise({
    factId: o.factId,
    topicId: o.topicId ?? ID,
    level: o.level,
    prompt: t(o.promptKey),
    display: '',
    spoken: say(o.promptKey),
    visual: o.visual,
    answer: o.answer,
    input: labelledChoices(o.labels),
    hints: o.hints,
    solution: o.solution,
    ...(o.advice ? { advice: o.advice } : {}),
  });
}

/**
 * Advice for every wrong name on the buttons: what that name means, then what
 * to check in the picture (never the right name itself).
 */
export function nameAdvice(
  labels: string[],
  answer: number,
  meaning: (label: string) => TranslationKey | null,
  check: TranslationKey,
  slots: Record<string, Slot> = {},
): AdviceSpec[] {
  return labels.flatMap((label, i) => {
    const key = i === answer ? null : meaning(label);
    return key ? [{ value: i, say: sayText(`${t(key)} ${t(check)}`, slots) }] : [];
  });
}

/** The key of the label's kind, by its word. */
export const byWord =
  <K extends string>(words: Record<K, string>, prefix: string) =>
  (label: string): TranslationKey | null => {
    const k = (Object.keys(words) as K[]).find((x) => words[x] === label);
    return k ? (`${prefix}.${k}` as TranslationKey) : null;
  };

/** Labels shuffled with the right one tracked. */
export function shuffledLabels(rng: Rng, right: string, wrong: string[]) {
  const labels = shuffle(rng, [right, ...wrong]);
  return { labels, answer: labels.indexOf(right) };
}

/* ---------- Level 1: what kind of angle? ---------- */

type AngleKind = 'acute' | 'right' | 'obtuse';
export const ANGLE_WORD: Record<AngleKind, string> = { acute: 'חדה', right: 'ישרה', obtuse: 'קהה' };
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
    advice: nameAdvice(labels, answer, byWord(ANGLE_WORD, 'g4.ang.adv.is'), 'g4.ang.adv.check'),
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
  ['house', 2],
  ['kite', 0],
  ['trapezoid', 0],
];

/**
 * Three neighbouring counts, not in order: many answers are 0, which in order
 * would always be the first button.
 */
export function numberChoices(n: number, rng: Rng): number[] {
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
    promptKey: 'g4.lines.prompt',
    visual: { type: 'lines', kind, turn },
    labels,
    answer,
    hints: [
      hint(say('ex.angles.lines.hint1')),
      hint(say('ex.angles.lines.hint2')),
      pictureExample(say(`ex.angles.lines.${ex}`), { type: 'lines', kind: ex }),
    ],
    solution: say(`ex.angles.lines.${kind}`),
    advice: nameAdvice(labels, answer, byWord(LINES_WORD, 'g4.lines.adv'), 'g4.lines.adv.check'),
  });
}

/* ---------- Levels 4–5: kinds of triangles ---------- */

export type SideKind = 'equilateral' | 'isosceles' | 'scalene';
export const SIDE_WORD: Record<SideKind, string> = {
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
    advice: nameAdvice(labels, answer, byWord(SIDE_WORD, 'g4.sides.adv'), 'g4.sides.adv.check'),
  });
}

export type AngleTriKind = 'acute' | 'right' | 'obtuse';
export const TRI_WORD: Record<AngleTriKind, string> = {
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
        // Drawn to the numbers on them, like the exercise.
        kind === 'right'
          ? poly(triangleFromAngles(20, 40), { angleLabels: ['20°', '40°', '120°'] })
          : poly(triangleFromAngles(50, 90), {
              angleLabels: ['50°', '90°', '40°'],
              rightAngles: [1],
            }),
      ),
    ],
    solution: say(`ex.angles.tri.${kind}`),
    advice: nameAdvice(labels, answer, byWord(TRI_WORD, 'g4.tri.adv'), 'g4.tri.adv.check', {
      m: { n: Math.max(...angles), noun: DEGREE },
    }),
  });
}

/* ---------- Level 6: quadrilaterals ---------- */

export type Quad = 'square' | 'rectangle' | 'rhombus' | 'parallelogram' | 'trapezoid' | 'kite';
export const QUAD_WORD: Record<Quad, string> = {
  square: 'ריבוע',
  rectangle: 'מלבן',
  rhombus: 'מעוין',
  parallelogram: 'מקבילית',
  trapezoid: 'טרפז',
  // In the grade 4 list of quadrilaterals.
  kite: 'דלתון',
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
  // A square and a rhombus are kites too, so they are never offered for a kite (nor a kite for them).
  kite: ['parallelogram', 'trapezoid'],
};
export const QUAD_MARKS: Record<Quad, Omit<Polygon, 'points'>> = {
  square: { ticks: [1, 1, 1, 1], rightAngles: [0, 1, 2, 3] },
  rectangle: { ticks: [1, 2, 1, 2], rightAngles: [0, 1, 2, 3] },
  rhombus: { ticks: [1, 1, 1, 1] },
  parallelogram: { ticks: [1, 2, 1, 2] },
  trapezoid: {},
  kite: { ticks: [1, 2, 2, 1] },
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
    // "זו מקבילית", "זה מלבן".
    solution: say(shape === 'parallelogram' ? 'g4.quad.solution.f' : 'ex.angles.quad.solution', {
      name: QUAD_WORD[shape],
    }),
    advice: nameAdvice(
      labels,
      answer,
      byWord(QUAD_WORD, 'ex.angles.quad.about'),
      'g4.quad.adv.check',
    ),
  });
}

/**
 * Triangles drawn to the numbers on them (a 120° label on a 120° corner):
 * points in the drawing box (0–100, y down), base at the bottom, aspect kept.
 */
export function fitTriangle(pts: [number, number][]): [number, number][] {
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
export function triangleFromAngles(a: number, b: number): [number, number][] {
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

/* ---------- Level 7: the angle between the hands of a clock ---------- */

/**
 * Times whose hands make a clear angle: whole hours, and half hours whose hour
 * hand stands well away from a right angle (never 2:30 or 8:30, near ninety).
 */
const CLOCK_TIMES: ClockTime[] = [
  ...[1, 2, 3, 4, 5, 7, 8, 9, 10, 11].map((h) => ({ h, m: 0 })),
  ...[12, 1, 4, 5, 6, 7, 10].map((h) => ({ h, m: 30 })),
];

/** The smaller angle between the hands, in degrees. */
export function handsAngle({ h, m }: ClockTime): number {
  const hour = ((h % 12) + m / 60) * 30;
  const minute = m * 6;
  const d = Math.abs(hour - minute) % 360;
  return Math.min(d, 360 - d);
}

function clockAngle(time: ClockTime, rng: Rng): Exercise {
  const kind = kindOf(handsAngle(time));
  const { labels, answer } = shuffledLabels(
    rng,
    ANGLE_WORD[kind],
    (Object.keys(ANGLE_WORD) as AngleKind[]).filter((k) => k !== kind).map((k) => ANGLE_WORD[k]),
  );
  return choiceExercise({
    level: 7,
    factId: `clock:${time.h}:${time.m}`,
    promptKey: 'ex.ang3.clock.prompt',
    visual: { type: 'clock', times: [time] },
    labels,
    answer,
    hints: [
      hint(say('ex.ang3.clock.hint1')),
      hint(say('ex.angles.kind.hint2')),
      // Three o'clock is a right angle; for a right angle, one o'clock (acute).
      kind === 'right'
        ? pictureExample(say('ex.ang3.clock.exAcute'), { type: 'clock', times: [{ h: 1, m: 0 }] })
        : pictureExample(say('ex.ang3.clock.exRight'), { type: 'clock', times: [{ h: 3, m: 0 }] }),
    ],
    solution: say(`ex.ang3.clock.${kind}`),
    advice: nameAdvice(labels, answer, byWord(ANGLE_WORD, 'g4.ang.adv.is'), 'ex.ang3.clock.check'),
  });
}

/* ---------- Level 8: the marked angle of a shape ---------- */

/** The angle at vertex i of a polygon, in degrees (between 0 and 180). */
export function vertexAngle(pts: readonly P[], i: number): number {
  const n = pts.length;
  const p = pts[i] as P;
  const a = pts[(i + n - 1) % n] as P;
  const b = pts[(i + 1) % n] as P;
  const u: P = [a[0] - p[0], a[1] - p[1]];
  const v: P = [b[0] - p[0], b[1] - p[1]];
  const cos = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

/** Which way the outline turns at vertex i; against the polygon's own way, the corner points inward. */
function turnSign(pts: readonly P[], i: number): number {
  const n = pts.length;
  const p = pts[i] as P;
  const a = pts[(i + n - 1) % n] as P;
  const b = pts[(i + 1) % n] as P;
  return Math.sign((p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]));
}

function areaSign(pts: readonly P[]): number {
  let s = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length] as P;
    s += p[0] * q[1] - q[0] * p[1];
  });
  return Math.sign(s);
}

const CORNER_SHAPES: ShapeName[] = [
  'right',
  'obtuse',
  'acute',
  'rightTrapezoid',
  'parallelogram',
  'trapezoid',
  'rhombus',
  'kite',
  'house',
  'lShape',
  'hexagon',
  'scalene',
  'rectangle',
];

/**
 * Corners whose kind is plain to the eye: exactly a right angle, or at least
 * twenty degrees away from one; never an inward corner (bigger than 180°).
 * One corner of each kind per shape.
 */
export const CORNERS: { shape: ShapeName; at: number; kind: AngleKind }[] = CORNER_SHAPES.flatMap(
  (shape) => {
    const pts = SHAPES[shape] as P[];
    const dir = areaSign(pts);
    const seen = new Set<AngleKind>();
    return pts.flatMap((_, at) => {
      if (turnSign(pts, at) !== dir) return [];
      const deg = vertexAngle(pts, at);
      const kind: AngleKind | null =
        Math.abs(deg - 90) < 0.5 ? 'right' : Math.abs(deg - 90) >= 20 ? kindOf(deg) : null;
      if (!kind || seen.has(kind)) return [];
      seen.add(kind);
      return [{ shape, at, kind }];
    });
  },
);

function cornerAngle({ shape, at, kind }: (typeof CORNERS)[number], rng: Rng): Exercise {
  const { labels, answer } = shuffledLabels(
    rng,
    ANGLE_WORD[kind],
    (Object.keys(ANGLE_WORD) as AngleKind[]).filter((k) => k !== kind).map((k) => ANGLE_WORD[k]),
  );
  return choiceExercise({
    level: 8,
    factId: `corner:${shape}:${at}`,
    promptKey: 'ex.ang3.corner.prompt',
    // An arc at the corner, never a right-angle square: the square would give it away.
    visual: poly(SHAPES[shape], { arcs: [at] }),
    labels,
    answer,
    hints: [
      hint(say('ex.ang3.corner.hint1')),
      hint(say('ex.angles.kind.hint2')),
      kind === 'right'
        ? pictureExample(say('ex.ang3.corner.exAcute'), poly(SHAPES.equilateral, { arcs: [0] }))
        : pictureExample(
            say('ex.ang3.corner.exRight'),
            poly(SHAPES.rectangle, { rightAngles: [0] }),
          ),
    ],
    solution: say(`ex.angles.kind.${kind}`),
    advice: nameAdvice(labels, answer, byWord(ANGLE_WORD, 'g4.ang.adv.is'), 'ex.ang3.corner.check'),
  });
}

/* ---------- Level 9: a square, a rectangle, a rhombus: true or false? ---------- */

type Basic = 'square' | 'rectangle' | 'rhombus';
type Prop = 'sides' | 'rights' | 'parallel' | 'opposite' | 'oneRight' | 'noRight';
const PROP_TRUE: Record<Prop, Record<Basic, boolean>> = {
  sides: { square: true, rectangle: false, rhombus: true },
  rights: { square: true, rectangle: true, rhombus: false },
  parallel: { square: true, rectangle: true, rhombus: true },
  opposite: { square: true, rectangle: true, rhombus: true },
  oneRight: { square: false, rectangle: false, rhombus: false },
  noRight: { square: false, rectangle: false, rhombus: true },
};

/** Why a statement is not true of this shape. */
function propWhy(prop: Prop, shape: Basic): TranslationKey {
  if (prop === 'sides') return 'ex.ang3.props.w.sides';
  return shape === 'rhombus' ? 'ex.ang3.props.w.noRights' : 'ex.ang3.props.w.fourRights';
}

export const PROP_FACTS = (Object.keys(PROP_TRUE) as Prop[]).flatMap((prop) =>
  (['square', 'rectangle', 'rhombus'] as Basic[]).map((shape) => ({
    prop,
    shape,
    truth: PROP_TRUE[prop][shape],
  })),
);

function shapeProp({ prop, shape, truth }: (typeof PROP_FACTS)[number]): Exercise {
  const statement = say(`ex.ang3.props.${prop}`, { name: QUAD_WORD[shape] });
  const ex: Quad = shape === 'square' ? 'rectangle' : 'square';
  return exercise({
    factId: `prop:${shape}:${prop}`,
    topicId: ID,
    level: 9,
    prompt: statement.text,
    display: '',
    spoken: say('ex.angles.tf.spoken', { s: statement.text }),
    visual: poly(SHAPES[shape], QUAD_MARKS[shape]),
    // Left to right: "לא נכון", then "נכון" on the right, where a Hebrew reader starts.
    answer: truth ? 1 : 0,
    input: labelledChoices([t('ex.angles.tf.false'), t('ex.angles.tf.true')]),
    hints: [
      hint(say('ex.ang3.props.hint1')),
      hint(say('ex.ang3.props.hint2')),
      pictureExample(say(`ex.angles.quad.about.${ex}`), poly(SHAPES[ex], QUAD_MARKS[ex])),
    ],
    solution: truth ? say('ex.ang3.props.yes') : say(propWhy(prop, shape)),
  });
}

/* ---------- Level 10: is this a line of symmetry? ---------- */

/** A dashed line through the shape, drawn a little past it at both ends. */
function through(from: P, to: P): { from: P; to: P } {
  const d: P = [to[0] - from[0], to[1] - from[1]];
  const k = 10 / Math.hypot(...d);
  return {
    from: [Math.round(from[0] - d[0] * k), Math.round(from[1] - d[1] * k)],
    to: [Math.round(to[0] + d[0] * k), Math.round(to[1] + d[1] * k)],
  };
}

export const SYM_LINES: { shape: ShapeName; id: string; line: [P, P]; yes: boolean }[] = [
  {
    shape: 'square',
    id: 'mid',
    line: [
      [50, 15],
      [50, 85],
    ],
    yes: true,
  },
  {
    shape: 'square',
    id: 'diag',
    line: [
      [15, 15],
      [85, 85],
    ],
    yes: true,
  },
  {
    shape: 'rectangle',
    id: 'mid',
    line: [
      [50, 25],
      [50, 75],
    ],
    yes: true,
  },
  {
    shape: 'rectangle',
    id: 'across',
    line: [
      [3, 50],
      [97, 50],
    ],
    yes: true,
  },
  // The classic slip: a rectangle's diagonal cuts it into two equal halves, but not mirror ones.
  {
    shape: 'rectangle',
    id: 'diag',
    line: [
      [3, 25],
      [97, 75],
    ],
    yes: false,
  },
  {
    shape: 'isosceles',
    id: 'mid',
    line: [
      [50, 3],
      [50, 92],
    ],
    yes: true,
  },
  {
    shape: 'isosceles',
    id: 'across',
    line: [
      [5, 55],
      [95, 55],
    ],
    yes: false,
  },
  {
    shape: 'equilateral',
    id: 'mid',
    line: [
      [50, 8],
      [50, 86],
    ],
    yes: true,
  },
  {
    shape: 'scalene',
    id: 'mid',
    line: [
      [30, 10],
      [50, 78],
    ],
    yes: false,
  },
  {
    shape: 'rhombus',
    id: 'mid',
    line: [
      [50, 3],
      [50, 97],
    ],
    yes: true,
  },
  {
    shape: 'rhombus',
    id: 'across',
    line: [
      [23, 50],
      [77, 50],
    ],
    yes: true,
  },
  {
    shape: 'parallelogram',
    id: 'mid',
    line: [
      [50, 25],
      [50, 75],
    ],
    yes: false,
  },
  {
    shape: 'parallelogram',
    id: 'across',
    line: [
      [3, 50],
      [97, 50],
    ],
    yes: false,
  },
  {
    shape: 'kite',
    id: 'mid',
    line: [
      [50, 5],
      [50, 95],
    ],
    yes: true,
  },
  {
    shape: 'kite',
    id: 'across',
    line: [
      [22, 38],
      [78, 38],
    ],
    yes: false,
  },
  {
    shape: 'trapezoid',
    id: 'mid',
    line: [
      [50, 25],
      [50, 75],
    ],
    yes: true,
  },
  {
    shape: 'trapezoid',
    id: 'across',
    line: [
      [3, 50],
      [97, 50],
    ],
    yes: false,
  },
  {
    shape: 'house',
    id: 'mid',
    line: [
      [50, 5],
      [50, 95],
    ],
    yes: true,
  },
  {
    shape: 'house',
    id: 'across',
    line: [
      [5, 67],
      [95, 67],
    ],
    yes: false,
  },
  {
    shape: 'hexagon',
    id: 'mid',
    line: [
      [50, 6],
      [50, 98],
    ],
    yes: true,
  },
];

function isSymLine({ shape, id, line, yes }: (typeof SYM_LINES)[number]): Exercise {
  return exercise({
    factId: `symline:${shape}:${id}`,
    topicId: ID,
    level: 10,
    prompt: t('ex.ang3.sym.prompt'),
    display: '',
    spoken: say('ex.ang3.sym.prompt'),
    visual: poly(SHAPES[shape], { height: through(...line) }),
    // "לא" on the left, "כן" on the right, where a Hebrew reader starts.
    answer: yes ? 1 : 0,
    input: labelledChoices([t('ex.ang3.no'), t('ex.ang3.yes')]),
    hints: [
      hint(say('ex.angles.sym.hint1')),
      hint(say('ex.angles.sym.hint2')),
      // Never the shape that is asked about.
      shape === 'isosceles'
        ? pictureExample(
            say('ex.ang3.sym.exampleRect'),
            poly(SHAPES.rectangle, { height: through([50, 25], [50, 75]) }),
          )
        : pictureExample(
            say('ex.angles.sym.example'),
            poly(SHAPES.isosceles, { ticks: [1, 0, 1], height: { from: [50, 3], to: [50, 92] } }),
          ),
    ],
    solution: say(yes ? 'ex.ang3.sym.yesWhy' : 'ex.ang3.sym.noWhy'),
  });
}

export const anglesTopic = defineTopic({
  id: ID,
  labelKey: 'topic.angles',
  // Grade 3's geometry. Grade 4 has its own world, "angles-4" (angles4.ts).
  grades: [3],
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
    closed(L(7), () => CLOCK_TIMES, clockAngle),
    closed(L(8), () => CORNERS, cornerAngle),
    closed(L(9), () => PROP_FACTS, shapeProp),
    closed(L(10), () => SYM_LINES, isSymLine),
  ],
});
