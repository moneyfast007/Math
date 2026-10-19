import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import type { Slot } from '@/lang/compose';
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
} from '../build';
import type { Exercise } from '../types';

/**
 * World 20, grade 6: "מעגל ונפח". Radius and diameter, the circumference and
 * the area of a circle (π taken as 3.14, as in school), the volume of a box
 * and a cube, a missing edge, litres and cubic centimetres, an aquarium.
 * All levels are closed, so every sentence is recorded whole.
 */

const ID = 'circle-volume';
const L = (n: number) => `level.circleVolume.${n}`;
const PI = 3.14;

const CM: Noun = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' };
const CM2: Noun = { singular: 'סנטימטר רבוע', plural: 'סנטימטרים רבועים', gender: 'm' };
const CM3: Noun = { singular: 'סנטימטר מעוקב', plural: 'סנטימטרים מעוקבים', gender: 'm' };
const LITRE: Noun = { singular: 'ליטר', plural: 'ליטרים', gender: 'm' };

interface Spec {
  level: number;
  id: string;
  /** Prefix of the sentence keys: `${key}.prompt`, `.spoken`, `.solution`. */
  key: string;
  slots: Record<string, Slot>;
  answer: number;
  unit: Noun;
  decimal: boolean;
  maxDigits: number;
  hints: [TranslationKey, TranslationKey];
  example: { display: string; slots: Record<string, Slot>; r: number };
  wrong?: number[];
}

/** Every exercise of this world has the same shape: a question, two hints, an example, a solution. */
function build(s: Spec): Exercise {
  // A whole result is a counted noun ("שלושים סנטימטרים"); a decimal is read with "נקודה" and the unit after it.
  const sol = (r: number, slots: Record<string, Slot>) =>
    say(`${s.key}.solution` as TranslationKey, {
      ...slots,
      r: Number.isInteger(r) ? { n: r, noun: s.unit } : r,
      u: Number.isInteger(r) ? '' : ` ${s.unit.plural}`,
    });
  // A typical mistake that gives the right number would be praised: such an exercise is a bug.
  if (s.wrong?.some((w) => Math.abs(w - s.answer) < 1e-9))
    throw new Error(`${s.id}: a typical mistake gives the answer`);
  return exercise({
    factId: s.id,
    topicId: ID,
    level: s.level,
    prompt: t(`${s.key}.prompt` as TranslationKey),
    display: '',
    spoken: say(`${s.key}.spoken` as TranslationKey, s.slots),
    answer: s.answer,
    input: numpad(s.maxDigits, s.decimal),
    hints: [
      hint(say(s.hints[0])),
      hint(say(s.hints[1])),
      exampleHint(s.example.display, sol(s.example.r, s.example.slots)),
    ],
    solution: sol(s.answer, s.slots),
    diagnose: (v) => (s.wrong?.some((w) => Math.abs(w - v) < 1e-9) ? 'wrongOperation' : null),
  });
}

/** Numbers in the sentence are plain numbers for decimals (compose reads them "נקודה"). */
function slot(x: number, noun: Noun): Slot {
  return Number.isInteger(x) ? { n: x, noun } : x;
}

const radiusDiameter = (r: number, toD: boolean): Exercise =>
  build({
    level: toD ? 1 : 2,
    id: `${toD ? 'r2d' : 'd2r'}:${r}`,
    key: toD ? 'ex.circle.diameter' : 'ex.circle.radius',
    slots: toD ? { r: slot(r, CM) } : { d: slot(2 * r, CM) },
    answer: toD ? 2 * r : r,
    unit: CM,
    decimal: false,
    maxDigits: 2,
    hints: ['ex.circle.rd.hint1', 'ex.circle.rd.hint2'],
    example:
      r === 5
        ? {
            display: toD ? '3 → 6' : '6 → 3',
            slots: toD ? { r: slot(3, CM) } : { d: slot(6, CM) },
            r: toD ? 6 : 3,
          }
        : {
            display: toD ? '5 → 10' : '10 → 5',
            slots: toD ? { r: slot(5, CM) } : { d: slot(10, CM) },
            r: toD ? 10 : 5,
          },
    wrong: [toD ? r : 4 * r],
  });

const circumference = (n: number, fromRadius: boolean): Exercise => {
  const d = fromRadius ? 2 * n : n;
  const answer = round(PI * d, 2);
  const e = (fromRadius ? n === 5 : n === 10) ? (fromRadius ? 3 : 4) : fromRadius ? 5 : 10;
  const eD = fromRadius ? 2 * e : e;
  return build({
    level: fromRadius ? 4 : 3,
    id: `circ${fromRadius ? 'R' : 'D'}:${n}`,
    key: fromRadius ? 'ex.circle.circR' : 'ex.circle.circD',
    slots: fromRadius ? { r: slot(n, CM) } : { d: slot(n, CM) },
    answer,
    unit: CM,
    decimal: true,
    maxDigits: 5,
    hints: [fromRadius ? 'ex.circle.circR.hint1' : 'ex.circle.circ.hint1', 'ex.circle.pi.hint'],
    example: {
      display: `3.14 × ${eD} = ${round(PI * eD, 2)}`,
      slots: fromRadius ? { r: slot(e, CM) } : { d: slot(e, CM) },
      r: round(PI * eD, 2),
    },
    // From the radius: forgot to double it, or the area. From the diameter: doubled it, or the area.
    wrong: fromRadius
      ? [round(PI * n, 2), round(PI * n * n, 2)]
      : [round(PI * 2 * n, 2), round(PI * (n / 2) * (n / 2), 2)],
  });
};

const area = (r: number): Exercise => {
  const answer = round(PI * r * r, 2);
  const e = r === 10 ? 5 : 10;
  return build({
    level: 5,
    id: `area:${r}`,
    key: 'ex.circle.area',
    slots: { r: slot(r, CM) },
    answer,
    unit: CM2,
    decimal: true,
    maxDigits: 6,
    hints: ['ex.circle.area.hint1', 'ex.circle.pi.hint'],
    example: {
      display: `3.14 × ${e} × ${e} = ${round(PI * e * e, 2)}`,
      slots: { r: slot(e, CM) },
      r: round(PI * e * e, 2),
    },
    wrong: [round(PI * 2 * r, 2), round(PI * r, 2)],
  });
};

type Box = { a: number; b: number; c: number };

const boxVolume = (x: Box): Exercise => {
  const answer = x.a * x.b * x.c;
  const e: Box = x.a === 5 && x.b === 4 && x.c === 3 ? { a: 6, b: 2, c: 3 } : { a: 5, b: 4, c: 3 };
  return build({
    level: 6,
    id: `box:${x.a}x${x.b}x${x.c}`,
    key: 'ex.vol.box',
    slots: { a: slot(x.a, CM), b: slot(x.b, CM), c: slot(x.c, CM) },
    answer,
    unit: CM3,
    decimal: false,
    maxDigits: 4,
    hints: ['ex.vol.box.hint1', 'ex.vol.box.hint2'],
    example: {
      display: `${e.a} × ${e.b} × ${e.c} = ${e.a * e.b * e.c}`,
      slots: { a: slot(e.a, CM), b: slot(e.b, CM), c: slot(e.c, CM) },
      r: e.a * e.b * e.c,
    },
    wrong: [x.a + x.b + x.c, 2 * (x.a * x.b + x.b * x.c + x.a * x.c)],
  });
};

const cube = (a: number): Exercise =>
  build({
    level: 7,
    id: `cube:${a}`,
    key: 'ex.vol.cube',
    slots: { a: slot(a, CM) },
    answer: a * a * a,
    unit: CM3,
    decimal: false,
    maxDigits: 4,
    hints: ['ex.vol.cube.hint1', 'ex.vol.box.hint2'],
    example:
      a === 3
        ? { display: '4 × 4 × 4 = 64', slots: { a: slot(4, CM) }, r: 64 }
        : { display: '3 × 3 × 3 = 27', slots: { a: slot(3, CM) }, r: 27 },
    wrong: [3 * a, a * a],
  });

const missingEdge = (x: Box): Exercise => {
  const v = x.a * x.b * x.c;
  const e: Box = x.a === 5 && x.b === 4 && x.c === 3 ? { a: 6, b: 2, c: 3 } : { a: 5, b: 4, c: 3 };
  return build({
    level: 8,
    id: `edge:${x.a}x${x.b}=${v}`,
    key: 'ex.vol.edge',
    slots: { v: slot(v, CM3), a: slot(x.a, CM), b: slot(x.b, CM) },
    answer: x.c,
    unit: CM,
    decimal: false,
    maxDigits: 2,
    hints: ['ex.vol.edge.hint1', 'ex.vol.edge.hint2'],
    example: {
      display: `${e.a * e.b * e.c} ÷ (${e.a} × ${e.b}) = ${e.c}`,
      slots: { v: slot(e.a * e.b * e.c, CM3), a: slot(e.a, CM), b: slot(e.b, CM) },
      r: e.c,
    },
    wrong: [v - x.a - x.b, v / x.a],
  });
};

const litres = (k: number): Exercise =>
  build({
    level: 9,
    id: `litre:${k}`,
    key: 'ex.vol.litre',
    slots: { k: slot(k, LITRE) },
    answer: k * 1000,
    unit: CM3,
    decimal: false,
    maxDigits: 5,
    hints: ['ex.vol.litre.hint1', 'ex.vol.litre.hint2'],
    example:
      k === 2
        ? { display: '3 → 3000', slots: { k: slot(3, LITRE) }, r: 3000 }
        : { display: '2 → 2000', slots: { k: slot(2, LITRE) }, r: 2000 },
    wrong: [k * 100, k * 10],
  });

const aquarium = (x: Box): Exercise => {
  const answer = (x.a * x.b * x.c) / 1000;
  const e: Box =
    x.a === 50 && x.b === 20 && x.c === 30 ? { a: 40, b: 20, c: 25 } : { a: 50, b: 20, c: 30 };
  return build({
    level: 10,
    id: `aqua:${x.a}x${x.b}x${x.c}`,
    key: 'ex.vol.aquarium',
    slots: { a: slot(x.a, CM), b: slot(x.b, CM), c: slot(x.c, CM) },
    answer,
    unit: LITRE,
    decimal: false,
    maxDigits: 3,
    hints: ['ex.vol.aquarium.hint1', 'ex.vol.litre.hint1'],
    example: {
      display: `${e.a} × ${e.b} × ${e.c} = ${e.a * e.b * e.c}`,
      slots: { a: slot(e.a, CM), b: slot(e.b, CM), c: slot(e.c, CM) },
      r: (e.a * e.b * e.c) / 1000,
    },
    wrong: [x.a * x.b * x.c, (x.a * x.b * x.c) / 100],
  });
};

/** Boxes whose volume is not also the sum of the edges or the surface (6 × 6 × 6: both 216). */
const BOXES: Box[] = range(2, 9)
  .flatMap((a) => range(2, a).flatMap((b) => range(2, 6).map((c) => ({ a, b, c }))))
  .filter(
    ({ a, b, c }) => a * b * c !== a + b + c && a * b * c !== 2 * (a * b + b * c + a * c),
  );
const AQUARIUMS: Box[] = [20, 25, 30, 40, 50, 60]
  .flatMap((a) => [10, 20, 25, 30].flatMap((b) => [10, 20, 30, 40].map((c) => ({ a, b, c }))))
  .filter((x) => (x.a * x.b * x.c) % 1000 === 0);

export const circleVolume = defineTopic({
  id: ID,
  labelKey: 'topic.circleVolume',
  grades: [6],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => range(1, 25),
      (r) => radiusDiameter(r, true),
    ),
    closed(
      L(2),
      () => range(1, 25),
      (r) => radiusDiameter(r, false),
    ),
    closed(
      L(3),
      // Not d = 4 (r = 2): there the area and the circumference are the same number,
      // so a child who mixes them up would be told she is right.
      () => range(1, 30).filter((d) => d !== 4),
      (d) => circumference(d, false),
    ),
    closed(
      L(4),
      () => range(1, 15).filter((r) => r !== 2),
      (r) => circumference(r, true),
    ),
    closed(
      L(5),
      // Not r = 1 or 2: there the area equals π × r or the circumference.
      () => range(3, 12),
      area,
    ),
    closed(L(6), () => BOXES, boxVolume),
    closed(L(7), () => range(2, 12), cube),
    closed(L(8), () => BOXES, missingEdge),
    closed(L(9), () => range(1, 20), litres),
    closed(L(10), () => AQUARIUMS, aquarium),
  ],
});
