import { t, type TranslationKey } from '@/i18n';
import type { Gender } from '@/lang/gender';
import { countNoun, numberToWords } from '@/lang/hebrewNumbers';
import { shown } from '@/lang/compose';
import { spokenEquation, spokenQuestion, displayBinary } from '@/lang/spoken';
import type { MistakeKind } from '@/state/schema';
import { say, spreadChoices, type AdviceSpec } from '../build';
import { NOUNS, type CountableNoun } from '../nouns';
import { pick } from '../rng';
import type { Exercise, Hint, LevelInfo, Rng, Topic, Visual } from '../types';

/**
 * Topic "add-sub-20": numbers and addition/subtraction up to 20.
 * Covers gan hova (counting, adding with pictures, levels 1–5) and grade 1
 * (levels 6–10: the symbols, friends of ten, ten-plus, then crossing ten),
 * following the Ministry curriculum order.
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
  | { kind: 'missAdd'; a: number; c: number };

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
      // The symbols, without pictures: adding and taking away within ten (3 + 4, 9 − 5).
      // n − n only for even n: nine of them were one exercise in six.
      return [
        ...pairs(range(1, 9), range(1, 9), (a, b) => a + b <= 10).map(([a, b]): Fact => ({
          kind: 'add',
          a,
          b,
        })),
        ...pairs(range(2, 10), range(1, 10), (a, b) => b < a || (b === a && a % 2 === 0)).map(
          ([a, b]): Fact => ({ kind: 'sub', a, b }),
        ),
      ];
    case 7:
      // Friends of ten: 3 + ? = 10 and 10 − 3, the pairs that make ten.
      return [
        ...range(1, 9).map((a): Fact => ({ kind: 'missAdd', a, c: 10 })),
        ...range(1, 9).map((b): Fact => ({ kind: 'sub', a: 10, b })),
      ];
    case 8:
      // Ten and some ones: 10 + 6, 6 + 10, 16 − 6, 16 − 10.
      return range(1, 9).flatMap((u): Fact[] => [
        { kind: 'add', a: 10, b: u },
        { kind: 'add', a: u, b: 10 },
        { kind: 'sub', a: 10 + u, b: u },
        { kind: 'sub', a: 10 + u, b: 10 },
      ]);
    case 9:
      // Up to 20 without crossing ten, past the ten-plus facts: 12 + 5, 17 − 4.
      return [
        ...pairs(range(11, 18), range(1, 9), (a, b) => (a % 10) + b <= 9).map(([a, b]): Fact => ({
          kind: 'add',
          a,
          b,
        })),
        ...pairs(range(12, 19), range(1, 9), (a, b) => b < a % 10).map(([a, b]): Fact => ({
          kind: 'sub',
          a,
          b,
        })),
      ];
    case 10:
      // Crossing ten: 8 + 5, 14 − 6, broken up openly through ten.
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
    default:
      throw new RangeError(`add-sub-20 has no level ${level}`);
  }
}

/** Levels 1–5 (gan and the start of grade 1) keep their numbered labels. */
const LABELS = [
  ...range(1, 5).map((level) => `level.addSub20.${level}`),
  'level.addSub20.addSub10',
  'level.addSub20.friends10',
  'level.addSub20.tenPlus',
  'level.addSub20.teens',
  'level.addSub20.crossTen',
];

export const LEVELS: readonly LevelInfo[] = LABELS.map((labelKey, i) => ({
  level: i + 1,
  labelKey,
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
  if (sample.kind === 'missAdd') return missingExample(sample);
  if ((sample.kind === 'add' || sample.kind === 'sub') && crossesTen(sample))
    return crossingExample(sample);
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
function missingExample(f: Extract<Fact, { kind: 'missAdd' }>): Hint {
  const gap = answerOf(f);
  const display = `${f.a} + ? = ${f.c},   ? = ${gap}`;
  const solved = t('ex.missAdd.exampleSolved', { params: { a: w(f.a), b: w(gap), c: w(f.c) } });
  return {
    text: t('hint.example'),
    spoken: t('spoken.example', { params: { sentence: solved } }),
    example: { display, spoken: solved },
  };
}

/** How a crossing of ten breaks up: 9 + 5 = 9 + 1 + 4, 14 − 6 = 14 − 4 − 2. */
function splitAtTen(f: Extract<Fact, { kind: 'add' | 'sub' }>) {
  if (f.kind === 'add') {
    const big = Math.max(f.a, f.b);
    const small = Math.min(f.a, f.b);
    return { big, small, first: 10 - big, rest: small - (10 - big) };
  }
  const u = f.a % 10;
  return { big: f.a, small: f.b, first: u, rest: f.b - u };
}

/** A crossing example broken up through ten, on screen and said: "8 + 5 = 8 + 2 + 3 = 13". */
function crossingExample(f: Extract<Fact, { kind: 'add' | 'sub' }>): Hint {
  const { big, first, rest } = splitAtTen(f);
  const c = answerOf(f);
  const display =
    f.kind === 'add'
      ? `${f.a} + ${f.b} = ${big} + ${first} + ${rest} = ${c}`
      : `${f.a} − ${f.b} = ${f.a} − ${first} − ${rest} = ${c}`;
  const solved =
    f.kind === 'add'
      ? say('ex.addCross.exampleSolved', { a: f.a, b: f.b, big, to10: first, rest, c })
      : say('ex.subCross.exampleSolved', { a: f.a, b: f.b, u: first, rest, c });
  return {
    text: t('hint.example'),
    spoken: t('spoken.example', { params: { sentence: solved.text } }),
    example: { display, spoken: solved.text },
  };
}

/** Whether a fact crosses ten (8 + 5, 14 − 6, 7 + ? = 12): its example should too, or not. */
function crossesTen(f: Fact): boolean {
  switch (f.kind) {
    // 3 + 10 and 16 − 10 add or take away a whole ten: no crossing.
    case 'add':
    case 'objAdd':
      return f.a < 10 && f.b < 10 && f.a + f.b > 10;
    case 'sub':
    case 'objSub':
      return f.a > 10 && f.b < 10 && f.a - f.b < 10;
    case 'missAdd':
      return f.a < 10 && f.c > 10;
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
  }
}

/** A hint from a composed sentence: digits on screen, words when read. */
function saidHint(key: string, slots: Parameters<typeof say>[1] = {}, visual?: Visual): Hint {
  const s = say(key as TranslationKey, slots);
  return { text: shown(s), spoken: s.text, ...(visual ? { visual } : {}) };
}

/** Hint 1 (simpler wording) and hint 2 (a picture) for a fact. */
function firstHints(f: Fact, noun: CountableNoun, level: number): [Hint, Hint] {
  const max = level >= 8 ? 20 : 10;
  // Friends of ten: the ten-frame and its empty cells.
  if (level === 7 && f.kind === 'sub')
    return [
      saidHint('hint.friends10.sub', { b: f.b }),
      saidHint(
        'hint.friends10.subPicture',
        {},
        {
          type: 'objects',
          kind: noun,
          groups: [10],
          removed: f.b,
          arranged: true,
        },
      ),
    ];
  // Ten-plus: one whole ten and some ones.
  if (level === 8 && (f.kind === 'add' || f.kind === 'sub')) {
    if (f.kind === 'add') {
      const u = f.a === 10 ? f.b : f.a;
      return [
        saidHint('hint.tenPlus.add', { u }),
        saidHint(
          'hint.tenPlus.picture',
          {},
          {
            type: 'objects',
            kind: noun,
            groups: [10, u],
            arranged: true,
          },
        ),
      ];
    }
    return [
      saidHint(f.b === 10 ? 'hint.tenPlus.subTen' : 'hint.tenPlus.subOnes', {
        a: f.a,
        u: f.a % 10,
      }),
      saidHint(
        'hint.tenPlus.subPicture',
        {},
        {
          type: 'objects',
          kind: noun,
          groups: [f.a],
          removed: f.b,
          arranged: true,
        },
      ),
    ];
  }
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
      const crossing = crossesTen(f);
      const k = crossing
        ? f.kind === 'add'
          ? 'hint.addCross.1'
          : 'hint.subCross.1'
        : `hint.${f.kind}.1`;
      const text = t(key(k));
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
      if (crossing) {
        // Broken up openly through ten: 9 + 5 = 9 + 1 + 4.
        const { big, small, first, rest } = splitAtTen(f);
        const split =
          f.kind === 'add'
            ? saidHint('hint.addCross.split', { small, to10: first, rest, big }, visual)
            : saidHint('hint.subCross.split', { b: small, u: first, rest, a: big }, visual);
        return [{ text, spoken: text }, split];
      }
      const nl = t('hint.numberLine');
      return [
        { text, spoken: text },
        { text: nl, spoken: nl, visual },
      ];
    }
    case 'missAdd': {
      const h1: Hint = {
        text: t('hint.missAdd.1', { params: { a: f.a, c: f.c } }),
        spoken: t('hint.missAdd.1.spoken', { params: { a: w(f.a), c: w(f.c) } }),
      };
      if (f.c === 10) {
        const frame = t('hint.friends10.frame');
        return [
          h1,
          {
            text: frame,
            spoken: frame,
            visual: { type: 'objects', kind: noun, groups: [f.a], frame: 10 },
          },
        ];
      }
      const gap = t('hint.numberLineGap');
      return [
        h1,
        {
          text: gap,
          spoken: gap,
          visual: { type: 'numberLine', from: 0, to: 20, start: f.a, hops: 0, target: f.c },
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
  const shows = (x: Fact) => (x.kind === 'missAdd' ? [x.c - x.a, x.c] : [answerOf(x)]);
  // Nor one that starts like the exercise (7 + ? = 15 for 7 + ? = 12): it reads as the same one.
  const sameStart = (x: Fact) => x.kind === 'missAdd' && f.kind === 'missAdd' && x.a === f.a;
  const fair = (x: Fact) =>
    factId(x) !== factId(f) && !shows(x).includes(answer) && !mirror(x) && !sameStart(x);
  // From the symbols on, preferably none of the example's numbers is this answer:
  // 10 − 3 = 7 answers 10 − 7 (friends of ten come in pairs).
  const numbersOf = (x: Fact) =>
    x.kind === 'missAdd'
      ? [x.a, x.c, answerOf(x)]
      : 'b' in x
        ? [x.a, x.b, answerOf(x)]
        : [answerOf(x)];
  const apart = (x: Fact) => level < 6 || !numbersOf(x).includes(answer);
  // Like the exercise: crossing ten when it does, not when it does not.
  const sample =
    around.find((x) => fair(x) && apart(x) && crossesTen(x) === crossesTen(f)) ??
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

  // Advice for the typical wrong answers, said for these numbers; never for the answer itself.
  const advice = adviceFor(f, level).filter(
    (a, i, all) =>
      a.value !== answer && a.value >= 0 && all.findIndex((b) => b.value === a.value) === i,
  );
  const diagnose = (value: number): MistakeKind | null => {
    if (value === answer) return null;
    const known = diagnoseArith(value, answer, wrongOp);
    const a = advice.find((x) => x.value === value);
    return a ? (a.kind ?? known ?? 'other') : known;
  };

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
    diagnose,
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

/** The typical slips of each grade-1 level, with what to say about them. */
function adviceFor(f: Fact, level: number): AdviceSpec[] {
  const near = (answer: number) => [answer - 1, answer + 1].filter((v) => v >= 0);
  if (f.kind === 'missAdd') {
    // Added the two numbers shown (7 + ? = 10 → 17): the sign says "add",
    // but the question is what is missing.
    const added: AdviceSpec = {
      value: f.a + f.c,
      say: say('adv.missAdd.added', { a: f.a, c: f.c }),
      kind: 'wrongOperation',
    };
    if (f.c !== 10) return [added];
    return [
      added,
      ...near(f.c - f.a).map((v) => ({
        value: v,
        say: say('adv.friends10.check', { a: f.a, v, s: f.a + v }),
        kind: 'offByOne' as const,
      })),
    ];
  }
  if (level === 7 && f.kind === 'sub')
    // 10 − 3: checked by adding back, the friends of ten.
    return near(f.a - f.b).map((v) => ({
      value: v,
      say: say('adv.friends10.check', { a: v, v: f.b, s: v + f.b }),
      kind: 'offByOne' as const,
    }));
  if (level === 8 && f.kind === 'add') {
    // 10 + 6 → 7: the ten counted as one.
    const u = f.a === 10 ? f.b : f.a;
    return [{ value: 1 + u, say: say('adv.tenPlus.addOne', { u }), kind: 'placeValue' }];
  }
  if (level === 8 && f.kind === 'sub') {
    if (f.b === 10)
      // 16 − 10 → 15: took away one, not a ten.
      return [{ value: f.a - 1, say: say('adv.tenPlus.minusOne'), kind: 'placeValue' }];
    // 16 − 6 → 0 (the ones only) or 1 (the tens digit read as one).
    return [
      { value: 0, say: say('adv.tenPlus.zero'), kind: 'placeValue' },
      { value: 1, say: say('adv.tenPlus.one'), kind: 'placeValue' },
    ];
  }
  if (f.kind === 'sub' && crossesTen(f)) {
    // 14 − 6 → 12: the smaller units digit taken from the bigger (6 − 4), the ten kept.
    const u = f.a % 10;
    return [
      {
        value: 10 + (f.b - u),
        say: say('adv.subCross.flip', { u, b: f.b, a: f.a }),
        kind: 'borrow',
      },
    ];
  }
  return [];
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
    for (const a of ex.advice ?? []) out.add(a.spoken);
  }
  return [...out];
}

export function startLevel(grade: number): number {
  // Gan hova arrives from world 1 (counting), so the counting levels are skipped.
  if (grade <= 0) return 3;
  // Grade 1 starts with adding and taking away pictures to ten (level 4), not past it.
  if (grade === 1) return 4;
  // Grade 2 reviews from ten-plus; older children start at crossing ten.
  if (grade === 2) return 8;
  return 10;
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
