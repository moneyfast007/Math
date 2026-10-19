import { t, type TranslationKey } from '@/i18n';
import { shown } from '@/lang/compose';
import { numberToWords, type Noun } from '@/lang/hebrewNumbers';
import { digitalTime, fromMinutes, minuteWords, toMinutes, wrapHour } from '@/lang/time';
import type { MistakeKind } from '@/state/schema';
import {
  closed,
  defineTopic,
  exampleHint,
  exercise,
  hint,
  labelledChoices,
  numpad,
  open,
  pictureExample,
  range,
  say,
} from '../build';
import { pick, randInt, shuffle } from '../rng';
import type { ClockTime, Exercise, Rng, Visual } from '../types';

/**
 * World "שעון ומדידות", grade 3 (phase 6). Reading the clock to five minutes
 * and to the minute, minutes that passed, hours and minutes, metres and
 * centimetres, measuring with a ruler, kilograms and grams, comparing
 * lengths and weights, time and measurement problems.
 */

const ID = 'measure';
const L = (n: number) => `level.measure.${n}`;
const MINUTE: Noun = { singular: 'דקה', plural: 'דקות', gender: 'f' };
const CM: Noun = { singular: 'סנטימטר', plural: 'סנטימטרים', gender: 'm' };
const METER: Noun = { singular: 'מטר', plural: 'מטרים', gender: 'm' };
const KG: Noun = { singular: 'קילוגרם', plural: 'קילוגרמים', gender: 'm' };
const GRAM: Noun = { singular: 'גרם', plural: 'גרמים', gender: 'm' };

const fem = (n: number) => numberToWords(n, 'f');
const words = (time: ClockTime) => minuteWords(time, fem);
const clock = (...times: ClockTime[]): Visual => ({ type: 'clock', times });
const at = (h: number, m: number): ClockTime => ({ h: wrapHour(h), m });
const same = (a: ClockTime, b: ClockTime) => a.h === b.h && a.m === b.m;

/** Clock choices: the right time and its distractors, shuffled, with the mistakes they stand for. */
function clockChoices(
  rng: Rng,
  right: ClockTime,
  wrong: { time: ClockTime; mistake?: MistakeKind }[],
) {
  const unique = wrong.filter(
    (w, i) =>
      !same(w.time, right) &&
      w.time.m >= 0 &&
      w.time.m < 60 &&
      wrong.findIndex((x) => same(x.time, w.time)) === i,
  );
  // Three choices: the right one and the first two distractors.
  const options = shuffle(rng, [right, ...unique.slice(0, 2).map((w) => w.time)]);
  const mistakes = new Map<number, MistakeKind>();
  for (const w of unique.slice(0, 2))
    if (w.mistake)
      mistakes.set(
        options.findIndex((o) => same(o, w.time)),
        w.mistake,
      );
  return { options, answer: options.findIndex((o) => same(o, right)), mistakes };
}

/* ---------- Levels 1–2: what time is it? ---------- */

function readClock(level: 1 | 2) {
  return (time: ClockTime, rng: Rng): Exercise => {
    // Reading the number the long hand points at as the minutes: 3:20 read as 3:04.
    const misread = at(time.h, Math.round(time.m / 5));
    const set = clockChoices(rng, time, [
      { time: misread, mistake: 'clockHands' },
      { time: at(time.h + 1, time.m), mistake: 'clockHands' },
      { time: at(time.h, (time.m + 5) % 60) },
    ]);
    const { options, answer } = set;
    const ex = same(time, at(8, 40)) ? at(2, 10) : at(8, 40);
    return exercise({
      factId: `mclock${level}:${time.h}:${time.m}`,
      topicId: ID,
      level,
      prompt: t('ex.clock.read.prompt'),
      display: '',
      spoken: say('ex.clock.read.prompt'),
      visual: clock(time),
      answer,
      input: labelledChoices(options.map(digitalTime)),
      hints: [
        hint(say('ex.measure.clock.hint1')),
        hint(say(level === 1 ? 'ex.measure.clock.hint2' : 'ex.measure.clock.hint2any')),
        pictureExample(say('ex.clock.example', { time: words(ex) }), clock(ex), digitalTime(ex)),
      ],
      solution: say('ex.clock.solution', { time: words(time) }),
      diagnose: (v) => set.mistakes.get(v) ?? null,
    });
  };
}

/* ---------- Level 3: how many minutes passed? ---------- */

function elapsed(rng: Rng): Exercise {
  const from = at(randInt(rng, 1, 11), randInt(rng, 0, 11) * 5);
  const d = randInt(rng, 2, 11) * 5;
  const to = fromMinutes(toMinutes(from) + d);
  const min = (n: number) => ({ n, noun: MINUTE });
  return exercise({
    factId: `melapsed:${from.h}:${from.m}+${d}`,
    topicId: ID,
    level: 3,
    prompt: t('ex.measure.elapsed.prompt'),
    display: '',
    spoken: say('ex.measure.elapsed.prompt'),
    visual: clock(from, to),
    answer: d,
    input: numpad(2),
    hints: [
      hint(say('ex.measure.elapsed.hint1')),
      hint(say('ex.measure.elapsed.hint2')),
      exampleHint(
        d === 35 ? '3:10 → 3:35' : '3:10 → 3:45',
        say('ex.measure.elapsed.solution', { d: min(d === 35 ? 25 : 35) }),
      ),
    ],
    solution: say('ex.measure.elapsed.solution', { d: min(d) }),
    diagnose: (v) => (v === d / 5 ? 'clockHands' : Math.abs(v - d) === 5 ? 'offByOne' : null),
  });
}

/* ---------- Level 4: hours and minutes ---------- */

const HOUR_FACTS: { key: TranslationKey; answer: number; choices: number[] }[] = [
  { key: 'ex.measure.hours.q1', answer: 60, choices: [10, 60, 100] },
  { key: 'ex.measure.hours.q2', answer: 30, choices: [30, 50, 60] },
  { key: 'ex.measure.hours.q3', answer: 15, choices: [15, 25, 45] },
  { key: 'ex.measure.hours.q4', answer: 90, choices: [90, 130, 150] },
  { key: 'ex.measure.hours.q5', answer: 120, choices: [100, 120, 200] },
  { key: 'ex.measure.hours.q6', answer: 180, choices: [130, 180, 300] },
  { key: 'ex.measure.hours.q7', answer: 45, choices: [30, 45, 75] },
  { key: 'ex.measure.hours.q8', answer: 150, choices: [150, 210, 250] },
];

function hours({ key, answer, choices }: (typeof HOUR_FACTS)[number], rng: Rng): Exercise {
  return exercise({
    factId: `mhours:${key}`,
    topicId: ID,
    level: 4,
    prompt: t(key),
    display: '',
    spoken: say(key),
    answer,
    // Not in order: the facts' distractors sit mostly on one side of the answer.
    input: { type: 'choices', choices: shuffle(rng, choices) },
    hints: [
      hint(say('ex.measure.hours.hint1')),
      hint(say('ex.measure.hours.hint2')),
      hint(say('ex.measure.hours.hint3')),
    ],
    solution: say('ex.measure.hours.solution', { n: { n: answer, noun: MINUTE } }),
    // 100 for an hour: thinking in hundreds, as with metres.
    diagnose: (v) => (v % 100 === 0 && answer % 60 === 0 ? 'other' : null),
  });
}

/* ---------- Levels 5 and 7: metres and centimetres, kilograms and grams ---------- */

function convert(level: 5 | 7) {
  const big = level === 5 ? METER : KG;
  const small = level === 5 ? CM : GRAM;
  const k = level === 5 ? 100 : 1000;
  const keyBase = level === 5 ? 'ex.measure.m' : 'ex.measure.kg';
  return (rng: Rng): Exercise => {
    const kind = pick(rng, ['whole', 'mixed', 'back'] as const);
    const a = randInt(rng, 3, 9);
    const extra = level === 5 ? randInt(rng, 1, 19) * 5 : randInt(rng, 1, 19) * 50;
    const answer = kind === 'back' ? a : kind === 'whole' ? a * k : a * k + extra;
    const bigU = level === 5 ? 'מ׳' : 'ק״ג';
    const smallU = level === 5 ? 'ס״מ' : 'גרם';
    const display =
      kind === 'back'
        ? `${a * k} ${smallU} = ? ${bigU}`
        : kind === 'whole'
          ? `${a} ${bigU} = ? ${smallU}`
          : `${a} ${bigU} + ${extra} ${smallU} = ? ${smallU}`;
    const spoken =
      kind === 'back'
        ? say(`${keyBase}.back` as TranslationKey, { s: { n: a * k, noun: small } })
        : kind === 'whole'
          ? say(`${keyBase}.whole` as TranslationKey, { b: { n: a, noun: big } })
          : say(`${keyBase}.mixed` as TranslationKey, {
              b: { n: a, noun: big },
              s: { n: extra, noun: small },
            });
    const solution = say(`${keyBase}.solution` as TranslationKey, {
      b: { n: a, noun: big },
      s: { n: a * k, noun: small },
    });
    return exercise({
      factId: `mconv${level}:${kind}:${a}:${kind === 'mixed' ? extra : 0}`,
      topicId: ID,
      level,
      prompt: t('ex.measure.convert.prompt'),
      display,
      spoken,
      answer,
      input: numpad(4),
      hints: [
        hint(say(`${keyBase}.hint1` as TranslationKey)),
        hint(say(kind === 'back' ? 'ex.measure.convert.hintBack' : 'ex.measure.convert.hint2')),
        exampleHint(
          level === 5 ? '2 מ׳ = 200 ס״מ' : '2 ק״ג = 2000 גרם',
          say(`${keyBase}.solution` as TranslationKey, {
            b: 'שני ' + big.plural,
            s: { n: 2 * k, noun: small },
          }),
        ),
      ],
      solution,
      diagnose: (v) =>
        kind === 'mixed' && v === a * k
          ? 'other'
          : v * 10 === answer || v === answer * 10
            ? 'placeValue'
            : null,
    });
  };
}

/* ---------- Level 6: measuring with a ruler ---------- */

function ruler(rng: Rng): Exercise {
  const fromZero = rng() < 0.5;
  const from = fromZero ? 0 : randInt(rng, 1, 4);
  const len = randInt(rng, 3, 10);
  const to = from + len;
  return exercise({
    factId: `ruler:${from}-${to}`,
    topicId: ID,
    level: 6,
    prompt: t('ex.measure.ruler.prompt'),
    display: '',
    spoken: say('ex.measure.ruler.prompt'),
    visual: { type: 'ruler', from, to, length: 15 },
    answer: len,
    input: numpad(2),
    hints: [
      hint(say('ex.measure.ruler.hint1')),
      hint(say('ex.measure.ruler.hint2')),
      pictureExample(say('ex.measure.ruler.example'), {
        type: 'ruler',
        from: 2,
        to: 7,
        length: 15,
      }),
    ],
    solution: say('ex.measure.ruler.solution', { to, from, len: { n: len, noun: CM } }),
    // Reading the end mark when the pencil does not start at zero.
    diagnose: (v) => (from > 0 && v === to ? 'other' : null),
  });
}

/* ---------- Level 8: which is longer, which is heavier? ---------- */

function compare(rng: Rng): Exercise {
  const length = rng() < 0.5;
  const k = length ? 100 : 1000;
  // Half the time the bigger number in the smaller unit wins (2 מ׳ or 250 ס״מ?):
  // otherwise "always pick metres" would pass the level without comparing.
  const smallWins = rng() < 0.5;
  const a = smallWins ? randInt(rng, 1, 4) : randInt(rng, 2, 6);
  let b = smallWins
    ? a * k + randInt(rng, 1, 6) * (length ? 25 : 250)
    : randInt(rng, 3, 9) * (length ? 25 : 250);
  if (b === a * k) b += length ? 25 : 250;
  const bigFirst = rng() < 0.5;
  const big = {
    label: `${a} ${length ? 'מ׳' : 'ק״ג'}`,
    value: a * k,
    slot: { n: a, noun: length ? METER : KG },
  };
  const small = {
    label: `${b} ${length ? 'ס״מ' : 'גרם'}`,
    value: b,
    slot: { n: b, noun: length ? CM : GRAM },
  };
  const pair = bigFirst ? [big, small] : [small, big];
  const [x, y] = pair as [typeof big, typeof big];
  const answer = x.value > y.value ? 0 : 1;
  const key = length ? 'ex.measure.cmp.longer' : 'ex.measure.cmp.heavier';
  const winner = answer === 0 ? x : y;
  const loser = answer === 0 ? y : x;
  return exercise({
    factId: `mcmp:${x.label}|${y.label}`,
    topicId: ID,
    level: 8,
    prompt: t(key, { params: { a: x.label, b: y.label } }),
    display: '',
    spoken: say(`${key}.spoken` as TranslationKey, { a: x.slot, b: y.slot }),
    answer,
    input: labelledChoices([x.label, y.label]),
    hints: [
      hint(say('ex.measure.cmp.hint1')),
      hint(say(length ? 'ex.measure.m.hint1' : 'ex.measure.kg.hint1')),
      // A spoken example in the same units as the question, never the question itself.
      a === 2 && (b === 150 || b === 1500)
        ? exampleHint(
            length ? '3 מ׳ = 300 ס״מ > 250 ס״מ' : '3 ק״ג = 3000 גרם > 2500 גרם',
            say(length ? 'ex.measure.cmp.example3' : 'ex.measure.cmp.exampleKg3'),
          )
        : exampleHint(
            length ? '2 מ׳ = 200 ס״מ > 150 ס״מ' : '2 ק״ג = 2000 גרם > 1500 גרם',
            say(length ? 'ex.measure.cmp.example' : 'ex.measure.cmp.exampleKg'),
          ),
    ],
    solution: say('ex.measure.cmp.solution', { w: winner.slot, l: loser.slot }),
    // The bigger number in the smaller unit is the classic trap.
    diagnose: (v) => (v !== answer && (v === 0 ? x : y) === small ? 'placeValue' : null),
  });
}

/* ---------- Level 9: time problems ---------- */

type TimeFact = { from: ClockTime; d: number };

function timeProblem({ from, d }: TimeFact, rng: Rng): Exercise {
  const end = fromMinutes(toMinutes(from) + d);
  const set = clockChoices(rng, end, [
    { time: fromMinutes(toMinutes(end) + 10) },
    { time: fromMinutes(toMinutes(end) - 10) },
  ]);
  const dWords = `${fem(d)} דקות`;
  return exercise({
    factId: `mtime:${from.h}:${from.m}+${d}`,
    topicId: ID,
    level: 9,
    prompt: shown(say('ex.measure.time.story', { start: words(from), d: dWords })),
    display: '',
    spoken: say('ex.measure.time.story', { start: words(from), d: dWords }),
    answer: set.answer,
    input: labelledChoices(set.options.map(digitalTime)),
    hints: [
      hint(say('ex.measure.time.hint1')),
      hint(say('ex.measure.time.hint2'), { visual: clock(from) }),
      hint(say('ex.measure.time.hint3')),
    ],
    solution: say('ex.measure.time.solution', { end: words(end) }),
  });
}

/* ---------- Level 10: measurement problems ---------- */

function problem(rng: Rng): Exercise {
  if (rng() < 0.5) {
    const a = randInt(rng, 3, 5);
    const b = randInt(rng, 3, 19) * 5;
    const left = a * 100 - b;
    return exercise({
      factId: `ribbon:${a}:${b}`,
      topicId: ID,
      level: 10,
      prompt: say('ex.measure.ribbon.story', { a: { n: a, noun: METER }, b: { n: b, noun: CM } })
        .text,
      display: '',
      spoken: say('ex.measure.ribbon.story', { a: { n: a, noun: METER }, b: { n: b, noun: CM } }),
      answer: left,
      input: numpad(3),
      hints: [
        hint(say('ex.measure.ribbon.hint1')),
        {
          ...hint(say('hint.equation')),
          example: { display: `${a * 100} − ${b} = ?`, spoken: say('hint.equation').text },
        },
        exampleHint('200 − 50 = 150', say('ex.measure.ribbon.example')),
      ],
      solution: say('ex.measure.ribbon.solution', { all: a * 100, b, left: { n: left, noun: CM } }),
      diagnose: (v) => (v === a - b || v === a * 10 - b ? 'placeValue' : null),
    });
  }
  const a = randInt(rng, 3, 5);
  const b = randInt(rng, 1, 9) * 100 + (rng() < 0.5 ? 50 : 0);
  const left = a * 1000 - b;
  return exercise({
    factId: `flour:${a}:${b}`,
    topicId: ID,
    level: 10,
    prompt: shown(say('ex.measure.flour.story', { a: { n: a, noun: KG }, b: { n: b, noun: GRAM } })),
    display: '',
    spoken: say('ex.measure.flour.story', { a: { n: a, noun: KG }, b: { n: b, noun: GRAM } }),
    answer: left,
    input: numpad(4),
    hints: [
      hint(say('ex.measure.flour.hint1')),
      {
        ...hint(say('hint.equation')),
        example: { display: `${a * 1000} − ${b} = ?`, spoken: say('hint.equation').text },
      },
      exampleHint('2000 − 500 = 1500', say('ex.measure.flour.example')),
    ],
    solution: say('ex.measure.flour.solution', { all: a * 1000, b, left: { n: left, noun: GRAM } }),
    diagnose: (v) => (v === a * 100 - b ? 'placeValue' : null),
  });
}

const FIVES = range(1, 11).map((k) => k * 5);
const ODD_MINUTES = [3, 7, 12, 18, 22, 27, 33, 38, 42, 47, 52, 58];

export const measureTopic = defineTopic({
  id: ID,
  labelKey: 'topic.measure',
  grades: [3],
  startLevel: () => 1,
  levels: [
    closed(L(1), () => range(1, 12).flatMap((h) => FIVES.map((m) => at(h, m))), readClock(1)),
    closed(L(2), () => range(1, 12).flatMap((h) => ODD_MINUTES.map((m) => at(h, m))), readClock(2)),
    open(L(3), elapsed),
    closed(
      L(4),
      () => HOUR_FACTS,
      (f: (typeof HOUR_FACTS)[number], rng) => hours(f, rng),
    ),
    open(L(5), convert(5)),
    open(L(6), ruler),
    open(L(7), convert(7)),
    open(L(8), compare),
    closed(
      L(9),
      () =>
        range(1, 10).flatMap((h) =>
          [0, 30].flatMap((m) => [15, 20, 40, 45, 50].map((d) => ({ from: at(h, m), d }))),
        ),
      timeProblem,
    ),
    open(L(10), problem),
  ],
});
