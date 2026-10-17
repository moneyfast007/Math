import { t, type TranslationKey } from '@/i18n';
import { compose, type Slot, type Spoken } from '@/lang/compose';
import type { Gender } from '@/lang/gender';
import type { MistakeKind } from '@/state/schema';
import { pick, seededRng, shuffle } from './rng';
import type { Exercise, Hint, LevelInfo, Rng, Topic, Visual } from './types';

/**
 * The toolkit every topic is written with (phase 5).
 *
 * A topic is a list of levels. A level is either closed (a finite list of
 * facts, every one of which can be enumerated for the audio bank and for
 * tests) or open (a generator, for numbers too big to enumerate). Both produce
 * the same `Exercise` shape; the spoken sentences come from `compose`, so each
 * carries the clips that assemble it when it is not recorded whole.
 */

/* ---------- Speech ---------- */

export type Said = Spoken;

/** A sentence from a template key, with the child's or a character's gender. */
export function say(
  key: TranslationKey,
  slots: Readonly<Record<string, Slot>> = {},
  gender: Gender = 'f',
): Said {
  return compose(t(key, { gender }), slots);
}

/** A sentence from literal template text (for pieces built in code). */
export function sayText(template: string, slots: Readonly<Record<string, Slot>> = {}): Said {
  return compose(template, slots);
}

/* ---------- Characters and nouns for word problems ---------- */

export interface Character {
  name: string;
  gender: Gender;
}

/** Fixed characters (the brief: not the child's own name). Three of each gender. */
export const CHARACTERS: readonly Character[] = [
  { name: 'דנה', gender: 'f' },
  { name: 'יובל', gender: 'm' },
  { name: 'מאיה', gender: 'f' },
  { name: 'נועם', gender: 'm' },
  { name: 'סבתא', gender: 'f' },
  { name: 'סבא', gender: 'm' },
];

/* ---------- Arithmetic display and speech ---------- */

export type Op = '+' | '-' | '×' | '÷';
export type Operation = 'add' | 'sub' | 'mul' | 'div';

export const OPERATION: Record<Op, Operation> = { '+': 'add', '-': 'sub', '×': 'mul', '÷': 'div' };

const OP_WORD: Record<Op, string> = { '+': 'ועוד', '-': 'פחות', '×': 'כפול', '÷': 'חלקי' };

export function opChar(op: Op): string {
  return op === '-' ? '−' : op;
}

/** "3 + 5 = ?", "? + 5 = 8", "3 + ? = 8". */
export function displayEquation(
  a: number | string,
  op: Op,
  b: number | string,
  c: number | string,
): string {
  return `${a} ${opChar(op)} ${b} = ${c}`;
}

/** The spoken question for an equation with one unknown. */
export function spokenEquationQuestion(
  a: number,
  op: Op,
  b: number,
  c: number,
  missing: 'a' | 'b' | 'c',
): Said {
  const w = OP_WORD[op];
  if (missing === 'c') return sayText(`כמה זה {a} ${w} {b}?`, { a, b });
  if (missing === 'b') return sayText(`{a} ${w} כמה זה {c}?`, { a, c });
  return sayText(`כמה ${w} {b} זה {c}?`, { b, c });
}

/** "שלוש ועוד חמש זה שמונה." */
export function spokenEquationSolved(a: number, op: Op, b: number, c: number): Said {
  return sayText(`{a} ${OP_WORD[op]} {b} זה {c}.`, { a, b, c });
}

/* ---------- Answers and choices ---------- */

/** Three or four choices around the answer, distinct, within [min, max], sorted. */
export function choicesAround(
  rng: Rng,
  answer: number,
  min: number,
  max: number,
  count = 3,
): number[] {
  const near = [answer - 2, answer - 1, answer + 1, answer + 2, answer + 10, answer - 10].filter(
    (v) => v >= min && v <= max && v !== answer,
  );
  const picked = shuffle(rng, [...new Set(near)]).slice(0, count - 1);
  return [answer, ...picked].sort((x, y) => x - y);
}

/** Choices shown as labels (fractions, signs); the answer is the index of the right one. */
export function labelledChoices(labels: string[]): Exercise['input'] {
  return { type: 'choices', choices: labels.map((_, i) => i), labels };
}

export function numpad(maxDigits: number, decimal = false): Exercise['input'] {
  return decimal ? { type: 'numpad', maxDigits, decimal: true } : { type: 'numpad', maxDigits };
}

/* ---------- Mistake diagnosis ---------- */

function reversedDigits(n: number): number | null {
  if (n < 10 || n > 99) return null;
  const r = Number(String(n).split('').reverse().join(''));
  return r === n ? null : r;
}

export interface ArithFacts {
  a: number;
  op: Op;
  b: number;
  answer: number;
  /** Which part of the equation is asked. */
  missing?: 'a' | 'b' | 'c';
}

/** The value a child gets by combining the two visible numbers with the wrong operation. */
function wrongOperationValue(f: ArithFacts): number | null {
  const missing = f.missing ?? 'c';
  if (missing !== 'c') {
    // 7 + ? = 12 → 19; 15 − ? = 9 → 24: adding what is visible.
    const c =
      f.op === '+'
        ? missing === 'b'
          ? f.a + f.answer
          : f.answer + f.b
        : missing === 'b'
          ? f.a - f.answer
          : f.answer - f.b;
    const visible = missing === 'b' ? f.a : f.b;
    return f.op === '+' || f.op === '-' ? visible + c : null;
  }
  switch (f.op) {
    case '+':
      return Math.abs(f.a - f.b);
    case '-':
      return f.a + f.b;
    case '×':
      return f.a + f.b;
    case '÷':
      return f.a * f.b;
  }
}

/** Classifies a wrong answer to an arithmetic exercise. */
export function diagnoseArith(value: number, f: ArithFacts): MistakeKind | null {
  const answer = f.answer;
  if (value === answer) return null;
  const wrongOp = wrongOperationValue(f);
  if (wrongOp !== null && value === wrongOp) return 'wrongOperation';
  if (Math.abs(value - answer) === 1) return 'offByOne';
  if (f.op === '÷' && value === f.a % f.b && f.a % f.b !== 0) return 'remainder';
  if ((f.op === '+' || f.op === '-') && f.missing !== 'a' && f.missing !== 'b') {
    const carried = f.op === '+' ? (f.a % 10) + (f.b % 10) >= 10 : f.a % 10 < f.b % 10;
    if (carried && value === (f.op === '+' ? answer - 10 : answer + 10)) return 'carry';
  }
  if (Math.abs(value - answer) === 10 || Math.abs(value - answer) === 100) return 'offByTen';
  if (reversedDigits(answer) === value) return 'digitReversal';
  if (answer >= 10 && String(value).length !== String(answer).length && value > 0)
    return 'placeValue';
  return null;
}

/* ---------- Exercise assembly ---------- */

export interface ExerciseParts {
  factId: string;
  topicId: string;
  level: number;
  prompt: string;
  display: string;
  spoken: Said;
  visual?: Visual;
  answer: number;
  operation?: Operation;
  input: Exercise['input'];
  hints: [Hint, Hint, Hint];
  solution: Said;
  diagnose?: (value: number) => MistakeKind | null;
}

/** Builds the final Exercise, filling the spoken-parts fields. */
export function exercise(p: ExerciseParts): Exercise {
  return {
    factId: p.factId,
    topicId: p.topicId,
    level: p.level,
    prompt: p.prompt,
    display: p.display,
    spokenText: p.spoken.text,
    spokenParts: p.spoken.parts,
    ...(p.visual ? { visual: p.visual } : {}),
    ...(p.operation ? { operation: p.operation } : {}),
    answer: p.answer,
    input: p.input,
    hints: p.hints,
    solutionSpoken: p.solution.text,
    solutionParts: p.solution.parts,
    // A right answer is never a mistake, whatever a topic's own diagnosis says.
    diagnose: (value) => (value === p.answer ? null : (p.diagnose?.(value) ?? null)),
  };
}

/** A hint from a sentence, optionally with a picture or a worked example. */
export function hint(
  said: Said,
  extra: { visual?: Visual; example?: { display: string; spoken: Said } } = {},
): Hint {
  return {
    text: said.text,
    spoken: said.text,
    spokenParts: said.parts,
    ...(extra.visual ? { visual: extra.visual } : {}),
    ...(extra.example
      ? { example: { display: extra.example.display, spoken: extra.example.spoken.text } }
      : {}),
  };
}

/** Hint 3: "here is a similar one, solved", from a different exercise of the same kind. */
export function exampleHint(display: string, solved: Said): Hint {
  return {
    text: t('hint.example'),
    spoken: t('spoken.example', { params: { sentence: solved.text } }),
    spokenParts: ['למשל', ...solved.parts],
    example: { display, spoken: solved.text },
  };
}

/* ---------- Levels and topics ---------- */

export type Build<F> = (fact: F, rng: Rng, gender: Gender) => Exercise;

export type LevelDef =
  /** Closed: a finite list of facts; everything it says can be recorded whole. */
  | { labelKey: string; facts: () => readonly unknown[]; build: Build<never> }
  /** Open: a generator for numbers too many to list. */
  | { labelKey: string; gen: (rng: Rng, gender: Gender) => Exercise };

export function closed<F>(labelKey: string, facts: () => readonly F[], build: Build<F>): LevelDef {
  return { labelKey, facts, build: build as unknown as Build<never> };
}

export function open(labelKey: string, gen: (rng: Rng, gender: Gender) => Exercise): LevelDef {
  return { labelKey, gen };
}

export interface TopicDef {
  id: string;
  labelKey: string;
  grades: readonly number[];
  startLevel: (grade: number) => number;
  levels: readonly LevelDef[];
}

/** How many exercises per level the bank samples from open levels to collect their pieces. */
const BANK_SAMPLES = 400;

export function defineTopic(def: TopicDef): Topic & { enumerate: (level: number) => Exercise[] } {
  const levels: LevelInfo[] = def.levels.map((l, i) => ({ level: i + 1, labelKey: l.labelKey }));
  const levelDef = (level: number): LevelDef => {
    const l = def.levels[level - 1];
    if (!l) throw new RangeError(`${def.id} has no level ${level}`);
    return l;
  };

  const generate = (level: number, rng: Rng, gender: Gender, avoidFactId?: string): Exercise => {
    const l = levelDef(level);
    if ('gen' in l) {
      // Avoid an immediate repeat when the generator happens to produce one.
      for (let i = 0; i < 6; i++) {
        const e = l.gen(rng, gender);
        if (e.factId !== avoidFactId) return e;
      }
      return l.gen(rng, gender);
    }
    const facts = l.facts() as readonly never[];
    const build = l.build;
    const pool =
      facts.length > 1
        ? facts.filter((f) => build(f, () => 0, gender).factId !== avoidFactId)
        : facts;
    return build(pick(rng, pool.length > 0 ? pool : facts), rng, gender);
  };

  /** Every exercise of a closed level (one noun choice each), or a sample of an open one. */
  const enumerate = (level: number): Exercise[] => {
    const l = levelDef(level);
    const fixed: Rng = () => 0;
    if ('gen' in l) {
      const rng = seededRng(level * 7919);
      return Array.from({ length: BANK_SAMPLES }, () => l.gen(rng, pick(rng, ['f', 'm'])));
    }
    return (l.facts() as readonly never[]).flatMap((f) => [
      l.build(f, fixed, 'f'),
      l.build(f, fixed, 'm'),
    ]);
  };

  const spokenBank = (): string[] => {
    const out = new Set<string>();
    // Word problems used by this topic register their stories while being sampled below.
    for (const { level } of levels) {
      const l = levelDef(level);
      const list = enumerate(level);
      // Open levels also contribute a larger sample of their pieces (finite, small).
      const sampled =
        'gen' in l
          ? [
              ...list,
              ...Array.from({ length: BANK_SAMPLES * 2 }, (_, i) =>
                l.gen(seededRng(level * 104729 + i), i % 2 ? 'f' : 'm'),
              ),
            ]
          : list;
      for (const e of sampled) {
        const texts = [e.spokenText, e.solutionSpoken, ...e.hints.map((h) => h.spoken)];
        const parts = [
          e.spokenParts ?? [],
          e.solutionParts ?? [],
          ...e.hints.map((h) => h.spokenParts ?? []),
        ];
        if ('gen' in l) {
          for (const p of parts.flat()) out.add(p);
        } else {
          for (const x of texts) out.add(x);
          for (const p of parts.flat()) out.add(p);
        }
      }
    }
    for (const p of storyPieces()) out.add(p);
    return [...out];
  };

  return {
    id: def.id,
    labelKey: def.labelKey,
    grades: def.grades,
    levels,
    startLevel: def.startLevel,
    generate,
    spokenBank,
    enumerate,
  };
}

/** Rounds to `digits` decimals, avoiding 0.1 + 0.2 artefacts. */
export function round(n: number, digits = 2): number {
  const k = 10 ** digits;
  return Math.round(n * k) / k;
}

export function range(from: number, to: number, step = 1): number[] {
  const out: number[] = [];
  for (let n = from; n <= to; n += step) out.push(n);
  return out;
}

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/* ---------- Plain arithmetic exercises ---------- */

export interface ArithOptions {
  topicId: string;
  level: number;
  a: number;
  op: Op;
  b: number;
  /** Which part is asked; the result by default. */
  missing?: 'a' | 'b' | 'c';
  /** The first two hints (strategy, picture); the third is the worked example. */
  hints: [Hint, Hint];
  /** Different numbers for the worked example. */
  example: { a: number; b: number };
  input: Exercise['input'];
  prompt?: string;
  visual?: Visual;
  /** Extra diagnosis tried before the generic one. */
  diagnose?: (value: number) => MistakeKind | null;
}

export function result(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return a / b;
  }
}

/** An equation with one unknown: "47 + 25 = ?", "? × 6 = 42". */
export function arith(o: ArithOptions): Exercise {
  const missing = o.missing ?? 'c';
  const c = result(o.a, o.op, o.b);
  const answer = missing === 'c' ? c : missing === 'a' ? o.a : o.b;
  const display = displayEquation(
    missing === 'a' ? '?' : o.a,
    o.op,
    missing === 'b' ? '?' : o.b,
    missing === 'c' ? '?' : c,
  );
  const example = differentExample(o.a, o.op, o.b, o.example);
  const exC = result(example.a, o.op, example.b);
  const facts: ArithFacts = { a: o.a, op: o.op, b: o.b, answer, missing };
  return exercise({
    factId: `${OPERATION[o.op]}${missing === 'c' ? '' : `:${missing}`}:${o.a}${o.op}${o.b}`,
    topicId: o.topicId,
    level: o.level,
    prompt: o.prompt ?? t(missing === 'c' ? 'ex.arith.prompt' : 'ex.missing.prompt'),
    display,
    spoken: spokenEquationQuestion(o.a, o.op, o.b, c, missing),
    ...(o.visual ? { visual: o.visual } : {}),
    answer,
    operation: OPERATION[o.op],
    input: o.input,
    hints: [
      o.hints[0],
      o.hints[1],
      exampleHint(
        displayEquation(example.a, o.op, example.b, exC),
        spokenEquationSolved(example.a, o.op, example.b, exC),
      ),
    ],
    solution: spokenEquationSolved(o.a, o.op, o.b, c),
    diagnose: (value) => o.diagnose?.(value) ?? diagnoseArith(value, facts),
  });
}

/**
 * The worked example must never be the exercise itself (it would give the
 * answer away). When the suggested example happens to match, nudge it while
 * keeping it valid: still non-negative for subtraction, still exact for division
 * (and with the same remainder, for remainder problems).
 */
export function differentExample(
  a: number,
  op: Op,
  b: number,
  ex: { a: number; b: number },
): { a: number; b: number } {
  const commutes = op === '+' || op === '×';
  const same = (x: { a: number; b: number }) =>
    (x.a === a && x.b === b) || (commutes && x.a === b && x.b === a);
  if (!same(ex)) return ex;
  const candidates =
    op === '÷'
      ? [
          { a: ex.a + ex.b, b: ex.b },
          { a: ex.a + 2 * ex.b, b: ex.b },
        ]
      : [
          { a: ex.a + 1, b: ex.b },
          { a: ex.a + 2, b: ex.b + 1 },
        ];
  return candidates.find((x) => !same(x)) ?? { a: ex.a + 3, b: ex.b };
}

/** A different pair of the same shape, for the worked example: shifted, kept in range. */
export function shifted(
  a: number,
  b: number,
  lo: number,
  hi: number,
  by = 3,
): { a: number; b: number } {
  const wrap = (n: number) => lo + ((n - lo + by) % (hi - lo + 1));
  return { a: wrap(a), b: wrap(b) };
}

/** Breaking a number into tens and units for a hint: "47 = 40 + 7". */
export function splitTensUnits(n: number): string {
  const tens = Math.floor(n / 10) * 10;
  const units = n % 10;
  return `${n} = ${tens} + ${units}`;
}

/* ---------- Word problems ---------- */

export interface WordNoun {
  singular: string;
  plural: string;
  gender: Gender;
}

/** Things a child buys, collects, gives away or shares; for word problems (no pictures). */
export const WORD_NOUNS: readonly WordNoun[] = [
  { singular: 'תפוח', plural: 'תפוחים', gender: 'm' },
  { singular: 'עוגייה', plural: 'עוגיות', gender: 'f' },
  { singular: 'סוכרייה', plural: 'סוכריות', gender: 'f' },
  { singular: 'בלון', plural: 'בלונים', gender: 'm' },
  { singular: 'מדבקה', plural: 'מדבקות', gender: 'f' },
  { singular: 'גולה', plural: 'גולות', gender: 'f' },
  { singular: 'ספר', plural: 'ספרים', gender: 'm' },
  { singular: 'עיפרון', plural: 'עפרונות', gender: 'm' },
  { singular: 'פרח', plural: 'פרחים', gender: 'm' },
  { singular: 'חרוז', plural: 'חרוזים', gender: 'm' },
  { singular: 'שקל', plural: 'שקלים', gender: 'm' },
];

export const SHEKELS: readonly WordNoun[] = [{ singular: 'שקל', plural: 'שקלים', gender: 'm' }];

export interface WordProblemOptions {
  topicId: string;
  level: number;
  /** Base key: `${key}.story` (gendered by the character), `${key}.hint1`. */
  key: string;
  rng: Rng;
  a: number;
  op: Op;
  b: number;
  /** Numbers for the worked example (same template). */
  example: { a: number; b: number };
  input: Exercise['input'];
  /** The division problem asks for the remainder rather than the quotient. */
  askRemainder?: boolean;
  /** Nouns to choose from (default: all). Big amounts read better as shekels. */
  nouns?: readonly WordNoun[];
}

/**
 * A story with fixed characters and a noun, agreeing in gender. The story is
 * the prompt; the equation appears only as the second hint, which is how the
 * curriculum wants word problems approached (understand, then write).
 */
const CHILD: WordNoun = { singular: 'ילד', plural: 'ילדים', gender: 'm' };
const BOX: WordNoun = { singular: 'קופסה', plural: 'קופסאות', gender: 'f' };

/** The second character follows from the first, so the bank can list every story. */
function otherOf(who: Character): Character {
  const i = CHARACTERS.indexOf(who);
  return CHARACTERS[(i + 1) % CHARACTERS.length] as Character;
}

/**
 * The slots of a story. {a}/{b}: counted with the noun; {kidsB}: "שלושה ילדים";
 * {boxesA}: "ארבע קופסאות". Every counted number is at least 3 (checked), so the
 * construct forms of one and two ("שני ילדים") never need a recording of their own.
 */
function storySlots(who: Character, noun: WordNoun, a: number, b: number): Record<string, Slot> {
  return {
    name: who.name,
    other: otherOf(who).name,
    a: { n: a, noun },
    b: { n: b, noun },
    kidsB: { n: b, noun: CHILD },
    boxesA: { n: a, noun: BOX },
    plural: noun.plural,
    singular: noun.singular,
  };
}

/** Word-problem templates in use, with their nouns, so the bank can list every piece. */
const STORIES = new Map<string, readonly WordNoun[]>();

/** Every literal piece of every story in use, for every character and noun. */
export function storyPieces(): string[] {
  const out = new Set<string>();
  for (const [key, nouns] of STORIES) {
    for (const who of CHARACTERS) {
      for (const noun of nouns) {
        const story = compose(t(`${key}.story` as TranslationKey, { gender: who.gender }), storySlots(who, noun, 3, 3));
        for (const p of story.parts) out.add(p);
        out.add(say(`${key}.hint1` as TranslationKey, {}, who.gender).text);
      }
    }
  }
  return [...out];
}

export function wordProblem(o: WordProblemOptions): Exercise {
  if (o.a < 3 || o.b < 3) throw new RangeError(`word problem numbers must be at least 3 (${o.key}: ${o.a}, ${o.b})`);
  const nouns = o.nouns ?? WORD_NOUNS;
  STORIES.set(o.key, nouns);
  const ex = differentExample(o.a, o.op, o.b, o.example);
  const who = pick(o.rng, CHARACTERS);
  const noun = pick(o.rng, nouns);
  const storyKey = `${o.key}.story` as TranslationKey;
  const slots = (a: number, b: number) => storySlots(who, noun, a, b);
  const story = compose(t(storyKey, { gender: who.gender }), slots(o.a, o.b));
  const c = o.askRemainder
    ? o.a % o.b
    : o.op === '÷'
      ? Math.floor(o.a / o.b)
      : result(o.a, o.op, o.b);
  const exC = o.askRemainder
    ? ex.a % ex.b
    : o.op === '÷'
      ? Math.floor(ex.a / ex.b)
      : result(ex.a, o.op, ex.b);
  const eq = (a: number, b: number, r: number | string) =>
    o.askRemainder ? `${a} ÷ ${b} = ${Math.floor(a / b)} (${r})` : displayEquation(a, o.op, b, r);
  const solved = o.askRemainder
    ? sayText('{a} חלקי {b} זה {q}, ונשאר {r}.', { a: o.a, b: o.b, q: Math.floor(o.a / o.b), r: c })
    : spokenEquationSolved(o.a, o.op, o.b, c);
  const exSolved = o.askRemainder
    ? sayText('{a} חלקי {b} זה {q}, ונשאר {r}.', {
        a: ex.a,
        b: ex.b,
        q: Math.floor(ex.a / ex.b),
        r: exC,
      })
    : spokenEquationSolved(ex.a, o.op, ex.b, exC);
  const facts: ArithFacts = { a: o.a, op: o.op, b: o.b, answer: c };
  return exercise({
    factId: `wp:${o.key}:${o.a}${o.op}${o.b}${o.askRemainder ? 'r' : ''}`,
    topicId: o.topicId,
    level: o.level,
    prompt: story.text,
    display: '',
    spoken: story,
    answer: c,
    operation: OPERATION[o.op],
    input: o.input,
    hints: [
      hint(say(`${o.key}.hint1` as TranslationKey, {}, who.gender)),
      {
        ...hint(say('hint.equation')),
        example: { display: eq(o.a, o.b, '?'), spoken: say('hint.equation').text },
      },
      exampleHint(eq(ex.a, ex.b, exC), exSolved),
    ],
    solution: solved,
    diagnose: (value) => {
      if (o.askRemainder && value === Math.floor(o.a / o.b)) return 'remainder';
      return diagnoseArith(value, facts);
    },
  });
}
