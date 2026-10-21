import { t, type TranslationKey } from '@/i18n';
import { compose, shown, type Slot } from '@/lang/compose';
import type { Gender } from '@/lang/gender';
import {
  type AdviceSpec,
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  pictureChoices,
  pictureExample,
  range,
  say,
  type Said,
  spreadChoices,
} from '../build';
import { NOUNS, type CountableNoun } from '../nouns';
import { shuffle } from '../rng';
import type { Exercise, Hint, Rng, ShapeColor, ShapeItem, ShapeKind, Visual } from '../types';

/**
 * World "דפוסים וסדרות", grade 1. Beyond the gan's one-colour or one-shape
 * patterns (shapes.ts, levels 7–9): a pattern of shape and colour together, a
 * pattern that grows, number sequences forward and backward, by one, two, five
 * and ten, even and odd, finding a sequence's rule, and a missing number in a
 * sequence of any of those rules.
 *
 * Every level is closed, so every sentence is recorded whole.
 */

const ID = 'patterns-1';
const L = (n: number) => `level.patterns1.${n}`;

/* ---------- Level 1: a pattern of shape and colour ---------- */

const SHAPE_NAME: Record<ShapeKind, string> = {
  circle: 'עיגול',
  square: 'ריבוע',
  triangle: 'משולש',
  rectangle: 'מלבן',
};
const COLOR_NAME: Record<ShapeColor, string> = {
  red: 'אדום',
  blue: 'כחול',
  yellow: 'צהוב',
  green: 'ירוק',
};

type Thing = [ShapeKind, ShapeColor];

const thingItem = ([shape, color]: Thing): ShapeItem => ({ shape, color, size: 0.9 });
const thingName = ([shape, color]: Thing): string => `${SHAPE_NAME[shape]} ${COLOR_NAME[color]}`;
const sameThing = (a: Thing, b: Thing) => a[0] === b[0] && a[1] === b[1];
const one = (item: ShapeItem): Visual => ({ type: 'shapes', items: [item] });
/** A pattern row, kept on one line so it reads in order on a phone. */
const line = (items: (ShapeItem | null)[]): Visual => ({ type: 'shapes', items, oneLine: true });

/** The repeating part, as indices into the things; and the row lengths shown (the answers differ). */
const TWO_PATTERNS = [
  { name: 'AABB', unit: [0, 0, 1, 1], lengths: [5, 6] },
  { name: 'ABCC', unit: [0, 1, 2, 2], lengths: [5, 6] },
  { name: 'ABBC', unit: [0, 1, 1, 2], lengths: [5, 7] },
] as const;

/** Things that differ in both shape and colour from each other. */
const PAIRS: Thing[][] = [
  [
    ['circle', 'red'],
    ['square', 'blue'],
  ],
  [
    ['triangle', 'yellow'],
    ['circle', 'green'],
  ],
  [
    ['square', 'green'],
    ['triangle', 'red'],
  ],
  [
    ['rectangle', 'blue'],
    ['circle', 'yellow'],
  ],
];
const TRIPLES: Thing[][] = [
  [
    ['circle', 'red'],
    ['square', 'blue'],
    ['triangle', 'yellow'],
  ],
  [
    ['triangle', 'green'],
    ['circle', 'blue'],
    ['square', 'red'],
  ],
  [
    ['square', 'yellow'],
    ['triangle', 'red'],
    ['circle', 'green'],
  ],
  [
    ['rectangle', 'green'],
    ['circle', 'yellow'],
    ['triangle', 'blue'],
  ],
];

type TwoFact = { pattern: 0 | 1 | 2; things: Thing[]; length: number };

function twoFacts(): TwoFact[] {
  return TWO_PATTERNS.flatMap((p, k) =>
    (k === 0 ? PAIRS : TRIPLES).flatMap((things) =>
      p.lengths.map((length) => ({ pattern: k as 0 | 1 | 2, things, length })),
    ),
  );
}

/** Hint 3: an AB pattern of two other things, solved; its answer is never this one's. */
const EXAMPLE_THINGS: Thing[] = [
  ['triangle', 'blue'],
  ['square', 'yellow'],
  ['circle', 'green'],
  ['rectangle', 'red'],
];

function twoExample(right: Thing, gender: Gender): Hint {
  const pool = EXAMPLE_THINGS.filter((x) => !sameThing(x, right));
  const a = pool[0] as Thing;
  const b = pool[1] as Thing;
  const seq = [a, b, a, b, a];
  return pictureExample(
    say(
      'ex.p1.two.example',
      {
        seq: seq.map(thingName).join(', '),
        unit: `${thingName(a)} ו${thingName(b)}`,
        next: thingName(b),
      },
      gender,
    ),
    line([...seq, b].map(thingItem)),
  );
}

function twoPattern({ pattern, things, length }: TwoFact, rng: Rng, gender: Gender): Exercise {
  const { unit, name } = TWO_PATTERNS[pattern];
  const at = (i: number) => things[unit[i % unit.length] as number] as Thing;
  const seq = range(0, length - 1).map(at);
  const right = at(length);
  const other = things.find((x) => !sameThing(x, right)) as Thing;
  // One distractor keeps the shape and takes another colour, the other keeps the colour:
  // only a child who follows both shape and colour finds the right one.
  const wrongColor: Thing = [right[0], other[1]];
  const wrongShape: Thing = [other[0], right[1]];
  const options = shuffle(rng, [right, wrongColor, wrongShape]);
  const index = (x: Thing) => options.findIndex((o) => sameThing(o, x));
  const prompt = say('ex.p1.two.prompt', {}, gender);
  const advice: AdviceSpec[] = [
    { value: index(wrongColor), say: say('ex.p1.two.adv.color', {}, gender) },
    { value: index(wrongShape), say: say('ex.p1.two.adv.shape', {}, gender) },
  ];
  return exercise({
    factId: `two:${name}:${things.map(thingName).join(',')}:${length}`,
    topicId: ID,
    level: 1,
    prompt: shown(prompt),
    display: '',
    spoken: prompt,
    visual: line([...seq.map(thingItem), null]),
    answer: index(right),
    input: pictureChoices(
      options.map(thingName),
      options.map((o) => one(thingItem(o))),
    ),
    hints: [
      hint(say('ex.p1.two.sayIt', { seq: seq.map(thingName).join(', ') }, gender)),
      hint(say('ex.p1.two.hint2', {}, gender), {
        visual: line(unit.map((k) => thingItem(things[k] as Thing))),
      }),
      twoExample(right, gender),
    ],
    solution: say('ex.p1.two.solution', { thing: thingName(right) }, gender),
    advice,
  });
}

/* ---------- Level 2: a growing pattern ---------- */

type GrowFact = { first: number; step: 1 | 2; groups: number; noun: CountableNoun };

function growFacts(): GrowFact[] {
  const out: GrowFact[] = [];
  for (const step of [1, 2] as const)
    for (const first of [1, 2, 3, 4])
      for (const groups of [3, 4]) {
        const last = first + (groups - 1) * step;
        // The next group fits on the buttons, and the picture stays small enough to count.
        if (last + step > 10 || ((first + last) * groups) / 2 > 22) continue;
        out.push({ first, step, groups, noun: NOUNS[out.length % NOUNS.length] as CountableNoun });
      }
  return out;
}

/** A number line under a sequence: from its first term, its hops, the asked term as "?". */
function seqLine(terms: number[], step: number, dir: 1 | -1, hide: number): Visual {
  const lo = Math.min(...terms);
  const hi = Math.max(...terms);
  return {
    type: 'numberLine',
    // One tick beyond either end when it fits; never off the step (odd numbers by twos).
    from: lo - step >= 0 ? lo - step : lo,
    to: hi + step <= 100 ? hi + step : hi,
    start: terms[0] as number,
    hops: dir * (terms.length - 1),
    step,
    hide,
  };
}

function grow({ first, step, groups, noun }: GrowFact, rng: Rng, gender: Gender): Exercise {
  const sizes = range(0, groups - 1).map((i) => first + i * step);
  const last = sizes.at(-1) as number;
  const answer = last + step;
  const spoken = say('ex.p1.grow.spoken', { plural: noun.plural }, gender);
  // Another growing row, whose next group is not this one's.
  const examples = [
    [2, 3, 4],
    [1, 3, 5],
    [3, 4, 5],
  ];
  const ex = examples.find(
    (e) =>
      (e[2] as number) * 2 - (e[1] as number) !== answer && e.join() !== sizes.slice(0, 3).join(),
  ) as number[];
  const exStep = (ex[1] as number) - (ex[0] as number);
  const exNext = (ex[2] as number) + exStep;
  return exercise({
    factId: `grow:${first}:${step}:${groups}`,
    topicId: ID,
    level: 2,
    prompt: shown(spoken),
    display: '',
    spoken,
    // In rows of five: a big group never wraps into two pieces, and stays easy to count.
    visual: { type: 'objects', kind: noun, groups: sizes, arranged: true },
    answer,
    input: {
      type: 'choices',
      choices: spreadChoices(rng, answer, { deltas: [1, 2], min: 1, max: 12 }),
    },
    hints: [
      hint(say('ex.p1.grow.hint1', { plural: noun.plural }, gender)),
      hint(say('ex.p1.grow.hint2', {}, gender), {
        visual: seqLine([...sizes, answer], step, 1, answer),
      }),
      pictureExample(
        say(
          'ex.p1.seq.example.fwd',
          { a: ex[0] as number, b: ex[1] as number, c: ex[2] as number, step: exStep, d: exNext },
          gender,
        ),
        { type: 'objects', kind: noun, groups: [...ex, exNext], arranged: true },
      ),
    ],
    solution: say('ex.p1.grow.solution', { step, ans: { n: answer, noun } }, gender),
    diagnose: (v) => (Math.abs(v - answer) === 1 ? 'offByOne' : null),
    // Adding one each time, when the groups grow by two.
    advice: step === 2 ? [{ value: last + 1, say: say('ex.p1.grow.adv.byOne', {}, gender) }] : [],
  });
}

/* ---------- Number sequences (levels 3–7 and 10) ---------- */

type SeqFact = { start: number; step: number; dir: 1 | -1; gap: number };
type SeqInput = 'numpad' | 'choices';

const LEN = 5;
const termsOf = ({ start, step, dir }: SeqFact) =>
  range(0, LEN - 1).map((i) => start + dir * step * i);

/** Another sequence of the same rule for hint 3: no number in common, and another answer. */
const EXAMPLE_STARTS: Record<string, number[]> = {
  '1': [23, 47, 68, 12],
  '-1': [52, 31, 86, 75],
  '2': [12, 31, 50, 73],
  '-2': [40, 27, 96, 61],
  '5': [15, 40, 60, 5],
  '-5': [65, 30, 95, 50],
  '10': [4, 21, 35, 8],
  '-10': [75, 58, 92, 39],
};

function seqExample(f: SeqFact, answer: number, gender: Gender): Hint {
  const terms = termsOf(f);
  const starts = EXAMPLE_STARTS[String(f.dir * f.step)] ?? [];
  const exTerms = (s: number) => range(0, 3).map((i) => s + f.dir * f.step * i);
  const start =
    starts.find((s) => {
      const e = exTerms(s);
      return e.at(-1) !== answer && !e.some((x) => terms.includes(x));
    }) ?? (starts[0] as number);
  const e = exTerms(start) as [number, number, number, number];
  return exampleHint(
    e.join(', '),
    say(
      f.dir > 0 ? 'ex.p1.seq.example.fwd' : 'ex.p1.seq.example.back',
      { a: e[0], b: e[1], c: e[2], step: f.step, d: e[3] },
      gender,
    ),
  );
}

/** "שלוש, ארבע, מה, שש": the shown terms with the gap said as a word ("what"). */
function seqSaid(key: TranslationKey, terms: number[], gap: number | null, gender: Gender): Said {
  const slots: Record<string, Slot> = {};
  const pieces = terms.map((v, i) => {
    if (i === gap) return t('ex.p1.seq.gap');
    slots[`n${i}`] = v;
    return `{n${i}}`;
  });
  return compose(t(key, { gender }).replace('{seq}', pieces.join(', ')), slots);
}

/** What the sequence does; the gendered ones ("קראי") take the child's gender. */
function hint1For(level: number, f: SeqFact, gender: Gender): Said {
  if (level === 3) return say('ex.p1.fwd.hint1', {}, gender);
  if (level === 4) return say('ex.p1.back.hint1', {}, gender);
  if (level === 10) return say('ex.p1.mixed.hint1', {}, gender);
  return say(f.dir > 0 ? 'ex.p1.jump.hint1' : 'ex.p1.jump.hint1back', { step: f.step });
}

function sequence(level: number, input: SeqInput) {
  return (f: SeqFact, rng: Rng, gender: Gender): Exercise => {
    const terms = termsOf(f);
    const answer = terms[f.gap] as number;
    const prev = terms[f.gap - 1] as number;
    const atEnd = f.gap === LEN - 1;
    const display = terms.map((v, i) => (i === f.gap ? '?' : String(v))).join(', ');
    const spoken = atEnd
      ? seqSaid('ex.p1.seq.next.spoken', terms.slice(0, LEN - 1), null, gender)
      : seqSaid('ex.p1.seq.missing.spoken', terms, f.gap, gender);
    // Typical slips: the wrong way (adding when the sequence goes down), or by one when it jumps.
    const wrongWay = prev - f.dir * f.step;
    const advice: AdviceSpec[] = [];
    if (wrongWay >= 0)
      advice.push({
        value: wrongWay,
        say: say(f.dir > 0 ? 'ex.p1.adv.wrongWay.fwd' : 'ex.p1.adv.wrongWay.back', {}, gender),
        kind: 'wrongOperation',
      });
    if (f.step > 1) advice.push({ value: prev + f.dir, say: say('ex.p1.adv.byOne', {}, gender) });
    return exercise({
      factId: `seq${level}:${f.start}:${f.dir * f.step}:${f.gap}`,
      topicId: ID,
      level,
      prompt: t(atEnd ? 'ex.p1.seq.next.prompt' : 'ex.p1.seq.missing.prompt'),
      display,
      spoken,
      answer,
      input:
        input === 'numpad'
          ? numpad(3)
          : {
              type: 'choices',
              choices: spreadChoices(rng, answer, {
                // Wrong by one (counted by ones) or by a whole jump (one jump too many or too few).
                deltas: f.step === 1 ? [1, 2] : [1, f.step],
                min: 0,
                max: 100,
                mix: true,
              }),
            },
      hints: [
        hint(hint1For(level, f, gender)),
        hint(say(f.dir > 0 ? 'ex.p1.line.fwd' : 'ex.p1.line.back', { step: f.step }, gender), {
          visual: seqLine(terms, f.step, f.dir, answer),
        }),
        seqExample(f, answer, gender),
      ],
      solution: say(
        f.dir > 0 ? 'ex.p1.seq.solution.fwd' : 'ex.p1.seq.solution.back',
        { prev, step: f.step, ans: answer },
        gender,
      ),
      diagnose: (v) =>
        Math.abs(v - answer) === 1 ? 'offByOne' : Math.abs(v - answer) === 10 ? 'offByTen' : null,
      advice,
    });
  };
}

/** Each start with two places for the gap (never the first number: something must lead to it). */
function seqFacts(starts: number[], step: number, dir: 1 | -1, gaps: (i: number) => number[]) {
  return (): SeqFact[] =>
    starts.flatMap((start, i) => gaps(i).map((gap) => ({ start, step, dir, gap })));
}

const twoGaps = (i: number) => [1 + (i % 4), 1 + ((i + 2) % 4)];

/** Counting on by one: from each ten, once across the next ten (6, 7, 8, 9, 10) and once inside it. */
const forwardStarts = range(0, 9).flatMap((t10) => [t10 * 10 + 6, t10 * 10 + 1]);
/** Counting back: across a ten (12, 11, 10, 9, 8), and inside one. */
const backStarts = [
  ...range(1, 9).map((t10) => t10 * 10 + 2),
  100,
  ...range(0, 9).map((t10) => t10 * 10 + 9),
];

/* ---------- Level 8: even and odd ---------- */

type EvenFact =
  | { kind: 'is'; n: number }
  | { kind: 'which'; parity: 'even' | 'odd'; nums: number[]; answer: number };

const pairs = (n: number): number[] =>
  range(0, Math.ceil(n / 2) - 1).map((i) => Math.min(2, n - i * 2));

function evenFacts(): EvenFact[] {
  const is: EvenFact[] = range(1, 14).map((n) => ({ kind: 'is', n }));
  const which: EvenFact[] = [];
  const evenU = [0, 2, 4, 6, 8];
  const oddU = [1, 3, 5, 7, 9];
  for (const parity of ['even', 'odd'] as const)
    for (let i = 0; i < 12; i++) {
      const [mine, other] = parity === 'even' ? [evenU, oddU] : [oddU, evenU];
      const tens = [1 + ((i * 4) % 9), 1 + ((i * 4 + 2) % 9), 1 + ((i * 4 + 5) % 9)] as const;
      const answer = tens[0] * 10 + (mine[i % 5] as number);
      const nums = [
        answer,
        tens[1] * 10 + (other[(i + 1) % 5] as number),
        tens[2] * 10 + (other[(i + 3) % 5] as number),
      ].sort((a, b) => a - b);
      which.push({ kind: 'which', parity, nums, answer });
    }
  return [...is, ...which];
}

const STAR = NOUNS.find((n) => n.id === 'star') as CountableNoun;

function evenOdd(f: EvenFact, _rng: Rng, gender: Gender): Exercise {
  if (f.kind === 'is') {
    const even = f.n % 2 === 0;
    const spoken = say('ex.p1.even.is', { n: f.n }, gender);
    const [e, o] = f.n === 6 || f.n === 7 ? [8, 9] : [6, 7];
    return exercise({
      factId: `even:is:${f.n}`,
      topicId: ID,
      level: 8,
      prompt: shown(spoken),
      display: '',
      spoken,
      visual: { type: 'objects', kind: STAR, groups: [f.n] },
      answer: even ? 0 : 1,
      input: labelledChoices([t('ex.p1.yes'), t('ex.p1.no')]),
      hints: [
        hint(say('ex.p1.even.is.hint1', {}, gender)),
        hint(say('ex.p1.even.is.hint2', {}, gender), {
          visual: { type: 'objects', kind: STAR, groups: pairs(f.n) },
        }),
        pictureExample(say('ex.p1.even.is.example', { e, o }, gender), {
          type: 'objects',
          kind: STAR,
          groups: pairs(o),
        }),
      ],
      solution: say(
        even ? 'ex.p1.even.is.solutionYes' : 'ex.p1.even.is.solutionNo',
        { n: f.n },
        gender,
      ),
    });
  }
  const even = f.parity === 'even';
  const [a, b, c] = f.nums as [number, number, number];
  const spoken = say(
    even ? 'ex.p1.even.which.spoken' : 'ex.p1.odd.which.spoken',
    { a, b, c },
    gender,
  );
  const ex = (even ? [36, 58] : [47, 29]).find((x) => !f.nums.includes(x)) as number;
  const solution = (n: number) =>
    say(even ? 'ex.p1.even.which.solution' : 'ex.p1.odd.which.solution', { n, u: n % 10 }, gender);
  return exercise({
    factId: `even:${f.parity}:${f.nums.join(',')}`,
    topicId: ID,
    level: 8,
    prompt: t(even ? 'ex.p1.even.which' : 'ex.p1.odd.which'),
    display: '',
    spoken,
    // The numbers in order, as they are said.
    answer: f.nums.indexOf(f.answer),
    input: labelledChoices(f.nums.map(String)),
    hints: [
      hint(say('ex.p1.even.which.hint1', {}, gender)),
      hint(say(even ? 'ex.p1.even.which.hint2' : 'ex.p1.odd.which.hint2', {}, gender)),
      exampleHint(String(ex), solution(ex)),
    ],
    solution: solution(f.answer),
  });
}

/* ---------- Level 9: what is the rule? ---------- */

const RULES = [1, 2, 5, 10] as const;
type RuleFact = { start: number; step: (typeof RULES)[number] };

const RULE_STARTS: Record<(typeof RULES)[number], number[]> = {
  1: [4, 18, 37, 59, 86],
  2: [2, 11, 24, 45, 70],
  5: [5, 20, 35, 55, 75],
  10: [10, 6, 23, 41, 52],
};

function rule({ start, step }: RuleFact, _rng: Rng, gender: Gender): Exercise {
  const terms = range(0, 3).map((i) => start + i * step);
  const [a, b] = terms as [number, number];
  const spoken = seqSaid('ex.p1.rule.spoken', terms, null, gender);
  return exercise({
    factId: `rule:${start}:${step}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.p1.rule.prompt'),
    display: terms.join(', '),
    spoken,
    answer: RULES.indexOf(step),
    input: labelledChoices(RULES.map((r) => `+${r}`)),
    hints: [
      hint(say('ex.p1.rule.hint1', {}, gender)),
      // The small hops from one number to the next: counting them is the rule.
      hint(say('ex.p1.rule.hint2', { a, b }, gender), {
        visual: { type: 'numberLine', from: a, to: b, start: a, hops: b - a },
      }),
      // Hops of three: not one of the buttons, so it never gives the answer away.
      exampleHint('3, 6, 9, 12', say('ex.p1.rule.example', {}, gender)),
    ],
    solution: say('ex.p1.rule.solution', { step }, gender),
  });
}

/* ---------- Level 10: a missing number, any rule ---------- */

const MIXED: { step: number; dir: 1 | -1; starts: number[] }[] = [
  { step: 1, dir: 1, starts: [28, 55, 87] },
  { step: 1, dir: -1, starts: [41, 73, 16] },
  { step: 2, dir: 1, starts: [9, 34, 62] },
  { step: 2, dir: -1, starts: [50, 27, 95] },
  { step: 5, dir: 1, starts: [10, 35, 65] },
  { step: 5, dir: -1, starts: [100, 45, 70] },
  { step: 10, dir: 1, starts: [2, 15, 54] },
  { step: 10, dir: -1, starts: [99, 63, 48] },
];

function mixedFacts(): SeqFact[] {
  return MIXED.flatMap(({ step, dir, starts }, k) =>
    starts.map((start, j) => ({ start, step, dir, gap: 1 + ((j + k) % 3) })),
  );
}

export const patterns1 = defineTopic({
  id: ID,
  labelKey: 'topic.patterns1',
  grades: [1],
  startLevel: () => 1,
  levels: [
    closed(L(1), twoFacts, twoPattern),
    closed(L(2), growFacts, grow),
    closed(L(3), seqFacts(forwardStarts, 1, 1, twoGaps), sequence(3, 'numpad')),
    closed(L(4), seqFacts(backStarts, 1, -1, twoGaps), sequence(4, 'numpad')),
    closed(
      L(5),
      seqFacts([2, 7, 14, 21, 36, 43, 58, 65, 80, 89], 2, 1, twoGaps),
      sequence(5, 'choices'),
    ),
    closed(
      L(6),
      seqFacts(range(0, 75, 5), 5, 1, (i) => [1 + (i % 4), 1 + ((i + 2) % 4)]),
      sequence(6, 'choices'),
    ),
    closed(
      L(7),
      () => {
        const starts = [3, 10, 17, 22, 30, 41, 46, 55, 58, 60];
        // Forward from each start, and back down from where that one ends.
        return starts.flatMap((s, i): SeqFact[] => [
          { start: s, step: 10, dir: 1, gap: 1 + (i % 4) },
          { start: s + 40, step: 10, dir: -1, gap: 1 + ((i + 2) % 4) },
        ]);
      },
      sequence(7, 'choices'),
    ),
    closed(L(8), evenFacts, evenOdd),
    closed(
      L(9),
      () => RULES.flatMap((step) => RULE_STARTS[step].map((start) => ({ start, step }))),
      rule,
    ),
    closed(L(10), mixedFacts, sequence(10, 'numpad')),
  ],
});
