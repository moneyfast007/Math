import { t } from '@/i18n';
import type { MistakeKind } from '@/state/schema';
import {
  arith,
  CHARACTERS,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  round,
  say,
  sayText,
  type Character,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng } from '../types';

/**
 * World 15, grade 5: "פעולות בשברים עשרוניים". Multiplying and dividing
 * decimals by 10, 100 and 1,000, a decimal times a whole, a decimal times a
 * decimal, a decimal divided by a whole, a whole divided by a half or a
 * quarter, money and measurement stories. Sentences are assembled from clips.
 */

const ID = 'decimal-ops';
const L = (n: number) => `level.decimalOps.${n}`;

/** Off by a factor of ten (the point in the wrong place). */
function pointSlip(answer: number): (v: number) => MistakeKind | null {
  return (v) => {
    for (const k of [10, 100, 1000]) {
      if (Math.abs(round(v * k, 6) - answer) < 1e-9 || Math.abs(round(v / k, 6) - answer) < 1e-9)
        return 'placeValue';
    }
    return null;
  };
}

function hints(a: string, b: string): [Hint, Hint] {
  return [hint(say(a as 'ex.dop.power.hint1')), hint(say(b as 'ex.dop.power.hint2'))];
}

function byPower(level: 1 | 2, rng: Rng): Exercise {
  const k = pick(rng, [10, 100, 1000]);
  const times = level === 1;
  // Two decimals when multiplying, one when dividing: at most four decimals in any answer.
  const x = times ? round(randInt(rng, 11, 9999) / 100, 2) : round(randInt(rng, 11, 9999) / 10, 1);
  const answer = round(times ? x * k : x / k, 5);
  return arith({
    topicId: ID,
    level,
    a: x,
    op: times ? '×' : '÷',
    b: k,
    hints: times
      ? hints('ex.dop.power.hint1', 'ex.dop.power.hint2')
      : hints('ex.dop.powerDiv.hint1', 'ex.dop.powerDiv.hint2'),
    example: times ? { a: 3.45, b: k } : { a: 34.5, b: k },
    input: numpad(6, true),
    diagnose: pointSlip(answer),
  });
}

function timesWhole(rng: Rng): Exercise {
  const x = round(randInt(rng, 11, 99) / 10, 1);
  const k = randInt(rng, 2, 9);
  return arith({
    topicId: ID,
    level: 3,
    a: x,
    op: '×',
    b: k,
    hints: hints('ex.dop.timesWhole.hint1', 'ex.dop.timesWhole.hint2'),
    example: { a: 2.5, b: 4 },
    input: numpad(4, true),
    diagnose: pointSlip(round(x * k, 2)),
  });
}

function timesWhole2(rng: Rng): Exercise {
  const x = round(randInt(rng, 101, 999) / 100, 2);
  const k = randInt(rng, 2, 9);
  return arith({
    topicId: ID,
    level: 4,
    a: x,
    op: '×',
    b: k,
    hints: hints('ex.dop.timesWhole.hint1', 'ex.dop.timesWhole.hint2'),
    example: { a: 1.25, b: 4 },
    input: numpad(5, true),
    diagnose: pointSlip(round(x * k, 2)),
  });
}

function timesDecimal(rng: Rng): Exercise {
  const a = round(randInt(rng, 2, 9) / 10, 1);
  const b = round(randInt(rng, 11, 99) / 10, 1);
  return arith({
    topicId: ID,
    level: 5,
    a: b,
    op: '×',
    b: a,
    hints: hints('ex.dop.timesDec.hint1', 'ex.dop.timesDec.hint2'),
    example: { a: 1.5, b: 0.4 },
    input: numpad(4, true),
    diagnose: pointSlip(round(a * b, 2)),
  });
}

function divWhole(rng: Rng): Exercise {
  const k = randInt(rng, 2, 9);
  const q = round(randInt(rng, 11, 99) / 10, 1);
  const a = round(q * k, 1);
  return arith({
    topicId: ID,
    level: 6,
    a,
    op: '÷',
    b: k,
    hints: hints('ex.dop.divWhole.hint1', 'ex.dop.divWhole.hint2'),
    example: { a: 7.5, b: 3 },
    input: numpad(4, true),
    diagnose: pointSlip(q),
  });
}

function divHalf(rng: Rng): Exercise {
  const b = pick(rng, [0.5, 0.25, 0.1]);
  const a = randInt(rng, 2, 20);
  return arith({
    topicId: ID,
    level: 7,
    a,
    op: '÷',
    b,
    hints: hints('ex.dop.divHalf.hint1', 'ex.dop.divHalf.hint2'),
    example: { a: 3, b: 0.5 },
    input: numpad(3),
    diagnose: (v) => (v === round(a * b, 2) ? 'wrongOperation' : null),
  });
}

/** 0.25 = 1/4, 0.5 = 1/2, 0.2 = 1/5: the familiar ones, as a denominator. */
function familiar(rng: Rng): Exercise {
  const [x, d] = pick(rng, [
    [0.5, 2],
    [0.25, 4],
    [0.2, 5],
    [0.1, 10],
    [0.125, 8],
  ] as const);
  return exercise({
    factId: `dfam:${x}`,
    topicId: ID,
    level: 8,
    prompt: t('ex.fmul.denominator.prompt'),
    display: `${x} = 1/?`,
    spoken: say('ex.dop.familiar.spoken', { x }),
    answer: d,
    input: numpad(2),
    hints: [
      hint(say('ex.dop.familiar.hint1')),
      hint(say('ex.dop.familiar.hint2')),
      x === 0.5
        ? exampleHint('0.25 = 1/4', say('ex.dop.familiar.quarter', { x: 0.25 }))
        : exampleHint('0.5 = 1/2', say('ex.dop.familiar.half', { x: 0.5 })),
    ],
    solution: say('ex.dop.familiar.solution', { x, d }),
  });
}

/** Rounding to the nearest tenth. */
function roundTenth(rng: Rng): Exercise {
  const x = round(randInt(rng, 101, 9999) / 100, 2);
  if (Math.round(x * 100) % 10 === 5 || Math.round(x * 100) % 10 === 0) return roundTenth(rng);
  const answer = round(Math.round(x * 10) / 10, 1);
  return exercise({
    factId: `dr10:${x}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.dop.round.prompt'),
    display: String(x),
    spoken: say('ex.dop.round.spoken', { x }),
    answer,
    input: numpad(4, true),
    hints: [
      hint(say('ex.dop.round.hint1')),
      hint(say('ex.dec.round.hint2')),
      x === 3.47
        ? exampleHint('2.81 → 2.8', say('ex.dop.round.solution', { x: 2.81, r: 2.8 }))
        : exampleHint('3.47 → 3.5', say('ex.dop.round.solution', { x: 3.47, r: 3.5 })),
    ],
    solution: say('ex.dop.round.solution', { x, r: answer }),
    diagnose: (v) => (v === Math.round(x) ? 'placeValue' : null),
  });
}

/** Shopping: k items at a decimal price. The character follows from the numbers. */
function story(rng: Rng): Exercise {
  const price = round(randInt(rng, 11, 99) / 2 / 10, 2); // 0.55 .. 4.95, steps of 0.05
  const k = randInt(rng, 3, 9);
  const who = CHARACTERS[k % CHARACTERS.length] as Character;
  const answer = round(price * k, 2);
  const spoken = say(
    'wp.dop.shop.story',
    { name: who.name, k: { n: k, noun: NOTEBOOK }, price },
    who.gender,
  );
  return exercise({
    factId: `dopwp:${k}x${price}`,
    topicId: ID,
    level: 10,
    prompt: spoken.text,
    display: '',
    spoken,
    answer,
    operation: 'mul',
    input: numpad(4, true),
    hints: [
      hint(say('wp.dop.shop.hint1')),
      {
        ...hint(say('hint.equation')),
        example: { display: `${k} × ${price} = ?`, spoken: say('hint.equation').text },
      },
      exampleHint('4 × 2.5 = 10', say('eq.times.solution', { a: 4, b: 2.5, c: 10 })),
    ],
    solution: say('eq.times.solution', { a: k, b: price, c: answer }),
    diagnose: pointSlip(answer),
  });
}

const NOTEBOOK = { singular: 'מחברת', plural: 'מחברות', gender: 'f' as const };

function storyBank(): string[] {
  const out: string[] = [];
  for (const who of CHARACTERS)
    out.push(
      ...say(
        'wp.dop.shop.story',
        { name: who.name, k: { n: 3, noun: NOTEBOOK }, price: 2.5 },
        who.gender,
      ).parts,
    );
  return out;
}

export const decimalOps = defineTopic({
  id: ID,
  labelKey: 'topic.decimalOps',
  grades: [5],
  startLevel: () => 1,
  extraBank: storyBank,
  levels: [
    open(L(1), (rng) => byPower(1, rng)),
    open(L(2), (rng) => byPower(2, rng)),
    open(L(3), timesWhole),
    open(L(4), timesWhole2),
    open(L(5), timesDecimal),
    open(L(6), divWhole),
    open(L(7), divHalf),
    open(L(8), familiar),
    open(L(9), roundTenth),
    open(L(10), story),
  ],
});
