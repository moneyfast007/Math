import { shown } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise as baseExercise,
  gcd,
  hint,
  numpad,
  range,
  round,
  say,
  type Said,
  type ExerciseParts,
} from '../build';
import type { Exercise } from '../types';

/**
 * World 19, grade 6: "יחס". Simplifying, equivalent ratios, dividing a
 * quantity in a ratio, the whole from a part, scale on a plan and on a map
 * (both ways, and finding the scale), unit price, proportion, and speed, time
 * and distance.
 *
 * A ratio is read "שלוש לחמש": the ל belongs to the number, so these sentences
 * cannot be assembled from separate number clips. Every level is closed and
 * every sentence is recorded whole.
 */

const ID = 'ratio';

/**
 * Every exercise here also hears "very close" for an answer one off; the
 * typical slips of each question are diagnosed first.
 */
function exercise(p: ExerciseParts): Exercise {
  return baseExercise({
    ...p,
    diagnose: (v) =>
      p.diagnose?.(v) ??
      (Number.isInteger(p.answer) && Math.abs(v - p.answer) === 1 ? 'offByOne' : null),
  });
}
const L = (n: number) => `level.ratio.${n}`;
const r = (a: number, b: number) => `${a} : ${b}`;

/** 6 : 4 = 3 : ? */
function simplify(a: number, b: number): Exercise {
  const g = gcd(a, b);
  const answer = b / g;
  return exercise({
    factId: `rsimp:${a}:${b}`,
    topicId: ID,
    level: 1,
    prompt: t('ex.ratio.missing.prompt'),
    display: `${r(a, b)} = ${a / g} : ?`,
    spoken: say('ex.ratio.simplify.spoken', { a, b, c: a / g }),
    answer,
    input: numpad(2),
    hints: [
      hint(say('ex.ratio.simplify.hint1')),
      hint(say('ex.ratio.simplify.hint2', { g })),
      // Not an example whose missing number is this answer: it would give it away.
      exampleAvoiding(
        answer,
        [
          { a: 6, b: 4 },
          { a: 10, b: 15 },
        ].map((ex) => {
          const eg = gcd(ex.a, ex.b);
          return {
            answer: ex.b / eg,
            hint: () =>
              exampleHint(
                `${r(ex.a, ex.b)} = ${r(ex.a / eg, ex.b / eg)}`,
                say('ex.ratio.equal.solution', { a: ex.a, b: ex.b, c: ex.a / eg, d: ex.b / eg }),
              ),
          };
        }),
      ),
    ],
    solution: say('ex.ratio.equal.solution', { a, b, c: a / g, d: answer }),
    // Not divided at all, or the same number taken away from both sides (6 : 4 = 3 : 1).
    diagnose: (v) => (v === b || v === b - (a - a / g) ? 'other' : null),
    advice: [b, b - (a - a / g)]
      .filter((v) => v >= 0)
      .map((v) => ({ value: v, say: say('r6.adv.simp.both', { a, g, c: a / g, b }) })),
  });
}

/** 2 : 3 = ? : 12 */
function equivalent(a: number, b: number, k: number): Exercise {
  const answer = a * k;
  return exercise({
    factId: `requiv:${a}:${b}x${k}`,
    topicId: ID,
    level: 2,
    prompt: t('ex.ratio.missing.prompt'),
    display: `${r(a, b)} = ? : ${b * k}`,
    spoken: say('ex.ratio.equiv.spoken', { a, b, d: b * k }),
    answer,
    input: numpad(3),
    hints: [
      hint(say('ex.ratio.equiv.hint1', { b, d: b * k })),
      hint(say('ex.ratio.equiv.hint2')),
      // Not an example whose missing number is this answer: it would give it away.
      exampleAvoiding(
        answer,
        [
          { a: 2, b: 3, k: 4 },
          { a: 3, b: 4, k: 2 },
        ].map((ex) => ({
          answer: ex.a * ex.k,
          hint: () =>
            exampleHint(
              `${r(ex.a, ex.b)} = ${r(ex.a * ex.k, ex.b * ex.k)}`,
              say('ex.ratio.equal.solution', { a: ex.a, b: ex.b, c: ex.a * ex.k, d: ex.b * ex.k }),
            ),
        })),
      ),
    ],
    solution: say('ex.ratio.equal.solution', { a, b, c: answer, d: b * k }),
    diagnose: (v) => (v === a + (b * k - b) ? 'other' : null),
    advice: [{ value: a + (b * k - b), say: say('r6.adv.equiv.add', { a, b, d: b * k }) }],
  });
}

const PART: Noun = { singular: 'חלק', plural: 'חלקים', gender: 'm' };

/**
 * What is shared in a ratio: a class, a necklace, stickers, lemonade. Each has
 * its question for the first and the second share (levels 3–4) and for the
 * whole from the first share (level 5).
 */
interface Context {
  id: string;
  total: Noun;
  first: Noun;
  divide: [TranslationKey, TranslationKey];
  whole: TranslationKey;
  /** Only real-sized wholes: a class has 20 to 40 children. */
  fits: (n: number) => boolean;
}

const CONTEXTS: readonly Context[] = [
  {
    id: 'class',
    total: { singular: 'ילד', plural: 'ילדים', gender: 'm' },
    first: { singular: 'בן', plural: 'בנים', gender: 'm' },
    divide: ['r6.div.class.1', 'r6.div.class.2'],
    whole: 'r6.whole.class',
    fits: (n) => n >= 20 && n <= 40,
  },
  {
    id: 'beads',
    total: { singular: 'חרוז', plural: 'חרוזים', gender: 'm' },
    first: { singular: 'חרוז אדום', plural: 'חרוזים אדומים', gender: 'm' },
    divide: ['r6.div.beads.1', 'r6.div.beads.2'],
    whole: 'r6.whole.beads',
    fits: (n) => n >= 10,
  },
  {
    id: 'stickers',
    total: { singular: 'מדבקה', plural: 'מדבקות', gender: 'f' },
    first: { singular: 'מדבקה', plural: 'מדבקות', gender: 'f' },
    divide: ['r6.div.stickers.1', 'r6.div.stickers.2'],
    whole: 'r6.whole.stickers',
    fits: (n) => n >= 10,
  },
  {
    id: 'lemonade',
    total: { singular: 'כוס', plural: 'כוסות', gender: 'f' },
    first: { singular: 'כוס', plural: 'כוסות', gender: 'f' },
    divide: ['r6.div.lemonade.1', 'r6.div.lemonade.2'],
    whole: 'r6.whole.lemonade',
    fits: (n) => n <= 30,
  },
];

/** The context of a fact follows from its numbers, so every sentence can be listed. */
function contextOf(n: number, seed: number): Context {
  const fitting = CONTEXTS.filter((c) => c.fits(n));
  return fitting[seed % fitting.length] as Context;
}

/** "20, 2 : 3 → 20 ÷ 5 = 4 → 2 × 4 = 8": the whole way, for the worked example. */
function divideSolution(a: number, b: number, n: number, first: boolean): Said {
  const unit = n / (a + b);
  const k = first ? a : b;
  return say('r6.divide.solution', { parts: { n: a + b, noun: PART }, unit, k, ans: k * unit });
}

/** a : b, total n: how many in the first share (level 3) / in the second (level 4)? */
function divide(level: 3 | 4, a: number, b: number, n: number): Exercise {
  const unit = n / (a + b);
  const first = level === 3;
  const answer = (first ? a : b) * unit;
  const ctx = contextOf(n, a * 5 + b * 3 + unit);
  const spoken = say(ctx.divide[first ? 0 : 1], { a, b, n: { n, noun: ctx.total } });
  return exercise({
    factId: `rdiv${level}:${a}:${b}:${n}`,
    topicId: ID,
    level,
    // The data on screen too (with digits), not only heard.
    prompt: shown(spoken),
    display: r(a, b),
    spoken,
    // The ratio as a bar of a + b equal parts, in two colours (a tape model).
    visual: { type: 'fraction', parts: a + b, shaded: a, added: b },
    answer,
    input: numpad(3),
    hints: [
      hint(say('r6.divide.hint1', { a, b, parts: { n: a + b, noun: PART } })),
      hint(say('r6.divide.hint2', { n, sum: a + b })),
      // The example's answer is never this one.
      exampleAvoiding(
        answer,
        [
          { a: 2, b: 3, n: 20 },
          { a: 1, b: 3, n: 20 },
          { a: 3, b: 4, n: 28 },
        ].map((e) => {
          const u = e.n / (e.a + e.b);
          const k = first ? e.a : e.b;
          return {
            answer: k * u,
            hint: () =>
              exampleHint(
                `${e.n}, ${r(e.a, e.b)} → ${e.n} ÷ ${e.a + e.b} = ${u} → ${k} × ${u} = ${k * u}`,
                divideSolution(e.a, e.b, e.n, first),
              ),
          };
        }),
      ),
    ],
    solution: divideSolution(a, b, n, first),
    // The other share, one part only, or the whole divided by one number of the ratio.
    diagnose: (v) =>
      v === (first ? b : a) * unit || v === unit || v === n / (first ? a : b) ? 'other' : null,
    advice: [
      {
        value: (first ? b : a) * unit,
        say: say(`r6.adv.other.${ctx.id}.${first ? 1 : 2}` as TranslationKey, {
          w: (first ? b : a) * unit,
          k: { n: first ? a : b, noun: PART },
        }),
      },
      {
        value: unit,
        say: say('r6.adv.div.unit', { w: unit, k: { n: first ? a : b, noun: PART } }),
      },
      ...((first ? a : b) > 1 && Number.isInteger(n / (first ? a : b))
        ? [
            {
              value: n / (first ? a : b),
              say: say('r6.adv.div.one', {
                n,
                x: first ? a : b,
                a,
                b,
                parts: { n: a + b, noun: PART },
              }),
            },
          ]
        : []),
    ],
  });
}

/** a : b, and the first share is x: how many altogether? */
function wholeFromPart(a: number, b: number, unit: number): Exercise {
  const part = a * unit;
  const total = (a + b) * unit;
  const ctx = contextOf(total, a * 3 + b + unit);
  const spoken = say(ctx.whole, { a, b, first: { n: part, noun: ctx.first } });
  const solved = (x: { a: number; b: number; unit: number }) =>
    say('r6.whole.solution', {
      a: x.a,
      unit: x.unit,
      sum: x.a + x.b,
      total: x.unit * (x.a + x.b),
    });
  return exercise({
    factId: `rwhole:${a}:${b}:${unit}`,
    topicId: ID,
    level: 5,
    prompt: shown(spoken),
    display: r(a, b),
    spoken,
    visual: { type: 'fraction', parts: a + b, shaded: a, added: b },
    answer: total,
    input: numpad(3),
    hints: [
      hint(say('r6.whole.hint1', { a: { n: a, noun: PART }, part })),
      hint(say('ex.ratio.whole.hint2', { parts: { n: a + b, noun: PART } })),
      // The example shows its part and its total: neither may be this answer.
      exampleAvoiding(
        total,
        [
          { a: 2, b: 3, unit: 4 },
          { a: 1, b: 2, unit: 5 },
          { a: 3, b: 4, unit: 3 },
        ]
          .filter((x) => x.a * x.unit !== total)
          .map((x) => ({
            answer: (x.a + x.b) * x.unit,
            hint: () =>
              exampleHint(
                `${x.a * x.unit} ÷ ${x.a} = ${x.unit} → ${x.a + x.b} × ${x.unit} = ${(x.a + x.b) * x.unit}`,
                solved(x),
              ),
          })),
      ),
    ],
    solution: solved({ a, b, unit }),
    // The other share only, or the part added to the ratio's numbers.
    diagnose: (v) => (v === b * unit || v === part + b ? 'other' : null),
    advice: [
      { value: b * unit, say: say('r6.adv.whole.other', { w: b * unit }) },
      { value: part + b, say: say('r6.adv.whole.addRatio', { part, k: { n: a, noun: PART } }) },
    ],
  });
}

const CM: Noun = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' };
const M: Noun = { singular: 'מטר', plural: 'מטרים', gender: 'm' };

/** On a plan at 1 : k (50, 100, 200), x cm are ? m. */
function planScale(k: number, x: number): Exercise {
  const answer = (x * k) / 100;
  const ex = [4, 6].find((e) => (e * k) / 100 !== answer) as number;
  const solved = (y: number) =>
    say('r6.scale.solution', { x: y, k, cm: y * k, m: { n: (y * k) / 100, noun: M } });
  return exercise({
    factId: `rplan${k}:${x}`,
    topicId: ID,
    level: 6,
    prompt: shown(say('r6.plan.spoken', { k, x: { n: x, noun: CM } })),
    display: `1 : ${k}`,
    spoken: say('r6.plan.spoken', { k, x: { n: x, noun: CM } }),
    answer,
    input: numpad(3),
    hints: [
      hint(say('r6.scale.hint1', { k })),
      hint(say('r6.scale.hint2', { x, k, cm: x * k })),
      exampleHint(`${ex} × ${k} = ${ex * k} → ${(ex * k) / 100}`, solved(ex)),
    ],
    solution: solved(x),
    // Centimetres not turned into metres, or the plan's number itself.
    diagnose: (v) => (v === x * k ? 'placeValue' : v === x ? 'other' : null),
    advice: [
      { value: x * k, say: say('r6.adv.scale.cm', { w: x * k }) },
      { value: x, say: say('r6.adv.scale.same', { w: x, k }) },
    ],
  });
}

type MapFact =
  | { kind: 'toReal'; k: number; x: number }
  | { kind: 'toMap'; k: number; m: number }
  | { kind: 'findScale'; k: number; x: number };

/** A map at 1 : k: to metres, back to centimetres on the plan, or the scale itself. */
function mapScale(f: MapFact): Exercise {
  if (f.kind === 'toReal') {
    const answer = (f.x * f.k) / 100;
    const ex = [3, 4].find((e) => (e * f.k) / 100 !== answer) as number;
    const solved = (y: number) =>
      say('r6.scale.solution', { x: y, k: f.k, cm: y * f.k, m: { n: (y * f.k) / 100, noun: M } });
    const spoken = say('r6.map.spoken', { k: f.k, x: { n: f.x, noun: CM } });
    return exercise({
      factId: `rmap${f.k}:${f.x}`,
      topicId: ID,
      level: 7,
      prompt: shown(spoken),
      display: `1 : ${f.k}`,
      spoken,
      answer,
      input: numpad(4),
      hints: [
        hint(say('r6.scale.hint1', { k: f.k })),
        hint(say('r6.scale.hint2', { x: f.x, k: f.k, cm: f.x * f.k })),
        exampleHint(`${ex} × ${f.k} = ${ex * f.k} → ${(ex * f.k) / 100}`, solved(ex)),
      ],
      solution: solved(f.x),
      diagnose: (v) => (v === f.x * f.k ? 'placeValue' : null),
      advice: [{ value: f.x * f.k, say: say('r6.adv.scale.cm', { w: f.x * f.k }) }],
    });
  }
  if (f.kind === 'toMap') {
    // Real metres back to centimetres on the plan: divide by the scale.
    const answer = (f.m * 100) / f.k;
    const ex = [6, 8].find((e) => (e * 100) / f.k !== answer) as number;
    const solved = (m: number) =>
      say('r6.toMap.solution', {
        m: { n: m, noun: M },
        cm: m * 100,
        k: f.k,
        x: { n: (m * 100) / f.k, noun: CM },
      });
    const spoken = say('r6.toMap.spoken', { k: f.k, m: { n: f.m, noun: M } });
    return exercise({
      factId: `rtomap${f.k}:${f.m}`,
      topicId: ID,
      level: 7,
      prompt: shown(spoken),
      display: `1 : ${f.k}`,
      spoken,
      answer,
      operation: 'div',
      input: numpad(3),
      hints: [
        hint(say('r6.toMap.hint1', { k: f.k })),
        hint(say('r6.toMap.hint2', { m: { n: f.m, noun: M }, cm: f.m * 100, k: f.k })),
        exampleHint(`${ex * 100} ÷ ${f.k} = ${(ex * 100) / f.k}`, solved(ex)),
      ],
      solution: solved(f.m),
      // Multiplied by the scale instead of dividing, the metres as they are, or not divided.
      diagnose: (v) =>
        v === f.m * f.k ? 'wrongOperation' : v === f.m || v === f.m * 100 ? 'other' : null,
      advice: [
        { value: f.m * f.k, say: say('r6.adv.toMap.times') },
        { value: f.m, say: say('r6.adv.toMap.same', { m: { n: f.m, noun: M }, k: f.k }) },
        { value: f.m * 100, say: say('r6.adv.toMap.cm', { w: f.m * 100, k: f.k }) },
      ],
    });
  }
  // x cm on the map are m metres: 1 : ?
  const m = (f.x * f.k) / 100;
  const ex = f.k === 500 ? { x: 3, k: 200 } : { x: 2, k: 500 };
  const solved = (x: number, k: number) =>
    say('r6.findScale.solution', { m: { n: (x * k) / 100, noun: M }, cm: x * k, x, k });
  const spoken = say('r6.findScale.spoken', { x: { n: f.x, noun: CM }, m: { n: m, noun: M } });
  return exercise({
    factId: `rfind:${f.x}=${m}`,
    topicId: ID,
    level: 7,
    prompt: shown(spoken),
    display: '1 : ?',
    spoken,
    answer: f.k,
    input: numpad(5),
    hints: [
      hint(say('r6.findScale.hint1', { m: { n: m, noun: M }, cm: m * 100 })),
      hint(say('r6.findScale.hint2', { x: f.x })),
      exampleHint(`${ex.x * ex.k} ÷ ${ex.x} = ${ex.k}`, solved(ex.x, ex.k)),
    ],
    solution: solved(f.x, f.k),
    // The metres not turned into centimetres.
    diagnose: (v) => (v === m / f.x || v * 100 === f.k ? 'placeValue' : null),
    advice: [m / f.x, f.k / 100]
      .filter((v) => Number.isInteger(v) && v > 0)
      .map((v) => ({ value: v, say: say('r6.adv.find.metres', { m: { n: m, noun: M } }) })),
  });
}

const SHEKEL_ITEMS: readonly {
  id: string;
  unit: TranslationKey;
  prop: TranslationKey;
  noun: Noun;
}[] = [
  {
    id: 'notebook',
    unit: 'r6.unit.notebook',
    prop: 'r6.prop.notebook',
    noun: { singular: 'מחברת', plural: 'מחברות', gender: 'f' },
  },
  {
    id: 'ticket',
    unit: 'r6.unit.ticket',
    prop: 'r6.prop.ticket',
    noun: { singular: 'כרטיס', plural: 'כרטיסים', gender: 'm' },
  },
  {
    id: 'apples',
    unit: 'r6.unit.apples',
    prop: 'r6.prop.apples',
    noun: { singular: 'קילוגרם', plural: 'קילוגרמים', gender: 'm' },
  },
];

/** k items cost c: one costs ? (level 8); m items cost ? (level 9). */
function price(level: 8 | 9, k: number, each: number, m: number): Exercise {
  const total = round(k * each, 2);
  const answer = level === 8 ? each : round(m * each, 2);
  const item = SHEKEL_ITEMS[
    (k + m + Math.round(each * 2)) % SHEKEL_ITEMS.length
  ] as (typeof SHEKEL_ITEMS)[number];
  const spoken =
    level === 8
      ? say(item.unit, { k: { n: k, noun: item.noun }, total })
      : say(item.prop, { k: { n: k, noun: item.noun }, total, m: { n: m, noun: item.noun } });
  const examples =
    level === 8
      ? [
          { k: 3, each: 4, m: 0 },
          { k: 4, each: 2.5, m: 0 },
        ]
      : [
          { k: 3, each: 4, m: 5 },
          { k: 4, each: 6, m: 2 },
        ];
  return exercise({
    factId: `rprice${level}:${k}:${each}:${m}`,
    topicId: ID,
    level,
    // The data on screen too (with digits), not only heard.
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: level === 8 ? 'div' : 'mul',
    input: numpad(level === 8 ? 4 : 5, !Number.isInteger(answer)),
    hints: [
      hint(say(level === 8 ? 'ex.ratio.unit.hint1' : 'ex.ratio.prop.hint1')),
      level === 8
        ? hint(say('r6.unit.hint2', { k, total }))
        : hint(say('r6.prop.hint2', { k, total, each, m })),
      // Not an example whose answer is this one: it would give it away.
      exampleAvoiding(
        answer,
        examples.map((e) => {
          const eTotal = round(e.k * e.each, 2);
          return level === 8
            ? {
                answer: e.each,
                hint: () =>
                  exampleHint(
                    `${eTotal} ÷ ${e.k} = ${e.each}`,
                    say('r6.unit.solution', { total: eTotal, k: e.k, each: e.each }),
                  ),
              }
            : {
                answer: round(e.each * e.m, 2),
                hint: () =>
                  exampleHint(
                    `${eTotal} ÷ ${e.k} = ${e.each} → ${e.each} × ${e.m} = ${round(e.each * e.m, 2)}`,
                    say('r6.prop.solution', {
                      total: eTotal,
                      k: e.k,
                      each: e.each,
                      m: e.m,
                      r: round(e.each * e.m, 2),
                    }),
                  ),
              };
        }),
      ),
    ],
    solution:
      level === 8
        ? say('r6.unit.solution', { total, k, each })
        : say('r6.prop.solution', { total, k, each, m, r: answer }),
    // Level 8: multiplied instead of dividing. Level 9: the difference in items added to the
    // price, the unit price only, or the whole price times the new number of items.
    diagnose: (v) =>
      level === 8
        ? Math.abs(v - total * k) < 1e-9
          ? 'wrongOperation'
          : null
        : Math.abs(v - (total + (m - k))) < 1e-9
          ? 'other'
          : null,
    advice:
      level === 8
        ? [
            {
              value: round(total * k, 2),
              say: say('r6.adv.unit.times', { total, k }),
              kind: 'wrongOperation',
            },
          ]
        : [
            { value: round(total + (m - k), 2), say: say('r6.adv.prop.add', { total, k }) },
            { value: each, say: say('r6.adv.prop.unit', { w: each, m }) },
            {
              value: round(total * m, 2),
              say: say('r6.adv.prop.totalTimes', { total, k: { n: k, noun: item.noun }, n: k }),
            },
          ],
  });
}

/** Hours as said: "שעתיים וחצי", "חצי שעה"; also shown so (no digits in a time span). */
const HOURS: Record<string, string> = {
  '0.5': 'חצי שעה',
  '1': 'שעה אחת',
  '1.5': 'שעה וחצי',
  '2': 'שעתיים',
  '2.5': 'שעתיים וחצי',
  '3': 'שלוש שעות',
  '4': 'ארבע שעות',
  '5': 'חמש שעות',
};
const hours = (h: number) => HOURS[String(h)] as string;

type Trip = { kind: 'distance' | 'time' | 'speed'; v: number; h: number; vehicle: string };

const KM: Noun = { singular: 'קילומטר', plural: 'קילומטרים', gender: 'm' };

/** Distance from speed and time, the time from distance and speed, or the speed. */
function trip(f: Trip): Exercise {
  const d = f.v * f.h;
  const answer = f.kind === 'distance' ? d : f.kind === 'time' ? f.h : f.v;
  const key: TranslationKey = `r6.${f.kind}.spoken`;
  const slots = { veh: f.vehicle, v: { n: f.v, noun: KM }, h: hours(f.h), d: { n: d, noun: KM } };
  const spoken = say(key, slots);
  const sol = (x: { v: number; h: number }): Said =>
    f.kind === 'distance'
      ? say('r6.distance.solution', { v: x.v, h: x.h, d: { n: x.v * x.h, noun: KM } })
      : f.kind === 'time'
        ? say('r6.time.solution', { d: x.v * x.h, v: x.v, h: hours(x.h) })
        : say('r6.speed.solution', { d: x.v * x.h, h: x.h, v: { n: x.v, noun: KM } });
  const show = (x: { v: number; h: number }) =>
    f.kind === 'distance'
      ? `${x.v} × ${x.h} = ${x.v * x.h}`
      : f.kind === 'time'
        ? `${x.v * x.h} ÷ ${x.v} = ${x.h}`
        : `${x.v * x.h} ÷ ${x.h} = ${x.v}`;
  const asked = (x: { v: number; h: number }) =>
    f.kind === 'distance' ? x.v * x.h : f.kind === 'time' ? x.h : x.v;
  return exercise({
    factId: `rtrip:${f.kind}:${f.v}x${f.h}`,
    topicId: ID,
    level: 10,
    // The data on screen too (with digits), not only heard.
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    operation: f.kind === 'distance' ? 'mul' : 'div',
    input: numpad(4, !Number.isInteger(answer)),
    hints: [
      hint(say(`r6.${f.kind}.hint1`, { v: { n: f.v, noun: KM } })),
      hint(say(`r6.${f.kind}.hint2`)),
      exampleAvoiding(
        answer,
        [
          { v: 60, h: 3 },
          { v: 50, h: 2 },
        ].map((x) => ({ answer: asked(x), hint: () => exampleHint(show(x), sol(x)) })),
      ),
    ],
    solution: sol(f),
    advice: [
      f.kind === 'distance'
        ? {
            value: f.v + f.h,
            say: say('r6.adv.trip.add', { v: { n: f.v, noun: KM } }),
            kind: 'wrongOperation',
          }
        : f.kind === 'time'
          ? {
              value: d * f.v,
              say: say('r6.adv.trip.timeTimes', { v: { n: f.v, noun: KM }, d: { n: d, noun: KM } }),
              kind: 'wrongOperation',
            }
          : { value: d * f.h, say: say('r6.adv.trip.speedTimes'), kind: 'wrongOperation' },
    ],
    // The two numbers added (distance), or multiplied when dividing (time, speed).
    diagnose: (x) =>
      f.kind === 'distance'
        ? x === f.v + f.h
          ? 'wrongOperation'
          : null
        : Math.abs(x - (f.kind === 'time' ? d * f.v : d * f.h)) < 1e-9
          ? 'wrongOperation'
          : null,
  });
}

/** Ratios a : b (a ≠ b, so never 1 : 1) whose parts make at most ten. */
const RATIOS = range(1, 7).flatMap((a) =>
  range(1, 7)
    .filter((b) => b !== a && gcd(a, b) === 1 && a + b <= 10)
    .map((b) => ({ a, b })),
);
/** A ratio and a whole of 12 to 60 (a class: 20 to 40, see the contexts). */
const SHARES = RATIOS.flatMap(({ a, b }) =>
  range(2, 8)
    .map((u) => ({ a, b, n: (a + b) * u }))
    .filter((x) => x.n >= 12 && x.n <= 60),
);

/** Unit prices: whole shekels and half shekels (7.5), for 3 to 8 items. */
const UNIT_FACTS = range(3, 8).flatMap((k) =>
  [...range(2, 12), 1.5, 2.5, 3.5, 4.5, 6.5, 7.5].map((each) => ({ k, each })),
);
/** k items at `each`, asked about m: fewer or more, and not a multiple (3 for 45, then 2). */
const PROPORTION_FACTS = range(2, 6).flatMap((k) =>
  range(3, 15).flatMap((each) =>
    [k === 2 ? 3 : k - 1, k + 3].filter((m) => m !== k).map((m) => ({ k, each, m })),
  ),
);

const TRIPS: Trip[] = [40, 50, 60, 70, 80, 90, 100, 120].flatMap((v, i) =>
  [0.5, 1.5, 2, 2.5, 3, 4].flatMap((h) =>
    (['distance', 'time', 'speed'] as const).map((kind) => ({
      kind,
      v,
      h,
      vehicle: (i + h * 2) % 2 === 0 ? 'מכונית' : 'רכבת',
    })),
  ),
);

export const ratio = defineTopic({
  id: ID,
  labelKey: 'topic.ratio',
  grades: [6],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () =>
        range(2, 20).flatMap((a) =>
          range(2, 20)
            .filter((b) => b !== a && gcd(a, b) > 1)
            .map((b) => ({ a, b })),
        ),
      (x) => simplify(x.a, x.b),
    ),
    closed(
      L(2),
      () =>
        range(1, 6).flatMap((a) =>
          range(1, 6)
            .filter((b) => b !== a && gcd(a, b) === 1)
            .flatMap((b) => range(2, 6).map((k) => ({ a, b, k }))),
        ),
      (x) => equivalent(x.a, x.b, x.k),
    ),
    closed(
      'level.ratio6.3',
      () => SHARES,
      (x) => divide(3, x.a, x.b, x.n),
    ),
    closed(
      'level.ratio6.4',
      () => SHARES,
      (x) => divide(4, x.a, x.b, x.n),
    ),
    closed(
      L(5),
      () =>
        RATIOS.flatMap(({ a, b }) =>
          range(2, 8)
            .map((unit) => ({ a, b, unit }))
            .filter((x) => x.a * x.unit >= 3 && (x.a + x.b) * x.unit <= 60),
        ),
      (x) => wholeFromPart(x.a, x.b, x.unit),
    ),
    closed(
      'level.ratio6.6',
      // A plan of a flat: 1 : 50, 1 : 100, 1 : 200 (whole metres).
      () => [
        ...range(1, 8).map((x) => ({ k: 50, x: 2 * x })),
        ...range(2, 12).map((x) => ({ k: 100, x })),
        ...range(2, 9).map((x) => ({ k: 200, x })),
      ],
      (x) => planScale(x.k, x.x),
    ),
    closed(
      'level.ratio6.7',
      // A map to metres, metres back to the plan, and the scale from both.
      (): MapFact[] => [
        ...[1000, 5000, 10000].flatMap((k) =>
          range(2, 9).map((x) => ({ kind: 'toReal' as const, k, x })),
        ),
        ...[50, 100, 200].flatMap((k) =>
          range(2, 9).map((m) => ({ kind: 'toMap' as const, k, m: k === 200 ? 2 * m : m })),
        ),
        ...[200, 500, 1000, 2000].flatMap((k) =>
          range(2, 5).map((x) => ({ kind: 'findScale' as const, k, x })),
        ),
      ],
      mapScale,
    ),
    closed(
      L(8),
      () => UNIT_FACTS,
      (x) => price(8, x.k, x.each, 0),
    ),
    closed(
      L(9),
      () => PROPORTION_FACTS,
      (x) => price(9, x.k, x.each, x.m),
    ),
    closed(L(10), () => TRIPS, trip),
  ],
});
