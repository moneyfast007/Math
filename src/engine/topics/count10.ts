import { t, type TranslationKey } from '@/i18n';
import { countNoun, numberToWords } from '@/lang/hebrewNumbers';
import {
  choicesAround,
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  pictureChoices,
  range,
  say,
  sayText,
  type Said,
} from '../build';
import { NOUNS, type CountableNoun } from '../nouns';
import type { Exercise, Rng, Visual } from '../types';

/**
 * World 1, gan hova: "מספרים עד 10". Number sense before arithmetic, in the
 * order kindergartens teach it: counting, more/less, one more and one less,
 * making five and ten, the number after and before, which number is bigger.
 * Every level is a closed list; everything is pictures and three big buttons.
 */

const ID = 'count-10';
const L = (n: number) => `level.count10.${n}`;

type Pair = { a: number; b: number };

/**
 * The object of a closed-level exercise comes from the fact, not from chance,
 * so every sentence that can be said is in the audio bank (it enumerates the
 * facts). Different facts still show different objects.
 */
function nounFor(seed: number): CountableNoun {
  return NOUNS[Math.abs(seed) % NOUNS.length] as CountableNoun;
}

function nounPair(a: number, b: number): [CountableNoun, CountableNoun] {
  const first = nounFor(a * 3 + b);
  const rest = NOUNS.filter((n) => n.id !== first.id);
  return [first, rest[(a * 5 + b * 7) % rest.length] as CountableNoun];
}

function k(key: string): TranslationKey {
  return key as TranslationKey;
}

/** Counting: "how many X?" */
function count(level: number, n: number, rng: Rng): Exercise {
  const noun = nounFor(n + level);
  const prompt = t('ex.count.prompt', { params: { plural: noun.plural } });
  const solved: Said = { text: `${countNoun(n, noun)}.`, parts: [`${countNoun(n, noun)}.`] };
  const k2 = n === 3 ? 4 : 3;
  const star = NOUNS.find((x) => x.id === 'star') as CountableNoun;
  const sequence = range(1, k2)
    .map((i) => numberToWords(i))
    .join(', ');
  const h3 = sayText(t('hint.count.3', { params: { phrase: countNoun(k2, star), sequence } }));
  return exercise({
    factId: `count:${n}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: { text: prompt, parts: [prompt] },
    visual: { type: 'objects', kind: noun, groups: [n] },
    answer: n,
    input: { type: 'choices', choices: choicesAround(rng, n, 1, 10) },
    hints: [
      hint(say('hint.count.1')),
      hint(say('hint.count.2'), {
        visual: { type: 'objects', kind: noun, groups: [n], arranged: true },
      }),
      {
        text: h3.text,
        spoken: h3.text,
        spokenParts: h3.parts,
        example: { display: `${'⭐'.repeat(k2)} = ${k2}`, spoken: h3.text },
      },
    ],
    solution: solved,
  });
}

/** Which group has more: two nouns, answer is the noun with more. */
function more(level: number, p: Pair, fewer: boolean): Exercise {
  const [x, y] = nounPair(p.a, p.b);
  const key = fewer ? 'ex.fewer' : 'ex.more';
  const prompt = t(k(`${key}.prompt`), { params: { x: x.plural, y: y.plural } });
  const winner = (fewer ? p.a < p.b : p.a > p.b) ? 0 : 1;
  const both: Visual = { type: 'objects', kind: x, kinds: [x, y], groups: [p.a, p.b] };
  // The example uses two other things: with the question's own, it would always
  // name one of them as the bigger group, giving the answer away or contradicting it.
  const [ex1, ex2] = NOUNS.filter((n) => n.id !== x.id && n.id !== y.id) as [
    CountableNoun,
    CountableNoun,
  ];
  const example: Visual = {
    type: 'objects',
    kind: ex1,
    kinds: [ex1, ex2],
    groups: [4, 2],
    arranged: true,
  };
  const solved = say(k(`${key}.solution`), {
    a: { n: p.a, noun: x },
    b: { n: p.b, noun: y },
    w: winner === 0 ? x.plural : y.plural,
  });
  return exercise({
    factId: `${fewer ? 'fewer' : 'more'}:${p.a},${p.b}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: { text: prompt, parts: [prompt] },
    visual: both,
    answer: winner,
    // Pictures, not words: most gan children cannot read yet. The first one named is on the right.
    input: pictureChoices(
      [x.plural, y.plural],
      [
        { type: 'objects', kind: x, groups: [1] },
        { type: 'objects', kind: y, groups: [1] },
      ],
      true,
    ),
    hints: [
      hint(say(k(`${key}.hint1`))),
      hint(say('hint.objects.2'), { visual: { ...both, arranged: true } }),
      hint(say(k(`${key}.hint3`), { a: { n: 4, noun: ex1 }, b: { n: 2, noun: ex2 } }), {
        visual: example,
      }),
    ],
    solution: solved,
  });
}

/** One more / one less. */
function oneStep(level: number, n: number, rng: Rng, more1: boolean): Exercise {
  const noun = nounFor(n * 2 + (more1 ? 1 : 0));
  const key = more1 ? 'ex.oneMore' : 'ex.oneLess';
  const answer = more1 ? n + 1 : n - 1;
  const prompt = t(k(`${key}.prompt`), { params: { plural: noun.plural }, gender: noun.gender });
  const spoken = say(k(`${key}.spoken`), { a: { n, noun }, plural: noun.plural }, noun.gender);
  const visual: Visual = more1
    ? { type: 'objects', kind: noun, groups: [n, 1] }
    : { type: 'objects', kind: noun, groups: [n], removed: 1 };
  const solved = say(k(`${key}.solution`), { a: n, c: answer });
  // The example shares no number with the exercise.
  const exStep = (x: number) => (more1 ? x + 1 : x - 1);
  const ex = {
    n:
      (more1 ? [3, 5, 6, 2] : [4, 6, 7, 3]).find(
        (x) => ![n, answer].includes(x) && ![n, answer].includes(exStep(x)),
      ) ?? 3,
  };
  const exSolved = say(k(`${key}.solution`), { a: ex.n, c: more1 ? ex.n + 1 : ex.n - 1 });
  return exercise({
    factId: `${more1 ? 'oneMore' : 'oneLess'}:${n}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken,
    visual,
    answer,
    operation: more1 ? 'add' : 'sub',
    input: { type: 'choices', choices: choicesAround(rng, answer, 0, 10) },
    hints: [
      hint(say(k(`${key}.hint1`))),
      hint(say('hint.numberLine'), {
        visual: {
          type: 'numberLine',
          from: 0,
          to: 10,
          start: n,
          hops: more1 ? 1 : -1,
          hide: answer,
        },
      }),
      exampleHint(`${ex.n} ${more1 ? '+' : '−'} 1 = ${more1 ? ex.n + 1 : ex.n - 1}`, exSolved),
    ],
    solution: solved,
  });
}

/** Making five or ten: how many are missing from the frame? */
function complete(level: number, n: number, rng: Rng, target: 5 | 10): Exercise {
  const noun = nounFor(n + target);
  const answer = target - n;
  const prompt = t('ex.makeN.prompt', { params: { target, plural: noun.plural }, gender: noun.gender });
  const spoken = say(
    'ex.makeN.spoken',
    {
      a: { n, noun },
      target: { n: target, gender: noun.gender },
      plural: noun.plural,
    },
    noun.gender,
  );
  const solved = say('ex.makeN.solution', { a: n, b: answer, target });
  // Neither number of the example is this exercise's: 2 + 3 = 5 would answer 3 + ? = 5.
  const exN = [2, 1, 3, 4].find((x) => x !== n && x !== answer && x < target) ?? 1;
  const exSolved = say('ex.makeN.solution', { a: exN, b: target - exN, target });
  return exercise({
    factId: `make${target}:${n}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken,
    visual: { type: 'objects', kind: noun, groups: [n], arranged: true },
    answer,
    operation: 'sub',
    input: { type: 'choices', choices: choicesAround(rng, answer, 0, target) },
    hints: [
      hint(say('ex.makeN.hint1', { target })),
      hint(say('hint.numberLineGap'), {
        visual: { type: 'numberLine', from: 0, to: target, start: n, hops: 0, target },
      }),
      // Written as the split of the target, so it ends with the part, not with the target.
      exampleHint(`${target} = ${exN} + ${target - exN}`, exSolved),
    ],
    solution: solved,
  });
}

/** The number after / before. */
function neighbour(level: number, n: number, rng: Rng, after: boolean): Exercise {
  const answer = after ? n + 1 : n - 1;
  const key = after ? 'ex.after' : 'ex.before';
  const prompt = t(k(`${key}.prompt`), { params: { n } });
  const spoken = say(k(`${key}.spoken`), { n });
  const solved = say(k(`${key}.solution`), { n, c: answer });
  // The example shares no number with the exercise (6 → 7 would answer "after 5").
  const exN =
    [5, 7, 2, 8, 3].find(
      (x) => ![n, answer].includes(x) && ![n, answer].includes(after ? x + 1 : x - 1),
    ) ?? 5;
  const exSolved = say(k(`${key}.solution`), { n: exN, c: after ? exN + 1 : exN - 1 });
  return exercise({
    factId: `${after ? 'after' : 'before'}:${n}`,
    topicId: ID,
    level,
    prompt,
    display: String(n),
    spoken,
    answer,
    input: { type: 'choices', choices: choicesAround(rng, answer, 0, 10) },
    hints: [
      hint(say(k(`${key}.hint1`))),
      hint(say('hint.numberLine'), {
        visual: {
          type: 'numberLine',
          from: 0,
          to: 10,
          start: n,
          hops: after ? 1 : -1,
          hide: answer,
        },
      }),
      exampleHint(`${exN} → ${after ? exN + 1 : exN - 1}`, exSolved),
    ],
    solution: solved,
  });
}

/** Which number is bigger: two numerals. */
function bigger(level: number, p: Pair): Exercise {
  const noun = nounFor(p.a + p.b);
  const prompt = t('ex.bigger.prompt');
  const spoken = say('ex.bigger.spoken', { a: p.a, b: p.b });
  const answer = p.a > p.b ? 0 : 1;
  const solved = say('ex.bigger.solution', { w: Math.max(p.a, p.b), l: Math.min(p.a, p.b) });
  const exSolved = say('ex.bigger.solution', { w: 6, l: 2 });
  return exercise({
    factId: `bigger:${p.a},${p.b}`,
    topicId: ID,
    level,
    prompt,
    display: '', // the two numbers are the answer buttons
    spoken,
    answer,
    input: labelledChoices([String(p.a), String(p.b)]),
    hints: [
      hint(say('ex.bigger.hint1')),
      hint(say('ex.bigger.hint2'), {
        visual: { type: 'objects', kind: noun, groups: [p.a, p.b], arranged: true },
      }),
      exampleHint('6 > 2', exSolved),
    ],
    solution: solved,
  });
}

function pairs(max: number, keep: (a: number, b: number) => boolean): Pair[] {
  return range(1, max).flatMap((a) =>
    range(1, max)
      .filter((b) => keep(a, b))
      .map((b) => ({ a, b })),
  );
}

export const count10 = defineTopic({
  id: ID,
  labelKey: 'topic.count10',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(
      L(1),
      () => range(1, 5),
      (n, rng) => count(1, n, rng),
    ),
    closed(
      L(2),
      () => range(3, 10),
      (n, rng) => count(2, n, rng),
    ),
    closed(
      L(3),
      () => pairs(6, (a, b) => a !== b),
      (p) => more(3, p, false),
    ),
    closed(
      L(4),
      () => pairs(8, (a, b) => a !== b && Math.abs(a - b) <= 4),
      (p) => more(4, p, true),
    ),
    closed(
      L(5),
      () => range(1, 9),
      (n, rng) => oneStep(5, n, rng, true),
    ),
    closed(
      L(6),
      () => range(2, 10),
      (n, rng) => oneStep(6, n, rng, false),
    ),
    closed(
      L(7),
      () => range(0, 4),
      (n, rng) => complete(7, n, rng, 5),
    ),
    closed(
      L(8),
      () => range(1, 9),
      (n, rng) => complete(8, n, rng, 10),
    ),
    closed(
      L(9),
      () => [
        ...range(1, 9).map((n) => ({ n, after: true })),
        ...range(2, 10).map((n) => ({ n, after: false })),
      ],
      (f, rng) => neighbour(9, f.n, rng, f.after),
    ),
    closed(
      L(10),
      () => pairs(10, (a, b) => a !== b),
      (p) => bigger(10, p),
    ),
  ],
});
