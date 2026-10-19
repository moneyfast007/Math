import { t, type TranslationKey } from '@/i18n';
import type { Gender } from '@/lang/gender';
import { countNoun, numberToWords } from '@/lang/hebrewNumbers';
import { spokenEquation, spokenQuestion, displayBinary } from '@/lang/spoken';
import type { MistakeKind } from '@/state/schema';
import { spreadChoices } from '../build';
import { NOUNS, type CountableNoun } from '../nouns';
import { pick } from '../rng';
import type { Exercise, Hint, LevelInfo, Rng, Topic, Visual } from '../types';

/**
 * Topic "add-sub-20": numbers and addition/subtraction up to 20.
 * Covers gan hova (counting, adding with pictures) through grade 2
 * (crossing ten, missing numbers), following the Ministry curriculum order.
 *
 * Each level is a closed list of facts. Exercises are drawn from that list,
 * so the set of everything the topic can say is finite and is pre-generated
 * as audio (see spokenBank).
 */

export const TOPIC_ID = 'add-sub-20';

type Fact =
  | { kind: 'count'; n: number }
  | { kind: 'objAdd'; a: number; b: number }
  | { kind: 'objSub'; a: number; b: number }
  | { kind: 'add'; a: number; b: number }
  | { kind: 'sub'; a: number; b: number }
  | { kind: 'missAdd'; a: number; c: number }
  | { kind: 'missSub'; c: number; b: number };

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function pairs(
  aRange: number[],
  bRange: number[],
  keep: (a: number, b: number) => boolean,
): [number, number][] {
  return aRange.flatMap((a) =>
    bRange.filter((b) => keep(a, b)).map((b) => [a, b] as [number, number]),
  );
}

/** The facts of each level. Order matters only for picking the worked example. */
function factsFor(level: number): Fact[] {
  switch (level) {
    case 1:
      return range(1, 5).map((n) => ({ kind: 'count', n }));
    case 2:
      return range(3, 10).map((n) => ({ kind: 'count', n }));
    case 3:
      return pairs(range(1, 4), range(1, 4), (a, b) => a + b <= 5).map(([a, b]) => ({
        kind: 'objAdd',
        a,
        b,
      }));
    case 4:
      return pairs(range(1, 9), range(1, 9), (a, b) => a + b >= 4 && a + b <= 10).map(([a, b]) => ({
        kind: 'objAdd',
        a,
        b,
      }));
    case 5:
      return pairs(range(2, 10), range(1, 9), (a, b) => b < a).map(([a, b]) => ({
        kind: 'objSub',
        a,
        b,
      }));
    case 6:
      return pairs(range(1, 9), range(1, 9), (a, b) => a + b <= 10).map(([a, b]) => ({
        kind: 'add',
        a,
        b,
      }));
    case 7:
      // n − n only for even n: nine of them were one exercise in six.
      return pairs(
        range(2, 10),
        range(1, 10),
        (a, b) => b < a || (b === a && a % 2 === 0),
      ).map(([a, b]) => ({ kind: 'sub', a, b }));
    case 8:
      // Up to 20 without crossing ten: 12 + 5, 17 − 4.
      return [
        ...pairs(range(10, 18), range(1, 9), (a, b) => (a % 10) + b <= 9).map(([a, b]): Fact => ({
          kind: 'add',
          a,
          b,
        })),
        ...pairs(range(11, 19), range(1, 9), (a, b) => b <= a % 10).map(([a, b]): Fact => ({
          kind: 'sub',
          a,
          b,
        })),
      ];
    case 9:
      // Crossing ten: 8 + 5, 14 − 6.
      return [
        ...pairs(range(2, 9), range(2, 9), (a, b) => a + b >= 11).map(([a, b]): Fact => ({
          kind: 'add',
          a,
          b,
        })),
        ...pairs(range(11, 18), range(2, 9), (a, b) => b > a % 10 && a - b >= 2).map(
          ([a, b]): Fact => ({ kind: 'sub', a, b }),
        ),
      ];
    case 10:
      // Missing number: 7 + ? = 12, 15 − ? = 9. The unknown is 1–10.
      return [
        ...pairs(range(2, 15), range(3, 20), (a, c) => c - a >= 1 && c - a <= 10 && c <= 20).map(
          ([a, c]): Fact => ({ kind: 'missAdd', a, c }),
        ),
        ...pairs(range(11, 20), range(1, 19), (c, b) => c - b >= 1 && c - b <= 10).map(
          ([c, b]): Fact => ({ kind: 'missSub', c, b }),
        ),
      ];
    default:
      throw new RangeError(`add-sub-20 has no level ${level}`);
  }
}

export const LEVELS: readonly LevelInfo[] = range(1, 10).map((level) => ({
  level,
  labelKey: `level.addSub20.${level}`,
}));

function factId(f: Fact): string {
  switch (f.kind) {
    case 'count':
      return `count:${f.n}`;
    case 'objAdd':
    case 'add':
      return `${f.kind}:${f.a}+${f.b}`;
    case 'objSub':
    case 'sub':
      return `${f.kind}:${f.a}-${f.b}`;
    case 'missAdd':
      return `missAdd:${f.a}+?=${f.c}`;
    case 'missSub':
      return `missSub:${f.c}-?=${f.b}`;
  }
}

function answerOf(f: Fact): number {
  switch (f.kind) {
    case 'count':
      return f.n;
    case 'objAdd':
    case 'add':
      return f.a + f.b;
    case 'objSub':
    case 'sub':
      return f.a - f.b;
    case 'missAdd':
      return f.c - f.a;
    case 'missSub':
      return f.c - f.b;
  }
}

function key(k: string): TranslationKey {
  return k as TranslationKey;
}

const w = (n: number) => numberToWords(n);

/** Three ascending choices around the answer, distinct, within the level's numbers, the answer at any place. */
function choicesFor(answer: number, min: number, max: number, rng: Rng): number[] {
  return spreadChoices(rng, answer, { deltas: [1, 2], min, max });
}

function reversedDigits(n: number): number | null {
  // 10 → 1, 20 → 2: a place-value slip, not two digits swapped.
  if (n < 10 || n > 99 || n % 10 === 0) return null;
  const r = Number(String(n).split('').reverse().join(''));
  return r === n ? null : r;
}

function diagnoseArith(
  value: number,
  answer: number,
  wrongOpValue: number | null,
): MistakeKind | null {
  if (value === answer) return null;
  if (wrongOpValue !== null && value === wrongOpValue && wrongOpValue !== answer)
    return 'wrongOperation';
  if (Math.abs(value - answer) === 1) return 'offByOne';
  if (reversedDigits(answer) === value) return 'digitReversal';
  return null;
}

/** "אחת, שתיים, שלוש" — counting aloud is feminine. */
function countingSequence(n: number): string {
  return range(1, n)
    .map((i) => w(i))
    .join(', ');
}

function exampleHint(sample: Fact): Hint {
  if (sample.kind === 'missAdd' || sample.kind === 'missSub') return missingExample(sample);
  const ex = buildCore(sample, NOUNS[2] as CountableNoun);
  const display = ex.display ? ex.display.replace('?', String(answerOf(sample))) : '';
  return {
    text: t('hint.example'),
    spoken: t('spoken.example', { params: { sentence: ex.solutionSpoken } }),
    example: { display, spoken: ex.solutionSpoken },
  };
}

/**
 * A missing-number example in the shape of the question: the equation with its
 * gap, then what goes in it ("3 + ? = 7, ? = 4"), said the way the question
 * is asked. A plain "3 + 4 = 7" does not show what was missing.
 */
function missingExample(f: Extract<Fact, { kind: 'missAdd' | 'missSub' }>): Hint {
  const gap = answerOf(f);
  const display =
    f.kind === 'missAdd'
      ? `${f.a} + ? = ${f.c},   ? = ${gap}`
      : `${f.c} − ? = ${f.b},   ? = ${gap}`;
  const solved =
    f.kind === 'missAdd'
      ? t('ex.missAdd.exampleSolved', { params: { a: w(f.a), b: w(gap), c: w(f.c) } })
      : t('ex.missSub.exampleSolved', { params: { c: w(f.c), a: w(gap), b: w(f.b) } });
  return {
    text: t('hint.example'),
    spoken: t('spoken.example', { params: { sentence: solved } }),
    example: { display, spoken: solved },
  };
}

/** Whether a fact crosses ten (8 + 5, 14 − 6, 7 + ? = 12): its example should too, or not. */
function crossesTen(f: Fact): boolean {
  switch (f.kind) {
    case 'add':
    case 'objAdd':
      return f.a < 10 && f.a + f.b > 10;
    case 'sub':
    case 'objSub':
      return f.a > 10 && f.a - f.b < 10;
    case 'missAdd':
      return f.a < 10 && f.c > 10;
    case 'missSub':
      return f.c > 10 && f.b < 10;
    case 'count':
      return false;
  }
}

interface Core {
  prompt: string;
  display: string;
  spokenText: string;
  visual?: Visual;
  solutionSpoken: string;
  operation?: 'add' | 'sub';
}

/** The parts of an exercise that depend only on the fact and the noun. */
function buildCore(f: Fact, noun: CountableNoun): Core {
  switch (f.kind) {
    case 'count': {
      const prompt = t('ex.count.prompt', { params: { plural: noun.plural } });
      return {
        prompt,
        display: '',
        spokenText: prompt,
        visual: { type: 'objects', kind: noun, groups: [f.n] },
        solutionSpoken: `${countNoun(f.n, noun)}.`,
      };
    }
    case 'objAdd':
      return {
        prompt: t('ex.objAdd.prompt', { params: { plural: noun.plural } }),
        display: displayBinary(f.a, '+', f.b),
        spokenText: t('spoken.objAdd', {
          params: { a: countNoun(f.a, noun), b: countNoun(f.b, noun), plural: noun.plural },
        }),
        visual: { type: 'objects', kind: noun, groups: [f.a, f.b] },
        solutionSpoken: spokenEquation(f.a, '+', f.b, f.a + f.b),
        operation: 'add',
      };
    case 'objSub':
      return {
        prompt: t('ex.objSub.prompt', { params: { plural: noun.plural } }),
        display: displayBinary(f.a, '-', f.b),
        spokenText: t('spoken.objSub', {
          params: { a: countNoun(f.a, noun), b: countNoun(f.b, noun), plural: noun.plural },
        }),
        visual: { type: 'objects', kind: noun, groups: [f.a], removed: f.b },
        solutionSpoken: spokenEquation(f.a, '-', f.b, f.a - f.b),
        operation: 'sub',
      };
    case 'add':
      return {
        prompt: t('ex.arith.prompt'),
        display: displayBinary(f.a, '+', f.b),
        spokenText: spokenQuestion(f.a, '+', f.b),
        solutionSpoken: spokenEquation(f.a, '+', f.b, f.a + f.b),
        operation: 'add',
      };
    case 'sub':
      return {
        prompt: t('ex.arith.prompt'),
        display: displayBinary(f.a, '-', f.b),
        spokenText: spokenQuestion(f.a, '-', f.b),
        solutionSpoken: spokenEquation(f.a, '-', f.b, f.a - f.b),
        operation: 'sub',
      };
    case 'missAdd':
      return {
        prompt: t('ex.missing.prompt'),
        display: `${f.a} + ? = ${f.c}`,
        spokenText: t('spoken.missAdd', { params: { a: w(f.a), c: w(f.c) } }),
        solutionSpoken: spokenEquation(f.a, '+', f.c - f.a, f.c),
        operation: 'add',
      };
    case 'missSub':
      return {
        prompt: t('ex.missing.prompt'),
        display: `${f.c} − ? = ${f.b}`,
        spokenText: t('spoken.missSub', { params: { c: w(f.c), b: w(f.b) } }),
        solutionSpoken: spokenEquation(f.c, '-', f.c - f.b, f.b),
        operation: 'sub',
      };
  }
}

/** Hint 1 (simpler wording) and hint 2 (a picture) for a fact. */
function firstHints(f: Fact, noun: CountableNoun, level: number): [Hint, Hint] {
  const max = level >= 8 ? 20 : 10;
  switch (f.kind) {
    case 'count': {
      const text = t('hint.count.1');
      const h2 = t('hint.count.2');
      return [
        { text, spoken: text },
        {
          text: h2,
          spoken: h2,
          visual: { type: 'objects', kind: noun, groups: [f.n], arranged: true },
        },
      ];
    }
    case 'objAdd':
    case 'objSub': {
      const text = t(key(`hint.${f.kind}.1`), { params: { plural: noun.plural } });
      const h2 = t('hint.objects.2');
      const visual: Visual =
        f.kind === 'objAdd'
          ? { type: 'objects', kind: noun, groups: [f.a, f.b], arranged: true }
          : { type: 'objects', kind: noun, groups: [f.a], removed: f.b, arranged: true };
      return [
        { text, spoken: text },
        { text: h2, spoken: h2, visual },
      ];
    }
    case 'add':
    case 'sub': {
      const crossing = f.kind === 'add' ? f.a < 10 && f.a + f.b > 10 : f.a > 10 && f.a - f.b < 10;
      const k = crossing
        ? f.kind === 'add'
          ? 'hint.addCross.1'
          : 'hint.subCross.1'
        : `hint.${f.kind}.1`;
      const text = t(key(k));
      const nl = t('hint.numberLine');
      // Count on from the larger addend (3 + 8 → start at 8).
      const start = f.kind === 'add' ? Math.max(f.a, f.b) : f.a;
      const hops = f.kind === 'add' ? Math.min(f.a, f.b) : -f.b;
      const visual: Visual = {
        type: 'numberLine',
        from: 0,
        to: max,
        start,
        hops,
        ...(crossing ? { stopAt: 10 } : {}),
      };
      return [
        { text, spoken: text },
        { text: nl, spoken: nl, visual },
      ];
    }
    case 'missAdd':
    case 'missSub': {
      const params: { text: Record<string, number>; spoken: Record<string, string> } =
        f.kind === 'missAdd'
          ? { text: { a: f.a, c: f.c }, spoken: { a: w(f.a), c: w(f.c) } }
          : { text: { c: f.c, b: f.b }, spoken: { c: w(f.c), b: w(f.b) } };
      const gap = t('hint.numberLineGap');
      const from = f.kind === 'missAdd' ? f.a : f.c;
      const to = f.kind === 'missAdd' ? f.c : f.b;
      return [
        {
          text: t(key(`hint.${f.kind}.1`), { params: params.text }),
          spoken: t(key(`hint.${f.kind}.1.spoken`), { params: params.spoken }),
        },
        {
          text: gap,
          spoken: gap,
          visual: { type: 'numberLine', from: 0, to: 20, start: from, hops: 0, target: to },
        },
      ];
    }
  }
}

/** Hint 3 for counting: a smaller, different count. */
function countingExample(n: number): Hint {
  const k = n === 3 ? 4 : 3;
  const star = NOUNS.find((x) => x.id === 'star') as CountableNoun;
  const text = t('hint.count.3', {
    params: { phrase: countNoun(k, star), sequence: countingSequence(k) },
  });
  return { text, spoken: text, example: { display: `${'⭐'.repeat(k)} = ${k}`, spoken: text } };
}

function usesNoun(f: Fact): boolean {
  return f.kind === 'count' || f.kind === 'objAdd' || f.kind === 'objSub';
}

function inputFor(level: number, answer: number, rng: Rng): Exercise['input'] {
  if (level <= 5)
    return {
      type: 'choices',
      // Within the level's numbers: 7 among the buttons of "up to five" rules itself out.
      choices: choicesFor(answer, level <= 2 ? 1 : 0, level === 3 ? 6 : 10, rng),
    };
  return { type: 'numpad', maxDigits: 2 };
}

function build(f: Fact, level: number, noun: CountableNoun, rng: Rng): Exercise {
  // The worked example: same kind of exercise, clearly different numbers (a third of
  // the way around the level's list, so it is not just "one more than" this one).
  const sameKind = factsFor(level).filter((x) => x.kind === f.kind);
  const index = sameKind.findIndex((x) => factId(x) === factId(f));
  const step = Math.max(1, Math.floor(sameKind.length / 3));
  const answer = answerOf(f);
  // Never the same answer, nor the same two numbers the other way round (3 + 1 for 1 + 3):
  // the example would give the answer away.
  const mirror = (x: Fact) =>
    'a' in x && 'a' in f && 'b' in x && 'b' in f && x.a === f.b && x.b === f.a;
  const around = sameKind.map((_, i) => sameKind[(index + step + i) % sameKind.length] as Fact);
  // A missing-number example shows its whole equation: none of its numbers may be this answer.
  const shows = (x: Fact) =>
    x.kind === 'missAdd'
      ? [x.c - x.a, x.c]
      : x.kind === 'missSub'
        ? [x.c - x.b, x.b]
        : [answerOf(x)];
  // Nor one that starts like the exercise (7 + ? = 15 for 7 + ? = 12): it reads as the same one.
  const sameStart = (x: Fact) =>
    (x.kind === 'missAdd' && f.kind === 'missAdd' && x.a === f.a) ||
    (x.kind === 'missSub' && f.kind === 'missSub' && x.c === f.c);
  const fair = (x: Fact) =>
    factId(x) !== factId(f) && !shows(x).includes(answer) && !mirror(x) && !sameStart(x);
  // Like the exercise: crossing ten when it does, not when it does not.
  const sample =
    around.find((x) => fair(x) && crossesTen(x) === crossesTen(f)) ??
    around.find(fair) ??
    around[0] ??
    f;
  const core = buildCore(f, noun);
  const [h1, h2] = firstHints(f, noun, level);
  const h3 = f.kind === 'count' ? countingExample(f.n) : exampleHint(sample);

  let wrongOp: number | null = null;
  if (f.kind === 'objAdd' || f.kind === 'add') wrongOp = Math.abs(f.a - f.b);
  if (f.kind === 'objSub' || f.kind === 'sub') wrongOp = f.a + f.b;
  if (f.kind === 'missAdd') wrongOp = f.a + f.c;
  if (f.kind === 'missSub') wrongOp = f.c + f.b;

  return {
    factId: factId(f),
    topicId: TOPIC_ID,
    level,
    prompt: core.prompt,
    display: core.display,
    spokenText: core.spokenText,
    ...(core.visual ? { visual: core.visual } : {}),
    ...(core.operation ? { operation: core.operation } : {}),
    answer,
    input: inputFor(level, answer, rng),
    hints: [h1, h2, h3],
    solutionSpoken: core.solutionSpoken,
    diagnose: (value) => diagnoseArith(value, answer, wrongOp),
  };
}

export function generate(
  level: number,
  rng: Rng,
  _gender: Gender,
  avoid?: string | readonly string[],
): Exercise {
  const facts = factsFor(level);
  const seen = new Set(avoid === undefined ? [] : typeof avoid === 'string' ? [avoid] : avoid);
  const last = typeof avoid === 'string' ? avoid : avoid?.at(-1);
  // Nothing seen in this round while there are others; at least never the same twice running.
  const fresh = facts.filter((f) => !seen.has(factId(f)));
  const notLast = facts.filter((f) => factId(f) !== last);
  const pool = fresh.length > 0 ? fresh : notLast.length > 0 ? notLast : facts;
  const fact = pick(rng, pool);
  const noun = usesNoun(fact) ? pick(rng, NOUNS) : (NOUNS[0] as CountableNoun);
  return build(fact, level, noun, rng);
}

/** Every exercise this topic can produce, for tests and for pre-generating audio. */
export function allExercises(): Exercise[] {
  const fixed: Rng = () => 0;
  return LEVELS.flatMap(({ level }) =>
    factsFor(level).flatMap((f) =>
      (usesNoun(f) ? NOUNS : [NOUNS[0] as CountableNoun]).map((noun) =>
        build(f, level, noun, fixed),
      ),
    ),
  );
}

export function spokenBank(): string[] {
  const out = new Set<string>();
  for (const ex of allExercises()) {
    out.add(ex.spokenText);
    out.add(ex.solutionSpoken);
    for (const h of ex.hints) out.add(h.spoken);
  }
  return [...out];
}

export function startLevel(grade: number): number {
  // Gan hova arrives from world 1 (counting), so the counting levels are skipped.
  if (grade <= 0) return 3;
  // Grade 1 starts with adding and taking away pictures to ten (level 4), not past it.
  if (grade === 1) return 4;
  if (grade === 2) return 8;
  return 9;
}

export const addSub20: Topic = {
  id: TOPIC_ID,
  labelKey: 'topic.addSub20',
  grades: [0, 1],
  levels: LEVELS,
  startLevel,
  // Gan stops before the symbols and the crossing of ten (levels 6–10 are grade 1).
  lastLevel: (grade) => (grade === 0 ? 5 : 10),
  generate,
  spokenBank,
};
