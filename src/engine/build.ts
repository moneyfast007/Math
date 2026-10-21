import { t, type TranslationKey } from '@/i18n';
import { compose, shown, type Slot, type Spoken } from '@/lang/compose';
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

/** The spoken operator, from the dictionary. */
const OP_KEY: Record<Op, TranslationKey> = {
  '+': 'op.add',
  '-': 'op.sub',
  '×': 'op.mul',
  '÷': 'op.div',
};
const opWord = (op: Op): string => t(OP_KEY[op]);

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
  const op2 = opWord(op);
  if (missing === 'c') return say('eq.question', { a, op: op2, b });
  if (missing === 'b') return say('eq.questionMissingB', { a, op: op2, c });
  return say('eq.questionMissingA', { op: op2, b, c });
}

/** "שלוש ועוד חמש זה שמונה." */
export function spokenEquationSolved(a: number, op: Op, b: number, c: number): Said {
  return say('eq.solution', { a, op: opWord(op), b, c });
}

/* ---------- Answers and choices ---------- */

/**
 * Ascending choices around the answer, with the answer at a random place among
 * them (first, middle or last): sorted buttons must not give it away by always
 * putting it in the middle. Distractors are `answer ± delta`, kept in [min, max].
 * `mix`: pick the distractors at random among the deltas; otherwise the nearest.
 */
export function spreadChoices(
  rng: Rng,
  answer: number,
  o: { deltas?: readonly number[]; min?: number; max?: number; count?: number; mix?: boolean } = {},
): number[] {
  const { deltas = [1, 2, 3], min = -Infinity, max = Infinity, count = 3, mix = false } = o;
  const below = deltas.map((d) => answer - d).filter((v) => v >= min);
  const above = deltas.map((d) => answer + d).filter((v) => v <= max);
  const places = Array.from({ length: count }, (_, k) => k).filter(
    (k) => below.length >= k && above.length >= count - 1 - k,
  );
  const take = (xs: number[], n: number) => (mix ? shuffle(rng, xs) : xs).slice(0, n);
  if (places.length === 0) {
    // Too little room in range: the nearest values on either side.
    const near = [...below, ...above].sort((x, y) => Math.abs(x - answer) - Math.abs(y - answer));
    return [answer, ...near.slice(0, count - 1)].sort((x, y) => x - y);
  }
  const k = pick(rng, places);
  return [...take(below, k), answer, ...take(above, count - 1 - k)].sort((x, y) => x - y);
}

/** Three or four choices around the answer (near it, or ten away), distinct, within [min, max], sorted. */
export function choicesAround(
  rng: Rng,
  answer: number,
  min: number,
  max: number,
  count = 3,
): number[] {
  return spreadChoices(rng, answer, { deltas: [1, 2, 10], min, max, count, mix: true });
}

/**
 * A run of `count` neighbouring values from an ordered list (0, 3, 4, 5 corners),
 * containing the answer at a random place.
 */
export function windowChoices(
  rng: Rng,
  ladder: readonly number[],
  answer: number,
  count = 3,
): number[] {
  const i = ladder.indexOf(answer);
  if (i < 0) throw new RangeError('windowChoices: the answer is not on the ladder');
  const starts = Array.from({ length: count }, (_, k) => i - k).filter(
    (s) => s >= 0 && s + count <= ladder.length,
  );
  const s = starts.length > 0 ? pick(rng, starts) : 0;
  return ladder.slice(s, s + count);
}

/** Choices shown as labels (fractions, signs); the answer is the index of the right one. */
export function labelledChoices(labels: string[], rtl = false): Exercise['input'] {
  return { type: 'choices', choices: labels.map((_, i) => i), labels, ...(rtl ? { rtl } : {}) };
}

/** Choices drawn as pictures (clocks, coins); `labels` name them for the reveal and screen readers. */
export function pictureChoices(
  labels: string[],
  visuals: Visual[],
  rtl = false,
): Exercise['input'] {
  if (labels.length !== visuals.length)
    throw new RangeError('pictureChoices: one label per picture');
  return {
    type: 'choices',
    choices: labels.map((_, i) => i),
    labels,
    visuals,
    ...(rtl ? { rtl } : {}),
  };
}

export function numpad(maxDigits: number, decimal = false): Exercise['input'] {
  return decimal ? { type: 'numpad', maxDigits, decimal: true } : { type: 'numpad', maxDigits };
}

/* ---------- Mistake diagnosis ---------- */

function reversedDigits(n: number): number | null {
  // 40 → 4 is a place-value slip, not two digits swapped.
  if (n < 10 || n > 99 || n % 10 === 0) return null;
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

/** Whether the exercise has a decimal number in it (then a moved point is a decimal-point slip). */
const hasDecimal = (f: ArithFacts) => [f.a, f.b, f.answer].some((x) => !Number.isInteger(x));

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
    // Forgot to carry (addition) or to borrow (subtraction): each has its own advice.
    if (carried && value === (f.op === '+' ? answer - 10 : answer + 10))
      return f.op === '+' ? 'carry' : 'borrow';
  }
  if (Math.abs(value - answer) === 10 || Math.abs(value - answer) === 100) return 'offByTen';
  // Place value only for a real factor-of-ten slip (40 for 4, 4 for 40), not any length difference.
  // Checked before swapped digits: 4 for 40 is about tens, not about order.
  // With a decimal on either side, the same digits with the point moved: the point's place.
  if (
    value > 0 &&
    [10, 100, 1000].some((k) => sameNumber(value, answer * k) || sameNumber(value * k, answer))
  )
    return Number.isInteger(answer) && Number.isInteger(value) && !hasDecimal(f)
      ? 'placeValue'
      : 'decimalPoint';
  if (reversedDigits(answer) === value) return 'digitReversal';
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
  /** Advice for typical wrong answers; see `adviceFor`. */
  advice?: readonly AdviceSpec[];
}

/**
 * One typical wrong answer and what to say about it. `kind` is the mistake
 * counted for the parent's report; without it, the exercise's own diagnosis
 * (or 'other') is counted.
 */
export interface AdviceSpec {
  value: number;
  say: Said;
  kind?: MistakeKind;
}

/** Only advice for real wrong answers, one per value (the first wins). */
function adviceOf(answer: number, specs: readonly AdviceSpec[] = []): AdviceSpec[] {
  const out: AdviceSpec[] = [];
  for (const a of specs)
    if (!sameNumber(a.value, answer) && !out.some((o) => sameNumber(o.value, a.value))) out.push(a);
  return out;
}

/** A typed answer matches: equal, give or take floating-point noise. */
export function sameNumber(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

/** Builds the final Exercise, filling the spoken-parts fields. */
export function exercise(p: ExerciseParts): Exercise {
  const advice = adviceOf(p.answer, p.advice);
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
    answer: exact(p.answer),
    input: p.input,
    hints: p.hints,
    solutionSpoken: p.solution.text,
    solutionParts: p.solution.parts,
    // A right answer is never a mistake, whatever a topic's own diagnosis says.
    diagnose: (value) => {
      if (sameNumber(value, p.answer)) return null;
      const known = p.diagnose?.(value) ?? null;
      const a = advice.find((x) => sameNumber(x.value, value));
      return a ? (a.kind ?? known ?? 'other') : known;
    },
    ...(advice.length > 0
      ? {
          advice: advice.map((a) => ({
            value: a.value,
            text: shown(a.say),
            spoken: a.say.text,
            parts: a.say.parts,
          })),
        }
      : {}),
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

/**
 * Hint 3 from the first of these examples whose answer is not this exercise's:
 * a worked example with the same answer gives it away. Give two or more.
 */
export function exampleAvoiding(
  answer: number,
  options: readonly { answer: number; hint: () => Hint }[],
): Hint {
  const chosen = options.find((o) => !sameNumber(o.answer, answer)) ?? options[0];
  if (!chosen) throw new RangeError('exampleAvoiding: no examples');
  return chosen.hint();
}

/** Hint 3 with a picture: a similar exercise, solved, shown as a picture (coins, a clock). */
export function pictureExample(solved: Said, visual: Visual, display?: string): Hint {
  return {
    text: t('hint.example'),
    spoken: t('spoken.example', { params: { sentence: solved.text } }),
    spokenParts: ['למשל', ...solved.parts],
    visual,
    ...(display ? { example: { display, spoken: solved.text } } : {}),
  };
}

/**
 * Everything an exercise can say, as [sentence, clips]: the question, the
 * solution, the hints, and for a column exercise what is said at every step.
 */
export function sayingsOf(e: Exercise): [string, string[] | undefined][] {
  const out: [string, string[] | undefined][] = [
    [e.spokenText, e.spokenParts],
    [e.solutionSpoken, e.solutionParts],
    ...e.hints.map((h): [string, string[] | undefined] => [h.spoken, h.spokenParts]),
    ...(e.advice ?? []).map((a): [string, string[] | undefined] => [a.spoken, a.parts]),
  ];
  if (e.input.type === 'vertical') {
    const { steps, rowIntro } = e.input.layout;
    for (const s of steps)
      out.push([s.ask.spoken, s.ask.parts], [s.explain.spoken, s.explain.parts]);
    for (const l of rowIntro) if (l) out.push([l.spoken, l.parts]);
  }
  return out;
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
  /** The last level for a younger grade that shares the world (10 when absent). */
  lastLevel?: (grade: number) => number;
  levels: readonly LevelDef[];
  /** Extra phrases for the audio bank (story pieces the sampling may not reach). */
  extraBank?: () => string[];
}

/** How many exercises per level the bank samples from open levels to collect their pieces. */
/**
 * Open levels play from a fixed pool of exercises, so that every sentence a
 * child can hear is recorded whole (no sentence assembled from clips). The
 * pool size follows what the level practises: arithmetic fluency, where an
 * answer is easy to remember, gets the biggest; word problems, long and hard
 * to remember, the smallest. A level with fewer exercises keeps all of them.
 */
export const POOL_SIZE = { fluency: 200, sense: 120, story: 100 } as const;

const OPERATION_SIGN = /[+−×÷:]/;

function poolKind(e: Exercise): keyof typeof POOL_SIZE {
  if (e.input.type === 'vertical' || OPERATION_SIGN.test(e.display)) return 'fluency';
  return !e.display && e.prompt.length > 45 ? 'story' : 'sense';
}

/** A stable number for a string (FNV-1a), to seed a level's pool. */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * A fact as the child meets it: the two numbers of a product or a sum in either order
 * are one fact ("mul:6×2" and "mul:2×6"), so a round does not give one right after the other.
 */
export function sameFact(factId: string): string {
  return factId.replace(/(\d+)([×+])(\d+)/g, (m, a: string, op: string, b: string) =>
    Number(a) <= Number(b) ? m : `${b}${op}${a}`,
  );
}

/** One exercise of a pool: the seed that builds it (in either gender) and its fact. */
interface PoolEntry {
  seed: number;
  factId: string;
  /**
   * Other seeds that build the same exercise, word for word in both genders, with
   * its buttons in another order. The pool fixes what is said, not where the right
   * answer sits: without these, a level with few facts would put it on the same
   * button most of the time.
   */
  variants: number[];
}

/** At most this many other button orders are kept for an exercise of a pool. */
const MAX_VARIANTS = 6;

/** Everything an exercise says, in both genders: two seeds must agree on it to be one exercise. */
function sayingsKey(gen: (rng: Rng, gender: Gender) => Exercise, seed: number): string {
  return JSON.stringify([
    sayingsOf(gen(seededRng(seed), 'f')),
    sayingsOf(gen(seededRng(seed), 'm')),
  ]);
}

export function defineTopic(def: TopicDef): Topic & { enumerate: (level: number) => Exercise[] } {
  const levels: LevelInfo[] = def.levels.map((l, i) => ({ level: i + 1, labelKey: l.labelKey }));
  const levelDef = (level: number): LevelDef => {
    const l = def.levels[level - 1];
    if (!l) throw new RangeError(`${def.id} has no level ${level}`);
    return l;
  };

  /**
   * The fixed pool of an open level, built once on first use: distinct
   * exercises from seeds derived from the topic and level, so the same pool on
   * every device and in the audio build.
   */
  const pools = new Map<number, PoolEntry[]>();
  const poolOf = (level: number): PoolEntry[] => {
    const cached = pools.get(level);
    if (cached) return cached;
    const l = levelDef(level);
    if (!('gen' in l)) return [];
    const base = hashString(`${def.id}:${level}`);
    const size = POOL_SIZE[poolKind(l.gen(seededRng(base), 'f'))];
    const out: PoolEntry[] = [];
    const byId = new Map<string, PoolEntry & { said?: string; orders: Set<string> }>();
    const order = (e: Exercise) => (e.input.type === 'choices' ? e.input.choices.join(',') : '');
    for (let k = 0; k < size * 8 && out.length < size; k++) {
      const seed = (base + k * 7919) >>> 0;
      const e = l.gen(seededRng(seed), 'f');
      const known = byId.get(e.factId);
      if (!known) {
        const entry = { seed, factId: e.factId, variants: [], orders: new Set([order(e)]) };
        byId.set(e.factId, entry);
        out.push(entry);
        continue;
      }
      // The same exercise again: worth keeping only as another order of its buttons.
      if (e.input.type !== 'choices' || known.variants.length >= MAX_VARIANTS) continue;
      if (known.orders.has(order(e))) continue;
      known.said ??= sayingsKey(l.gen, known.seed);
      if (sayingsKey(l.gen, seed) !== known.said) continue;
      known.orders.add(order(e));
      known.variants.push(seed);
    }
    const pool = out.map(({ seed, factId, variants }) => ({ seed, factId, variants }));
    pools.set(level, pool);
    return pool;
  };

  const generate = (
    level: number,
    rng: Rng,
    gender: Gender,
    avoid?: string | readonly string[],
  ): Exercise => {
    const l = levelDef(level);
    // Compared as a child sees them: 6 × 2 right after 2 × 6 is the same exercise again.
    const seen = new Set(
      (avoid === undefined ? [] : typeof avoid === 'string' ? [avoid] : avoid).map(sameFact),
    );
    const last = typeof avoid === 'string' ? avoid : avoid?.at(-1);
    if ('gen' in l) {
      // From the level's pool: nothing seen in this round, at least never the same twice running.
      const pool = poolOf(level);
      const fresh = pool.filter((p) => !seen.has(sameFact(p.factId)));
      const notLast = pool.filter((p) => p.factId !== last);
      const from = fresh.length > 0 ? fresh : notLast.length > 0 ? notLast : pool;
      const entry = from.length > 0 ? pick(rng, from) : undefined;
      if (!entry) return l.gen(rng, gender);
      // Which of its button orders: the exercise is the same, word for word.
      const seed =
        entry.variants.length > 0 ? pick(rng, [entry.seed, ...entry.variants]) : entry.seed;
      return l.gen(seededRng(seed), gender);
    }
    const facts = l.facts() as readonly never[];
    const build = l.build;
    const ids = facts.map((f) => build(f, () => 0, gender).factId);
    const fresh = facts.filter((_, i) => !seen.has(sameFact(ids[i] ?? '')));
    const notLast = facts.filter((_, i) => ids[i] !== last);
    const pool = fresh.length > 0 ? fresh : notLast.length > 0 ? notLast : facts;
    return build(pick(rng, pool), rng, gender);
  };

  /** Every exercise a level can give: a closed level's facts, an open level's pool; both genders. */
  const enumerate = (level: number): Exercise[] => {
    const l = levelDef(level);
    const fixed: Rng = () => 0;
    if ('gen' in l) {
      const gen = l.gen;
      return poolOf(level).flatMap((p) => [
        gen(seededRng(p.seed), 'f'),
        gen(seededRng(p.seed), 'm'),
      ]);
    }
    return (l.facts() as readonly never[]).flatMap((f) => [
      l.build(f, fixed, 'f'),
      l.build(f, fixed, 'm'),
    ]);
  };

  let bankCache: string[] | null = null;
  const spokenBank = (): string[] => {
    // Computed once: every sentence of every exercise a child can get, recorded whole.
    if (bankCache) return bankCache;
    const out = new Set<string>();
    for (const { level } of levels) {
      const closedLevel = !('gen' in levelDef(level));
      for (const e of enumerate(level))
        for (const [text, parts] of sayingsOf(e)) {
          out.add(text);
          // A closed level's choices (a noun, an order) can vary at play time: its clips stay too.
          if (closedLevel) for (const p of parts ?? []) out.add(p);
        }
    }
    for (const p of def.extraBank?.() ?? []) out.add(p);
    bankCache = [...out];
    return bankCache;
  };

  return {
    id: def.id,
    labelKey: def.labelKey,
    grades: def.grades,
    levels,
    startLevel: def.startLevel,
    ...(def.lastLevel ? { lastLevel: def.lastLevel } : {}),
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
  /** Advice for typical wrong answers, said for these numbers. */
  advice?: readonly AdviceSpec[];
}

/**
 * Drops binary floating-point noise: 26.099999999999998 → 26.1, 0.6000000000000001 → 0.6.
 * Every answer the engine computes goes through this (a typed 26.1 must match).
 */
export function exact(x: number): number {
  return Number.isInteger(x) ? x : Number(x.toFixed(9));
}

export function result(a: number, op: Op, b: number): number {
  switch (op) {
    case '+':
      return exact(a + b);
    case '-':
      return exact(a - b);
    case '×':
      return exact(a * b);
    case '÷':
      return exact(a / b);
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
  const example = differentExample(o.a, o.op, o.b, o.example, missing);
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
    ...(o.advice ? { advice: o.advice } : {}),
  });
}

/**
 * The worked example must never give the answer away: not the exercise itself
 * (nor its mirror, 5 + 3 for 3 + 5), and not an exercise with the same answer
 * (the asked part: the result, or the missing number). When the suggested
 * example does, nudge it while keeping it valid: still non-negative for
 * subtraction, still exact for division (with the same remainder, for
 * remainder problems).
 */
export function differentExample(
  a: number,
  op: Op,
  b: number,
  ex: { a: number; b: number },
  missing: 'a' | 'b' | 'c' = 'c',
): { a: number; b: number } {
  const commutes = op === '+' || op === '×';
  const asked = (x: { a: number; b: number }) =>
    missing === 'a' ? x.a : missing === 'b' ? x.b : result(x.a, op, x.b);
  const answer = asked({ a, b });
  const valid = (x: { a: number; b: number }) =>
    x.a > 0 && x.b > 0 && (op !== '-' || x.a >= x.b) && (op !== '÷' || x.a % x.b === a % b);
  const bad = (x: { a: number; b: number }) =>
    (x.a === a && x.b === b) || (commutes && x.a === b && x.b === a) || asked(x) === answer;
  if (!bad(ex)) return ex;
  const candidates =
    op === '÷'
      ? [
          { a: ex.a + ex.b, b: ex.b },
          { a: ex.a + 2 * ex.b, b: ex.b },
          { a: ((ex.a - (ex.a % ex.b)) / ex.b) * (ex.b + 1) + (ex.a % ex.b), b: ex.b + 1 },
          { a: Math.max(1, ex.a - ex.b), b: ex.b },
        ]
      : [
          { a: ex.a + 1, b: ex.b },
          { a: ex.a, b: ex.b + 1 },
          { a: ex.a + 2, b: ex.b + 1 },
          { a: ex.a + 1, b: ex.b + 2 },
          { a: Math.max(1, ex.a - 1), b: ex.b },
          { a: ex.a + 3, b: ex.b },
        ];
  return candidates.find((x) => valid(x) && !bad(x)) ?? { a: ex.a + 3, b: ex.b };
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
  /** Advice for typical wrong answers, said for these numbers. */
  advice?: readonly AdviceSpec[];
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
        const story = compose(
          t(`${key}.story` as TranslationKey, { gender: who.gender }),
          storySlots(who, noun, 3, 3),
        );
        for (const p of story.parts) out.add(p);
        out.add(say(`${key}.hint1` as TranslationKey, {}, who.gender).text);
      }
    }
  }
  return [...out];
}

export function wordProblem(o: WordProblemOptions): Exercise {
  if (o.a < 3 || o.b < 3)
    throw new RangeError(`word problem numbers must be at least 3 (${o.key}: ${o.a}, ${o.b})`);
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
    ? say('eq.remainder.solution', { a: o.a, b: o.b, q: Math.floor(o.a / o.b), r: c })
    : spokenEquationSolved(o.a, o.op, o.b, c);
  const exSolved = o.askRemainder
    ? say('eq.remainder.solution', {
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
    // On screen with digits; heard with words.
    prompt: shown(story),
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
    ...(o.advice ? { advice: o.advice } : {}),
  });
}
