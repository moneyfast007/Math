import { t, type TranslationKey } from '@/i18n';
import { compose, shown, type Slot } from '@/lang/compose';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  range,
  say,
  spreadChoices,
  type AdviceSpec,
  type Character,
  type Said,
} from '../build';
import { NOUNS, type CountableNoun } from '../nouns';
import { shuffle } from '../rng';
import type { Exercise, Rng, Visual } from '../types';

/**
 * World 12, gan hova: "סיפורים חשבוניים". Short stories, read aloud, about a
 * child and her things: getting more (to five, to ten), giving some to a
 * friend, two children's things together, who has more and by how many, the
 * same stories with no picture (the picture is a hint), which exercise tells
 * the story, and a story in two steps. Every level is a closed list, so every
 * sentence is recorded whole; answers are three big number buttons (or three
 * exercises).
 */

const ID = 'story-0';
const L = (n: number) => `level.story0.${n}`;

/** The thing and the children of a fact come from the fact, so the bank knows every sentence. */
const nounFor = (seed: number): CountableNoun =>
  NOUNS[Math.abs(seed) % NOUNS.length] as CountableNoun;
const childFor = (seed: number): Character =>
  CHARACTERS[Math.abs(seed) % CHARACTERS.length] as Character;
/** The other child: of the other gender, so "לשניהם" is right. */
const otherFor = (who: Character, seed: number): Character => {
  const others = CHARACTERS.filter((c) => c.gender !== who.gender);
  return others[Math.abs(seed) % others.length] as Character;
};

function story(key: string, who: Character, slots: Record<string, Slot>): Said {
  return compose(t(key as TranslationKey, { gender: who.gender }), { name: who.name, ...slots });
}

function near(rng: Rng, answer: number, max: number): number[] {
  return spreadChoices(rng, answer, { deltas: [1, 2], min: 0, max });
}

const offByOne = (answer: number) => (v: number) =>
  Math.abs(v - answer) === 1 ? 'offByOne' : null;

const objects = (noun: CountableNoun, groups: number[], removed?: number): Visual => ({
  type: 'objects',
  kind: noun,
  groups,
  ...(removed ? { removed } : {}),
});

/** A worked example with other numbers: "2 + 3 = 5" (never this exercise's answer at the end). */
function example(op: '+' | '-', a: number, b: number, answer: number): { a: number; b: number } {
  const options =
    op === '+'
      ? [
          { a: 2, b: 3 },
          { a: 4, b: 2 },
          { a: 3, b: 1 },
          { a: 5, b: 3 },
        ]
      : [
          { a: 5, b: 2 },
          { a: 6, b: 2 },
          { a: 7, b: 5 },
          { a: 8, b: 3 },
        ];
  const result = (x: { a: number; b: number }) => (op === '+' ? x.a + x.b : x.a - x.b);
  return (
    options.find((x) => result(x) !== answer && !(x.a === a && x.b === b)) ??
    (options[0] as { a: number; b: number })
  );
}

function exampleOf(op: '+' | '-', a: number, b: number, answer: number) {
  const ex = example(op, a, b, answer);
  const r = op === '+' ? ex.a + ex.b : ex.a - ex.b;
  return exampleHint(
    `${ex.a} ${op === '+' ? '+' : '−'} ${ex.b} = ${r}`,
    say(op === '+' ? 'ex.s0.add.solution' : 'ex.s0.sub.solution', { a: ex.a, b: ex.b, c: r }),
  );
}

/* ---------- 1–4, 7, 8: getting more, giving some ---------- */

type Pair = { a: number; b: number };
type Kind = 'get' | 'give';

function simple(level: number, kind: Kind, { a, b }: Pair, rng: Rng, picture: boolean): Exercise {
  const seed = a * 11 + b * 3 + level;
  const noun = nounFor(seed);
  const who = childFor(seed);
  const add = kind === 'get';
  const c = add ? a + b : a - b;
  const spoken = story(`ex.s0.${kind}.story`, who, {
    a: { n: a, noun },
    b: { n: b, gender: noun.gender },
    plural: noun.plural,
  });
  const visual = add ? objects(noun, [a, b]) : objects(noun, [a], b);
  const advice: AdviceSpec[] = [
    ...(a !== c ? [{ value: a, say: say('adv.s0.first') }] : []),
    ...(add
      ? [{ value: a - b, say: say('adv.s0.get.less') }]
      : [{ value: a + b, say: say('adv.s0.give.more') }]),
  ].filter((x) => x.value >= 0 && x.value !== c);
  return exercise({
    factId: `${kind}${picture ? '' : ':words'}:${a},${b}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    ...(picture ? { visual } : {}),
    answer: c,
    operation: add ? 'add' : 'sub',
    input: { type: 'choices', choices: near(rng, c, 12) },
    hints: [
      hint(say(`ex.s0.${kind}.hint1` as TranslationKey)),
      picture
        ? hint(say(add ? 'ex.s0.line.add' : 'ex.s0.line.sub', { a, b }), {
            visual: { type: 'numberLine', from: 0, to: 10, start: a, hops: add ? b : -b },
          })
        : hint(say('ex.s0.picture.hint2'), { visual }),
      exampleOf(add ? '+' : '-', a, b, c),
    ],
    solution: say(add ? 'ex.s0.add.solution' : 'ex.s0.sub.solution', { a, b, c }),
    diagnose: offByOne(c),
    advice,
  });
}

/* ---------- 5, 6: two children ---------- */

function twoChildren(level: number, kind: 'both' | 'more', { a, b }: Pair, rng: Rng): Exercise {
  const seed = a * 7 + b * 5 + level;
  const noun = nounFor(seed);
  const who = childFor(seed);
  const other = otherFor(who, seed);
  const both = kind === 'both';
  const c = both ? a + b : a - b;
  const spoken = story(`ex.s0.${kind}.story`, who, {
    other: other.name,
    a: { n: a, noun },
    b: { n: b, noun },
    plural: noun.plural,
  });
  return exercise({
    factId: `${kind}:${a},${b}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    visual: { type: 'objects', kind: noun, groups: [a, b], ...(both ? {} : { arranged: true }) },
    answer: c,
    operation: both ? 'add' : 'sub',
    input: { type: 'choices', choices: near(rng, c, 12) },
    hints: [
      hint(say(`ex.s0.${kind}.hint1` as TranslationKey)),
      hint(both ? say('ex.s0.line.add', { a, b }) : say('hint.numberLineGap'), {
        visual: both
          ? { type: 'numberLine', from: 0, to: 10, start: a, hops: b }
          : { type: 'numberLine', from: 0, to: 10, start: b, hops: 0, target: a },
      }),
      exampleOf(both ? '+' : '-', a, b, c),
    ],
    solution: say(both ? 'ex.s0.add.solution' : 'ex.s0.sub.solution', { a, b, c }),
    diagnose: offByOne(c),
    advice: [
      ...(both ? [] : [{ value: a + b, say: say('ex.s0.more.hint1') }]),
      { value: a, say: say('adv.s0.first') },
    ].filter((x) => x.value !== c),
  });
}

/* ---------- 9: which exercise tells the story ---------- */

type Which = { kind: Kind; a: number; b: number };

function which(level: number, { kind, a, b }: Which, rng: Rng): Exercise {
  const seed = a * 13 + b + (kind === 'get' ? 0 : 50);
  const noun = nounFor(seed);
  const who = childFor(seed);
  const spoken = story(`ex.s0.${kind}.story`, who, {
    a: { n: a, noun },
    b: { n: b, gender: noun.gender },
    plural: noun.plural,
  });
  // No spaces: an exercise on a button is one word, so it stays on one line at a size that fits.
  const sp = '';
  const plus = `${a}${sp}+${sp}${b}`;
  const minus = `${a}${sp}−${sp}${b}`;
  const swapped = kind === 'get' ? `${b}${sp}−${sp}${a}` : `${b}${sp}+${sp}${a}`;
  const right = kind === 'get' ? plus : minus;
  const wrong = kind === 'get' ? minus : plus;
  const labels = shuffle(rng, [right, wrong, swapped]);
  const op = (k: 'plus' | 'minus') => t(k === 'plus' ? 'ex.s0.op.plus' : 'ex.s0.op.minus');
  const written = `${shown(spoken)} ${t('ex.s0.which.prompt')}`;
  return exercise({
    factId: `which:${kind}:${a},${b}`,
    topicId: ID,
    level,
    prompt: written,
    display: '',
    spoken: {
      text: `${spoken.text} ${t('ex.s0.which.prompt')}`,
      parts: [...spoken.parts, t('ex.s0.which.prompt')],
    },
    answer: labels.indexOf(right),
    input: labelledChoices(labels),
    hints: [
      hint(say('ex.s0.which.hint1')),
      hint(say('ex.s0.picture.hint2'), {
        visual: kind === 'get' ? objects(noun, [a, b]) : objects(noun, [a], b),
      }),
      exampleHint('2 + 3', say('ex.s0.which.solution', { a: 2, op: op('plus'), b: 3 })),
    ],
    solution: say('ex.s0.which.solution', {
      a,
      op: op(kind === 'get' ? 'plus' : 'minus'),
      b,
    }),
    advice: [
      {
        value: labels.indexOf(wrong),
        say: say('adv.s0.which', { op: op(kind === 'get' ? 'minus' : 'plus') }),
      },
    ],
  });
}

/* ---------- 10: two steps ---------- */

type Two = { a: number; b: number; c: number };

function twoSteps(level: number, { a, b, c }: Two, rng: Rng): Exercise {
  const seed = a * 17 + b * 7 + c;
  const noun = nounFor(seed);
  const who = childFor(seed);
  const s = a + b;
  const d = s - c;
  const spoken = story('ex.s0.two.story', who, {
    a: { n: a, noun },
    b: { n: b, gender: noun.gender },
    c: { n: c, gender: noun.gender },
    plural: noun.plural,
  });
  return exercise({
    factId: `two:${a},${b},${c}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer: d,
    input: { type: 'choices', choices: near(rng, d, 12) },
    hints: [
      hint(say('ex.s0.two.hint1')),
      hint(say('ex.s0.picture.hint2'), { visual: objects(noun, [s], c) }),
      d === 4
        ? exampleHint('4 + 3 − 2 = 5', say('ex.s0.two.solution', { a: 4, b: 3, s: 7, c: 2, d: 5 }))
        : exampleHint('3 + 2 − 1 = 4', say('ex.s0.two.solution', { a: 3, b: 2, s: 5, c: 1, d: 4 })),
    ],
    solution: say('ex.s0.two.solution', { a, b, s, c, d }),
    diagnose: offByOne(d),
    advice: [
      { value: s, say: say('ex.s0.two.hint1') },
      { value: a, say: say('adv.s0.first') },
    ].filter((x) => x.value !== d),
  });
}

/* ---------- The world ---------- */

const adds = (max: number, min = 2): Pair[] =>
  range(min, max - 1).flatMap((a) => range(1, max - a).map((b) => ({ a, b })));
const subs = (max: number, min = 2): Pair[] =>
  range(min, max).flatMap((a) => range(1, a - 1).map((b) => ({ a, b })));

export const story0 = defineTopic({
  id: ID,
  labelKey: 'topic.story0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => adds(5),
      (f, rng) => simple(1, 'get', f, rng, true),
    ),
    closed(
      L(2),
      () => adds(10).filter((p) => p.a + p.b > 5),
      (f, rng) => simple(2, 'get', f, rng, true),
    ),
    closed(
      L(3),
      () => subs(5),
      (f, rng) => simple(3, 'give', f, rng, true),
    ),
    closed(
      L(4),
      () => subs(10).filter((p) => p.a > 5),
      (f, rng) => simple(4, 'give', f, rng, true),
    ),
    closed(
      L(5),
      () => adds(10, 1),
      (f, rng) => twoChildren(5, 'both', f, rng),
    ),
    closed(
      L(6),
      () => subs(10).filter((p) => p.a - p.b >= 1 && p.b >= 1),
      (f, rng) => twoChildren(6, 'more', { a: f.a, b: f.a - f.b }, rng),
    ),
    closed(
      L(7),
      () => adds(10),
      (f, rng) => simple(7, 'get', f, rng, false),
    ),
    closed(
      L(8),
      () => subs(10),
      (f, rng) => simple(8, 'give', f, rng, false),
    ),
    closed(
      L(9),
      () => [
        ...adds(8)
          .filter((p) => p.a !== p.b)
          .map((p): Which => ({ kind: 'get', ...p })),
        ...subs(8)
          .filter((p) => p.a !== 2 * p.b)
          .map((p): Which => ({ kind: 'give', ...p })),
      ],
      (f, rng) => which(9, f, rng),
    ),
    closed(
      L(10),
      () =>
        range(2, 6).flatMap((a) =>
          range(1, 4).flatMap((b) =>
            range(1, a + b - 1)
              .filter((c) => a + b <= 10 && c <= 4 && c !== b)
              .map((c): Two => ({ a, b, c })),
          ),
        ),
      (f, rng) => twoSteps(10, f, rng),
    ),
  ],
});
