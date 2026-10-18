import { t, type TranslationKey } from '@/i18n';
import { groupDigits } from '@/lang/groupDigits';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  CHARACTERS,
  diagnoseArith,
  differentExample,
  displayEquation,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  OPERATION,
  pictureExample,
  say,
  spokenEquationSolved,
} from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';
import { atPlace, layoutFor, withoutBorrowing, withoutCarrying } from '../vertical';

/**
 * Three worlds of column arithmetic ("חשבון במאונך"), one per grade, as the
 * curriculum orders it:
 * - grade 2, up to 100: without regrouping first, then with;
 * - grade 3, up to 10,000: subtraction in stages (borrowing in the units, in
 *   the tens, twice, across zeros);
 * - grade 4, up to a million, and multiplication (by one digit, by two).
 *
 * The first level of each operation is guided (every digit is checked as it
 * is written and the carry appears by itself); later levels are written
 * whole, then checked. Each world also has "which digit is missing?", "find
 * the mistake", and word problems written in columns.
 */

type ColOp = '+' | '-' | '×';
const VOP = { '+': 'add', '-': 'sub', '×': 'mul' } as const;

const digitsOf = (n: number): number[] => String(n).split('').reverse().map(Number);

/** How many columns carry when adding. */
export function carries(a: number, b: number): number[] {
  const x = digitsOf(a);
  const y = digitsOf(b);
  const out: number[] = [];
  let c = 0;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    c = (x[i] ?? 0) + (y[i] ?? 0) + c >= 10 ? 1 : 0;
    if (c) out.push(i);
  }
  return out;
}

/** The columns that borrow when subtracting b from a. */
export function borrows(a: number, b: number): number[] {
  const x = digitsOf(a);
  const y = digitsOf(b);
  const out: number[] = [];
  let lent = 0;
  for (let i = 0; i < x.length; i++) {
    const top = (x[i] ?? 0) - lent;
    lent = top < (y[i] ?? 0) ? 1 : 0;
    if (lent) out.push(i);
  }
  return out;
}

/** A number drawn until it fits (tries a few hundred times, then takes the last). */
function until<T>(make: () => T, ok: (v: T) => boolean): T {
  let v = make();
  for (let i = 0; i < 400 && !ok(v); i++) v = make();
  return v;
}

const HINT1: Record<ColOp, TranslationKey> = {
  '+': 'col.hint1.add',
  '-': 'col.hint1.sub',
  '×': 'col.hint1.mul',
};

interface ColumnOptions {
  topicId: string;
  level: number;
  op: ColOp;
  a: number;
  b: number;
  guided: boolean;
  /** Different numbers for the worked example. */
  example: { a: number; b: number };
  /** A word problem's story: the prompt and what is read. */
  story?: { text: string; spoken: string; parts: string[] };
}

/** An exercise written in columns. */
export function columnExercise(o: ColumnOptions): Exercise {
  const layout = layoutFor(VOP[o.op], o.a, o.b);
  const c = layout.rows.at(-1)?.value ?? 0;
  const ex = differentExample(o.a, o.op, o.b, o.example);
  const exLayout = layoutFor(VOP[o.op], ex.a, ex.b);
  const exC = exLayout.rows.at(-1)?.value ?? 0;
  const firstRowSteps = layout.steps.filter((s) => s.row === 0).length;
  const twoRows = o.op === '×' && o.b >= 10;
  const spoken = o.story
    ? { text: o.story.spoken, parts: o.story.parts }
    : say('col.question', {
        a: o.a,
        op: t(o.op === '+' ? 'op.add' : o.op === '-' ? 'op.sub' : 'op.mul'),
        b: o.b,
      });
  return exercise({
    factId: `col:${o.guided ? 'g' : 'f'}:${o.a}${o.op}${o.b}`,
    topicId: o.topicId,
    level: o.level,
    prompt: o.story ? o.story.text : t('col.prompt'),
    display: displayEquation(o.a, o.op, o.b, '?'),
    spoken,
    answer: c,
    operation: OPERATION[o.op],
    input: { type: 'vertical', layout, guided: o.guided },
    hints: [
      hint(say(twoRows ? 'col.hint1.mul2' : HINT1[o.op])),
      hint(say('col.hint2'), {
        visual: { type: 'vertical', layout, upto: Math.min(1, firstRowSteps) },
      }),
      pictureExample(
        spokenEquationSolved(ex.a, o.op, ex.b, exC),
        { type: 'vertical', layout: exLayout },
        displayEquation(ex.a, o.op, ex.b, exC),
      ),
    ],
    solution: spokenEquationSolved(o.a, o.op, o.b, c),
    diagnose: (v) => {
      if (o.op === '+' && v === withoutCarrying(o.a, o.b)) return 'carry';
      if (o.op === '-' && v === withoutBorrowing(o.a, o.b)) return 'borrow';
      return diagnoseArith(v, { a: o.a, op: o.op, b: o.b, answer: c });
    },
  });
}

/* ---------- Which digit is missing? ---------- */

export function missingDigit(
  topicId: string,
  level: number,
  op: ColOp,
  a: number,
  b: number,
  rng: Rng,
): Exercise {
  const layout = layoutFor(VOP[op], a, b);
  const operand: 'top' | 'bottom' = op === '×' ? 'top' : rng() < 0.5 ? 'top' : 'bottom';
  const n = operand === 'top' ? a : b;
  const ds = digitsOf(n);
  const col = randInt(rng, 0, ds.length - 1);
  const answer = ds[col] ?? 0;
  const ex = layoutFor(VOP[op], op === '×' ? a + 1 : a + 11, op === '-' ? b + 1 : b + 1);
  const exDigit = digitsOf(operand === 'top' ? ex.top : ex.bottom)[0] ?? 0;
  return exercise({
    factId: `colmiss:${a}${op}${b}:${operand}${col}`,
    topicId,
    level,
    prompt: t('col.missing.prompt'),
    display: '',
    spoken: say('col.missing.spoken'),
    visual: { type: 'vertical', layout, missing: { operand, col } },
    answer,
    input: numpad(1),
    hints: [
      hint(say('col.missing.hint1', { place: atPlace(col) })),
      hint(say('col.missing.hint2')),
      pictureExample(say('col.missing.solution', { d: exDigit }), {
        type: 'vertical',
        layout: ex,
      }),
    ],
    solution: say('col.missing.solution', { d: answer }),
  });
}

/* ---------- Find the mistake ---------- */

const COLUMN_NAME = [
  'col.name.0',
  'col.name.1',
  'col.name.2',
  'col.name.3',
  'col.name.4',
  'col.name.5',
] as const;

export function findMistake(
  topicId: string,
  level: number,
  op: ColOp,
  a: number,
  b: number,
  rng: Rng,
): Exercise {
  const layout = layoutFor(VOP[op], a, b);
  const lastRow = layout.rows.length - 1;
  const cells = layout.steps.filter((s) => s.row === lastRow);
  const columns = cells.length;
  const labels = [
    ...Array.from({ length: columns }, (_, i) => t(COLUMN_NAME[Math.min(i, 5)] ?? 'col.name.0')),
    t('col.mistake.none'),
  ];
  const none = rng() < 0.25;
  const step = pick(rng, cells);
  // A typical slip when there is one in that column, otherwise a digit one off.
  const slip = step.slips[0]?.digit;
  const wrongDigit = slip ?? (step.digit + (rng() < 0.5 ? 1 : 9)) % 10;
  const answer = none ? columns : step.col;
  const visual = none
    ? { type: 'vertical' as const, layout }
    : {
        type: 'vertical' as const,
        layout,
        wrong: { row: lastRow, col: step.col, digit: wrongDigit },
      };
  // The example: another exercise of the same kind, with its mistake named.
  const exLayout = layoutFor(VOP[op], a + 3, b + 2);
  const exCells = exLayout.steps.filter((s) => s.row === exLayout.rows.length - 1);
  const exStep = exCells[Math.min(1, exCells.length - 1)] ?? exCells[0];
  const exWrong = exStep ? (exStep.digit + 1) % 10 : 0;
  const solved = (stepCol: number, w: number, d: number) =>
    say('col.mistake.solution', { place: atPlace(stepCol), w, d });
  return exercise({
    factId: `colerr:${a}${op}${b}:${none ? 'none' : `${step.col}=${wrongDigit}`}`,
    topicId,
    level,
    prompt: t('col.mistake.prompt'),
    display: '',
    spoken: say('col.mistake.spoken'),
    visual,
    answer,
    input: labelledChoices(labels),
    hints: [
      hint(say('col.mistake.hint1')),
      hint(say(op === '-' ? 'col.mistake.hint2.sub' : 'col.mistake.hint2.carry')),
      exStep
        ? pictureExample(solved(exStep.col, exWrong, exStep.digit), {
            type: 'vertical',
            layout: exLayout,
            wrong: { row: exLayout.rows.length - 1, col: exStep.col, digit: exWrong },
          })
        : hint(say('col.mistake.hint1')),
    ],
    solution: none ? say('col.mistake.noneSolution') : solved(step.col, wrongDigit, step.digit),
  });
}

/* ---------- About how much? ---------- */

/** Rounded to its first digit: 487 → 500, 32 → 30. */
function lead(n: number): number {
  const k = 10 ** (String(n).length - 1);
  return Math.round(n / k) * k;
}

export function estimate(topicId: string, level: number, rng: Rng): Exercise {
  const a = randInt(rng, 120, 980);
  const b = randInt(rng, 12, 98);
  const ra = lead(a);
  const rb = lead(b);
  const e = ra * rb;
  // The right one is not always in the middle: three neighbours on the scale of tens.
  const shift = randInt(rng, 0, 2);
  const choices = [0, 1, 2].map((i) => (i < shift ? e / 10 ** (shift - i) : e * 10 ** (i - shift)));
  const exA = a === 312 ? 689 : 312;
  const exB = 47;
  return exercise({
    factId: `colest:${a}×${b}`,
    topicId,
    level,
    prompt: t('col.estimate.prompt'),
    display: `${a} × ${b} ≈ ?`,
    spoken: say('col.estimate.spoken', { a, b }),
    answer: e,
    input: { type: 'choices', choices, labels: choices.map((x) => groupDigits(String(x))) },
    hints: [
      hint(say('col.estimate.hint1')),
      hint(say('col.estimate.hint2', { a, ra })),
      exampleHint(
        `${exA} × ${exB} ≈ ${lead(exA)} × ${lead(exB)} = ${groupDigits(String(lead(exA) * lead(exB)))}`,
        say('col.estimate.solution', {
          a: exA,
          b: exB,
          ra: lead(exA),
          rb: lead(exB),
          e: lead(exA) * lead(exB),
        }),
      ),
    ],
    solution: say('col.estimate.solution', { a, b, ra, rb, e }),
  });
}

/* ---------- Word problems ---------- */

const NOUN = {
  cap: { singular: 'פקק', plural: 'פקקים', gender: 'm' },
  book: { singular: 'ספר', plural: 'ספרים', gender: 'm' },
  shekel: { singular: 'שקל', plural: 'שקלים', gender: 'm' },
  point: { singular: 'נקודה', plural: 'נקודות', gender: 'f' },
  crate: { singular: 'ארגז', plural: 'ארגזים', gender: 'm' },
  orange: { singular: 'תפוז', plural: 'תפוזים', gender: 'm' },
  ticket: { singular: 'כרטיס', plural: 'כרטיסים', gender: 'm' },
  step: { singular: 'צעד', plural: 'צעדים', gender: 'm' },
} as const satisfies Record<string, Noun>;

interface Story {
  key: TranslationKey;
  op: ColOp;
  /** {a} and {b}, counted with these nouns. */
  nouns: [Noun, Noun];
}

const STORIES: readonly Story[] = [
  { key: 'col.story.add1', op: '+', nouns: [NOUN.cap, NOUN.cap] },
  { key: 'col.story.add2', op: '+', nouns: [NOUN.book, NOUN.book] },
  { key: 'col.story.add3', op: '+', nouns: [NOUN.step, NOUN.step] },
  { key: 'col.story.sub1', op: '-', nouns: [NOUN.shekel, NOUN.shekel] },
  { key: 'col.story.sub2', op: '-', nouns: [NOUN.point, NOUN.point] },
  { key: 'col.story.sub3', op: '-', nouns: [NOUN.book, NOUN.book] },
  { key: 'col.story.mul1', op: '×', nouns: [NOUN.orange, NOUN.crate] },
  { key: 'col.story.mul2', op: '×', nouns: [NOUN.shekel, NOUN.ticket] },
];

/** Every literal piece of every story, for every character (the audio bank). */
export function storyBank(): string[] {
  const out = new Set<string>();
  for (const s of STORIES) {
    for (const who of CHARACTERS) {
      const said = say(
        s.key,
        { name: who.name, a: { n: 33, noun: s.nouns[0] }, b: { n: 33, noun: s.nouns[1] } },
        who.gender,
      );
      for (const p of said.parts) out.add(p);
    }
  }
  return [...out];
}

export function storyColumn(
  topicId: string,
  level: number,
  op: ColOp,
  a: number,
  b: number,
  rng: Rng,
): Exercise {
  const story = pick(
    rng,
    STORIES.filter((s) => s.op === op),
  );
  const who = pick(rng, CHARACTERS);
  const said = say(
    story.key,
    { name: who.name, a: { n: a, noun: story.nouns[0] }, b: { n: b, noun: story.nouns[1] } },
    who.gender,
  );
  // On screen the numbers are digits (with separators), as in a textbook.
  const text = t(story.key, {
    gender: who.gender,
    params: {
      name: who.name,
      a: `${groupDigits(String(a))} ${story.nouns[0].plural}`,
      b: `${groupDigits(String(b))} ${story.nouns[1].plural}`,
    },
  });
  return columnExercise({
    topicId,
    level,
    op,
    a,
    b,
    guided: false,
    example: { a: a + 12, b: Math.max(3, b - 1) },
    story: { text, spoken: said.text, parts: said.parts },
  });
}

/* ---------- Number drawing ---------- */

/** A two-number column exercise of the given shape, drawn until it fits. */
export function pair(
  rng: Rng,
  make: (rng: Rng) => [number, number],
  ok: (a: number, b: number) => boolean,
): [number, number] {
  return until(
    () => make(rng),
    ([a, b]) => ok(a, b),
  );
}
