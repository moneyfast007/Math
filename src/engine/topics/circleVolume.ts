import type { TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import { shown, type Slot } from '@/lang/compose';
import type { MistakeKind } from '@/state/schema';
import {
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  numpad,
  range,
  round,
  say,
  type Said,
} from '../build';
import type { Exercise, Visual } from '../types';

/**
 * World 20, grade 6: "מעגל ונפח". Radius and diameter, the circumference and
 * the area of a circle (π taken as 3.14, as in school, and said in the
 * question), the volume of a box and a cube, a missing edge, litres and cubic
 * centimetres, an aquarium. All levels are closed, so every sentence is
 * recorded whole.
 *
 * The circle levels climb slowly: friendly numbers first (3.14 × 10, × 20,
 * × 50), then any number; the second hint splits the work into two steps
 * (the diameter or r × r first, then × 3.14), and the solution says both.
 */

const ID = 'circle-volume';
const L = (n: number) => `level.circleVolume.${n}`;
const PI = 3.14;

const CM: Noun = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' };
const CM2: Noun = { singular: 'סנטימטר רבוע', plural: 'סנטימטרים רבועים', gender: 'm' };
const CM3: Noun = { singular: 'סנטימטר מעוקב', plural: 'סנטימטרים מעוקבים', gender: 'm' };
const LITRE: Noun = { singular: 'ליטר', plural: 'ליטרים', gender: 'm' };

/** A typical mistake: the number it gives and what kind of slip it is. */
interface Wrong {
  v: number;
  kind: MistakeKind;
}

interface Spec {
  level: number;
  id: string;
  /** The question's key. */
  key: TranslationKey;
  slots: Record<string, Slot>;
  /** The solution's key, and its own slots (its steps) besides the result. */
  solution: TranslationKey;
  solutionSlots: Record<string, Slot>;
  answer: number;
  unit: Noun;
  decimal: boolean;
  maxDigits: number;
  hints: [Said, Said];
  example: { display: string; slots: Record<string, Slot>; r: number };
  wrong: Wrong[];
  /** The operation, when the slip is doing the other one (doubling instead of halving). */
  operation?: 'mul' | 'div';
  /** The circle or the box, with the given measures on it. */
  visual?: Visual;
}

/** Every exercise of this world has the same shape: a question, two hints, an example, a solution. */
function build(s: Spec): Exercise {
  // A whole result is a counted noun ("שלושים סנטימטרים"); a decimal is read with "נקודה" and the unit after it.
  const sol = (r: number, slots: Record<string, Slot>) =>
    say(s.solution, {
      ...slots,
      r: Number.isInteger(r) ? { n: r, noun: s.unit } : r,
      u: Number.isInteger(r) ? '' : ` ${s.unit.plural}`,
    });
  // A typical mistake that gives the right number would be praised: such an exercise is a bug.
  if (s.wrong.some((w) => Math.abs(w.v - s.answer) < 1e-9))
    throw new Error(`${s.id}: a typical mistake gives the answer`);
  const question = say(s.key, s.slots);
  return exercise({
    factId: s.id,
    topicId: ID,
    level: s.level,
    // The data on screen too (with digits), not only heard.
    prompt: shown(question),
    display: '',
    spoken: question,
    ...(s.visual ? { visual: s.visual } : {}),
    answer: s.answer,
    ...(s.operation ? { operation: s.operation } : {}),
    input: numpad(s.maxDigits, s.decimal),
    hints: [
      hint(s.hints[0]),
      hint(s.hints[1]),
      exampleHint(s.example.display, sol(s.example.r, s.example.slots)),
    ],
    solution: sol(s.answer, s.solutionSlots),
    // Radius and diameter mixed up, circumference for area, edges added for a volume, litres
    // left in cubic centimetres; otherwise a slip of one in a whole answer.
    diagnose: (v) =>
      s.wrong.find((w) => Math.abs(w.v - v) < 1e-9)?.kind ??
      (Number.isInteger(s.answer) && Math.abs(v - s.answer) === 1 ? 'offByOne' : null),
  });
}

/** Numbers in the sentence are plain numbers for decimals (compose reads them "נקודה"). */
/** A length with its unit, whole or decimal ("שלוש נקודה חמש סנטימטרים"). */
function slot(x: number, noun: Noun): Slot {
  return { n: x, noun };
}

/* ---------- Level 1: radius and diameter, both ways ---------- */

const radiusDiameter = (r: number, toD: boolean): Exercise =>
  build({
    level: 1,
    id: `${toD ? 'r2d' : 'd2r'}:${r}`,
    visual: { type: 'circle', mark: toD ? 'radius' : 'diameter', label: `${toD ? r : 2 * r} ס״מ` },
    key: toD ? 'ex.circle.diameter.spoken' : 'ex.circle.radius.spoken',
    slots: toD ? { r: slot(r, CM) } : { d: slot(2 * r, CM) },
    solution: toD ? 'ex.circle.diameter.solution' : 'ex.circle.radius.solution',
    solutionSlots: {},
    answer: toD ? 2 * r : r,
    unit: CM,
    decimal: false,
    maxDigits: 2,
    hints: [say('ex.circle.rd.hint1'), say('ex.circle.rd.hint2')],
    example:
      r === 5
        ? { display: toD ? '3 → 6' : '6 → 3', slots: {}, r: toD ? 6 : 3 }
        : { display: toD ? '5 → 10' : '10 → 5', slots: {}, r: toD ? 10 : 5 },
    // The radius given back (not doubled), or the diameter doubled instead of halved.
    wrong: [{ v: toD ? r : 4 * r, kind: 'wrongOperation' }],
    operation: toD ? 'mul' : 'div',
  });

/* ---------- Levels 2–4: the circumference ---------- */

/** The circumference from the diameter (or from the radius): 3.14 × d. */
const circumference = (level: number, n: number, fromRadius: boolean): Exercise => {
  const d = fromRadius ? 2 * n : n;
  const answer = round(PI * d, 2);
  // An example of the same kind with other numbers (never this answer).
  const e = (fromRadius ? [5, 3] : [10, 20]).find((c) => c !== n) as number;
  const eD = fromRadius ? 2 * e : e;
  const eR = round(PI * eD, 2);
  const steps = (dd: number): Record<string, Slot> =>
    fromRadius ? { d: slot(dd, CM), x: dd, pi: PI } : { d: dd, pi: PI };
  return build({
    level,
    id: `circ${fromRadius ? 'R' : 'D'}:${n}`,
    visual: { type: 'circle', mark: fromRadius ? 'radius' : 'diameter', label: `${n} ס״מ` },
    key: fromRadius ? 'c6.circR.spoken' : 'c6.circD.spoken',
    slots: fromRadius ? { r: slot(n, CM), pi: PI } : { d: slot(n, CM), pi: PI },
    solution: fromRadius ? 'c6.circR.solution' : 'c6.circD.solution',
    solutionSlots: steps(d),
    answer,
    unit: CM,
    decimal: true,
    maxDigits: 5,
    hints: fromRadius
      ? [say('ex.circle.circR.hint1'), say('c6.circR.hint2', { d: slot(d, CM), x: d, pi: PI })]
      : // Two easy products instead of one hard one: d × 3, and d × 0.14.
        [say('ex.circle.circ.hint1'), say('c6.circD.hint2', { d, f: 0.14 })],
    example: {
      display: fromRadius ? `r = ${e} → d = ${eD} → 3.14 × ${eD} = ${eR}` : `3.14 × ${eD} = ${eR}`,
      slots: steps(eD),
      r: eR,
    },
    // From the radius: forgot to double it, or the area. From the diameter: doubled it, or the area.
    wrong: fromRadius
      ? [
          { v: round(PI * n, 2), kind: 'other' },
          { v: round(PI * n * n, 2), kind: 'shapeFormula' },
        ]
      : [
          { v: round(PI * 2 * n, 2), kind: 'other' },
          { v: round(PI * (n / 2) * (n / 2), 2), kind: 'shapeFormula' },
        ],
  });
};

/* ---------- Levels 5–6: the area ---------- */

/** The area from the radius, or from the diameter (halved first). */
const area = (level: number, n: number, fromDiameter: boolean): Exercise => {
  const r = fromDiameter ? n / 2 : n;
  const answer = round(PI * r * r, 2);
  const e = (fromDiameter ? [10, 20] : [10, 5]).find((c) => c !== n) as number;
  const eR = fromDiameter ? e / 2 : e;
  const eA = round(PI * eR * eR, 2);
  const steps = (x: number) => ({ x, rad: slot(x, CM), rr: x * x, pi: PI });
  return build({
    level,
    id: `area${fromDiameter ? 'D' : ''}:${n}`,
    visual: { type: 'circle', mark: fromDiameter ? 'diameter' : 'radius', label: `${n} ס״מ` },
    key: fromDiameter ? 'c6.areaD.spoken' : 'c6.area.spoken',
    slots: fromDiameter ? { d: slot(n, CM), pi: PI } : { r: slot(n, CM), pi: PI },
    solution: fromDiameter ? 'c6.areaD.solution' : 'c6.area.solution',
    solutionSlots: steps(r),
    answer,
    unit: CM2,
    decimal: true,
    maxDigits: 6,
    hints: [
      say(fromDiameter ? 'c6.areaD.hint1' : 'ex.circle.area.hint1'),
      // Two steps: r × r first, then × 3.14.
      say(fromDiameter ? 'c6.areaD.hint2' : 'c6.area.hint2', steps(r)),
    ],
    example: {
      display: fromDiameter
        ? `d = ${e} → r = ${eR} → 3.14 × ${eR} × ${eR} = ${eA}`
        : `3.14 × ${e} × ${e} = ${eA}`,
      slots: steps(eR),
      r: eA,
    },
    wrong: [
      // The circumference instead of the area.
      { v: round(PI * 2 * r, 2), kind: 'shapeFormula' },
      // π × r: the radius only once.
      { v: round(PI * r, 2), kind: 'other' },
      // From the diameter: the diameter taken for the radius.
      ...(fromDiameter ? [{ v: round(PI * n * n, 2), kind: 'other' as const }] : []),
    ],
  });
};

/* ---------- Level 7: boxes and cubes ---------- */

type Box = { a: number; b: number; c: number };

const boxVolume = (x: Box): Exercise => {
  const cube = x.a === x.b && x.b === x.c;
  const answer = round(x.a * x.b * x.c, 2);
  // Not an example whose volume is this answer: it would give it away.
  const e: Box = cube
    ? x.a === 3
      ? { a: 4, b: 4, c: 4 }
      : { a: 3, b: 3, c: 3 }
    : answer === 8 * 5 * 3
      ? { a: 7, b: 4, c: 2 }
      : { a: 8, b: 5, c: 3 };
  const eV = e.a * e.b * e.c;
  const steps = (y: Box) => ({ a: y.a, b: y.b, c: y.c });
  return build({
    level: 7,
    id: `${cube ? 'cube' : 'box'}:${x.a}x${x.b}x${x.c}`,
    visual: { type: 'box', l: x.a, w: x.b, h: x.c, unit: 'ס״מ' },
    key: cube ? 'ex.vol.cube.spoken' : 'ex.vol.box.spoken',
    slots: cube ? { a: slot(x.a, CM) } : { a: slot(x.a, CM), b: slot(x.b, CM), c: slot(x.c, CM) },
    solution: 'c6.box.solution',
    solutionSlots: steps(x),
    answer,
    unit: CM3,
    decimal: !Number.isInteger(answer),
    maxDigits: 4,
    // The first step with the numbers: the floor, then the height.
    hints: cube
      ? [say('ex.vol.cube.hint1'), say('c6.cube.hint2', { a: x.a, aa: x.a * x.a })]
      : [say('ex.vol.box.hint1'), say('c6.box.hint2', { a: x.a, b: x.b, ab: round(x.a * x.b, 2) })],
    example: { display: `${e.a} × ${e.b} × ${e.c} = ${eV}`, slots: steps(e), r: eV },
    wrong: cube
      ? [
          { v: 3 * x.a, kind: 'shapeFormula' },
          { v: x.a * x.a, kind: 'other' },
        ]
      : [
          { v: round(x.a + x.b + x.c, 2), kind: 'shapeFormula' },
          { v: round(2 * (x.a * x.b + x.b * x.c + x.a * x.c), 2), kind: 'shapeFormula' },
        ],
  });
};

/* ---------- Level 8: a missing edge ---------- */

const missingEdge = (x: Box): Exercise => {
  const v = x.a * x.b * x.c;
  // Not an example whose missing edge is this answer: it would give it away.
  const e: Box = x.c === 3 ? { a: 6, b: 2, c: 4 } : { a: 5, b: 4, c: 3 };
  const steps = (y: Box) => ({ v: y.a * y.b * y.c, ab: y.a * y.b });
  return build({
    level: 8,
    id: `edge:${x.a}x${x.b}=${v}`,
    key: 'ex.vol.edge.spoken',
    slots: { v: slot(v, CM3), a: slot(x.a, CM), b: slot(x.b, CM) },
    solution: 'c6.edge.solution',
    solutionSlots: steps(x),
    answer: x.c,
    unit: CM,
    decimal: false,
    maxDigits: 2,
    hints: [say('ex.vol.edge.hint1'), say('c6.edge.hint2', { ab: x.a * x.b })],
    example: {
      display: `${e.a * e.b * e.c} ÷ (${e.a} × ${e.b}) = ${e.c}`,
      slots: steps(e),
      r: e.c,
    },
    // Subtracted the edges instead of dividing, or divided by one edge only.
    wrong: [
      { v: v - x.a - x.b, kind: 'wrongOperation' },
      { v: v / x.a, kind: 'other' },
    ],
    operation: 'div',
  });
};

/* ---------- Level 9: litres and cubic centimetres, both ways ---------- */

const litres = (k: number, toCm3: boolean): Exercise => {
  const v = k * 1000;
  const e = k === 2 ? 3 : 2;
  return build({
    level: 9,
    id: `${toCm3 ? 'litre' : 'cm3'}:${k}`,
    key: toCm3 ? 'c6.litre.spoken' : 'c6.cm3.spoken',
    slots: toCm3
      ? { k: slot(k, LITRE), u: '' }
      : { v: { n: v, noun: CM3 } },
    solution: toCm3 ? 'c6.litre.solution' : 'c6.cm3.solution',
    solutionSlots: toCm3 ? { k } : { v },
    answer: toCm3 ? v : k,
    unit: toCm3 ? CM3 : LITRE,
    decimal: !toCm3 && !Number.isInteger(k),
    maxDigits: 5,
    hints: [say('ex.vol.litre.hint1'), say(toCm3 ? 'ex.vol.litre.hint2' : 'c6.cm3.hint2')],
    example: toCm3
      ? { display: `${e} → ${e * 1000}`, slots: { k: e }, r: e * 1000 }
      : { display: `${e * 1000} → ${e}`, slots: { v: e * 1000 }, r: e },
    // A hundred or ten in a litre: the units mixed up.
    wrong: toCm3
      ? [
          { v: k * 100, kind: 'placeValue' },
          { v: k * 10, kind: 'placeValue' },
        ]
      : [
          { v: v / 100, kind: 'placeValue' },
          { v: v / 10, kind: 'placeValue' },
        ],
  });
};

/* ---------- Level 10: an aquarium ---------- */

const aquarium = (x: Box): Exercise => {
  const v = x.a * x.b * x.c;
  const answer = v / 1000;
  // Not an example with as many litres as this answer: it would give it away.
  const e: Box = answer === 30 ? { a: 40, b: 20, c: 25 } : { a: 50, b: 20, c: 30 };
  const eV = e.a * e.b * e.c;
  return build({
    level: 10,
    id: `aqua:${x.a}x${x.b}x${x.c}`,
    visual: { type: 'box', l: x.a, w: x.b, h: x.c, unit: 'ס״מ' },
    key: 'ex.vol.aquarium.spoken',
    slots: { a: slot(x.a, CM), b: slot(x.b, CM), c: slot(x.c, CM) },
    solution: 'c6.aquarium.solution',
    solutionSlots: { v: { n: v, noun: CM3 } },
    answer,
    unit: LITRE,
    decimal: false,
    maxDigits: 3,
    hints: [say('ex.vol.aquarium.hint1'), say('ex.vol.litre.hint1')],
    // The whole way: the volume in cubic centimetres, then the litres.
    example: {
      display: `${e.a} × ${e.b} × ${e.c} = ${eV} → ${eV / 1000}`,
      slots: { v: { n: eV, noun: CM3 } },
      r: eV / 1000,
    },
    wrong: [
      { v, kind: 'placeValue' },
      { v: v / 100, kind: 'placeValue' },
    ],
  });
};

/** Small boxes for the missing edge: the volume is not also the sum of the edges or the surface. */
const BOXES: Box[] = range(2, 9)
  .flatMap((a) => range(2, a).flatMap((b) => range(2, 6).map((c) => ({ a, b, c }))))
  .filter(({ a, b, c }) => a * b * c !== a + b + c && a * b * c !== 2 * (a * b + b * c + a * c));
/**
 * Volume in grade 6: bigger boxes than grade 5's, some with a half centimetre
 * (2.5 × 8 × 5), and cubes; never a volume that is also the sum of the edges
 * or the surface (6 × 6 × 6: both 216).
 */
const BIG_BOXES: Box[] = [
  ...range(6, 15).flatMap((a) =>
    [4, 5, 6, 8, 10].filter((b) => b < a).flatMap((b) => [3, 5, 7].map((c) => ({ a, b, c }))),
  ),
  ...[1.5, 2.5, 3.5, 4.5].flatMap((a) =>
    [4, 6, 8].flatMap((b) => [3, 5].map((c) => ({ a, b, c }))),
  ),
  ...range(2, 12).map((a) => ({ a, b: a, c: a })),
].filter(
  ({ a, b, c }) =>
    round(a * b * c, 2) !== round(a + b + c, 2) &&
    round(a * b * c, 2) !== round(2 * (a * b + b * c + a * c), 2),
);
const AQUARIUMS: Box[] = [20, 25, 30, 40, 50, 60]
  .flatMap((a) => [10, 20, 25, 30].flatMap((b) => [10, 20, 30, 40].map((c) => ({ a, b, c }))))
  .filter((x) => (x.a * x.b * x.c) % 1000 === 0);

/** Diameters (level 2) and radii (level 3) that make 3.14 × d easy; never r = 2 (see level 4). */
const FRIENDLY_D = [1, 2, 3, 5, 6, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 500];
const FRIENDLY_R = [1, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 100, 150];
/** Radii whose area is easy to work out: r × r is a small square or a round number. */
const FRIENDLY_AREA = [3, 4, 5, 6, 7, 10, 20, 30, 40, 50, 60, 70, 100];

export const circleVolume = defineTopic({
  id: ID,
  labelKey: 'topic.circleVolume',
  grades: [6],
  startLevel: () => 1,
  levels: [
    // Radius to diameter and back in one level: each alone is a single doubling or halving.
    closed(
      'level.circleVolume6.1',
      () => range(1, 25).flatMap((r) => [true, false].map((toD) => ({ r, toD }))),
      (x) => radiusDiameter(x.r, x.toD),
    ),
    closed(
      L(3),
      () => FRIENDLY_D,
      (d) => circumference(2, d, false),
    ),
    closed(
      L(4),
      () => FRIENDLY_R,
      (r) => circumference(3, r, true),
    ),
    closed(
      'level.circleVolume6.4',
      // Any diameter or radius. Not d = 4 or r = 2: there the area and the circumference are
      // the same number, so a child who mixes them up would be told she is right.
      () => [
        ...range(6, 30)
          .filter((d) => !FRIENDLY_D.includes(d))
          .map((n) => ({ n, fromRadius: false })),
        ...range(4, 14)
          .filter((r) => !FRIENDLY_R.includes(r))
          .map((n) => ({ n, fromRadius: true })),
      ],
      (x) => circumference(4, x.n, x.fromRadius),
    ),
    // Not r = 1 or 2: there the area equals π × r or the circumference.
    closed(
      L(5),
      () => FRIENDLY_AREA,
      (r) => area(5, r, false),
    ),
    closed(
      'level.circleVolume6.6',
      () => [
        ...range(3, 15)
          .filter((r) => !FRIENDLY_AREA.includes(r))
          .map((n) => ({ n, fromDiameter: false })),
        ...range(3, 15)
          .filter((r) => r !== 5 && r !== 10)
          .map((r) => ({ n: 2 * r, fromDiameter: true })),
      ],
      (x) => area(6, x.n, x.fromDiameter),
    ),
    closed('level.circleVolume6.7', () => BIG_BOXES, boxVolume),
    closed(L(8), () => BOXES, missingEdge),
    closed(
      L(9),
      // Both ways, and half litres too (2.5 litres are 2,500 cubic centimetres).
      () =>
        [...range(1, 12), 0.5, 1.5, 2.5, 3.5].flatMap((k) =>
          [true, false].map((toCm3) => ({ k, toCm3 })),
        ),
      (x) => litres(x.k, x.toCm3),
    ),
    closed(L(10), () => AQUARIUMS, aquarium),
  ],
});
