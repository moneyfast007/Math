import { t, type TranslationKey } from '@/i18n';
import {
  displayFraction as f,
  displayMixed,
  fractionNoun,
  fractionWords as w,
} from '@/lang/fractions';
import { numberToWords } from '@/lang/hebrewNumbers';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exercise,
  labelledChoices,
  numpad,
  open,
  range,
  type Character,
  type Said,
} from '../build';
import type { Gender } from '@/lang/gender';
import { pick, randInt, shuffle } from '../rng';
import type { Exercise, Hint, Rng, Topic, Visual } from '../types';
import { bigNumbers } from './bigNumbers';
import { fractionOps } from './fractionOps';
import { longMulDiv } from './longMulDiv';
import { vertical4 } from './vertical';

/**
 * Grade 4's practice for the school's autumn test ("מיפוי"), two worlds beside
 * the journey (Topic.track): never in the way of the year's worlds, opened by
 * the child or the parent when the test comes. What the year worlds leave out
 * is built here. The numerator and the denominator, fractions and
 * mixed numbers on a picture, less than, equal to or more than one, fractions
 * and big numbers in words, sequences, word problems adding and taking away
 * fractions with the same parts.
 *
 * Silent (no recordings, no speaker): the texts are shown only, so they may
 * carry digits; what a screen reader reads is the shown text.
 */

/** The builders' own tag; every station retags its exercises with its world and level. */
const ID = 'map4';
const DENS = [2, 3, 4, 5, 6, 8, 10];

/** Shown text as the "spoken" one: a screen reader's label, never played. */
const said = (text: string): Said => ({ text, parts: [] });
const tx = (key: string, params?: Record<string, string | number>) =>
  t(key as TranslationKey, params ? { params } : undefined);
const note = (key: string, params?: Record<string, string | number>, visual?: Visual): Hint => {
  const text = tx(key, params);
  return { text, spoken: text, ...(visual ? { visual } : {}) };
};
/** Hint 3: a solved one like it. */
const solved = (display: string): Hint => {
  const text = tx('r4.example');
  return { text, spoken: `${text} ${display}`, example: { display, spoken: display } };
};

const bar = (n: number, d: number, shape: 'bar' | 'circle' = 'bar'): Visual => ({
  type: 'fraction',
  parts: d,
  shaded: n,
  ...(shape === 'circle' ? { shape } : {}),
});

/** 2 3/4 drawn: three bars of quarters, two full and three quarters of the last. */
const mixedPicture = (whole: number, rest: number, d: number): Visual => ({
  type: 'fraction',
  parts: d,
  shaded: whole * d + rest,
  wholes: whole + 1,
});

/** Labels for choices: the right one and up to `count - 1` wrong ones, shuffled. */
function choicesOf(rng: Rng, right: string, wrong: readonly string[], count = 3) {
  const others = wrong.filter((x, i) => x !== right && wrong.indexOf(x) === i).slice(0, count - 1);
  const labels = shuffle(rng, [right, ...others]);
  return { labels, answer: labels.indexOf(right) };
}

/* ---------- 1. The numerator and the denominator ---------- */

function numDen(n: number, d: number, ask: 'num' | 'den'): Exercise {
  const answer = ask === 'num' ? n : d;
  const display = ask === 'num' ? `?/${d}` : `${n}/?`;
  const ex = d === 4 && n === 3 ? { n: 2, d: 5 } : { n: 3, d: 4 };
  return exercise({
    factId: `r4nd:${ask}:${n}/${d}`,
    topicId: ID,
    level: 1,
    prompt: tx(`r4.${ask}.prompt`),
    display,
    spoken: said(`${tx(`r4.${ask}.prompt`)} ${display}`),
    visual: bar(n, d, (n + d) % 2 === 0 ? 'circle' : 'bar'),
    answer,
    input: numpad(2),
    hints: [
      note(`r4.${ask}.hint1`),
      note(`r4.${ask}.hint2`),
      solved(ask === 'num' ? `${f(ex.n, ex.d)} → ${ex.n}` : `${f(ex.n, ex.d)} → ${ex.d}`),
    ],
    solution: said(f(n, d)),
  });
}

/* ---------- 2. Which fraction is drawn ---------- */

function drawn(n: number, d: number, rng: Rng): Exercise {
  const right = f(n, d);
  // The usual slips: the white parts counted, the numbers swapped, coloured to white.
  const wrong = [f(d - n, d), f(d, n), d - n > 0 ? f(n, d - n) : f(n, d + 1), f(n, d + 1)];
  const { labels, answer } = choicesOf(rng, right, wrong);
  const ex = n === 1 && d === 3 ? { n: 2, d: 5 } : { n: 1, d: 3 };
  return exercise({
    factId: `r4pic:${n}/${d}`,
    topicId: ID,
    level: 2,
    prompt: tx('r4.pic.prompt'),
    display: '',
    spoken: said(tx('r4.pic.prompt')),
    visual: bar(n, d, n % 2 === 0 ? 'circle' : 'bar'),
    answer,
    input: labelledChoices(labels),
    hints: [
      note('r4.pic.hint1'),
      note('r4.pic.hint2', { n, d }),
      { ...solved(f(ex.n, ex.d)), visual: bar(ex.n, ex.d) },
    ],
    solution: said(right),
  });
}

/* ---------- 3. A mixed number drawn ---------- */

function mixedDrawn(whole: number, rest: number, d: number, rng: Rng): Exercise {
  const right = displayMixed(whole, rest, d);
  const wrong = [
    displayMixed(whole + 1, rest, d),
    displayMixed(whole, d - rest, d),
    displayMixed(whole, rest, d + 1),
    whole > 1 ? displayMixed(whole - 1, rest, d) : displayMixed(whole + 2, rest, d),
  ].filter((x) => x !== right);
  const { labels, answer } = choicesOf(rng, right, wrong);
  const ex = whole === 1 && rest === 1 && d === 2 ? { w: 2, r: 1, d: 3 } : { w: 1, r: 1, d: 2 };
  return exercise({
    factId: `r4mix:${whole} ${rest}/${d}`,
    topicId: ID,
    level: 3,
    prompt: tx('r4.mixed.prompt'),
    display: '',
    spoken: said(tx('r4.mixed.prompt')),
    visual: mixedPicture(whole, rest, d),
    answer,
    input: labelledChoices(labels),
    hints: [
      note('r4.mixed.hint1'),
      note('r4.mixed.hint2', { w: whole, r: rest, d }),
      {
        ...solved(displayMixed(ex.w, ex.r, ex.d)),
        visual: mixedPicture(ex.w, ex.r, ex.d),
      },
    ],
    solution: said(right),
  });
}

/* ---------- 4. Less than, equal to or more than one ---------- */

const ONE_LABELS = () => [tx('r4.one.less'), tx('r4.one.equal'), tx('r4.one.more')];

function toOne(n: number, d: number): Exercise {
  const answer = n < d ? 0 : n === d ? 1 : 2;
  const ex = answer === 0 ? { n: 5, d: 4 } : { n: 2, d: 3 };
  const exSide = ONE_LABELS()[ex.n < ex.d ? 0 : 2];
  return exercise({
    factId: `r4one:${n}/${d}`,
    topicId: ID,
    level: 4,
    prompt: tx('r4.one.prompt'),
    display: f(n, d),
    spoken: said(`${tx('r4.one.prompt')} ${f(n, d)}`),
    answer,
    // Read from the right: less, equal, more.
    input: labelledChoices(ONE_LABELS(), true),
    hints: [
      note('r4.one.hint1'),
      note('r4.one.hint2', {}, n <= d ? bar(n, d) : mixedPicture(Math.floor(n / d), n % d, d)),
      solved(`${f(ex.n, ex.d)} → ${exSide}`),
    ],
    solution: said(`${f(n, d)} ${ONE_LABELS()[answer]}`),
  });
}

/* ---------- 5–6. Fractions in words and in digits ---------- */

function toDigits(n: number, d: number, rng: Rng): Exercise {
  const right = f(n, d);
  const wrong = [f(d, n), f(n, d === 10 ? 8 : d + 1), f(n + 1 < d ? n + 1 : n - 1, d)].filter(
    (x) => !x.startsWith('0/'),
  );
  const { labels, answer } = choicesOf(rng, right, wrong);
  const words = w(n, d);
  const ex = n === 3 && d === 4 ? { n: 2, d: 5 } : { n: 3, d: 4 };
  return exercise({
    factId: `r4dig:${n}/${d}`,
    topicId: ID,
    level: 5,
    prompt: tx('r4.toDigits.prompt', { words }),
    display: '',
    spoken: said(tx('r4.toDigits.prompt', { words })),
    answer,
    input: labelledChoices(labels),
    hints: [
      note('r4.words.hint1'),
      note('r4.words.hint2'),
      solved(`${w(ex.n, ex.d)} → ${f(ex.n, ex.d)}`),
    ],
    solution: said(`${words} = ${right}`),
  });
}

function toWords(n: number, d: number, rng: Rng): Exercise {
  const right = w(n, d);
  // The closest other parts (a word that sounds alike), then another count of the same parts.
  const others = DENS.filter((x) => x !== d && x > n).sort(
    (x, y) => Math.abs(x - d) - Math.abs(y - d),
  );
  const counts = [n + 1, n - 1, n + 2].filter((x) => x >= 1 && x < d);
  const wrong = [
    ...others.slice(0, 1).map((x) => w(n, x)),
    ...counts.slice(0, 1).map((x) => w(x, d)),
    ...others.slice(1, 2).map((x) => w(n, x)),
    ...counts.slice(1).map((x) => w(x, d)),
  ];
  const { labels, answer } = choicesOf(rng, right, wrong);
  const ex = n === 2 && d === 3 ? { n: 3, d: 5 } : { n: 2, d: 3 };
  return exercise({
    factId: `r4wrd:${n}/${d}`,
    topicId: ID,
    level: 6,
    prompt: tx('r4.toWords.prompt'),
    display: f(n, d),
    spoken: said(`${tx('r4.toWords.prompt')} ${f(n, d)}`),
    answer,
    input: labelledChoices(labels, true),
    hints: [
      note('r4.words.hint1'),
      note('r4.words.hint2'),
      solved(`${f(ex.n, ex.d)} → ${w(ex.n, ex.d)}`),
    ],
    solution: said(`${f(n, d)} = ${right}`),
  });
}

/* ---------- 7. Big numbers in words ---------- */

const grouped = (n: number) => n.toLocaleString('en-US');

/** A number of four to six digits with a zero or two inside, like 30,405. */
function nameNumber(rng: Rng): number {
  const digits = pick(rng, [4, 5, 5, 6]);
  for (;;) {
    let n = randInt(rng, 1, 9);
    for (let i = 1; i < digits; i++) n = n * 10 + (rng() < 0.35 ? 0 : randInt(rng, 1, 9));
    if (String(n).slice(1).includes('0')) return n;
  }
}

/** The same digits read wrong: a zero moved, a place lost or added. */
function nearNames(n: number): number[] {
  const s = String(n);
  const out: number[] = [];
  // A zero swapped with its neighbour (3,045 ↔ 3,405).
  for (let i = 1; i < s.length - 1; i++) {
    if (s[i] === '0' && s[i + 1] !== '0') {
      const c = s.split('');
      [c[i], c[i + 1]] = [c[i + 1] as string, c[i] as string];
      out.push(Number(c.join('')));
    }
    if (s[i] !== '0' && s[i + 1] === '0') {
      const c = s.split('');
      [c[i], c[i + 1]] = [c[i + 1] as string, c[i] as string];
      out.push(Number(c.join('')));
    }
  }
  // A zero dropped, or one more (the thousands read as hundreds, or as tens of thousands).
  const zero = s.indexOf('0', 1);
  if (zero > 0) out.push(Number(s.slice(0, zero) + s.slice(zero + 1)));
  if (s.length < 6) out.push(Number(`${s.slice(0, 1)}0${s.slice(1)}`));
  return out.filter((x) => x !== n && x >= 1000 && x < 1_000_000);
}

function numberName(rng: Rng): Exercise {
  const n = nameNumber(rng);
  const right = numberToWords(n);
  const wrong = nearNames(n).map((x) => numberToWords(x));
  const { labels, answer } = choicesOf(rng, right, wrong);
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const ex = n === 20_305 ? 104_060 : 20_305;
  return exercise({
    factId: `r4name:${n}`,
    topicId: ID,
    level: 7,
    prompt: tx('r4.name.prompt'),
    display: grouped(n),
    spoken: said(`${tx('r4.name.prompt')} ${grouped(n)}`),
    answer,
    input: labelledChoices(labels, true),
    hints: [
      note('r4.name.hint1'),
      note('r4.name.hint2', {
        thousands: `${grouped(thousands)} ${tx('r4.name.thousandsWord')}`,
        rest: rest === 0 ? '0' : String(rest),
      }),
      solved(`${grouped(ex)} → ${numberToWords(ex)}`),
    ],
    solution: said(`${grouped(n)} = ${right}`),
  });
}

/* ---------- 8–9. Sequences ---------- */

const STEPS = [25, 50, 75, 100, 125, 150, 200, 250, 300, 500, 750, 1000, 1500, 2000, 2500, 5000];

interface Seq {
  terms: number[];
  step: number;
  up: boolean;
}

/** Five terms adding or taking away the same step, all between 0 and a million. */
function sequence(rng: Rng, top = 900_000): Seq {
  const step = pick(rng, STEPS);
  const up = rng() < 0.5;
  const scale = step >= 1000 ? 1000 : step >= 100 ? 100 : 25;
  const low = step * 5;
  const from = Math.ceil(low / scale);
  const to = Math.floor(Math.min(top - low, step * 400) / scale);
  const start = randInt(rng, from, to) * scale;
  const terms = range(0, 4).map((i) => (up ? start + i * step : start + low - i * step));
  return { terms, step, up };
}

/** Hint 3 for a sequence: a solved one, drawn as cards (and its rule, when that is the question). */
const solvedSequence = (items: number[], ruleText?: string): Hint => {
  const text = tx('r4.example');
  return {
    text,
    spoken: `${text} ${items.map(grouped).join(', ')}${ruleText ? `: ${ruleText}` : ''}`,
    visual: { type: 'sequence', items },
    ...(ruleText ? { example: { display: ruleText, spoken: ruleText } } : {}),
  };
};

const rule = (step: number, up: boolean) =>
  tx(up ? 'r4.seq.up' : 'r4.seq.down', { step: grouped(step) });

function seqMissing(rng: Rng): Exercise {
  const { terms: all, step, up } = sequence(rng);
  // Four numbers, as cards (they wrap on a narrow phone): the next one hidden, or one in the middle.
  const terms = all.slice(0, 4);
  const gap = rng() < 0.5 ? 3 : randInt(rng, 1, 2);
  const answer = terms[gap] as number;
  const shownText = terms.map((x, i) => (i === gap ? '?' : grouped(x))).join(', ');
  const prompt = tx(gap === 3 ? 'r4.seq.next.prompt' : 'r4.seq.gap.prompt');
  const ex = step === 100 && up ? [450, 350, 250, 150] : [300, 400, 500, 600];
  return exercise({
    factId: `r4seq:${terms.join(',')}:${gap}`,
    topicId: ID,
    level: 8,
    prompt,
    display: '',
    spoken: said(`${prompt} ${shownText}`),
    visual: { type: 'sequence', items: terms.map((x, i) => (i === gap ? null : x)) },
    answer,
    input: numpad(6),
    hints: [
      note('r4.seq.hint1'),
      note(up ? 'r4.seq.hint2Up' : 'r4.seq.hint2Down', { step: grouped(step) }),
      solvedSequence(ex),
    ],
    solution: said(`${rule(step, up)}: ${grouped(answer)}`),
  });
}

function seqRule(rng: Rng): Exercise {
  const { terms, step, up } = sequence(rng);
  const right = rule(step, up);
  const other = pick(
    rng,
    STEPS.filter((x) => x !== step && x !== step * 2 && x * 2 !== step),
  );
  const wrong = [rule(step, !up), rule(step * 2, up), rule(other, up), rule(other, !up)];
  const { labels, answer } = choicesOf(rng, right, wrong);
  const four = terms.slice(0, 4);
  return exercise({
    factId: `r4rule:${terms.join(',')}`,
    topicId: ID,
    level: 9,
    prompt: tx('r4.seq.rule.prompt'),
    display: '',
    spoken: said(`${tx('r4.seq.rule.prompt')} ${four.map(grouped).join(', ')}`),
    visual: { type: 'sequence', items: four },
    answer,
    input: labelledChoices(labels, true),
    hints: [
      note('r4.seq.hint1'),
      note('r4.seq.ruleHint2'),
      // A solved one whose rule is not this one's.
      step === 200 && !up
        ? solvedSequence([300, 400, 500], rule(100, true))
        : solvedSequence([1200, 1000, 800], rule(200, false)),
    ],
    solution: said(right),
  });
}

/* ---------- 10. Word problems with fractions ---------- */

type Story = 'eat' | 'paint' | 'juice' | 'road' | 'pizza';

const VERB: Record<'eat' | 'paint' | 'walk', Record<'f' | 'm', string>> = {
  eat: { f: 'אכלה', m: 'אכל' },
  paint: { f: 'צבעה', m: 'צבע' },
  walk: { f: 'הלכה', m: 'הלך' },
};

interface StoryFact {
  kind: Story;
  x: number;
  y: number;
  d: number;
}

function storyOf(fact: StoryFact, rng: Rng): Exercise {
  const { kind, x, y, d } = fact;
  const a: Character = pick(rng, CHARACTERS);
  const b: Character = pick(
    rng,
    CHARACTERS.filter((c) => c.name !== a.name),
  );
  const add = kind === 'eat' || kind === 'paint';
  const whole = kind === 'road';
  const answer = add ? x + y : whole ? d - x : x - y;
  const plural = fractionNoun(d).plural;
  const prompt =
    kind === 'eat'
      ? tx('r4.story.eat', {
          a: a.name,
          b: b.name,
          va: VERB.eat[a.gender],
          vb: VERB.eat[b.gender],
          x: f(x, d),
          y: f(y, d),
        })
      : kind === 'paint'
        ? tx('r4.story.paint', { a: a.name, v: VERB.paint[a.gender], x: f(x, d), y: f(y, d) })
        : kind === 'juice'
          ? tx('r4.story.juice', { x: f(x, d), y: f(y, d) })
          : kind === 'road'
            ? tx('r4.story.road', { a: a.name, v: VERB.walk[a.gender], x: f(x, d) })
            : tx('r4.story.pizza', { a: a.name, v: VERB.eat[a.gender], x: f(x, d), y: f(y, d) });
  const display = whole
    ? `1 − ${f(x, d)} = ?/${d}`
    : `${f(x, d)} ${add ? '+' : '−'} ${f(y, d)} = ?/${d}`;
  const ex = add
    ? d === 5 && x + y === 3
      ? `2/7 + 3/7 = 5/7`
      : `1/5 + 2/5 = 3/5`
    : whole
      ? d === 4 && x === 1
        ? `1 − 2/5 = 3/5`
        : `1 − 1/4 = 3/4`
      : d === 6 && x - y === 3
        ? `5/8 − 3/8 = 2/8`
        : `5/6 − 2/6 = 3/6`;
  return exercise({
    factId: `r4story:${kind}:${x},${y}/${d}`,
    topicId: ID,
    level: 10,
    prompt,
    display,
    spoken: said(`${prompt} ${display}`),
    answer,
    operation: add ? 'add' : 'sub',
    input: numpad(2),
    hints: [
      note('r4.story.hint1'),
      whole
        ? note('r4.story.hint2Whole', { whole: f(d, d) })
        : note(add ? 'r4.story.hint2Add' : 'r4.story.hint2Sub', { plural }),
      solved(ex),
    ],
    solution: said(display.replace('?', String(answer))),
  });
}

const STORY_FACTS: StoryFact[] = [
  ...[3, 4, 5, 6, 8, 10].flatMap((d) =>
    range(1, d - 2).flatMap((x) =>
      range(1, d - 1 - x).flatMap((y) => [
        { kind: 'eat' as const, x, y, d },
        { kind: 'paint' as const, x, y, d },
      ]),
    ),
  ),
  ...[4, 5, 6, 8, 10].flatMap((d) =>
    range(2, d - 1).flatMap((x) =>
      range(1, x - 1).flatMap((y) => [
        { kind: 'juice' as const, x, y, d },
        { kind: 'pizza' as const, x, y, d },
      ]),
    ),
  ),
  ...[3, 4, 5, 6, 8, 10].flatMap((d) =>
    range(1, d - 1).map((x) => ({ kind: 'road' as const, x, y: 0, d })),
  ),
];

/* ---------- The world ---------- */

const FRACTIONS = DENS.flatMap((d) => range(1, d - 1).map((n) => ({ n, d })));

/* ---------- The two worlds ---------- */

const FRACTIONS_ID = 'map4-fractions';
const NUMBERS_ID = 'map4-numbers';
const LF = (n: number) => `level.map4f.${n}`;
const LN = (n: number) => `level.map4n.${n}`;

/** An exercise as a station of this world (built here, or borrowed from a year world). */
const at = (topicId: string, level: number, e: Exercise): Exercise => ({ ...e, topicId, level });

/**
 * A station of a year world, played here: its exercises as they are (a hint, a
 * picture, a column to write in), counted in this world. `keep` takes only some
 * of them (the ones with brackets, say).
 */
function borrowed(
  source: Topic,
  sourceLevel: number,
  topicId: string,
  level: number,
  keep: (e: Exercise) => boolean = () => true,
) {
  return (rng: Rng, gender: Gender): Exercise => {
    let e = source.generate(sourceLevel, rng, gender);
    // Some kinds are rare in a station (an addition among its word problems): look long enough.
    for (let i = 0; i < 600 && !keep(e); i++) e = source.generate(sourceLevel, rng, gender);
    return at(topicId, level, e);
  };
}

/** One of several stations of year worlds, at random. */
function either(...gens: ((rng: Rng, gender: Gender) => Exercise)[]) {
  return (rng: Rng, gender: Gender): Exercise => pick(rng, gens)(rng, gender);
}

/**
 * Grade 4's test practice, part 1: "שברים ומספרים מעורבים". Ten stations, as the
 * school's list has them: what the numerator and the denominator say, a fraction
 * and a mixed number drawn, less than, equal to or more than one, fractions in
 * words and in digits, expanding and simplifying, comparing, improper fractions to
 * mixed numbers and back, word problems adding and taking away fractions.
 */
export const map4Fractions = defineTopic({
  id: FRACTIONS_ID,
  labelKey: 'topic.map4.fractions',
  grades: [4],
  startLevel: () => 1,
  silent: true,
  track: 'map4',
  levels: [
    closed(
      LF(1),
      () =>
        FRACTIONS.flatMap((x) => [
          { ...x, ask: 'num' as const },
          { ...x, ask: 'den' as const },
        ]),
      (x) => at(FRACTIONS_ID, 1, numDen(x.n, x.d, x.ask)),
    ),
    closed(
      LF(2),
      () => FRACTIONS,
      (x, rng) => at(FRACTIONS_ID, 2, drawn(x.n, x.d, rng)),
    ),
    closed(
      LF(3),
      () =>
        [1, 2, 3].flatMap((whole) =>
          [2, 3, 4, 5, 6, 8].flatMap((d) => range(1, d - 1).map((rest) => ({ whole, rest, d }))),
        ),
      (x, rng) => at(FRACTIONS_ID, 3, mixedDrawn(x.whole, x.rest, x.d, rng)),
    ),
    // As many of each answer: below one, exactly one, above one.
    closed(
      LF(4),
      () =>
        [3, 4, 5, 6, 8, 10].flatMap((d) => [
          { n: d - 1, d },
          { n: Math.ceil(d / 2), d },
          { n: d, d },
          { n: d, d },
          { n: d + 1, d },
          { n: d + Math.ceil(d / 2), d },
        ]),
      (x) => at(FRACTIONS_ID, 4, toOne(x.n, x.d)),
    ),
    // Both ways: words to digits, and digits to words.
    closed(
      LF(5),
      () => [
        ...FRACTIONS.map((x) => ({ ...x, way: 'digits' as const })),
        ...FRACTIONS.filter((x) => x.d > 2).map((x) => ({ ...x, way: 'words' as const })),
      ],
      (x, rng) =>
        at(FRACTIONS_ID, 5, x.way === 'digits' ? toDigits(x.n, x.d, rng) : toWords(x.n, x.d, rng)),
    ),
    // Expanding and simplifying: the same fraction, smaller parts or bigger ones.
    open(
      LF(6),
      either(borrowed(fractionOps, 1, FRACTIONS_ID, 6), borrowed(fractionOps, 2, FRACTIONS_ID, 6)),
    ),
    open(LF(7), borrowed(fractionOps, 3, FRACTIONS_ID, 7)),
    open(LF(8), borrowed(fractionOps, 7, FRACTIONS_ID, 8)),
    open(LF(9), borrowed(fractionOps, 8, FRACTIONS_ID, 9)),
    closed(
      LF(10),
      () => STORY_FACTS,
      (x, rng) => at(FRACTIONS_ID, 10, storyOf(x, rng)),
    ),
  ],
});

const added = (e: Exercise) => e.operation === 'add';
const takenAway = (e: Exercise) => e.operation !== 'add' && e.operation !== 'mul';

/**
 * Grade 4's test practice, part 2: "מספרים טבעיים". Ten stations: a number's name
 * both ways, sequences (the missing number, the rule), adding and taking away in
 * columns, the order of operations without and with brackets, word problems.
 */
export const map4Numbers = defineTopic({
  id: NUMBERS_ID,
  labelKey: 'topic.map4.numbers',
  grades: [4],
  startLevel: () => 1,
  silent: true,
  track: 'map4',
  levels: [
    open(LN(1), (rng) => at(NUMBERS_ID, 1, numberName(rng))),
    open(LN(2), borrowed(bigNumbers, 1, NUMBERS_ID, 2)),
    open(LN(3), (rng) => at(NUMBERS_ID, 3, seqMissing(rng))),
    open(LN(4), (rng) => at(NUMBERS_ID, 4, seqRule(rng))),
    open(LN(5), borrowed(vertical4, 1, NUMBERS_ID, 5)),
    open(LN(6), borrowed(vertical4, 2, NUMBERS_ID, 6)),
    open(
      LN(7),
      borrowed(longMulDiv, 9, NUMBERS_ID, 7, (e) => !e.display.includes('(')),
    ),
    open(
      LN(8),
      borrowed(longMulDiv, 9, NUMBERS_ID, 8, (e) => e.display.includes('(')),
    ),
    open(
      LN(9),
      either(
        borrowed(bigNumbers, 10, NUMBERS_ID, 9, added),
        borrowed(vertical4, 10, NUMBERS_ID, 9, added),
      ),
    ),
    open(
      LN(10),
      either(
        borrowed(bigNumbers, 10, NUMBERS_ID, 10, takenAway),
        borrowed(vertical4, 10, NUMBERS_ID, 10, (e) => e.operation === 'sub'),
      ),
    ),
  ],
});
