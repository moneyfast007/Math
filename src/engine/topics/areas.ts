import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
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

interface AreaParts {
  level: number;
  factId: string;
  spoken: Said;
  visual: Visual;
  display: string;
  answer: number;
  hints: [Hint, Hint];
  example: { display: string; solved: Said };
  solution: Said;
  digits?: number;
}

function areaExercise(p: AreaParts): Exercise {
  return exercise({
    factId: p.factId,
    topicId: ID,
    level: p.level,
    prompt: t('ex.areas.prompt'),
    display: p.display,
    spoken: p.spoken,
    visual: p.visual,
    answer: p.answer,
    input: numpad(p.digits ?? 3),
    hints: [p.hints[0], p.hints[1], exampleHint(p.example.display, p.example.solved)],
    solution: p.solution,
  });
}

/* ---------- Level 1: rectangles and squares ---------- */

function rectangle(rng: Rng): Exercise {
  const square = rng() < 0.3;
  const a = randInt(rng, 3, 20);
  const b = square ? a : randInt(rng, 3, 20);
  const ex = a === 6 && b === 4 ? { a: 7, b: 3 } : { a: 6, b: 4 };
  const solved = (x: number, y: number) =>
    say('ex.areas.rect.solution', { a: x, b: y, s: cm2(x * y) });
  return areaExercise({
    level: 1,
    factId: `rect:${a}x${b}`,
    spoken: square
      ? say('ex.areas.square.spoken', { a: cm(a) })
      : say('ex.areas.rect.spoken', { a: cm(a), b: cm(b) }),
    visual: square
      ? poly(
          [
            [15, 15],
            [85, 15],
            [85, 85],
            [15, 85],
          ],
          { sideLabels: [lab(a), null, null, null], rightAngles: [0, 1, 2, 3] },
        )
      : poly(
          [
            [3, 25],
            [97, 25],
            [97, 75],
            [3, 75],
          ],
          { sideLabels: [lab(a), lab(b), null, null], rightAngles: [0, 1, 2, 3] },
        ),
    display: `${a} × ${b} = ?`,
    answer: a * b,
    hints: [hint(say('ex.areas.rect.hint1')), hint(say('ex.areas.rect.hint2'))],
    example: { display: `${ex.a} × ${ex.b} = ${ex.a * ex.b}`, solved: solved(ex.a, ex.b) },
    solution: solved(a, b),
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
  const ex = a === 6 && b === 8 ? { a: 4, b: 10 } : { a: 6, b: 8 };
  const solved = (x: number, y: number) =>
    say('ex.areas.half.solution', { a: x, b: y, p: x * y, s: cm2((x * y) / 2) });
  return areaExercise({
    level: 2,
    factId: `rtri:${a}x${b}`,
    spoken: say('ex.areas.rtri.spoken', { a: cm(a), b: cm(b) }),
    visual: poly(
      [
        [10, 8],
        [10, 92],
        [90, 92],
      ],
      { sideLabels: [lab(a), lab(b), null], rightAngles: [1] },
    ),
    display: `${a} × ${b} ÷ 2 = ?`,
    answer: (a * b) / 2,
    hints: [hint(say('ex.areas.rtri.hint1')), hint(say('ex.areas.half.hint2'))],
    example: {
      display: `${ex.a} × ${ex.b} ÷ 2 = ${(ex.a * ex.b) / 2}`,
      solved: solved(ex.a, ex.b),
    },
    solution: solved(a, b),
  });
}

function triangle(rng: Rng): Exercise {
  let b: number;
  let h: number;
  do {
    b = randInt(rng, 4, 20);
    h = randInt(rng, 3, 15);
  } while ((b * h) % 2 !== 0);
  const ex = b === 10 && h === 6 ? { a: 8, b: 5 } : { a: 10, b: 6 };
  const solved = (x: number, y: number) =>
    say('ex.areas.half.solution', { a: x, b: y, p: x * y, s: cm2((x * y) / 2) });
  return areaExercise({
    level: 3,
    factId: `tri:${b}x${h}`,
    spoken: say('ex.areas.tri.spoken', { b: cm(b), h: cm(h) }),
    visual: poly(
      [
        [3, 90],
        [97, 90],
        [35, 10],
      ],
      { sideLabels: [lab(b), null, null], height: { from: [35, 10], to: [35, 90], label: lab(h) } },
    ),
    display: `${b} × ${h} ÷ 2 = ?`,
    answer: (b * h) / 2,
    hints: [hint(say('ex.areas.tri.hint1')), hint(say('ex.areas.half.hint2'))],
    example: {
      display: `${ex.a} × ${ex.b} ÷ 2 = ${(ex.a * ex.b) / 2}`,
      solved: solved(ex.a, ex.b),
    },
    solution: solved(b, h),
  });
}

/* ---------- Levels 4–5: parallelogram, trapezoid ---------- */

function parallelogram(rng: Rng): Exercise {
  const b = randInt(rng, 4, 20);
  const h = randInt(rng, 3, 15);
  const ex = b === 9 && h === 4 ? { a: 8, b: 5 } : { a: 9, b: 4 };
  const solved = (x: number, y: number) =>
    say('ex.areas.rect.solution', { a: x, b: y, s: cm2(x * y) });
  return areaExercise({
    level: 4,
    factId: `para:${b}x${h}`,
    spoken: say('ex.areas.para.spoken', { b: cm(b), h: cm(h) }),
    visual: poly(
      [
        [28, 20],
        [97, 20],
        [72, 80],
        [3, 80],
      ],
      {
        sideLabels: [null, null, lab(b), null],
        height: { from: [28, 20], to: [28, 80], label: lab(h) },
      },
    ),
    display: `${b} × ${h} = ?`,
    answer: b * h,
    hints: [hint(say('ex.areas.para.hint1')), hint(say('ex.areas.para.hint2'))],
    example: { display: `${ex.a} × ${ex.b} = ${ex.a * ex.b}`, solved: solved(ex.a, ex.b) },
    solution: solved(b, h),
    // The slanted side times the base is the usual slip; nothing to diagnose without it.
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
  const ex = a === 4 && b === 8 && h === 5 ? { a: 6, b: 10, h: 4 } : { a: 4, b: 8, h: 5 };
  const solved = (x: number, y: number, z: number) =>
    say('ex.areas.trap.solution', { a: x, b: y, sum: x + y, h: z, s: cm2(((x + y) * z) / 2) });
  return areaExercise({
    level: 5,
    factId: `trap:${a}:${b}:${h}`,
    spoken: say('ex.areas.trap.spoken', { a: cm(a), b: cm(b), h: cm(h) }),
    visual: poly(
      [
        [30, 20],
        [70, 20],
        [97, 80],
        [3, 80],
      ],
      {
        sideLabels: [lab(a), null, lab(b), null],
        height: { from: [30, 20], to: [30, 80], label: lab(h) },
      },
    ),
    display: `(${a} + ${b}) × ${h} ÷ 2 = ?`,
    answer: area,
    hints: [hint(say('ex.areas.trap.hint1')), hint(say('ex.areas.trap.hint2'))],
    example: {
      display: `(${ex.a} + ${ex.b}) × ${ex.h} ÷ 2 = ${((ex.a + ex.b) * ex.h) / 2}`,
      solved: solved(ex.a, ex.b, ex.h),
    },
    solution: solved(a, b, h),
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
  const ex = w === 6 && hgt === 4 && roof === 4 ? { w: 8, h: 3, r: 4 } : { w: 6, h: 4, r: 4 };
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
    visual: poly(
      [
        [5, 42],
        [50, 6],
        [95, 42],
        [95, 95],
        [5, 95],
      ],
      {
        sideLabels: [null, null, lab(hgt), lab(w), null],
        height: { from: [50, 6], to: [50, 42], label: lab(roof) },
        rightAngles: [3, 4],
      },
    ),
    display: `${w} × ${hgt} + ${w} × ${roof} ÷ 2 = ?`,
    answer: area,
    hints: [hint(say('ex.areas.house.hint1')), hint(say('ex.areas.house.hint2'))],
    example: {
      display: `${ex.w} × ${ex.h} + ${ex.w} × ${ex.r} ÷ 2 = ${ex.w * ex.h + (ex.w * ex.r) / 2}`,
      solved: solved(ex.w, ex.h, ex.r),
    },
    solution: solved(w, hgt, roof),
  });
}

/* ---------- Levels 7–8: the volume of a box ---------- */

type BoxFact = { l: number; w: number; h: number };

function cubes({ l, w, h }: BoxFact): Exercise {
  const v = l * w * h;
  const ex = l === 3 && w === 2 && h === 2 ? { l: 2, w: 2, h: 2 } : { l: 3, w: 2, h: 2 };
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
      exampleHint(
        `${ex.l} × ${ex.w} × ${ex.h} = ${ex.l * ex.w * ex.h}`,
        say('ex.areas.cubes.solution', { n: { n: ex.l * ex.w * ex.h, noun: CUBE } }),
      ),
    ],
    solution: say('ex.areas.cubes.solution', { n: { n: v, noun: CUBE } }),
    diagnose: (x) => (x === l * w + w * h + l * h || x === l * w ? 'other' : null),
  });
}

function boxVolume(rng: Rng): Exercise {
  const l = randInt(rng, 3, 15);
  const w = randInt(rng, 3, 12);
  const h = randInt(rng, 3, 10);
  const v = l * w * h;
  const ex = l === 5 && w === 4 && h === 3 ? { l: 6, w: 4, h: 3 } : { l: 5, w: 4, h: 3 };
  const solved = (a: number, b: number, c: number) =>
    say('ex.areas.box.solution', { l: a, w: b, h: c, v: { n: a * b * c, noun: CM3 } });
  return exercise({
    factId: `box:${l}x${w}x${h}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.areas.box.prompt'),
    display: `${l} × ${w} × ${h} = ?`,
    spoken: say('ex.areas.box.spoken', { l: cm(l), w: cm(w), h: cm(h) }),
    visual: { type: 'box', l, w, h, unit: 'ס״מ' },
    answer: v,
    input: numpad(4),
    hints: [
      hint(say('ex.areas.box.hint1')),
      hint(say('ex.areas.box.hint2', { base: l * w })),
      exampleHint(`${ex.l} × ${ex.w} × ${ex.h} = ${ex.l * ex.w * ex.h}`, solved(ex.l, ex.w, ex.h)),
    ],
    solution: solved(l, w, h),
    diagnose: (x) => (x === l + w + h ? 'wrongOperation' : x === l * w ? 'other' : null),
  });
}

/* ---------- Level 9: units ---------- */

const UNITS: { key: TranslationKey; answer: number; choices: number[]; why: TranslationKey }[] = [
  {
    key: 'ex.areas.units.q1',
    answer: 10000,
    choices: [100, 1000, 10000],
    why: 'ex.areas.units.a1',
  },
  { key: 'ex.areas.units.q2', answer: 1000, choices: [100, 1000, 10000], why: 'ex.areas.units.a2' },
  { key: 'ex.areas.units.q3', answer: 3, choices: [3, 30, 300], why: 'ex.areas.units.a3' },
  { key: 'ex.areas.units.q4', answer: 1000, choices: [10, 100, 1000], why: 'ex.areas.units.a4' },
  { key: 'ex.areas.units.q5', answer: 1000, choices: [10, 100, 1000], why: 'ex.areas.units.a5' },
  { key: 'ex.areas.units.q6', answer: 100, choices: [10, 100, 1000], why: 'ex.areas.units.a6' },
  { key: 'ex.areas.units.q7', answer: 5000, choices: [50, 500, 5000], why: 'ex.areas.units.a7' },
  {
    key: 'ex.areas.units.q8',
    answer: 20000,
    choices: [200, 2000, 20000],
    why: 'ex.areas.units.a8',
  },
];

function units({ key, answer, choices, why }: (typeof UNITS)[number]): Exercise {
  return exercise({
    factId: `units:${key}`,
    topicId: ID,
    level: 9,
    prompt: t(key),
    display: '',
    spoken: say(key),
    answer,
    input: { type: 'choices', choices },
    hints: [
      hint(say('ex.areas.units.hint1')),
      hint(say('ex.areas.units.hint2')),
      hint(say('ex.areas.units.hint3')),
    ],
    solution: say(why),
    diagnose: (v) => (v * 10 === answer || v === answer * 10 ? 'placeValue' : null),
  });
}

/* ---------- Level 10: word problems ---------- */

function word(rng: Rng): Exercise {
  if (rng() < 0.5) {
    const a = randInt(rng, 3, 12);
    const b = randInt(rng, 3, 9);
    const ex = a === 5 && b === 4 ? { a: 6, b: 4 } : { a: 5, b: 4 };
    const solved = (x: number, y: number) =>
      say('ex.areas.floor.solution', { a: x, b: y, s: { n: x * y, noun: M2 } });
    return exercise({
      factId: `floor:${a}x${b}`,
      topicId: ID,
      level: 10,
      prompt: say('ex.areas.floor.story', { a: { n: a, noun: M }, b: { n: b, noun: M } }).text,
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
        exampleHint(`${ex.a} × ${ex.b} = ${ex.a * ex.b}`, solved(ex.a, ex.b)),
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
    prompt: say('ex.areas.pack.story', { l: cm(l), w: cm(w), h: cm(h), side: cm(side) }).text,
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
        for (let l = 2; l <= 4; l++)
          for (let w = 2; w <= 3; w++) for (let h = 2; h <= 3; h++) out.push({ l, w, h });
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
