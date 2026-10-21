import { shown } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
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
  pictureExample,
  POOL_SIZE,
  say,
  sayText,
  type AdviceSpec,
} from '../build';
import { randInt, seededRng, shuffle } from '../rng';
import type { Exercise, Polygon, Rng, Visual } from '../types';
import {
  choiceExercise,
  DEGREE,
  fitTriangle,
  nameAdvice,
  numberChoices,
  poly,
  QUAD_MARKS,
  QUAD_WORD,
  SHAPES,
  shuffledLabels,
  SIDE_WORD,
  TRI_WORD,
  triangleFromAngles,
  byWord,
  type AngleTriKind,
  type Quad,
  type ShapeName,
  type SideKind,
} from './angles';

/**
 * World "זוויות, משולשים ומרובעים", grade 4 (grade 3 has "angles"). Kinds of
 * angles by their degrees, estimating an angle, the missing part of a right or
 * a straight angle, triangles by their angles and sides together, the angles
 * of a triangle (180°) and of a quadrilateral (360°), diagonals, what is true
 * of every parallelogram, trapezoid and rhombus, lines of symmetry, true or false.
 */

const ID = 'angles-4';
const L = (n: number) => `level.angles4.${n}`;
const DIAGONAL: Noun = { singular: 'אלכסון', plural: 'אלכסונים', gender: 'm' };
const SYM_LINE: Noun = { singular: 'קו סימטריה', plural: 'קווי סימטריה', gender: 'm' };
const deg = (n: number) => ({ n, noun: DEGREE });

type P = [number, number];

/* ---------- Level 1: the kind of an angle, by its degrees ---------- */

type Kind4 = 'acute' | 'right' | 'obtuse' | 'straight';
const KIND4_WORD: Record<Kind4, string> = {
  acute: 'חדה',
  right: 'ישרה',
  obtuse: 'קהה',
  straight: 'שטוחה',
};
const kind4 = (d: number): Kind4 =>
  d < 90 ? 'acute' : d === 90 ? 'right' : d < 180 ? 'obtuse' : 'straight';

/** Near ninety on both sides too (89°, 91°): the number decides, not the look. */
export const KIND_DEGREES = [
  10, 20, 30, 40, 50, 60, 70, 80, 85, 89, 90, 91, 95, 100, 110, 120, 130, 140, 150, 160, 170, 180,
];

function kindByDegrees(d: number, rng: Rng): Exercise {
  const kind = kind4(d);
  const all = Object.keys(KIND4_WORD) as Kind4[];
  const { labels, answer } = shuffledLabels(
    rng,
    KIND4_WORD[kind],
    all.filter((k) => k !== kind).map((k) => KIND4_WORD[k]),
  );
  const exObtuse = kind !== 'obtuse';
  return exercise({
    factId: `kind:${d}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.a4.kind.prompt'),
    display: `${d}°`,
    spoken: say('ex.a4.kind.spoken', { d: deg(d) }),
    answer,
    input: labelledChoices(labels),
    hints: [
      hint(say('ex.a4.kind.hint1')),
      hint(say('ex.a4.kind.hint2')),
      pictureExample(say(exObtuse ? 'ex.a4.kind.exObtuse' : 'ex.a4.kind.exAcute'), {
        type: 'angle',
        deg: exObtuse ? 120 : 40,
      }),
    ],
    solution: say(`ex.a4.kind.${kind}`, { d: deg(d) }),
    advice: nameAdvice(labels, answer, byWord(KIND4_WORD, 'ex.a4.kind.adv'), 'ex.a4.kind.check'),
  });
}

/* ---------- Level 2: about how many degrees? ---------- */

/** Two wrong sizes per angle, far enough from it to tell by eye (fixed, so all advice is recorded). */
const MEASURE: Record<number, [number, number]> = {
  30: [90, 150],
  45: [90, 150],
  60: [120, 150],
  90: [45, 135],
  120: [45, 90],
  135: [45, 90],
  150: [90, 45],
};

export const MEASURE_FACTS = Object.keys(MEASURE).flatMap((d) =>
  [0, 20].map((turn) => ({ d: Number(d), turn })),
);

function measure({ d, turn }: (typeof MEASURE_FACTS)[number], rng: Rng): Exercise {
  const wrong = MEASURE[d] ?? [90, 150];
  const values = shuffle(rng, [d, ...wrong]);
  const labels = values.map((v) => `${v}°`);
  const answer = values.indexOf(d);
  const advice: AdviceSpec[] = values.flatMap((v, i) =>
    v === d
      ? []
      : [
          {
            value: i,
            say: say(v < d ? 'ex.a4.measure.less' : 'ex.a4.measure.more', { v: deg(v) }),
          },
        ],
  );
  return exercise({
    factId: `measure:${d}:${turn}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.a4.measure.prompt'),
    display: '',
    spoken: say('ex.a4.measure.prompt'),
    visual: { type: 'angle', deg: d, turn },
    answer,
    input: labelledChoices(labels),
    hints: [
      hint(say('ex.a4.measure.hint1')),
      hint(say('ex.a4.measure.hint2')),
      d === 90
        ? pictureExample(say('ex.a4.measure.ex45'), { type: 'angle', deg: 45 })
        : pictureExample(say('ex.a4.measure.ex90'), { type: 'angle', deg: 90 }),
    ],
    solution: say('ex.a4.measure.solution', { d: deg(d) }),
    advice,
  });
}

/* ---------- Level 3: the missing part of a right or a straight angle ---------- */

export const SPLIT_FACTS: { total: 90 | 180; part: number }[] = [
  ...[20, 30, 40, 45, 50, 60, 70].map((part) => ({ total: 90 as const, part })),
  ...[30, 40, 45, 60, 70, 80, 100, 110, 120, 135, 140, 150].map((part) => ({
    total: 180 as const,
    part,
  })),
];

function missingPart({ total, part }: (typeof SPLIT_FACTS)[number]): Exercise {
  const c = total - part;
  // Examples with fives (35°, 65°): never one of these answers, all whole tens or 45/135.
  const examples = total === 90 ? [35, 15] : [35, 65];
  return exercise({
    factId: `split:${total}:${part}`,
    topicId: ID,
    level: 3,
    prompt: t(`ex.a4.split.prompt${total}`),
    display: '',
    spoken: say(`ex.a4.split.spoken${total}`, { a: deg(part) }),
    visual: { type: 'angleSplit', total, part },
    answer: c,
    input: numpad(3),
    hints: [
      hint(say(`ex.a4.split.hint${total}`)),
      hint(say('ex.a4.split.hint2'), {
        example: { display: `${total} − ${part} = ?`, spoken: say('ex.a4.split.hint2') },
      }),
      exampleAvoiding(
        c,
        examples.map((a) => ({
          answer: total - a,
          hint: () =>
            exampleHint(
              `${total} − ${a} = ${total - a}`,
              say('ex.a4.split.solution', { t: total, a, c: deg(total - a) }),
            ),
        })),
      ),
    ],
    solution: say('ex.a4.split.solution', { t: total, a: part, c: deg(c) }),
    diagnose: (v) => (v === total + part ? 'wrongOperation' : null),
  });
}

/* ---------- Level 4: triangles by their angles and their sides together ---------- */

/** Angles at vertices 0, 1, 2; equal angles stand opposite equal sides. */
export const BOTH_FACTS: [number, number, number][] = [
  [60, 60, 60],
  [70, 70, 40],
  [50, 50, 80],
  [50, 60, 70],
  [45, 80, 55],
  [45, 45, 90],
  [30, 90, 60],
  [60, 30, 90],
  [30, 30, 120],
  [25, 25, 130],
  [20, 40, 120],
  [25, 45, 110],
];

export function triKinds(angles: readonly number[]): { angle: AngleTriKind; side: SideKind } {
  const max = Math.max(...angles);
  const angle: AngleTriKind = max < 90 ? 'acute' : max === 90 ? 'right' : 'obtuse';
  const distinct = new Set(angles).size;
  const side: SideKind = distinct === 1 ? 'equilateral' : distinct === 2 ? 'isosceles' : 'scalene';
  return { angle, side };
}

const bothName = (angle: AngleTriKind, side: SideKind) => `${TRI_WORD[angle]} ו${SIDE_WORD[side]}`;
const OTHER_ANGLE: Record<AngleTriKind, AngleTriKind> = {
  acute: 'right',
  right: 'obtuse',
  obtuse: 'acute',
};
/** Never "isosceles" for an equilateral triangle: it is isosceles too. */
const OTHER_SIDE: Record<SideKind, SideKind> = {
  equilateral: 'scalene',
  isosceles: 'scalene',
  scalene: 'isosceles',
};

/** Ticks on the sides opposite equal angles (side i joins vertex i to i + 1, opposite vertex i + 2). */
function equalTicks(angles: readonly number[]): number[] {
  return [0, 1, 2].map((side) => {
    const opposite = angles[(side + 2) % 3] ?? 0;
    return angles.filter((x) => x === opposite).length > 1 ? 1 : 0;
  });
}

function triangleBoth(angles: [number, number, number], rng: Rng): Exercise {
  const { angle, side } = triKinds(angles);
  const right = bothName(angle, side);
  const wrongAngle = bothName(OTHER_ANGLE[angle], side === 'equilateral' ? 'isosceles' : side);
  const wrongSide = bothName(angle, OTHER_SIDE[side]);
  const { labels, answer } = shuffledLabels(rng, right, [wrongAngle, wrongSide]);
  const advice: AdviceSpec[] = labels.flatMap((label, i) =>
    label === wrongAngle
      ? [
          {
            value: i,
            say: sayText(`${t(`g4.tri.adv.${OTHER_ANGLE[angle]}`)} ${t('g4.tri.adv.check')}`, {
              m: deg(Math.max(...angles)),
            }),
          },
        ]
      : label === wrongSide
        ? [
            {
              value: i,
              say: sayText(`${t(`g4.sides.adv.${OTHER_SIDE[side]}`)} ${t('ex.a4.both.sideCheck')}`),
            },
          ]
        : [],
  );
  const isRightIsosceles = angle === 'right' && side === 'isosceles';
  return choiceExercise({
    topicId: ID,
    level: 4,
    factId: `both:${angles.join(',')}`,
    promptKey: 'ex.a4.both.prompt',
    visual: poly(triangleFromAngles(angles[0], angles[1]), {
      angleLabels: angles.map((a) => `${a}°`),
      ticks: equalTicks(angles),
      ...(angle === 'right' ? { rightAngles: [angles.indexOf(90)] } : {}),
    }),
    labels,
    answer,
    hints: [
      hint(say('ex.a4.both.hint1')),
      hint(say('ex.a4.both.hint2')),
      isRightIsosceles
        ? pictureExample(
            say('ex.a4.both.exObtuse'),
            poly(triangleFromAngles(35, 25), { angleLabels: ['35°', '25°', '120°'] }),
          )
        : pictureExample(
            say('ex.a4.both.exRight'),
            poly(triangleFromAngles(45, 45), {
              angleLabels: ['45°', '45°', '90°'],
              ticks: [0, 1, 1],
              rightAngles: [2],
            }),
          ),
    ],
    solution: say('ex.a4.both.solution', { name: right }),
    advice,
  });
}

/* ---------- Level 5: the third angle of a triangle ---------- */

function thirdAngle(a: number, b: number): Exercise {
  const c = 180 - a - b;
  return exercise({
    factId: `third:${a}:${b}`,
    topicId: ID,
    level: 5,
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

/** Two angles of a triangle in fives, the third at least 15°. */
function randomPair(rng: Rng): [number, number] {
  let a: number;
  let b: number;
  do {
    a = randInt(rng, 4, 24) * 5;
    b = randInt(rng, 4, 24) * 5;
  } while (180 - a - b < 15);
  return [a, b];
}

/** FNV-1a, as `defineTopic` seeds an open level's pool. */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * The same triangles this level had as level 7 of "angles" (an open level's
 * pool, seeded by "angles:7"), now a closed list: every sentence of it is
 * already in the audio bank.
 */
let thirdPairs: [number, number][] | null = null;
export function thirdFacts(): [number, number][] {
  if (thirdPairs) return thirdPairs;
  const base = hashString('angles:7');
  const size = POOL_SIZE.sense;
  const out = new Map<string, [number, number]>();
  for (let k = 0; k < size * 8 && out.size < size; k++) {
    const pair = randomPair(seededRng((base + k * 7919) >>> 0));
    out.set(pair.join(':'), pair);
  }
  thirdPairs = [...out.values()];
  return thirdPairs;
}

/* ---------- Level 6: the angles of a quadrilateral ---------- */

/** Four angles (sum 360°), in order around the shape, every one below 180°. */
export const QUAD_ANGLES: [number, number, number, number][] = [
  [90, 90, 90, 90],
  [90, 90, 120, 60],
  [90, 90, 135, 45],
  [90, 90, 100, 80],
  [110, 70, 110, 70],
  [100, 80, 100, 80],
  [60, 120, 120, 60],
  [75, 105, 105, 75],
  [80, 95, 85, 100],
  [70, 100, 90, 100],
  [85, 95, 110, 70],
  [65, 115, 65, 115],
  [120, 80, 70, 90],
  [130, 50, 90, 90],
];

/** Which angle is hidden: a different corner from one quadrilateral to the next. */
export const QUAD_FACTS = QUAD_ANGLES.map((angles, i) => ({ angles, hide: (i * 3 + 1) % 4 }));

/**
 * A quadrilateral drawn to its own angles: P0 = (0, 0), P1 = (1, 0), going
 * round counterclockwise; of the lengths that close it, the most even sides.
 */
export function quadFromAngles([a, b, c]: readonly number[]): P[] {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dir = (d: number): P => [Math.cos(rad(d)), Math.sin(rad(d))];
  const e1 = 180 - (b ?? 0);
  const e2 = e1 + 180 - (c ?? 0);
  let best: P[] = [];
  let bestScore = -1;
  for (let l3 = 0.5; l3 <= 1.6; l3 += 0.05) {
    const p3: P = [l3 * Math.cos(rad(a ?? 0)), l3 * Math.sin(rad(a ?? 0))];
    // P1 + s·dir(e1) = P3 − u·dir(e2), solved for s and u.
    const [d1x, d1y] = dir(e1);
    const [d2x, d2y] = dir(e2);
    const rx = p3[0] - 1;
    const ry = p3[1];
    const det = d1x * d2y - d1y * d2x;
    if (Math.abs(det) < 1e-9) continue;
    const s = (rx * d2y - ry * d2x) / det;
    const u = (d1x * ry - d1y * rx) / det;
    if (s <= 0.2 || u <= 0.2) continue;
    const sides = [1, s, u, l3];
    const score = Math.min(...sides) / Math.max(...sides);
    if (score > bestScore) {
      bestScore = score;
      best = [[0, 0], [1, 0], [1 + s * d1x, s * d1y], p3];
    }
  }
  return fitTriangle(best);
}

function quadAngle({ angles, hide }: (typeof QUAD_FACTS)[number]): Exercise {
  const answer = angles[hide] ?? 0;
  const known = angles.filter((_, i) => i !== hide);
  const [a, b, c] = known as [number, number, number];
  return exercise({
    factId: `quad4:${angles.join(',')}:${hide}`,
    topicId: ID,
    level: 6,
    prompt: t('ex.a4.quad.prompt'),
    display: '',
    spoken: say('ex.a4.quad.spoken', { a: deg(a), b: deg(b), c: deg(c) }),
    visual: poly(quadFromAngles(angles), {
      angleLabels: angles.map((x, i) => (i === hide ? '?' : `${x}°`)),
      // A known right angle gets its square; the hidden one never does.
      rightAngles: angles.flatMap((x, i) => (x === 90 && i !== hide ? [i] : [])),
    }),
    answer,
    input: numpad(3),
    hints: [
      hint(say('ex.a4.quad.hint1')),
      hint(say('ex.a4.quad.hint2'), {
        example: { display: `360 − ${a} − ${b} − ${c} = ?`, spoken: say('ex.a4.quad.hint2') },
      }),
      exampleAvoiding(
        answer,
        [
          [90, 90, 70],
          [100, 80, 60],
        ].map(([x, y, z]) => {
          const d = 360 - (x ?? 0) - (y ?? 0) - (z ?? 0);
          return {
            answer: d,
            hint: () =>
              exampleHint(
                `360 − ${x} − ${y} − ${z} = ${d}`,
                say('ex.a4.quad.solution', { a: x ?? 0, b: y ?? 0, c: z ?? 0, d: deg(d) }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.a4.quad.solution', { a, b, c, d: deg(answer) }),
    // Added the three and stopped there.
    diagnose: (v) => (v === a + b + c ? 'wrongOperation' : null),
  });
}

/* ---------- Level 7: diagonals ---------- */

const DIAGONALS: [ShapeName, string, number][] = [
  ['equilateral', 'משולש', 0],
  ['square', 'ריבוע', 2],
  ['rectangle', 'מלבן', 2],
  ['trapezoid', 'טרפז', 2],
  ['pentagon', 'מחומש', 5],
  ['hexagon', 'משושה', 9],
  ['rhombus', 'מעוין', 2],
  ['parallelogram', 'מקבילית', 2],
  ['kite', 'דלתון', 2],
];

function diagonals([shape, name, n]: [ShapeName, string, number], rng: Rng): Exercise {
  const ex: [ShapeName, string] = shape === 'square' ? ['pentagon', 'מחומש'] : ['square', 'ריבוע'];
  return exercise({
    factId: `diag:${shape}`,
    topicId: ID,
    level: 7,
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

/* ---------- Level 8: what is true of every parallelogram, trapezoid, rhombus ---------- */

type Prop4 =
  | 'twoPairs'
  | 'onePair'
  | 'oppSides'
  | 'oppAngles'
  | 'allSides'
  | 'fourRight'
  | 'diagPerp'
  | 'noParallel';
type Shape4 = Extract<Quad, 'parallelogram' | 'trapezoid' | 'rhombus'>;

/**
 * What is true of EVERY such shape (a trapezoid has exactly one pair of
 * parallel sides, as in the curriculum; a rhombus is a parallelogram too).
 */
const ALWAYS: Record<Shape4, Prop4[]> = {
  parallelogram: ['twoPairs', 'oppSides', 'oppAngles'],
  trapezoid: ['onePair'],
  rhombus: ['twoPairs', 'oppSides', 'oppAngles', 'allSides', 'diagPerp'],
};
const NOT_ALWAYS: Record<Shape4, Prop4[]> = {
  parallelogram: ['allSides', 'fourRight', 'onePair', 'diagPerp', 'noParallel'],
  trapezoid: ['twoPairs', 'oppSides', 'fourRight', 'allSides', 'noParallel', 'oppAngles'],
  rhombus: ['fourRight', 'onePair', 'noParallel'],
};

/** The true statement and two that are not always true, a different pair each time. */
export const PROP4_FACTS: { shape: Shape4; right: Prop4; wrong: [Prop4, Prop4] }[] = [
  { shape: 'parallelogram', right: 'twoPairs', wrong: ['onePair', 'fourRight'] },
  { shape: 'parallelogram', right: 'oppSides', wrong: ['allSides', 'noParallel'] },
  { shape: 'parallelogram', right: 'oppAngles', wrong: ['fourRight', 'diagPerp'] },
  { shape: 'trapezoid', right: 'onePair', wrong: ['twoPairs', 'allSides'] },
  { shape: 'trapezoid', right: 'onePair', wrong: ['oppSides', 'noParallel'] },
  { shape: 'rhombus', right: 'allSides', wrong: ['fourRight', 'onePair'] },
  { shape: 'rhombus', right: 'diagPerp', wrong: ['fourRight', 'noParallel'] },
  { shape: 'rhombus', right: 'oppAngles', wrong: ['onePair', 'fourRight'] },
];

export const isAlways = (shape: Shape4, prop: Prop4) => ALWAYS[shape].includes(prop);
export const isNotAlways = (shape: Shape4, prop: Prop4) => NOT_ALWAYS[shape].includes(prop);

const PROP4_MARKS: Record<Shape4, Omit<Polygon, 'points'>> = {
  parallelogram: QUAD_MARKS.parallelogram,
  trapezoid: QUAD_MARKS.trapezoid,
  rhombus: QUAD_MARKS.rhombus,
};

function shapeProps({ shape, right, wrong }: (typeof PROP4_FACTS)[number], rng: Rng): Exercise {
  const word = (p: Prop4) => t(`ex.a4.prop.p.${p}`);
  const { labels, answer } = shuffledLabels(rng, word(right), wrong.map(word));
  const name = QUAD_WORD[shape];
  const visual: Visual = poly(SHAPES[shape], {
    ...PROP4_MARKS[shape],
    ...(right === 'diagPerp' ? { diagonals: true } : {}),
  });
  return choiceExercise({
    topicId: ID,
    level: 8,
    factId: `prop4:${shape}:${right}:${wrong.join(',')}`,
    promptKey: `ex.a4.prop.prompt.${shape}`,
    visual,
    labels,
    answer,
    hints: [
      hint(say('ex.a4.prop.hint1')),
      hint(say('ex.a4.prop.hint2')),
      pictureExample(say('ex.angles.quad.about.square'), poly(SHAPES.square, QUAD_MARKS.square)),
    ],
    solution: say('ex.a4.prop.solution', { name, prop: word(right) }),
    advice: labels.flatMap((label, i) =>
      i === answer ? [] : [{ value: i, say: say('ex.a4.prop.adv', { name, prop: label }) }],
    ),
  });
}

/* ---------- Level 9: lines of symmetry ---------- */

const SYMMETRY: [ShapeName, string, number, Omit<Polygon, 'points'>][] = [
  ['square', 'ריבוע', 4, { ticks: [1, 1, 1, 1], rightAngles: [0, 1, 2, 3] }],
  ['rectangle', 'מלבן', 2, { rightAngles: [0, 1, 2, 3] }],
  ['equilateral', 'משולש שווה צלעות', 3, { ticks: [1, 1, 1] }],
  ['isosceles', 'משולש שווה שוקיים', 1, { ticks: [1, 0, 1] }],
  ['rhombus', 'מעוין', 2, { ticks: [1, 1, 1, 1] }],
  ['parallelogram', 'מקבילית', 0, {}],
  ['scalene', 'משולש שונה צלעות', 0, {}],
  ['kite', 'דלתון', 1, { ticks: [1, 2, 2, 1] }],
  ['trapezoid', 'טרפז שווה שוקיים', 1, { ticks: [0, 1, 0, 1] }],
  ['hexagon', 'משושה משוכלל', 6, { ticks: [1, 1, 1, 1, 1, 1] }],
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

/** What a statement is about: its last hint pictures that (a shape, lines, angles). */
type About = 'shape' | 'lines' | 'angles';

const STATEMENTS: { key: TranslationKey; truth: boolean; why?: TranslationKey; about: About }[] = [
  { key: 'ex.angles.tf.s1', truth: true, about: 'shape' },
  { key: 'ex.angles.tf.s2', truth: true, about: 'shape' },
  { key: 'ex.angles.tf.s3', truth: false, why: 'ex.angles.tf.w3', about: 'shape' },
  { key: 'ex.angles.tf.s4', truth: true, about: 'shape' },
  { key: 'ex.angles.tf.s5', truth: false, why: 'ex.angles.tf.w5', about: 'angles' },
  { key: 'ex.angles.tf.s6', truth: true, about: 'angles' },
  { key: 'ex.angles.tf.s7', truth: false, why: 'ex.angles.tf.w7', about: 'shape' },
  { key: 'ex.angles.tf.s8', truth: true, about: 'shape' },
  { key: 'ex.angles.tf.s9', truth: false, why: 'ex.angles.tf.w9', about: 'angles' },
  { key: 'ex.angles.tf.s10', truth: true, about: 'angles' },
  { key: 'ex.angles.tf.s11', truth: true, about: 'lines' },
  { key: 'ex.angles.tf.s12', truth: false, why: 'ex.angles.tf.w12', about: 'lines' },
  { key: 'ex.angles.tf.s13', truth: true, about: 'angles' },
  { key: 'ex.angles.tf.s14', truth: false, why: 'ex.angles.tf.w14', about: 'shape' },
  { key: 'g4.tf.s15', truth: true, about: 'shape' },
  { key: 'g4.tf.s16', truth: false, why: 'g4.tf.w16', about: 'shape' },
  { key: 'g4.tf.s17', truth: false, why: 'g4.tf.w17', about: 'angles' },
];

const TF_HINT3: Record<About, TranslationKey> = {
  shape: 'ex.angles.tf.hint3',
  lines: 'g4.tf.hint3.lines',
  angles: 'g4.tf.hint3.angles',
};

function trueFalse({ key, truth, why, about }: (typeof STATEMENTS)[number]): Exercise {
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
      hint(say(TF_HINT3[about])),
    ],
    solution: truth ? say('ex.angles.tf.yes') : say(why ?? 'ex.angles.tf.no'),
  });
}

export const angles4 = defineTopic({
  id: ID,
  labelKey: 'topic.angles4',
  grades: [4],
  startLevel: () => 1,
  levels: [
    closed(L(1), () => KIND_DEGREES, kindByDegrees),
    closed(L(2), () => MEASURE_FACTS, measure),
    closed(
      L(3),
      () => SPLIT_FACTS,
      (f: (typeof SPLIT_FACTS)[number]) => missingPart(f),
    ),
    closed(L(4), () => BOTH_FACTS, triangleBoth),
    closed(L(5), thirdFacts, ([a, b]: [number, number]) => thirdAngle(a, b)),
    closed(
      L(6),
      () => QUAD_FACTS,
      (f: (typeof QUAD_FACTS)[number]) => quadAngle(f),
    ),
    closed(
      L(7),
      () => DIAGONALS,
      (f: [ShapeName, string, number], rng) => diagonals(f, rng),
    ),
    closed(L(8), () => PROP4_FACTS, shapeProps),
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
