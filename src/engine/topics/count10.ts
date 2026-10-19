import { t, type TranslationKey } from '@/i18n';
import { countNoun, numberToWords } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  pictureChoices,
  pictureExample,
  range,
  say,
  sayText,
  spreadChoices,
  type AdviceSpec,
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

/**
 * Three buttons near the answer, within the level's numbers. Not ten away, as
 * elsewhere: 0 next to 9 and 10 is no real choice for numbers up to ten.
 */
function near(rng: Rng, answer: number, min: number, max: number): number[] {
  return spreadChoices(rng, answer, { deltas: [1, 2], min, max });
}

/** One too many or too few: counted something twice, or skipped one. */
const offByOne = (answer: number) => (v: number) =>
  Math.abs(v - answer) === 1 ? 'offByOne' : null;

/** Counted one twice (one too many) or skipped one (one too few). */
const countAdvice = (n: number): AdviceSpec[] => [
  { value: n + 1, say: say('adv.count.twice') },
  ...(n > 1 ? [{ value: n - 1, say: say('adv.count.skipped') }] : []),
];

/**
 * A fact and a variant: the same numbers shown with other objects. Levels with
 * only four or five numbers would otherwise repeat within a round of six.
 */
type Variant = { n: number; v: number };
const variants = (ns: number[], count: number): Variant[] =>
  ns.flatMap((n) => range(0, count - 1).map((v) => ({ n, v })));
const variantId = (v: number) => (v === 0 ? '' : `:${v}`);

/** Counting: "how many X?" */
function count(level: number, { n, v }: Variant, rng: Rng): Exercise {
  const noun = nounFor(n + level + v * 3);
  const prompt = t('ex.count.prompt', { params: { plural: noun.plural } });
  const solved: Said = { text: `${countNoun(n, noun)}.`, parts: [`${countNoun(n, noun)}.`] };
  const k2 = n === 3 ? 4 : 3;
  const star = NOUNS.find((x) => x.id === 'star') as CountableNoun;
  const sequence = range(1, k2)
    .map((i) => numberToWords(i))
    .join(', ');
  const h3 = sayText(t('hint.count.3', { params: { phrase: countNoun(k2, star), sequence } }));
  return exercise({
    factId: `count:${n}${variantId(v)}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: { text: prompt, parts: [prompt] },
    visual: { type: 'objects', kind: noun, groups: [n] },
    answer: n,
    input: { type: 'choices', choices: near(rng, n, 1, 10) },
    hints: [
      hint(say('hint.count.1')),
      // "Rows of five" means nothing for one or two pictures.
      n <= 2
        ? hint(say('hint.count.2few'))
        : hint(say('hint.count.2'), {
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
    diagnose: offByOne(n),
    advice: countAdvice(n),
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
    // The other group: for "fewer", most often the bigger one (more and fewer mixed up).
    advice: [
      {
        value: 1 - winner,
        say: say(k(fewer ? 'adv.fewer.check' : 'adv.more.check'), {
          a: { n: p.a, noun: x },
          b: { n: p.b, noun: y },
        }),
      },
    ],
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
    input: { type: 'choices', choices: near(rng, answer, 0, 10) },
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
    diagnose: offByOne(answer),
    // The number shown, as if nothing was added or taken; or one counted twice.
    advice: [
      {
        value: n,
        say: say(k(`adv.${more1 ? 'oneMore' : 'oneLess'}.same`), { a: { n, noun } }, noun.gender),
      },
      {
        value: more1 ? n + 2 : n - 2,
        say: say(k(more1 ? 'adv.oneMore.over' : 'adv.oneLess.under'), {}, noun.gender),
      },
    ].filter((a) => a.value >= 0 && a.value <= 10),
  });
}

/** Making five or ten: how many are missing from the frame? */
function complete(level: number, { n, v }: Variant, rng: Rng, target: 5 | 10): Exercise {
  const noun = nounFor(n + target + v * 3);
  const answer = target - n;
  const prompt = t('ex.makeN.prompt', {
    params: { target, plural: noun.plural },
    gender: noun.gender,
  });
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
    factId: `make${target}:${n}${variantId(v)}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken,
    // A five- or ten-frame: what is missing are the empty cells, to be seen, not counted on in the head.
    visual: { type: 'objects', kind: noun, groups: [n], frame: target },
    answer,
    operation: 'sub',
    input: { type: 'choices', choices: near(rng, answer, 0, target) },
    hints: [
      hint(say('ex.makeN.hint1frame', { target })),
      hint(say('hint.numberLineGap'), {
        visual: { type: 'numberLine', from: 0, to: target, start: n, hops: 0, target },
      }),
      // Written as the split of the target, so it ends with the part, not with the target.
      exampleHint(`${target} = ${exN} + ${target - exN}`, exSolved),
    ],
    solution: solved,
    diagnose: offByOne(answer),
    // Counted what is there instead of what is missing; or one empty cell too many or too few.
    advice: [
      { value: n, say: say('adv.makeN.counted', { a: { n, noun }, target }) },
      ...[answer - 1, answer + 1]
        .filter((v) => v >= 0)
        .map((v) => ({
          value: v,
          say: say('adv.makeN.near', { a: n, v, s: n + v, target }),
          kind: 'offByOne' as const,
        })),
    ],
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
    input: { type: 'choices', choices: near(rng, answer, 0, 10) },
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
      // On the number line, not as "5 → 4": a hop backwards shows what "before" means.
      pictureExample(exSolved, {
        type: 'numberLine',
        from: 0,
        to: 10,
        start: exN,
        hops: after ? 1 : -1,
      }),
    ],
    solution: solved,
    diagnose: offByOne(answer),
    // The other way (before for after), the number itself, or one number skipped.
    advice: [
      {
        value: after ? n - 1 : n + 1,
        say: say(k(after ? 'adv.after.before' : 'adv.before.after'), {
          v: after ? n - 1 : n + 1,
          n,
        }),
      },
      { value: n, say: say(k(`adv.${after ? 'after' : 'before'}.self`), { n }) },
      {
        value: after ? n + 2 : n - 2,
        say: say(k(`adv.${after ? 'after' : 'before'}.skip`), { n }),
      },
    ].filter((a) => a.value >= 0 && a.value <= 10),
  });
}

/** Which number is bigger: two numerals. */
function bigger(level: number, p: Pair): Exercise {
  const noun = nounFor(p.a + p.b);
  const prompt = t('ex.bigger.prompt');
  const spoken = say('ex.bigger.spoken', { a: p.a, b: p.b });
  const answer = p.a > p.b ? 0 : 1;
  const solved = say('ex.bigger.solution', { w: Math.max(p.a, p.b), l: Math.min(p.a, p.b) });
  // An example with neither of this exercise's numbers (6 and 2 would answer "6 or 2?").
  const [w, l] = (
    [
      [6, 2],
      [7, 3],
      [8, 4],
    ] as const
  ).find((x) => !x.some((y) => y === p.a || y === p.b)) ?? [9, 5];
  const exSolved = say('ex.bigger.solution', { w, l });
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
      // Two groups with their numbers, not "6 > 2": the sign comes later than gan.
      pictureExample(
        exSolved,
        { type: 'objects', kind: noun, groups: [w, l], arranged: true },
        `${w}     ${l}`,
      ),
    ],
    solution: solved,
    advice: [{ value: 1 - answer, say: say('adv.bigger.check', { a: p.a, b: p.b }) }],
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
      // Five numbers, each with two kinds of objects: a round of six never repeats one.
      () => variants(range(1, 5), 2),
      (f, rng) => count(1, f, rng),
    ),
    closed(
      L(2),
      () => variants(range(3, 10), 1),
      (f, rng) => count(2, f, rng),
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
      // From one: an empty plate ("there are zero cookies") is no way to say it in gan.
      () => variants(range(1, 4), 2),
      (f, rng) => complete(7, f, rng, 5),
    ),
    closed(
      L(8),
      () => variants(range(1, 9), 1),
      (f, rng) => complete(8, f, rng, 10),
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
      // Mostly close numbers (1 to 3 apart), where comparing takes thought; some far apart.
      () => pairs(10, (a, b) => a !== b && (Math.abs(a - b) <= 3 || (a + b) % 2 === 0)),
      (p) => bigger(10, p),
    ),
  ],
});
