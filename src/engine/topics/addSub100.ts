import type { TranslationKey } from '@/i18n';
import { t } from '@/i18n';
import { compose, shown, type Slot } from '@/lang/compose';
import type { Gender } from '@/lang/gender';
import {
  arith,
  CHARACTERS,
  defineTopic,
  diagnoseArith,
  displayEquation,
  exampleHint,
  exercise,
  hint,
  numpad,
  open,
  result,
  say,
  splitTensUnits,
  spokenEquationSolved,
  WORD_NOUNS,
  wordProblem,
  type Character,
  type Op,
  type WordNoun,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Hint, Rng, Visual } from '../types';

/**
 * World 4, grade 2: "חיבור וחיסור עד 100". From a two-digit number plus or
 * minus a unit, through carrying and borrowing (each with a level of its own,
 * for addition and for subtraction), to missing numbers and word problems.
 * Every level is open (too many pairs to record whole); their sentences are
 * assembled from clips.
 */

const ID = 'add-sub-100';
const L = (n: number) => `level.addSub100.${n}`;

type Gen = (rng: Rng) => { a: number; b: number };

/* ---------- Shared helpers (also used by the grade 3 worlds) ---------- */

/**
 * Hint 3 for a missing-number exercise, in the same shape as the exercise:
 * "25 + ? = 60 → 35", so the example shows the skill asked, not a plain sum.
 */
export function missingExample(a: number, op: Op, b: number, missing: 'a' | 'b'): Hint {
  const c = result(a, op, b);
  const shownEq = displayEquation(missing === 'a' ? '?' : a, op, missing === 'b' ? '?' : b, c);
  return exampleHint(`${shownEq} → ${missing === 'a' ? a : b}`, spokenEquationSolved(a, op, b, c));
}

/** The same exercise with another worked example (hint 3). */
export function withExample(e: Exercise, example: Hint): Exercise {
  return { ...e, hints: [e.hints[0], e.hints[1], example] };
}

/**
 * Numbers for a worked example from the exercise's own generator: the same
 * skill and range (a carry when the exercise has one, a single digit when it
 * does), never the exercise itself, its mirror, or its answer.
 */
function exampleFrom(gen: Gen, rng: Rng, a: number, op: Op, b: number): { a: number; b: number } {
  const answer = result(a, op, b);
  let fallback = gen(rng);
  for (let i = 0; i < 30; i++) {
    const ex = gen(rng);
    const mirror = (op === '+' || op === '×') && ex.a === b && ex.b === a;
    if ((ex.a === a && ex.b === b) || mirror) continue;
    if (result(ex.a, op, ex.b) !== answer) return ex;
    fallback = ex;
  }
  return fallback;
}

/* ---------- Levels 1–8: adding and subtracting ---------- */

/** Whether the units carry (addition) or borrow (subtraction). */
function regroups(a: number, op: '+' | '-', b: number): boolean {
  return op === '+' ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
}

function strategyHints(a: number, op: '+' | '-', b: number, carry: boolean): [Hint, Hint] {
  // Without carrying, what stays depends on what is added: units (the tens stay),
  // whole tens (the units stay), or both (units with units, tens with tens).
  const shape = b < 10 ? 'plain' : b % 10 === 0 ? 'tens' : 'two';
  const key =
    op === '+'
      ? carry
        ? 'hint.add100.carry'
        : (`hint.add100.${shape}` as const)
      : carry
        ? 'hint.sub100.borrow'
        : (`hint.sub100.${shape}` as const);
  return [hint(say(key)), stepHint(a, op, b, carry)];
}

/**
 * Hint 2 carries on the strategy of hint 1. With a carry or a borrow it shows
 * the first step and leaves the last one: 33 + 9 → "33 + 7 = 40 → 40 + 2 = ?",
 * 72 − 35 → "72 − 30 = 42 → 42 − 5 = ?". Without one, it splits what is split:
 * only the two-digit numbers (a single digit is not broken into "0 + 9").
 */
function stepHint(a: number, op: '+' | '-', b: number, carry: boolean): Hint {
  const sign = op === '+' ? '+' : '−';
  const steps = (display: string) =>
    hint(say('hint.add100.steps'), { example: { display, spoken: say('hint.add100.steps') } });
  if (carry && b < 10) {
    const u = a % 10;
    // 47 + 3 or 40 − 7: no step to the ten (it would be the answer, or nothing).
    if (op === '+' && u + b === 10) return hint(say('hint.add100.makeTen', { u, b }));
    // 40 − 7: nothing to take down to the ten first. Take a whole ten, give back the rest.
    if (op === '-' && u === 0) return steps(`${a} − 10 = ${a - 10} → ${a - 10} + ${10 - b} = ?`);
    // To the next ten (or down to this ten), then the rest.
    const first = op === '+' ? 10 - u : u;
    const mid = op === '+' ? a + first : a - first;
    return steps(`${a} ${sign} ${first} = ${mid} → ${mid} ${sign} ${b - first} = ?`);
  }
  if (carry) {
    // The tens first, then the units (which still cross a ten).
    const tens = Math.floor(b / 10) * 10;
    const mid = op === '+' ? a + tens : a - tens;
    return steps(`${a} ${sign} ${tens} = ${mid} → ${mid} ${sign} ${b % 10} = ?`);
  }
  if (b >= 10 && b % 10 === 0) {
    // Whole tens: counted as tens, the units do not move.
    const said = say('hint.tens100.count', { b, tb: b / 10 });
    return a % 10 === 0
      ? hint(said)
      : hint(said, { example: { display: splitTensUnits(a), spoken: said } });
  }
  const split = [a, b].filter((n) => n >= 10 && n % 10 !== 0).map(splitTensUnits);
  // 40 + 5: a round ten and a unit, nothing to split.
  if (split.length === 0) return hint(say('hint.add100.roundTen'));
  return hint(say('ex.decompose.hint2'), {
    example: { display: split.join('   '), spoken: say('ex.decompose.hint2') },
  });
}

function plain(
  level: number,
  op: '+' | '-',
  gen: Gen,
  carry: boolean,
): (rng: Rng, gender: Gender) => Exercise {
  return (rng) => {
    const { a, b } = gen(rng);
    return arith({
      topicId: ID,
      level,
      a,
      op,
      b,
      hints: strategyHints(a, op, b, carry),
      example: exampleFrom(gen, rng, a, op, b),
      input: numpad(3),
    });
  };
}

/** A two-digit number whose units digit satisfies `ok`. */
function twoDigit(rng: Rng, ok: (units: number) => boolean, lo = 11, hi = 99): number {
  for (;;) {
    const a = randInt(rng, lo, hi);
    if (ok(a % 10)) return a;
  }
}

/** A unit from 2 up when there is room: "plus one" is too easy to take a third of the level. */
function unitUpTo(rng: Rng, max: number): number {
  return max >= 2 ? randInt(rng, 2, max) : 1;
}

const unitsNoCarry: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u <= 8, 11, 98);
  return { a, b: unitUpTo(rng, 9 - (a % 10)) };
};
const unitsCarry: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u >= 1, 11, 89);
  return { a, b: randInt(rng, 10 - (a % 10), 9) };
};
const unitsNoBorrow: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u >= 1);
  return { a, b: unitUpTo(rng, a % 10) };
};
const unitsBorrow: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u <= 8, 20, 99);
  return { a, b: randInt(rng, (a % 10) + 1, 9) };
};
const tensPlus: Gen = (rng) => {
  const a = randInt(rng, 11, 79);
  return { a, b: randInt(rng, 1, Math.floor((99 - a) / 10)) * 10 };
};
const tensMinus: Gen = (rng) => {
  const a = randInt(rng, 31, 99);
  return { a, b: randInt(rng, 1, Math.floor(a / 10) - 1) * 10 };
};
const twoDigitNoCarry: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u <= 8, 11, 88);
  const bu = randInt(rng, 0, 9 - (a % 10));
  const bt = randInt(rng, 1, 9 - Math.floor(a / 10));
  return { a, b: bt * 10 + bu };
};
const twoDigitCarry: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u >= 1, 11, 79);
  const bu = randInt(rng, 10 - (a % 10), 9);
  const bt = randInt(rng, 1, 8 - Math.floor(a / 10));
  return { a, b: bt * 10 + bu };
};
const twoDigitNoBorrow: Gen = (rng) => {
  const a = twoDigit(rng, () => true, 22, 99);
  const bu = randInt(rng, 0, a % 10);
  const bt = randInt(rng, 1, Math.floor(a / 10) - 1);
  return { a, b: bt * 10 + bu };
};
const twoDigitBorrow: Gen = (rng) => {
  const a = twoDigit(rng, (u) => u <= 8, 30, 99);
  const bu = randInt(rng, (a % 10) + 1, 9);
  const bt = randInt(rng, 1, Math.floor(a / 10) - 1);
  return { a, b: bt * 10 + bu };
};

/* ---------- Level 9: the missing number ---------- */

type MissingKind = 'b+' | 'a-' | 'b-';

/** The numbers of a missing-number exercise: a op b = c, with the asked part. */
function missingNumbers(rng: Rng, kind: MissingKind): { a: number; b: number } {
  if (kind === 'b+') {
    const a = randInt(rng, 11, 79);
    return { a, b: randInt(rng, a + 3, 99) - a };
  }
  if (kind === 'a-') {
    const b = randInt(rng, 10, 60);
    return { a: b + randInt(rng, 5, 99 - b), b };
  }
  const a = randInt(rng, 30, 99);
  return { a, b: a - randInt(rng, 1, a - 10) };
}

/**
 * A number line in tens from the ten below to the ten above, with the start,
 * the end and the next ten marked: jump to the ten, then in tens (18 → 20 → 90),
 * not 80 ticks of one too small to read.
 */
function tensLine(start: number, target: number): Visual {
  const from = Math.floor(start / 10) * 10;
  const to = Math.min(100, Math.ceil(target / 10) * 10);
  const next = from + 10;
  return {
    type: 'numberLine',
    from,
    to: Math.max(to, from + 10),
    start,
    hops: 0,
    target,
    step: 10,
    ...(next < target && next !== start ? { stopAt: next } : {}),
  };
}

/** 34 + ? = 60, ? − 20 = 35, 80 − ? = 45. The missing addend first: half the level. */
function missing(rng: Rng): Exercise {
  const kind: MissingKind = rng() < 0.5 ? 'b+' : pick(rng, ['a-', 'b-'] as const);
  const { a, b } = missingNumbers(rng, kind);
  const op = kind === 'b+' ? '+' : '-';
  const asked = kind === 'a-' ? 'a' : 'b';
  const c = result(a, op, b);
  const hints: [Hint, Hint] =
    kind === 'b+'
      ? [hint(say('hint.missAdd100')), hint(say('hint.numberLineTens'), { visual: tensLine(a, c) })]
      : kind === 'a-'
        ? [
            hint(say('hint.missStart100')),
            // Adding back, shown as the exercise that does it.
            hint(say('hint.addBack100'), {
              example: { display: `? = ${c} + ${b}`, spoken: say('hint.addBack100') },
            }),
          ]
        : [
            hint(say('hint.missSub100')),
            hint(say('hint.numberLineTens'), { visual: tensLine(c, a) }),
          ];
  // Another exercise of the same kind, solved, whose missing number is not this one.
  let ex = missingNumbers(rng, kind);
  for (
    let i = 0;
    i < 20 && (ex[asked] === (asked === 'a' ? a : b) || (ex.a === a && ex.b === b));
    i++
  )
    ex = missingNumbers(rng, kind);
  const e = arith({
    topicId: ID,
    level: 9,
    a,
    op,
    b,
    missing: asked,
    hints,
    example: ex,
    input: numpad(2),
  });
  return withExample(e, missingExample(ex.a, op, ex.b, asked));
}

/* ---------- Level 10: word problems ---------- */

/** Bought "more shekels" makes no sense: shekels are counted, not bought. */
const BUY_NOUNS = WORD_NOUNS.filter((n) => n.singular !== 'שקל');

/** Story kinds: put together, take away, compare, the start unknown, how many more are needed. */
const ADD_KEYS = ['wp.buy', 'wp.collect', 'wp.start'] as const;
const SUB_KEYS = ['wp.give', 'wp.compare2', 'wp.need'] as const;

/** Example numbers like the exercise's: the same operation, carrying (or borrowing) when it does. */
function wordExample(rng: Rng, a: number, op: '+' | '-', b: number): { a: number; b: number } {
  const carry = regroups(a, op, b);
  const answer = result(a, op, b);
  let ex = { a: 0, b: 0 };
  for (let i = 0; i < 40; i++) {
    ex = op === '+' ? addPair(rng) : subPair(rng);
    if (regroups(ex.a, op, ex.b) === carry && result(ex.a, op, ex.b) !== answer) return ex;
  }
  return ex;
}

function addPair(rng: Rng): { a: number; b: number } {
  const a = randInt(rng, 12, 60);
  return { a, b: randInt(rng, 5, 99 - a) };
}

function subPair(rng: Rng): { a: number; b: number } {
  const a = randInt(rng, 20, 99);
  return { a, b: randInt(rng, 5, a - 3) };
}

function word(rng: Rng): Exercise {
  const kind = pick(rng, ['add', 'sub', 'twoStep'] as const);
  if (kind === 'twoStep') return twoStep(rng);
  const op = kind === 'add' ? '+' : '-';
  const { a, b } = op === '+' ? addPair(rng) : subPair(rng);
  const key = pick(rng, op === '+' ? ADD_KEYS : SUB_KEYS);
  return wordProblem({
    topicId: ID,
    level: 10,
    key,
    rng,
    a,
    op,
    b,
    example: wordExample(rng, a, op, b),
    input: numpad(op === '+' ? 3 : 2),
    ...(key === 'wp.buy' ? { nouns: BUY_NOUNS } : {}),
  });
}

/* ---------- A story with two steps ---------- */

/** The second character of a story follows from the first (as in build.ts), so the bank can list them all. */
function otherOf(who: Character): Character {
  const i = CHARACTERS.indexOf(who);
  return CHARACTERS[(i + 1) % CHARACTERS.length] as Character;
}

function twoStepSlots(who: Character, noun: WordNoun, a: number, b: number, c: number) {
  const slots: Record<string, Slot> = {
    name: who.name,
    other: otherOf(who).name,
    a: { n: a, noun },
    b: { n: b, noun },
    c: { n: c, noun },
    plural: noun.plural,
  };
  return slots;
}

const TWO_STEP_STORY: TranslationKey = 'wp.twoStep.story';

/** "Had 34, got 12 more, gave 9 away: how many now?" Two steps, in the order they happen. */
function twoStep(rng: Rng): Exercise {
  const numbers = (): { a: number; b: number; c: number } => {
    const a = randInt(rng, 20, 60);
    const b = randInt(rng, 5, Math.min(30, 99 - a));
    return { a, b, c: randInt(rng, 5, a + b - 5) };
  };
  const { a, b, c } = numbers();
  const answer = a + b - c;
  const who = pick(rng, CHARACTERS);
  const noun = pick(rng, WORD_NOUNS);
  const story = compose(
    t(TWO_STEP_STORY, { gender: who.gender }),
    twoStepSlots(who, noun, a, b, c),
  );
  let ex = numbers();
  for (let i = 0; i < 20 && (ex.a + ex.b - ex.c === answer || ex.a + ex.b === a + b); i++)
    ex = numbers();
  const solved = (x: { a: number; b: number; c: number }) =>
    say('wp.twoStep.solution', { a: x.a, b: x.b, s: x.a + x.b, c: x.c, r: x.a + x.b - x.c });
  return exercise({
    factId: `wp:twoStep:${a}+${b}-${c}`,
    topicId: ID,
    level: 10,
    // On screen with digits; heard with words.
    prompt: shown(story),
    display: '',
    spoken: story,
    answer,
    operation: 'sub',
    input: numpad(2),
    hints: [
      hint(say('wp.twoStep.hint1')),
      {
        ...hint(say('hint.equation')),
        example: { display: `${a} + ${b} − ${c} = ?`, spoken: say('hint.equation').text },
      },
      exampleHint(
        `${ex.a} + ${ex.b} = ${ex.a + ex.b} → ${ex.a + ex.b} − ${ex.c} = ${ex.a + ex.b - ex.c}`,
        solved(ex),
      ),
    ],
    solution: solved({ a, b, c }),
    // Stopping after the first step is its own slip (no specific advice yet); then the second step's.
    diagnose: (v) =>
      v === a + b ? 'other' : diagnoseArith(v, { a: a + b, op: '-', b: c, answer }),
  });
}

/** Every literal piece of the two-step story, for every character and noun (for the audio bank). */
function storyBank(): string[] {
  const out = new Set<string>();
  for (const who of CHARACTERS)
    for (const noun of WORD_NOUNS) {
      const s = compose(
        t(TWO_STEP_STORY, { gender: who.gender }),
        twoStepSlots(who, noun, 3, 3, 3),
      );
      for (const p of s.parts) out.add(p);
    }
  return [...out];
}

export const addSub100 = defineTopic({
  id: ID,
  labelKey: 'topic.addSub100',
  grades: [2],
  startLevel: () => 1,
  levels: [
    // Plus and minus a unit without crossing a ten: one warm-up level, not two.
    open('level.addSub100.unitsPlain', (rng, g) =>
      rng() < 0.5
        ? plain(1, '+', unitsNoCarry, false)(rng, g)
        : plain(1, '-', unitsNoBorrow, false)(rng, g),
    ),
    open(L(2), plain(2, '+', unitsCarry, true)),
    open(L(4), plain(3, '-', unitsBorrow, true)),
    open(L(5), (rng, g) =>
      rng() < 0.5
        ? plain(4, '+', tensPlus, false)(rng, g)
        : plain(4, '-', tensMinus, false)(rng, g),
    ),
    open(L(6), plain(5, '+', twoDigitNoCarry, false)),
    open(L(7), plain(6, '+', twoDigitCarry, true)),
    // Subtraction, like addition, without and then with regrouping: a child who
    // cannot borrow yet is not stuck at half right.
    open('level.addSub100.subNoBorrow', plain(7, '-', twoDigitNoBorrow, false)),
    open('level.addSub100.subBorrow', plain(8, '-', twoDigitBorrow, true)),
    open(L(9), missing),
    open(L(10), word),
  ],
  extraBank: storyBank,
});

/** Exported for the tests: every generator stays in range and matches its level's rule. */
export const GENERATORS = {
  unitsNoCarry,
  unitsCarry,
  unitsNoBorrow,
  unitsBorrow,
  tensPlus,
  tensMinus,
  twoDigitNoCarry,
  twoDigitCarry,
  twoDigitNoBorrow,
  twoDigitBorrow,
};
