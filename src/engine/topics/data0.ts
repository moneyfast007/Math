import { t, type TranslationKey } from '@/i18n';
import type { Noun } from '@/lang/hebrewNumbers';
import {
  closed,
  defineTopic,
  exercise,
  hint,
  pictureExample,
  range,
  say,
  spreadChoices,
  type AdviceSpec,
} from '../build';
import type { Exercise, Rng, Visual } from '../types';
import { THEMES, themeTitle, type Theme } from './dataKit';
import { pictureQuestion, type PictureOption } from './ganKit';

/**
 * World 10, gan hova: "גרפים וספירה". A picture graph of what the children
 * chose (one picture for each child): how many, the most and the least, which
 * of two, all together, how many more; tally marks; and the week's weather in a
 * picture graph of days. Small numbers, closed lists, everything said.
 */

const ID = 'data-0';
const L = (n: number) => `level.data0.${n}`;
const K = (k: string) => `ex.d0.${k}` as TranslationKey;
const A = (k: string) => `adv.d0.${k}` as TranslationKey;

const KID: Noun = { singular: 'ילד', plural: 'ילדים', gender: 'm' };
const LINE: Noun = { singular: 'קו', plural: 'קווים', gender: 'm' };
const DAY: Noun = { singular: 'יום', plural: 'ימים', gender: 'm' };

const icon = (emoji: string): Visual => ({
  type: 'scene',
  w: 20,
  h: 20,
  icon: true,
  items: [{ emoji, x: 10, y: 10, size: 16 }],
});

const numbers = (rng: Rng, answer: number, min: number, max: number) => ({
  type: 'choices' as const,
  choices: spreadChoices(rng, answer, { deltas: [1, 2], min, max }),
});

const offByOne = (answer: number) => (v: number) =>
  Math.abs(v - answer) === 1 ? 'offByOne' : null;

/* ---------- The surveys ---------- */

/** What the children chose: a theme, three of its answers, how many chose each (all different). */
interface Survey {
  theme: Theme;
  items: [number, number, number];
  vals: [number, number, number];
}

const S = (key: Theme['key'], items: [number, number, number], vals: [number, number, number]) => ({
  theme: THEMES.find((x) => x.key === key) as Theme,
  items,
  vals,
});

const SURVEYS: Survey[] = [
  S('fruit', [0, 1, 2], [3, 5, 1]),
  S('fruit', [3, 0, 4], [4, 2, 5]),
  S('pet', [0, 1, 2], [5, 3, 2]),
  S('pet', [3, 0, 4], [1, 4, 3]),
  S('color', [0, 1, 3], [2, 4, 5]),
  S('color', [2, 4, 1], [3, 1, 5]),
  S('sport', [0, 2, 3], [4, 2, 5]),
  S('fruit', [1, 2, 3], [2, 4, 3]),
];

const label = (s: Survey, i: number) => s.theme.items[s.items[i] as number] as string;
const emojiOf = (s: Survey, i: number) => s.theme.icons[s.items[i] as number] as string;

function graph(s: Survey): Visual {
  return {
    type: 'bars',
    bars: s.items.map((_, i) => ({
      label: label(s, i),
      value: s.vals[i] as number,
      icon: emojiOf(s, i),
    })),
    title: themeTitle(s.theme),
  };
}

const itemOption = (s: Survey, i: number): PictureOption => ({
  label: label(s, i),
  visual: icon(emojiOf(s, i)),
});

const total = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);

/* ---------- 1: how many chose …? ---------- */

type ReadFact = { s: number; i: number };

const readFacts = (): ReadFact[] => SURVEYS.flatMap((_, s) => [0, 1, 2].map((i) => ({ s, i })));

const readSaid = (n: number, item: string) =>
  n === 1
    ? say(K('read.solution1'), { item })
    : say(K('read.solution'), { n: { n, noun: KID }, item });

function read(level: number, f: ReadFact, rng: Rng): Exercise {
  const s = SURVEYS[f.s] as Survey;
  const n = s.vals[f.i] as number;
  const item = label(s, f.i);
  const ex = SURVEYS[(f.s + 3) % SURVEYS.length] as Survey;
  const exI = ex.vals.findIndex((v) => v !== n);
  return exercise({
    factId: `read:${f.s}:${f.i}`,
    topicId: ID,
    level,
    prompt: t(K('read.prompt'), { params: { item } }),
    display: '',
    spoken: say(K('read.prompt'), { item }),
    visual: graph(s),
    answer: n,
    input: numbers(rng, n, 0, 8),
    hints: [
      hint(say(K('read.hint1'), { item })),
      hint(say(K('read.hint2'))),
      pictureExample(readSaid(ex.vals[exI] as number, label(ex, exI)), graph(ex)),
    ],
    solution: readSaid(n, item),
    diagnose: offByOne(n),
  });
}

/* ---------- 2, 3: the most and the least ---------- */

type ExtremeFact = { s: number; ask: 'most' | 'least' };

function extreme(level: number, f: ExtremeFact, rng: Rng): Exercise {
  const s = SURVEYS[f.s] as Survey;
  const pickIdx = (x: Survey) => {
    const target = f.ask === 'most' ? Math.max(...x.vals) : Math.min(...x.vals);
    return x.vals.indexOf(target);
  };
  const win = pickIdx(s);
  const others = [0, 1, 2].filter((i) => i !== win);
  const ex = SURVEYS[(f.s + 2) % SURVEYS.length] as Survey;
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `${f.ask}:${f.s}`,
      spoken: say(K(`${f.ask}.prompt`)),
      visual: graph(s),
      options: [itemOption(s, win), ...others.map((i) => itemOption(s, i))] as [
        PictureOption,
        ...PictureOption[],
      ],
      hints: [
        hint(say(K(`${f.ask}.hint1`))),
        hint(say(K('extreme.hint2'))),
        pictureExample(say(K(`${f.ask}.solution`), { item: label(ex, pickIdx(ex)) }), graph(ex)),
      ],
      solution: say(K(`${f.ask}.solution`), { item: label(s, win) }),
      advice: others.map((_, k) => ({ option: k + 1, say: say(A('extreme')) })),
    },
    rng,
  );
}

/* ---------- 4: which of two? ---------- */

type PairFact = { s: number; a: number; b: number };

const pairFacts = (): PairFact[] =>
  SURVEYS.flatMap((_, s) =>
    [
      [0, 1],
      [1, 2],
      [2, 0],
    ].map(([a, b]) => ({ s, a: a as number, b: b as number })),
  );

function more(level: number, f: PairFact, rng: Rng): Exercise {
  const s = SURVEYS[f.s] as Survey;
  const aWins = (s.vals[f.a] as number) > (s.vals[f.b] as number);
  const [w, l] = aWins ? [f.a, f.b] : [f.b, f.a];
  const ex = SURVEYS[(f.s + 5) % SURVEYS.length] as Survey;
  const [ew, el] = (ex.vals[0] as number) > (ex.vals[1] as number) ? [0, 1] : [1, 0];
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `more:${f.s}:${f.a}${f.b}`,
      spoken: say(K('more.prompt'), { a: label(s, f.a), b: label(s, f.b) }),
      visual: graph(s),
      options: [itemOption(s, w), itemOption(s, l)],
      hints: [
        hint(say(K('more.hint1'))),
        hint(say(K('more.hint2'))),
        pictureExample(say(K('more.solution'), { w: label(ex, ew), l: label(ex, el) }), graph(ex)),
      ],
      solution: say(K('more.solution'), { w: label(s, w), l: label(s, l) }),
      advice: [{ option: 1, say: say(A('more')) }],
    },
    rng,
  );
}

/* ---------- 5: all together ---------- */

function together(level: number, si: number, rng: Rng): Exercise {
  const s = SURVEYS[si] as Survey;
  const n = total(s.vals);
  // The example: the next survey whose total is another.
  const exS =
    range(1, SURVEYS.length - 1)
      .map((k) => SURVEYS[(si + k) % SURVEYS.length] as Survey)
      .find((x) => total(x.vals) !== n) ?? s;
  const exN = total(exS.vals);
  return exercise({
    factId: `total:${si}`,
    topicId: ID,
    level,
    prompt: t(K('total.prompt')),
    display: '',
    spoken: say(K('total.prompt')),
    visual: graph(s),
    answer: n,
    input: numbers(rng, n, 1, 15),
    hints: [
      hint(say(K('total.hint1'))),
      hint(say(K('total.hint2'))),
      pictureExample(say(K('total.solution'), { n: { n: exN, noun: KID } }), graph(exS)),
    ],
    solution: say(K('total.solution'), { n: { n, noun: KID } }),
    diagnose: offByOne(n),
  });
}

/* ---------- 6: how many more? ---------- */

type DiffFact = { s: number; big: number; small: number };

/** Pairs whose smaller column has two or more (one child "בחרו" would not agree). */
const diffFacts = (): DiffFact[] =>
  SURVEYS.flatMap((x, s) =>
    [
      [0, 1],
      [1, 2],
      [2, 0],
    ].flatMap(([a, b]) => {
      const [big, small] =
        (x.vals[a as number] as number) > (x.vals[b as number] as number) ? [a, b] : [b, a];
      return (x.vals[small as number] as number) >= 2
        ? [{ s, big: big as number, small: small as number }]
        : [];
    }),
  );

function diff(level: number, f: DiffFact, rng: Rng): Exercise {
  const s = SURVEYS[f.s] as Survey;
  const x = s.vals[f.big] as number;
  const y = s.vals[f.small] as number;
  const d = x - y;
  const said = (sv: Survey, b: number, sm: number) => {
    const bx = sv.vals[b] as number;
    const sy = sv.vals[sm] as number;
    return say(K('diff.solution'), {
      x: { n: bx, noun: KID },
      a: label(sv, b),
      y: { n: sy, noun: KID },
      b: label(sv, sm),
      d: { n: bx - sy, noun: KID },
    });
  };
  const gap = (e: DiffFact) => {
    const sv = SURVEYS[e.s] as Survey;
    return (sv.vals[e.big] as number) - (sv.vals[e.small] as number);
  };
  const facts = diffFacts();
  const ex = facts.find((e) => e.s !== f.s && gap(e) !== d) ?? (facts[0] as DiffFact);
  return exercise({
    factId: `diff:${f.s}:${f.big}${f.small}`,
    topicId: ID,
    level,
    prompt: t(K('diff.prompt'), { params: { a: label(s, f.big), b: label(s, f.small) } }),
    display: '',
    spoken: say(K('diff.prompt'), { a: label(s, f.big), b: label(s, f.small) }),
    visual: graph(s),
    answer: d,
    input: numbers(rng, d, 1, 6),
    hints: [
      hint(say(K('diff.hint1'))),
      hint(say(K('diff.hint2'))),
      pictureExample(
        said(SURVEYS[ex.s] as Survey, ex.big, ex.small),
        graph(SURVEYS[ex.s] as Survey),
      ),
    ],
    solution: said(s, f.big, f.small),
    diagnose: offByOne(d),
    advice: [
      { value: x, say: say(K('diff.hint1')) },
      { value: y, say: say(K('diff.hint1')) },
    ],
  });
}

/* ---------- 7, 8: tally marks ---------- */

const tally = (n: number): Visual => ({ type: 'tally', rows: [{ count: n }] });

function tallyCount(level: number, n: number, rng: Rng): Exercise {
  const exN = n === 4 ? 6 : 4;
  return exercise({
    factId: `tally:${n}`,
    topicId: ID,
    level,
    prompt: t(K('tally.prompt')),
    display: '',
    spoken: say(K('tally.prompt')),
    visual: tally(n),
    answer: n,
    input: numbers(rng, n, 1, 10),
    hints: [
      hint(say(K('tally.hint1'))),
      hint(say(K('tally.hint2'))),
      pictureExample(say(K('tally.solution'), { n: { n: exN, noun: LINE } }), tally(exN)),
    ],
    solution: say(K('tally.solution'), { n: { n, noun: LINE } }),
    diagnose: offByOne(n),
    advice: [
      { value: n + 1, say: say(A('tally.twice')) },
      { value: n - 1, say: say(A('tally.skipped')) },
    ] satisfies AdviceSpec[],
  });
}

type MatchFact = { n: number; v: 0 | 1 };

function tallyMatch(level: number, f: MatchFact, rng: Rng): Exercise {
  const wrong = f.v === 0 ? [f.n + 1, f.n - 1] : [f.n + 2, f.n - 1];
  const valid = wrong.map((w) => (w < 1 ? f.n + 3 : w));
  const option = (k: number): PictureOption => ({ label: String(k), visual: tally(k) });
  const exN = f.n === 3 ? 5 : 3;
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `match:${f.n}:${f.v}`,
      spoken: say(K('match.prompt'), { n: { n: f.n, noun: LINE } }),
      options: [option(f.n), ...valid.map(option)] as [PictureOption, ...PictureOption[]],
      hints: [
        hint(say(K('match.hint1'))),
        hint(say(K('match.hint2'), { n: { n: f.n, noun: LINE } })),
        pictureExample(say(K('match.solution'), { n: { n: exN, noun: LINE } }), tally(exN)),
      ],
      solution: say(K('match.solution'), { n: { n: f.n, noun: LINE } }),
      advice: valid.map((_, i) => ({ option: i + 1, say: say(A('match')) })),
    },
    rng,
  );
}

/* ---------- 9, 10: the week's weather ---------- */

const WEATHER = [
  { key: 'sunny', emoji: '☀️' },
  { key: 'cloudy', emoji: '☁️' },
  { key: 'rainy', emoji: '🌧️' },
] as const;

/** Days of sun, clouds and rain in a week of seven (all different). */
const WEEKS: [number, number, number][] = [
  [4, 2, 1],
  [1, 2, 4],
  [2, 4, 1],
  [4, 1, 2],
  [1, 4, 2],
  [2, 1, 4],
];

const wWord = (i: number) => t(K(`weather.${WEATHER[i]?.key ?? 'sunny'}`));

function weatherGraph(week: [number, number, number]): Visual {
  return {
    type: 'bars',
    bars: WEATHER.map((w, i) => ({ label: wWord(i), value: week[i] as number, icon: w.emoji })),
    title: t(K('weather.title')),
  };
}

const weatherOption = (i: number): PictureOption => ({
  label: wWord(i),
  visual: icon(WEATHER[i]?.emoji ?? '☀️'),
});

type WeatherFact = { wk: number; i: number };

function weatherRead(level: number, f: WeatherFact, rng: Rng): Exercise {
  const week = WEEKS[f.wk] as [number, number, number];
  const n = week[f.i] as number;
  const exWk = (f.wk + 1) % WEEKS.length;
  const exI = (WEEKS[exWk] as number[]).findIndex((v) => v !== n);
  const exN = (WEEKS[exWk] as number[])[exI] as number;
  return exercise({
    factId: `weather:${f.wk}:${f.i}`,
    topicId: ID,
    level,
    prompt: t(K('weather.read.prompt'), { params: { w: wWord(f.i) } }),
    display: '',
    spoken: say(K('weather.read.prompt'), { w: wWord(f.i) }),
    visual: weatherGraph(week),
    answer: n,
    input: numbers(rng, n, 0, 7),
    hints: [
      hint(say(K('weather.read.hint1'), { w: wWord(f.i) })),
      hint(say(K('weather.read.hint2'))),
      pictureExample(
        say(K('weather.read.solution'), { w: wWord(exI), n: { n: exN, noun: DAY } }),
        weatherGraph(WEEKS[exWk] as [number, number, number]),
      ),
    ],
    solution: say(K('weather.read.solution'), { w: wWord(f.i), n: { n, noun: DAY } }),
    diagnose: offByOne(n),
  });
}

type WeatherMostFact = { wk: number; ask: 'most' | 'least' };

function weatherMost(level: number, f: WeatherMostFact, rng: Rng): Exercise {
  const week = WEEKS[f.wk] as [number, number, number];
  const target = f.ask === 'most' ? Math.max(...week) : Math.min(...week);
  const win = week.indexOf(target);
  const others = [0, 1, 2].filter((i) => i !== win);
  const exWk = (f.wk + 2) % WEEKS.length;
  const exWeek = WEEKS[exWk] as [number, number, number];
  const exTarget = f.ask === 'most' ? Math.max(...exWeek) : Math.min(...exWeek);
  const exWin = exWeek.indexOf(exTarget);
  const said = (i: number, n: number) =>
    f.ask === 'most'
      ? say(K('weather.most.solution'), { w: wWord(i) })
      : say(K('weather.least.solution'), { w: wWord(i), n: { n, noun: DAY } });
  return pictureQuestion(
    {
      topicId: ID,
      level,
      factId: `wmost:${f.wk}:${f.ask}`,
      spoken: say(K(`weather.${f.ask}.prompt`)),
      visual: weatherGraph(week),
      options: [weatherOption(win), ...others.map(weatherOption)] as [
        PictureOption,
        ...PictureOption[],
      ],
      hints: [
        hint(say(K(`${f.ask}.hint1`))),
        hint(say(K('extreme.hint2'))),
        pictureExample(said(exWin, exTarget), weatherGraph(exWeek)),
      ],
      solution: said(win, target),
      advice: others.map((_, k) => ({ option: k + 1, say: say(A('extreme')) })),
    },
    rng,
  );
}

export const data0 = defineTopic({
  id: ID,
  labelKey: 'topic.data0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closed(L(1), readFacts, (f, rng) => read(1, f, rng)),
    closed(
      L(2),
      () => SURVEYS.map((_, s) => ({ s, ask: 'most' as const })),
      (f, rng) => extreme(2, f, rng),
    ),
    closed(
      L(3),
      () => SURVEYS.map((_, s) => ({ s, ask: 'least' as const })),
      (f, rng) => extreme(3, f, rng),
    ),
    closed(L(4), pairFacts, (f, rng) => more(4, f, rng)),
    closed(
      L(5),
      () => SURVEYS.map((_, s) => s),
      (s, rng) => together(5, s, rng),
    ),
    closed(L(6), diffFacts, (f, rng) => diff(6, f, rng)),
    closed(
      L(7),
      () => range(1, 8),
      (n, rng) => tallyCount(7, n, rng),
    ),
    closed(
      L(8),
      (): MatchFact[] => range(2, 7).flatMap((n) => ([0, 1] as const).map((v) => ({ n, v }))),
      (f, rng) => tallyMatch(8, f, rng),
    ),
    closed(
      L(9),
      (): WeatherFact[] => WEEKS.flatMap((_, wk) => [0, 1, 2].map((i) => ({ wk, i }))),
      (f, rng) => weatherRead(9, f, rng),
    ),
    closed(
      L(10),
      (): WeatherMostFact[] =>
        WEEKS.flatMap((_, wk) => (['most', 'least'] as const).map((ask) => ({ wk, ask }))),
      (f, rng) => weatherMost(10, f, rng),
    ),
  ],
});
