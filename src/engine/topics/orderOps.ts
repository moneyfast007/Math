import { shown, type Slot, type Spoken } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import type { MistakeKind } from '@/state/schema';
import {
  CHARACTERS,
  defineTopic,
  exampleAvoiding,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  say,
  type Character,
  type Said,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';

/**
 * World 17, grade 5: "סדר פעולות וחוקי החשבון". Multiplication before
 * addition, left to right, brackets, two brackets, the distributive law,
 * a missing number inside an expression, two-step stories.
 *
 * Every expression is a shape with three or four numbers; its display, its
 * spoken form (brackets are read "פותחים סוגריים … סוגרים סוגריים"), its value,
 * the typical wrong value (the operations done in the wrong order), and its
 * first step with these numbers (the second hint).
 */

const ID = 'order-ops';
const L = (n: number) => `level.orderOps.${n}`;

interface Shape {
  key: TranslationKey;
  display: string;
  slots: Record<string, Slot>;
  value: number;
  wrong: number;
  /** What to work out first, with the numbers: "קודם נחשב 4 כפול 3. כמה זה?" */
  first: Said;
}

type Gen = (rng: Rng) => Shape | null;

const plusTimes: Gen = (rng) => {
  const a = randInt(rng, 2, 30);
  const b = randInt(rng, 2, 9);
  const c = randInt(rng, 2, 9);
  return {
    key: 'ex.ord.aPlusBC',
    display: `${a} + ${b} × ${c}`,
    slots: { a, b, c },
    value: a + b * c,
    wrong: (a + b) * c,
    first: say('ord.step.mul', { x: b, y: c }),
  };
};

const timesMinusDiv: Gen = (rng) => {
  const a = randInt(rng, 3, 9);
  const b = randInt(rng, 3, 9);
  const d = randInt(rng, 2, 9);
  const q = randInt(rng, 1, Math.min(9, Math.floor((a * b) / d)));
  const c = d * q;
  if (a * b - q < 0) return null;
  return {
    key: 'ex.ord.abMinusCD',
    display: `${a} × ${b} − ${c} ÷ ${d}`,
    slots: { a, b, c, d },
    value: a * b - q,
    wrong: Math.floor((a * b - c) / d),
    first: say('ord.step.both', { a, b, c, d }),
  };
};

const bracketTimes: Gen = (rng) => {
  const a = randInt(rng, 2, 15);
  const b = randInt(rng, 2, 15);
  const c = randInt(rng, 2, 9);
  return {
    key: 'ex.ord.bracketPlusTimes',
    display: `(${a} + ${b}) × ${c}`,
    slots: { a, b, c },
    value: (a + b) * c,
    wrong: a + b * c,
    first: say('ord.step.add', { x: a, y: b }),
  };
};

const timesBracket: Gen = (rng) => {
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 6, 20);
  const c = randInt(rng, 1, b - 1);
  return {
    key: 'ex.ord.timesBracketMinus',
    display: `${a} × (${b} − ${c})`,
    slots: { a, b, c },
    value: a * (b - c),
    wrong: a * b - c,
    first: say('ord.step.sub', { x: b, y: c }),
  };
};

const twoBrackets: Gen = (rng) => {
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 2, 9);
  const c = randInt(rng, 5, 15);
  const d = randInt(rng, 1, c - 1);
  return {
    key: 'ex.ord.twoBrackets',
    display: `(${a} + ${b}) × (${c} − ${d})`,
    // s1, s2: the two brackets, for the solution that says the whole way.
    slots: { a, b, c, d, s1: a + b, s2: c - d },
    value: (a + b) * (c - d),
    wrong: a + b * c - d,
    first: say('ord.step.two', { a, b, c, d }),
  };
};

const leftToRightAdd: Gen = (rng) => {
  const a = randInt(rng, 20, 60);
  const b = randInt(rng, 5, a - 1);
  const c = randInt(rng, 2, 15);
  // The slip: adding first, a − (b + c).
  if (a - (b + c) < 0) return null;
  return {
    key: 'ex.ord.minusPlus',
    display: `${a} − ${b} + ${c}`,
    slots: { a, b, c },
    value: a - b + c,
    wrong: a - (b + c),
    first: say('ord.step.ltrSub', { x: a, y: b }),
  };
};

const leftToRightMul: Gen = (rng) => {
  const b = randInt(rng, 2, 6);
  const q = randInt(rng, 2, 9);
  const c = randInt(rng, 2, 6);
  const a = b * q;
  const wrong = a / (b * c);
  return {
    key: 'ex.ord.divTimes',
    display: `${a} ÷ ${b} × ${c}`,
    slots: { a, b, c },
    value: q * c,
    wrong: Number.isInteger(wrong) ? wrong : -1,
    first: say('ord.step.ltrDiv', { x: a, y: b }),
  };
};

/** The solution of a shape; two brackets say both brackets and the product. */
function solved(s: Shape): Spoken {
  const key =
    s.key === 'ex.ord.twoBrackets'
      ? 'ord.twoBrackets.solution'
      : (`${s.key}.solution` as TranslationKey);
  return say(key, { ...s.slots, r: s.value });
}

function fromShape(level: number, gen: Gen, rng: Rng): Exercise {
  const s = gen(rng);
  if (!s) return fromShape(level, gen, rng);
  const spoken = say(s.key, s.slots);
  // The example is the same shape at fixed draws: not this exercise, and not one with
  // the same value, which would give the answer away.
  const example = [0.37, 0.71, 0.13, 0.9]
    .map((x) => gen(() => x))
    .find((e) => e && e.display !== s.display && e.value !== s.value);
  if (!example) return fromShape(level, gen, rng);
  const diagnose = (v: number): MistakeKind | null =>
    v === s.wrong ? 'order' : Math.abs(v - s.value) === 1 ? 'offByOne' : null;
  return exercise({
    factId: `ord:${s.display}`,
    topicId: ID,
    level,
    prompt: t('ex.arith.prompt'),
    display: `${s.display} = ?`,
    spoken,
    answer: s.value,
    input: numpad(3),
    hints: [
      hint(
        say(
          s.display.includes('(')
            ? 'hint.order.brackets'
            : s.display.includes('×') && (s.display.includes('+') || s.display.includes('−'))
              ? 'hint.order.first'
              : 'hint.order.leftToRight',
        ),
      ),
      // The first step with these numbers, not the rule again.
      hint(s.first),
      exampleHint(`${example.display} = ${example.value}`, solved(example)),
    ],
    solution: solved(s),
    diagnose,
  });
}

/**
 * 7 × 23 = 7 × 20 + ?, or 7 × 98 = 7 × 100 − ?: the asked part is a product,
 * not a digit already on the screen; both ways of breaking the number.
 */
function distributive(rng: Rng): Exercise {
  const a = randInt(rng, 3, 9);
  const minus = rng() < 0.5;
  // Not u = 1: then the answer is a, already on the screen.
  const u = minus ? randInt(rng, 2, 3) : randInt(rng, 2, 9);
  const t10 = minus ? randInt(rng, 2, 10) * 10 : randInt(rng, 1, 9) * 10;
  const n = minus ? t10 - u : t10 + u;
  const sign = minus ? '−' : '+';
  const answer = a * u;
  const solvedOf = (x: { a: number; t: number; u: number }) =>
    say(minus ? 'ord.dist.solution.minus' : 'ord.dist.solution.plus', {
      a: x.a,
      n: minus ? x.t - x.u : x.t + x.u,
      t: x.t,
      u: x.u,
      r: x.a * x.u,
    });
  return exercise({
    factId: `dist:${a}x${n}${minus ? '-' : '+'}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.missing.prompt'),
    display: `${a} × ${n} = ${a} × ${t10} ${sign} ?`,
    spoken: say(minus ? 'ord.dist.minus' : 'ord.dist.plus', { a, n, t: t10 }),
    answer,
    input: numpad(2),
    hints: [
      hint(say(minus ? 'ord.dist.hint1.minus' : 'ord.dist.hint1.plus', { n, t: t10, u })),
      hint(say('ord.dist.hint2', { a, t: t10, u })),
      // Not an example whose missing number is this answer: it would give it away.
      exampleAvoiding(
        answer,
        (minus
          ? [
              { a: 4, t: 30, u: 2 },
              { a: 6, t: 50, u: 3 },
            ]
          : [
              { a: 4, t: 20, u: 3 },
              { a: 6, t: 30, u: 4 },
            ]
        ).map((x) => ({
          answer: x.a * x.u,
          hint: () =>
            exampleHint(
              `${x.a} × ${minus ? x.t - x.u : x.t + x.u} = ${x.a} × ${x.t} ${sign} ${x.a * x.u}`,
              solvedOf(x),
            ),
        })),
      ),
    ],
    solution: solvedOf({ a, t: t10, u }),
    // The units alone (not multiplied), or the whole product.
    diagnose: (v) => (v === u || v === a * n ? 'other' : null),
  });
}

/** (? + 4) × 3 = 21 */
function missingInside(rng: Rng): Exercise {
  const x = randInt(rng, 1, 12);
  const b = randInt(rng, 1, 9);
  const c = randInt(rng, 2, 9);
  const r = (x + b) * c;
  const said = (e: { x: number; b: number; c: number }) =>
    say('ord.inside.solution', { r: (e.x + e.b) * e.c, c: e.c, s: e.x + e.b, b: e.b, x: e.x });
  // Not an example whose missing number is this answer.
  const ex = x !== 5 ? { x: 5, b: 4, c: 2 } : { x: 3, b: 5, c: 4 };
  return exercise({
    factId: `minside:${x}+${b}x${c}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.missing.prompt'),
    display: `(? + ${b}) × ${c} = ${r}`,
    spoken: say('ex.ord.inside.spoken', { b, c, r }),
    answer: x,
    input: numpad(2),
    hints: [
      hint(say('ex.ord.inside.hint1', { c, r })),
      hint(say('ex.ord.inside.hint2', { b })),
      // The way back, not the filled-in exercise: first undo the times, then the plus.
      exampleHint(`(? + ${ex.b}) × ${ex.c} = ${(ex.x + ex.b) * ex.c} → ? = ${ex.x}`, said(ex)),
    ],
    solution: said({ x, b, c }),
    // Stopped inside the brackets, or added the number instead of taking it away.
    diagnose: (v) => (v === r / c || v === r / c + b ? 'other' : null),
  });
}

const NOTEBOOK: Noun = { singular: 'מחברת', plural: 'מחברות', gender: 'f' };
const TICKET: Noun = { singular: 'כרטיס', plural: 'כרטיסים', gender: 'm' };

/**
 * Two steps: k things at a price plus one more thing (notebooks and a pen,
 * cinema tickets and popcorn), or the change from a note.
 */
function story(rng: Rng): Exercise {
  const k = randInt(rng, 3, 8);
  const price = randInt(rng, 3, 15);
  const pen = randInt(rng, 3, 12);
  const kind = pick(rng, ['shop', 'cinema', 'change'] as const);
  const who = CHARACTERS[(k + pen) % CHARACTERS.length] as Character;
  const bill = [50, 100, 200].find((x) => x > k * price) as number;
  const change = kind === 'change';
  const answer = change ? bill - k * price : k * price + pen;
  const key: TranslationKey =
    kind === 'shop' ? 'wp.ord.shop.story' : kind === 'cinema' ? 'ord.wp.cinema' : 'ord.wp.change';
  const spoken = say(
    key,
    {
      name: who.name,
      k: { n: k, noun: kind === 'cinema' ? TICKET : NOTEBOOK },
      price,
      pen,
      bill,
    },
    who.gender,
  );
  const shown2 = change ? `${bill} − ${k} × ${price} = ?` : `${k} × ${price} + ${pen} = ?`;
  return exercise({
    factId: `owp:${kind}:${k}x${price}${change ? `:${bill}` : `+${pen}`}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    input: numpad(3),
    hints: [
      hint(
        say(
          change
            ? 'ord.wp.change.hint1'
            : kind === 'cinema'
              ? 'ord.wp.cinema.hint1'
              : 'wp.ord.shop.hint1',
        ),
      ),
      {
        ...hint(say('hint.equation')),
        example: { display: shown2, spoken: say('hint.equation').text },
      },
      // Not an example whose total is this answer: it would give it away.
      exampleAvoiding(
        answer,
        [
          { a: 3, b: 8, c: change ? 50 : 5 },
          { a: 4, b: 6, c: change ? 100 : 3 },
        ].map((ex) => {
          const r = change ? ex.c - ex.a * ex.b : ex.a * ex.b + ex.c;
          return {
            answer: r,
            hint: () =>
              exampleHint(
                change
                  ? `${ex.c} − ${ex.a} × ${ex.b} = ${r}`
                  : `${ex.a} × ${ex.b} + ${ex.c} = ${r}`,
                say(change ? 'ord.wp.change.solution' : 'wp.ord.shop.solution', { ...ex, r }),
              ),
          };
        }),
      ),
    ],
    solution: say(change ? 'ord.wp.change.solution' : 'wp.ord.shop.solution', {
      a: k,
      b: price,
      c: change ? bill : pen,
      r: answer,
    }),
    // Adding before multiplying, or stopping after the first step (the cost, not the change).
    diagnose: (v) =>
      change
        ? v === k * price
          ? 'other'
          : v === (bill - k) * price
            ? 'order'
            : null
        : v === k * (price + pen)
          ? 'order'
          : null,
  });
}

function storyBank(): string[] {
  return CHARACTERS.flatMap((who) =>
    (['wp.ord.shop.story', 'ord.wp.cinema', 'ord.wp.change'] as const).flatMap(
      (key) =>
        say(
          key,
          {
            name: who.name,
            k: { n: 3, noun: key === 'ord.wp.cinema' ? TICKET : NOTEBOOK },
            price: 8,
            pen: 5,
            bill: 50,
          },
          who.gender,
        ).parts,
    ),
  );
}

export const orderOps = defineTopic({
  id: ID,
  labelKey: 'topic.orderOps',
  grades: [5],
  startLevel: () => 1,
  extraBank: storyBank,
  levels: [
    open(L(1), (rng) => fromShape(1, plusTimes, rng)),
    open(L(2), (rng) => fromShape(2, timesMinusDiv, rng)),
    open(L(3), (rng) => fromShape(3, bracketTimes, rng)),
    open(L(4), (rng) => fromShape(4, timesBracket, rng)),
    open(L(5), (rng) => fromShape(5, twoBrackets, rng)),
    open(L(6), (rng) => fromShape(6, leftToRightAdd, rng)),
    open(L(7), (rng) => fromShape(7, leftToRightMul, rng)),
    open(L(8), distributive),
    open(L(9), missingInside),
    open(L(10), story),
  ],
});
