import { shown } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import type { MistakeKind } from '@/state/schema';
import {
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  say,
  type Said,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Polygon, Rng, Visual } from '../types';

/**
 * World "שטחים ונפחים", grade 5 (phase 6). Area of rectangles and squares
 * (review), right triangles, any triangle, parallelograms, trapezoids and a
 * composite shape; the volume of a box, first by counting cubes, then by
 * the formula; units of area and volume; word problems.
 */

const ID = 'areas';
const L = (n: number) => `level.areas.${n}`;
const CM: Noun = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' };
const CM2: Noun = { singular: 'סנטימטר רבוע', plural: 'סנטימטרים רבועים', gender: 'm' };
const CM3: Noun = { singular: 'סנטימטר מעוקב', plural: 'סנטימטרים מעוקבים', gender: 'm' };
const M: Noun = { singular: 'מטר', plural: 'מטרים', gender: 'm' };
const M2: Noun = { singular: 'מטר רבוע', plural: 'מטרים רבועים', gender: 'm' };
const CUBE: Noun = { singular: 'קובייה', plural: 'קוביות', gender: 'f' };

const cm = (n: number) => ({ n, noun: CM });
const cm2 = (n: number) => ({ n, noun: CM2 });
const poly = (points: [number, number][], extra: Omit<Polygon, 'points'> = {}): Visual => ({
  type: 'polygon',
  points,
  ...extra,
});
const lab = (n: number) => `${n} ס״מ`;

type Pt = [number, number];

/**
 * A shape drawn to its own measures (the longer side looks longer), from points
 * in centimetres (y down), fitted into the drawing box. Very long, thin shapes
 * are squashed to at most 3 : 1 so they stay readable, still longer the right way.
 */
function drawn(points: Pt[], extra: Omit<Polygon, 'points'> = {}): Visual {
  const all = [...points, ...(extra.height ? [extra.height.from, extra.height.to] : [])];
  const minX = Math.min(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const w = Math.max(...all.map((p) => p[0])) - minX || 1;
  const h = Math.max(...all.map((p) => p[1])) - minY || 1;
  // Same scale both ways, except that the short side is drawn at least a third of the long one.
  const k = 92 / Math.max(w, h);
  const kx = h > 3 * w ? 92 / 3 / w : k;
  const ky = w > 3 * h ? 92 / 3 / h : k;
  const W = w * kx;
  const H = h * ky;
  const map = ([x, y]: Pt): Pt => [
    Math.round((x - minX) * kx + (100 - W) / 2),
    Math.round((y - minY) * ky + (100 - H) / 2),
  ];
  return poly(points.map(map), {
    ...extra,
    ...(extra.height ? { height: { ...extra.height, from: map(extra.height.from), to: map(extra.height.to) } } : {}),
  });
}

interface AreaParts {
  level: number;
  factId: string;
  spoken: Said;
  visual: Visual;
  display: string;
  answer: number;
  hints: [Hint, Hint];
  /** Hint 3; never an example with this answer, which would give it away. */
  example: Hint;
  solution: Said;
  digits?: number;
  /** The typical slips for this shape (the rectangle's perimeter, a triangle not halved). */
  slips?: (v: number) => MistakeKind | null;
  /** What should be done, for "read the question again": multiply (rectangle) or halve (triangle). */
  operation?: 'mul' | 'div';
}

/**
 * Hint 3 from the first of these examples whose value is not this answer:
 * an example with the same answer would give it away.
 */
function avoiding<T>(
  answer: number,
  options: readonly T[],
  value: (o: T) => number,
  show: (o: T, v: number) => Hint,
): Hint {
  return exampleAvoiding(
    answer,
    options.map((o) => ({ answer: value(o), hint: () => show(o, value(o)) })),
  );
}

function areaExercise(p: AreaParts): Exercise {
  return exercise({
    factId: p.factId,
    topicId: ID,
    level: p.level,
    prompt: t('ex.areas.prompt'),
    // The picture carries the numbers; the formula is the second hint, not the question.
    display: '',
    spoken: p.spoken,
    visual: p.visual,
    answer: p.answer,
    input: numpad(p.digits ?? 3),
    hints: [
      p.hints[0],
      { ...p.hints[1], example: { display: p.display, spoken: p.hints[1].spoken } },
      p.example,
    ],
    solution: p.solution,
    ...(p.operation ? { operation: p.operation } : {}),
    // The shape's own slips; otherwise a slip of one or of ten.
    diagnose: (v) =>
      p.slips?.(v) ??
      (Math.abs(v - p.answer) === 1
        ? 'offByOne'
        : Math.abs(v - p.answer) === 10
          ? 'offByTen'
          : null),
  });
}

/* ---------- Level 1: rectangles and squares ---------- */

function rectangle(rng: Rng): Exercise {
  const square = rng() < 0.3;
  const x = randInt(rng, 3, 20);
  const y = square ? x : randInt(rng, 3, 20);
  // The length is the longer side, as in school (and on the long side of the picture).
  const a = Math.max(x, y);
  const b = Math.min(x, y);
  const solved = (x: number, y: number) =>
    say('ex.areas.rect.solution', { a: x, b: y, s: cm2(x * y) });
  return areaExercise({
    level: 1,
    factId: `rect:${a}x${b}`,
    spoken: square
      ? say('ex.areas.square.spoken', { a: cm(a) })
      : say('ex.areas.rect.spoken', { a: cm(a), b: cm(b) }),
    visual: drawn(
      [
        [0, 0],
        [a, 0],
        [a, b],
        [0, b],
      ],
      { sideLabels: [lab(a), square ? null : lab(b), null, null], rightAngles: [0, 1, 2, 3] },
    ),
    display: `${a} × ${b} = ?`,
    answer: a * b,
    // A square: the side times itself; a rectangle: these two numbers.
    hints: [
      hint(say('ex.areas.rect.hint1')),
      hint(square ? say('ex.areas.rect.hint2') : say('ar.rect.hint2', { a, b })),
    ],
    example: avoiding(
      a * b,
      [
        { a: 6, b: 4 },
        { a: 7, b: 3 },
      ],
      (e) => e.a * e.b,
      (e, v) => exampleHint(`${e.a} × ${e.b} = ${v}`, solved(e.a, e.b)),
    ),
    solution: solved(a, b),
    // The perimeter instead of the area, or the two sides added.
    slips: (v) => (v === 2 * (a + b) ? 'shapeFormula' : v === a + b ? 'wrongOperation' : null),
    operation: 'mul',
  });
}

/* ---------- Levels 2–3: triangles ---------- */

function rightTriangle(rng: Rng): Exercise {
  let a: number;
  let b: number;
  do {
    a = randInt(rng, 3, 16);
    b = randInt(rng, 3, 16);
  } while ((a * b) % 2 !== 0);
  const solved = (x: number, y: number) =>
    say('ex.areas.half.solution', { a: x, b: y, p: x * y, s: cm2((x * y) / 2) });
  return areaExercise({
    level: 2,
    factId: `rtri:${a}x${b}`,
    spoken: say('ex.areas.rtri.spoken', { a: cm(a), b: cm(b) }),
    visual: drawn(
      [
        [0, 0],
        [0, a],
        [b, a],
      ],
      { sideLabels: [lab(a), lab(b), null], rightAngles: [1] },
    ),
    display: `${a} × ${b} ÷ 2 = ?`,
    answer: (a * b) / 2,
    hints: [hint(say('ex.areas.rtri.hint1')), hint(say('ex.areas.half.hint2'))],
    example: avoiding(
      (a * b) / 2,
      [
        { a: 6, b: 8 },
        { a: 4, b: 10 },
      ],
      (e) => (e.a * e.b) / 2,
      (e, v) => exampleHint(`${e.a} × ${e.b} ÷ 2 = ${v}`, solved(e.a, e.b)),
    ),
    solution: solved(a, b),
    // The whole rectangle, not halved.
    slips: (v) => (v === a * b ? 'wrongOperation' : null),
    operation: 'div',
  });
}

function triangle(rng: Rng): Exercise {
  let b: number;
  let h: number;
  do {
    b = randInt(rng, 4, 20);
    h = randInt(rng, 3, 15);
  } while ((b * h) % 2 !== 0);
  // Half the triangles are obtuse: the top is past the end of the base, and the height
  // falls outside the triangle (the curriculum's case, not only the acute one).
  const obtuse = rng() < 0.5;
  const top = obtuse ? b * 1.4 : b * 0.35;
  const solved = (x: number, y: number) =>
    say('ex.areas.half.solution', { a: x, b: y, p: x * y, s: cm2((x * y) / 2) });
  return areaExercise({
    level: 3,
    factId: `tri${obtuse ? 'O' : ''}:${b}x${h}`,
    spoken: say('ex.areas.tri.spoken', { b: cm(b), h: cm(h) }),
    visual: drawn(
      [
        [0, h],
        [b, h],
        [top, 0],
      ],
      { sideLabels: [lab(b), null, null], height: { from: [top, 0], to: [top, h], label: lab(h) } },
    ),
    display: `${b} × ${h} ÷ 2 = ?`,
    answer: (b * h) / 2,
    hints: [
      hint(say(obtuse ? 'ar.tri.obtuse.hint1' : 'ex.areas.tri.hint1')),
      hint(say('ex.areas.half.hint2')),
    ],
    example: avoiding(
      (b * h) / 2,
      [
        { a: 10, b: 6 },
        { a: 8, b: 5 },
      ],
      (e) => (e.a * e.b) / 2,
      (e, v) => exampleHint(`${e.a} × ${e.b} ÷ 2 = ${v}`, solved(e.a, e.b)),
    ),
    solution: solved(b, h),
    slips: (v) => (v === b * h ? 'wrongOperation' : null),
    operation: 'div',
  });
}

/* ---------- Levels 4–5: parallelogram, trapezoid ---------- */

/** Height, sideways shift and slanted side of a parallelogram: whole numbers (3, 4, 5). */
const SLANTS: readonly [number, number, number][] = [
  [3, 4, 5],
  [4, 3, 5],
  [6, 8, 10],
  [8, 6, 10],
  [5, 12, 13],
  [12, 5, 13],
  [9, 12, 15],
  [12, 9, 15],
  [8, 15, 17],
  [15, 8, 17],
  [12, 16, 20],
];

function parallelogram(rng: Rng): Exercise {
  const b = randInt(rng, 4, 20);
  // The slanted side is given too, as in school: it is not the height.
  const [h, off, slant] = pick(rng, SLANTS);
  const solved = (x: number, y: number) =>
    say('ex.areas.rect.solution', { a: x, b: y, s: cm2(x * y) });
  return areaExercise({
    level: 4,
    factId: `para:${b}x${h}/${slant}`,
    spoken: say('ar.para.spoken', { b: cm(b), s: cm(slant), h: cm(h) }),
    visual: drawn(
      [
        [off, 0],
        [b + off, 0],
        [b, h],
        [0, h],
      ],
      {
        sideLabels: [null, null, lab(b), lab(slant)],
        height: { from: [off, 0], to: [off, h], label: lab(h) },
      },
    ),
    display: `${b} × ${h} = ?`,
    answer: b * h,
    hints: [hint(say('ex.areas.para.hint1')), hint(say('ex.areas.para.hint2'))],
    example: avoiding(
      b * h,
      [
        { a: 9, b: 4 },
        { a: 8, b: 5 },
      ],
      (e) => e.a * e.b,
      (e, v) => exampleHint(`${e.a} × ${e.b} = ${v}`, solved(e.a, e.b)),
    ),
    solution: solved(b, h),
    // The slanted side times the base: the usual slip (hint 2 says why not).
    slips: (v) => (v === b * slant || v === (b * h) / 2 ? 'other' : null),
  });
}

function trapezoid(rng: Rng): Exercise {
  let a: number;
  let b: number;
  let h: number;
  do {
    a = randInt(rng, 3, 12);
    b = a + randInt(rng, 2, 10);
    h = randInt(rng, 3, 12);
  } while (((a + b) * h) % 2 !== 0);
  const area = ((a + b) * h) / 2;
  const solved = (x: number, y: number, z: number) =>
    say('ex.areas.trap.solution', { a: x, b: y, sum: x + y, h: z, s: cm2(((x + y) * z) / 2) });
  return areaExercise({
    level: 5,
    factId: `trap:${a}:${b}:${h}`,
    spoken: say('ex.areas.trap.spoken', { a: cm(a), b: cm(b), h: cm(h) }),
    visual: drawn(
      [
        [(b - a) / 2, 0],
        [(b + a) / 2, 0],
        [b, h],
        [0, h],
      ],
      {
        sideLabels: [lab(a), null, lab(b), null],
        height: { from: [(b - a) / 2, 0], to: [(b - a) / 2, h], label: lab(h) },
      },
    ),
    display: `(${a} + ${b}) × ${h} ÷ 2 = ?`,
    answer: area,
    hints: [hint(say('ex.areas.trap.hint1')), hint(say('ex.areas.trap.hint2'))],
    example: avoiding(
      area,
      [
        { a: 4, b: 8, h: 5 },
        { a: 6, b: 10, h: 4 },
      ],
      (e) => ((e.a + e.b) * e.h) / 2,
      (e, v) => exampleHint(`(${e.a} + ${e.b}) × ${e.h} ÷ 2 = ${v}`, solved(e.a, e.b, e.h)),
    ),
    solution: solved(a, b, h),
    // Not halved, or all three multiplied.
    slips: (v) => (v === (a + b) * h ? 'wrongOperation' : v === (a * b * h) / 2 ? 'other' : null),
    operation: 'div',
  });
}

/* ---------- Level 6: a house (a rectangle and a triangle) ---------- */

function house(rng: Rng): Exercise {
  let w: number;
  const hgt = randInt(rng, 3, 10);
  let roof: number;
  do {
    w = randInt(rng, 4, 14);
    roof = randInt(rng, 2, 8);
  } while ((w * roof) % 2 !== 0 || roof < 3);
  const area = w * hgt + (w * roof) / 2;
  const solved = (a: number, b: number, c: number) =>
    say('ex.areas.house.solution', {
      rect: a * b,
      tri: (a * c) / 2,
      s: cm2(a * b + (a * c) / 2),
    });
  return areaExercise({
    level: 6,
    factId: `house:${w}:${hgt}:${roof}`,
    spoken: say('ex.areas.house.spoken', { w: cm(w), h: cm(hgt), r: cm(roof) }),
    visual: drawn(
      [
        [0, roof],
        [w / 2, 0],
        [w, roof],
        [w, roof + hgt],
        [0, roof + hgt],
      ],
      {
        sideLabels: [null, null, lab(hgt), lab(w), null],
        height: { from: [w / 2, 0], to: [w / 2, roof], label: lab(roof) },
        rightAngles: [3, 4],
      },
    ),
    display: `${w} × ${hgt} + ${w} × ${roof} ÷ 2 = ?`,
    answer: area,
    hints: [hint(say('ex.areas.house.hint1')), hint(say('ex.areas.house.hint2'))],
    example: avoiding(
      area,
      [
        { w: 6, h: 4, r: 4 },
        { w: 8, h: 3, r: 4 },
      ],
      (e) => e.w * e.h + (e.w * e.r) / 2,
      (e, v) => exampleHint(`${e.w} × ${e.h} + ${e.w} × ${e.r} ÷ 2 = ${v}`, solved(e.w, e.h, e.r)),
    ),
    solution: solved(w, hgt, roof),
    // The roof not halved, only the wall, or one rectangle of the whole height.
    slips: (v) =>
      v === w * hgt + w * roof || v === w * hgt || v === w * (hgt + roof) ? 'other' : null,
  });
}

/* ---------- Levels 7–8: the volume of a box ---------- */

type BoxFact = { l: number; w: number; h: number };

function cubes({ l, w, h }: BoxFact): Exercise {
  const v = l * w * h;
  return exercise({
    factId: `cubes:${l}x${w}x${h}`,
    topicId: ID,
    level: 7,
    prompt: t('ex.areas.cubes.prompt'),
    display: '',
    spoken: say('ex.areas.cubes.prompt'),
    visual: { type: 'box', l, w, h, cubes: true },
    answer: v,
    input: numpad(2),
    hints: [
      hint(say('ex.areas.cubes.hint1')),
      hint(say('ex.areas.cubes.hint2', { n: l * w })),
      avoiding(
        v,
        [
          { l: 3, w: 2, h: 2 },
          { l: 2, w: 2, h: 2 },
        ],
        (e) => e.l * e.w * e.h,
        (e, n) =>
          exampleHint(
            `${e.l} × ${e.w} × ${e.h} = ${n}`,
            say('ar.cubes.solution', { n: { n, noun: CUBE } }),
          ),
      ),
    ],
    solution: say('ar.cubes.solution', { n: { n: v, noun: CUBE } }),
    diagnose: (x) => (x === l * w + w * h + l * h || x === l * w ? 'other' : null),
  });
}

function boxVolume(rng: Rng): Exercise {
  const l = randInt(rng, 3, 15);
  const w = randInt(rng, 3, 12);
  const h = randInt(rng, 3, 10);
  const v = l * w * h;
  const solved = (a: number, b: number, c: number) =>
    say('ex.areas.box.solution', { l: a, w: b, h: c, v: { n: a * b * c, noun: CM3 } });
  return exercise({
    factId: `box:${l}x${w}x${h}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.areas.box.prompt'),
    display: '',
    spoken: say('ex.areas.box.spoken', { l: cm(l), w: cm(w), h: cm(h) }),
    visual: { type: 'box', l, w, h, unit: 'ס״מ' },
    answer: v,
    input: numpad(4),
    hints: [
      hint(say('ex.areas.box.hint1')),
      hint(say('ex.areas.box.hint2', { base: l * w })),
      avoiding(
        v,
        [
          { l: 5, w: 4, h: 3 },
          { l: 6, w: 4, h: 3 },
        ],
        (e) => e.l * e.w * e.h,
        (e, n) => exampleHint(`${e.l} × ${e.w} × ${e.h} = ${n}`, solved(e.l, e.w, e.h)),
      ),
    ],
    solution: solved(l, w, h),
    // Adding the edges, or stopping at the floor's area: volume is length × width × height.
    diagnose: (x) => (x === l + w + h ? 'shapeFormula' : x === l * w ? 'other' : null),
  });
}

/* ---------- Level 9: units ---------- */

/**
 * Unit questions, each with a hint of its own. The choices are ascending, and the
 * right one is first, in the middle or last about equally often (not always the biggest).
 */
const UNITS: {
  key: TranslationKey;
  answer: number;
  choices: number[];
  why: TranslationKey;
  hint: TranslationKey;
}[] = [
  { key: 'ex.areas.units.q1', answer: 10000, choices: [1000, 10000, 100000], why: 'ex.areas.units.a1', hint: 'ar.units.h1' },
  { key: 'ex.areas.units.q2', answer: 1000, choices: [1000, 10000, 100000], why: 'ex.areas.units.a2', hint: 'ar.units.h2' },
  { key: 'ex.areas.units.q3', answer: 3, choices: [3, 30, 300], why: 'ex.areas.units.a3', hint: 'ar.units.h3' },
  { key: 'ex.areas.units.q4', answer: 1000, choices: [10, 100, 1000], why: 'ex.areas.units.a4', hint: 'ar.units.h4' },
  { key: 'ex.areas.units.q5', answer: 1000, choices: [100, 1000, 10000], why: 'ex.areas.units.a5', hint: 'ar.units.h5' },
  { key: 'ex.areas.units.q6', answer: 100, choices: [10, 100, 1000], why: 'ex.areas.units.a6', hint: 'ar.units.h6' },
  { key: 'ex.areas.units.q7', answer: 5000, choices: [500, 5000, 50000], why: 'ex.areas.units.a7', hint: 'ar.units.h7' },
  { key: 'ex.areas.units.q8', answer: 20000, choices: [200, 2000, 20000], why: 'ex.areas.units.a8', hint: 'ar.units.h8' },
  { key: 'ar.units.q9', answer: 5, choices: [5, 50, 500], why: 'ar.units.a9', hint: 'ar.units.h9' },
  { key: 'ar.units.q10', answer: 900, choices: [9, 90, 900], why: 'ar.units.a10', hint: 'ar.units.h10' },
  { key: 'ar.units.q11', answer: 500, choices: [500, 5000, 50000], why: 'ar.units.a11', hint: 'ar.units.h11' },
];

function units({ key, answer, choices, why, hint: own }: (typeof UNITS)[number]): Exercise {
  return exercise({
    factId: `units:${key}`,
    topicId: ID,
    level: 9,
    prompt: t(key),
    display: '',
    spoken: say(key),
    answer,
    input: { type: 'choices', choices },
    // The rule, the units, then this question's own step.
    hints: [hint(say('ex.areas.units.hint2')), hint(say('ex.areas.units.hint1')), hint(say(own))],
    solution: say(why),
    // A factor of ten, a hundred or a thousand off: length, area and volume units mixed up.
    diagnose: (v) => (v !== answer ? 'shapeFormula' : null),
  });
}

/* ---------- Level 10: word problems ---------- */

function word(rng: Rng): Exercise {
  if (rng() < 0.5) {
    const a = randInt(rng, 3, 12);
    const b = randInt(rng, 3, 9);
    const solved = (x: number, y: number) =>
      say('ex.areas.floor.solution', { a: x, b: y, s: { n: x * y, noun: M2 } });
    return exercise({
      factId: `floor:${a}x${b}`,
      topicId: ID,
      level: 10,
      prompt: shown(say('ex.areas.floor.story', { a: { n: a, noun: M }, b: { n: b, noun: M } })),
      display: '',
      spoken: say('ex.areas.floor.story', { a: { n: a, noun: M }, b: { n: b, noun: M } }),
      answer: a * b,
      input: numpad(3),
      hints: [
        hint(say('ex.areas.floor.hint1')),
        {
          ...hint(say('hint.equation')),
          example: { display: `${a} × ${b} = ?`, spoken: say('hint.equation').text },
        },
        avoiding(
          a * b,
          [
            { a: 5, b: 4 },
            { a: 6, b: 4 },
          ],
          (e) => e.a * e.b,
          (e, v) => exampleHint(`${e.a} × ${e.b} = ${v}`, solved(e.a, e.b)),
        ),
      ],
      solution: solved(a, b),
      diagnose: (v) => (v === 2 * (a + b) ? 'other' : null),
    });
  }
  const side = pick(rng, [2, 3, 4, 5]);
  const l = side * randInt(rng, 2, 5);
  const w = side * randInt(rng, 2, 4);
  const h = side * randInt(rng, 2, 3);
  const n = (l / side) * (w / side) * (h / side);
  const ex = { l: 6, w: 4, h: 2, side: 2 };
  return exercise({
    factId: `pack:${l}x${w}x${h}/${side}`,
    topicId: ID,
    level: 10,
    prompt: shown(say('ex.areas.pack.story', { l: cm(l), w: cm(w), h: cm(h), side: cm(side) })),
    display: '',
    spoken: say('ex.areas.pack.story', { l: cm(l), w: cm(w), h: cm(h), side: cm(side) }),
    answer: n,
    input: numpad(3),
    hints: [
      hint(say('ex.areas.pack.hint1')),
      {
        ...hint(say('hint.equation')),
        example: {
          display: `(${l} ÷ ${side}) × (${w} ÷ ${side}) × (${h} ÷ ${side}) = ?`,
          spoken: say('hint.equation').text,
        },
      },
      exampleHint(
        `(${ex.l} ÷ ${ex.side}) × (${ex.w} ÷ ${ex.side}) × (${ex.h} ÷ ${ex.side}) = 6`,
        say('ex.areas.pack.solution', { a: 3, b: 2, c: 1, n: { n: 6, noun: CUBE } }),
      ),
    ],
    solution: say('ex.areas.pack.solution', {
      a: l / side,
      b: w / side,
      c: h / side,
      n: { n, noun: CUBE },
    }),
  });
}

export const areasTopic = defineTopic({
  id: ID,
  labelKey: 'topic.areas',
  grades: [5],
  startLevel: () => 1,
  levels: [
    open(L(1), rectangle),
    open(L(2), rightTriangle),
    open(L(3), triangle),
    open(L(4), parallelogram),
    open(L(5), trapezoid),
    open(L(6), house),
    closed(
      L(7),
      () => {
        const out: BoxFact[] = [];
        for (let l = 2; l <= 5; l++)
          for (let w = 2; w <= 4; w++) for (let h = 2; h <= 3; h++) out.push({ l, w, h });
        return out;
      },
      (f: BoxFact) => cubes(f),
    ),
    open(L(8), boxVolume),
    closed(
      L(9),
      () => UNITS,
      (f: (typeof UNITS)[number]) => units(f),
    ),
    open(L(10), word),
  ],
});
