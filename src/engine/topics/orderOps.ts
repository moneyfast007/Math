import { shown, type Slot, type Spoken } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
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
} from '../build';
import { randInt } from '../rng';
import type { Exercise, Rng } from '../types';

/**
 * World 17, grade 5: "סדר פעולות וחוקי החשבון". Multiplication before
 * addition, left to right, brackets, two brackets, the distributive law,
 * a missing number inside an expression, two-step stories.
 *
 * Every expression is a shape with three or four numbers; its display, its
 * spoken form (brackets are read "פותחים סוגריים … סוגרים סוגריים"), its value
 * and the typical wrong value (the operations done in the wrong order).
 */

const ID = 'order-ops';
const L = (n: number) => `level.orderOps.${n}`;

interface Shape {
  key: TranslationKey;
  display: string;
  slots: Record<string, Slot>;
  value: number;
  wrong: number;
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
    slots: { a, b, c, d },
    value: (a + b) * (c - d),
    wrong: a + b * c - d,
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
  };
};

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
  const diagnose = (v: number): MistakeKind | null => (v === s.wrong ? 'order' : null);
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
      hint(say('hint.order.rule')),
      exampleHint(`${example.display} = ${example.value}`, solved(example)),
    ],
    solution: solved(s),
    diagnose,
  });
}

/** Each shape has a matching solution template: "{a} ועוד {b} כפול {c} זה {r}." */
function solved(s: Shape): Spoken {
  return say(`${s.key}.solution` as TranslationKey, { ...s.slots, r: s.value });
}

/** 7 × 23 = 7 × 20 + 7 × ? */
function distributive(rng: Rng): Exercise {
  const a = randInt(rng, 3, 9);
  const tens = randInt(rng, 1, 9) * 10;
  const u = randInt(rng, 1, 9);
  return exercise({
    factId: `dist:${a}x${tens + u}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.missing.prompt'),
    display: `${a} × ${tens + u} = ${a} × ${tens} + ${a} × ?`,
    spoken: say('ex.ord.dist.spoken', { a, n: tens + u, t: tens }),
    answer: u,
    input: numpad(2),
    hints: [
      hint(say('ex.ord.dist.hint1', { n: tens + u, t: tens })),
      hint(say('ex.ord.dist.hint2')),
      // Not an example whose missing number is this answer: it would give it away.
      exampleAvoiding(
        u,
        [
          { a: 4, tens: 20, u: 3 },
          { a: 6, tens: 30, u: 2 },
        ].map((ex) => ({
          answer: ex.u,
          hint: () =>
            exampleHint(
              `${ex.a} × ${ex.tens + ex.u} = ${ex.a} × ${ex.tens} + ${ex.a} × ${ex.u}`,
              say('ex.ord.dist.solution', { n: ex.tens + ex.u, t: ex.tens, u: ex.u }),
            ),
        })),
      ),
    ],
    solution: say('ex.ord.dist.solution', { n: tens + u, t: tens, u }),
    diagnose: (v) => (v === tens + u ? 'other' : null),
  });
}

/** (? + 4) × 3 = 21 */
function missingInside(rng: Rng): Exercise {
  const x = randInt(rng, 1, 12);
  const b = randInt(rng, 1, 9);
  const c = randInt(rng, 2, 9);
  const r = (x + b) * c;
  // Neither the example's missing number nor its result may be this answer.
  const first = { x: 3, b: 4, c: 3 };
  const ex = x !== first.x && x !== (first.x + first.b) * first.c ? first : { x: 2, b: 5, c: 4 };
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
      exampleHint(
        `(${ex.x} + ${ex.b}) × ${ex.c} = ${(ex.x + ex.b) * ex.c}`,
        say('ex.ord.inside.solution', { x: ex.x }),
      ),
    ],
    solution: say('ex.ord.inside.solution', { x }),
    diagnose: (v) => (v === r / c ? 'other' : null),
  });
}

const NOTEBOOK = { singular: 'מחברת', plural: 'מחברות', gender: 'f' as const };

/** Two steps: k notebooks at a price, plus a pen. */
function story(rng: Rng): Exercise {
  const k = randInt(rng, 3, 8);
  const price = randInt(rng, 3, 15);
  const pen = randInt(rng, 3, 12);
  const who = CHARACTERS[(k + pen) % CHARACTERS.length] as Character;
  const answer = k * price + pen;
  const spoken = say(
    'wp.ord.shop.story',
    { name: who.name, k: { n: k, noun: NOTEBOOK }, price, pen },
    who.gender,
  );
  return exercise({
    factId: `owp:${k}x${price}+${pen}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    input: numpad(3),
    hints: [
      hint(say('wp.ord.shop.hint1')),
      {
        ...hint(say('hint.equation')),
        example: { display: `${k} × ${price} + ${pen} = ?`, spoken: say('hint.equation').text },
      },
      // Not an example whose total is this answer: it would give it away.
      exampleAvoiding(
        answer,
        [
          { a: 3, b: 8, c: 5 },
          { a: 4, b: 6, c: 3 },
        ].map((ex) => {
          const r = ex.a * ex.b + ex.c;
          return {
            answer: r,
            hint: () =>
              exampleHint(
                `${ex.a} × ${ex.b} + ${ex.c} = ${r}`,
                say('wp.ord.shop.solution', { ...ex, r }),
              ),
          };
        }),
      ),
    ],
    solution: say('wp.ord.shop.solution', { a: k, b: price, c: pen, r: answer }),
    diagnose: (v) => (v === k * (price + pen) ? 'order' : null),
  });
}

function storyBank(): string[] {
  return CHARACTERS.flatMap(
    (who) =>
      say(
        'wp.ord.shop.story',
        { name: who.name, k: { n: 3, noun: NOTEBOOK }, price: 8, pen: 5 },
        who.gender,
      ).parts,
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
