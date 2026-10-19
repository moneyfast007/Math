import { shown } from '@/lang/compose';
import { t, type TranslationKey } from '@/i18n';
import {
  digitalTime,
  durationWords,
  fromMinutes,
  timeWords,
  toMinutes,
  wrapHour,
} from '@/lang/time';
import type { MistakeKind } from '@/state/schema';
import {
  CHARACTERS,
  closed,
  defineTopic,
  exercise,
  hint,
  labelledChoices,
  pictureChoices,
  pictureExample,
  range,
  say,
  type Character,
  type Said,
} from '../build';
import { shuffle } from '../rng';
import type { ClockTime, Exercise, Hint, Rng, Visual } from '../types';

/**
 * World "שעון", grade 2 (phase 6). Whole hours, half hours, quarter past and
 * quarter to, digital and analog clocks, an hour later or earlier, how much
 * time passed, time stories. No single minutes: that is grade 3.
 *
 * Times are said the way children hear them ("שלוש וחצי", "רבע לשלוש"); the ל
 * and ו belong to the words, so every level is closed and every sentence is
 * recorded whole.
 */

const ID = 'clock';
const L = (n: number) => `level.clock.${n}`;
const HOURS = range(1, 12);

const clock = (...times: ClockTime[]): Visual => ({ type: 'clock', times });
const digital = (time: ClockTime): Visual => ({ type: 'clock', times: [time], digital: true });
const at = (h: number, m: number): ClockTime => ({ h: wrapHour(h), m });
const plus = (time: ClockTime, minutes: number) => fromMinutes(toMinutes(time) + minutes);
const key = (time: ClockTime) => `${time.h}:${time.m}`;
const same = (a: ClockTime, b: ClockTime) => a.h === b.h && a.m === b.m;

/** A worked example that is never the exercise itself. */
function exampleTime(time: ClockTime, preferred: ClockTime, fallback: ClockTime): ClockTime {
  return same(time, preferred) ? fallback : preferred;
}

interface ChoiceSet {
  options: ClockTime[];
  answer: number;
  /** Which wrong options mean a particular mistake. */
  mistakes: Map<number, MistakeKind>;
}

/** The right time and its distractors, in a shuffled order. */
function choiceSet(
  rng: Rng,
  right: ClockTime,
  wrong: { time: ClockTime; mistake?: MistakeKind }[],
): ChoiceSet {
  const unique = wrong.filter(
    (w, i) => !same(w.time, right) && wrong.findIndex((x) => same(x.time, w.time)) === i,
  );
  const options = shuffle(rng, [right, ...unique.map((w) => w.time)]);
  const mistakes = new Map<number, MistakeKind>();
  for (const w of unique)
    if (w.mistake)
      mistakes.set(
        options.findIndex((o) => same(o, w.time)),
        w.mistake,
      );
  return { options, answer: options.findIndex((o) => same(o, right)), mistakes };
}

function solution(time: ClockTime): Said {
  return say('ex.clock.solution', { time: timeWords(time) });
}

function example(time: ClockTime): Hint {
  return pictureExample(say('ex.clock.example', { time: timeWords(time) }), clock(time));
}

/** "מה השעה?": a clock, three times in words. */
function readClock(
  level: number,
  time: ClockTime,
  wrong: { time: ClockTime; mistake?: MistakeKind }[],
  hints: [TranslationKey, TranslationKey],
  ex: ClockTime,
  rng: Rng,
): Exercise {
  const set = choiceSet(rng, time, wrong);
  return exercise({
    factId: `clock${level}:${key(time)}`,
    topicId: ID,
    level,
    prompt: t('ex.clock.read.prompt'),
    display: '',
    spoken: say('ex.clock.read.prompt'),
    visual: clock(time),
    answer: set.answer,
    input: labelledChoices(set.options.map(timeWords)),
    hints: [hint(say(hints[0])), hint(say(hints[1])), example(ex)],
    solution: solution(time),
    diagnose: (v) => set.mistakes.get(v) ?? null,
  });
}

/** "איזה שעון מראה שלוש?": a time in words, three clocks. */
function pickClock(
  level: number,
  time: ClockTime,
  wrong: { time: ClockTime; mistake?: MistakeKind }[],
  hints: [TranslationKey, TranslationKey],
  ex: ClockTime,
  rng: Rng,
): Exercise {
  const set = choiceSet(rng, time, wrong);
  const spoken = say('ex.clock.pick.prompt', { time: timeWords(time) });
  return exercise({
    factId: `clock${level}:${key(time)}`,
    topicId: ID,
    level,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer: set.answer,
    input: pictureChoices(
      set.options.map(digitalTime),
      set.options.map((o) => clock(o)),
    ),
    hints: [hint(say(hints[0])), hint(say(hints[1])), example(ex)],
    solution: solution(time),
    diagnose: (v) => set.mistakes.get(v) ?? null,
  });
}

/* ---------- Levels ---------- */

export const wholeHours = () => HOURS.map((h) => at(h, 0));
export const halfHours = () => HOURS.map((h) => at(h, 30));

export function level1(time: ClockTime, rng: Rng): Exercise {
  return readClock(
    1,
    time,
    [{ time: at(time.h - 1, 0) }, { time: at(time.h + 1, 0) }],
    ['ex.clock.hour.hint1', 'ex.clock.hour.hint2'],
    exampleTime(time, at(8, 0), at(4, 0)),
    rng,
  );
}

export function level2(time: ClockTime, rng: Rng): Exercise {
  // The classic mix-up: the hands swapped (the long hand on the hour).
  const wrong =
    time.h === 12
      ? [{ time: at(11, 0) }, { time: at(1, 0) }]
      : [{ time: at(12, time.h * 5), mistake: 'clockHands' as const }, { time: at(time.h + 1, 0) }];
  return pickClock(
    2,
    time,
    wrong,
    ['ex.clock.hour.hint1', 'ex.clock.hour.hint2'],
    exampleTime(time, at(8, 0), at(4, 0)),
    rng,
  );
}

export function level3(time: ClockTime, rng: Rng): Exercise {
  return readClock(
    3,
    time,
    // The hour hand is past the hour: reading the next number is the usual slip.
    [{ time: at(time.h + 1, 30), mistake: 'clockHands' }, { time: at(time.h, 0) }],
    ['ex.clock.half.hint1', 'ex.clock.half.hint2'],
    exampleTime(time, at(7, 30), at(2, 30)),
    rng,
  );
}

export type DigitalFact = { time: ClockTime; to: 'analog' | 'digital' };

export function level4({ time, to }: DigitalFact, rng: Rng): Exercise {
  const wrong = [{ time: at(time.h + 1, time.m) }, { time: at(time.h, time.m === 0 ? 30 : 0) }];
  const set = choiceSet(rng, time, wrong);
  const ex = exampleTime(time, at(9, 30), at(5, 0));
  const hints: [Hint, Hint, Hint] = [
    hint(say('ex.clock.digital.hint1')),
    hint(say('ex.clock.digital.hint2')),
    pictureExample(say('ex.clock.example', { time: timeWords(ex) }), clock(ex), digitalTime(ex)),
  ];
  const promptKey = to === 'analog' ? 'ex.clock.toAnalog.prompt' : 'ex.clock.toDigital.prompt';
  return exercise({
    factId: `clock4:${to}:${key(time)}`,
    topicId: ID,
    level: 4,
    prompt: t(promptKey),
    display: '',
    spoken: say(promptKey),
    visual: to === 'analog' ? digital(time) : clock(time),
    answer: set.answer,
    input:
      to === 'analog'
        ? pictureChoices(
            set.options.map(digitalTime),
            set.options.map((o) => clock(o)),
          )
        : pictureChoices(
            set.options.map(digitalTime),
            set.options.map((o) => digital(o)),
          ),
    hints,
    solution: solution(time),
  });
}

function level5(time: ClockTime, rng: Rng): Exercise {
  return readClock(
    5,
    time,
    // One more "quarter past" (another hour) and one "quarter to": the right one is not
    // simply the only "quarter past" among the three.
    [{ time: at(time.h + 1, 15), mistake: 'clockHands' }, { time: at(time.h, 45) }],
    ['ex.clock.past.hint1', 'ex.clock.past.hint2'],
    exampleTime(time, at(4, 15), at(9, 15)),
    rng,
  );
}

function level6(time: ClockTime, rng: Rng): Exercise {
  return readClock(
    6,
    time,
    [{ time: at(time.h, 15) }, { time: at(time.h - 1, 45), mistake: 'clockHands' }],
    ['ex.clock.to.hint1', 'ex.clock.to.hint2'],
    exampleTime(time, at(5, 45), at(10, 45)),
    rng,
  );
}

function level7(time: ClockTime, rng: Rng): Exercise {
  const wrong =
    time.m === 45
      ? [{ time: at(time.h + 1, 45), mistake: 'clockHands' as const }, { time: at(time.h + 1, 15) }]
      : [{ time: at(time.h, 45) }, { time: at(time.h - 1, 45) }];
  return pickClock(
    7,
    time,
    wrong,
    ['ex.clock.quarters.hint1', time.m === 45 ? 'ex.clock.to.hint2' : 'ex.clock.past.hint2'],
    exampleTime(time, at(6, 15), at(11, 45)),
    rng,
  );
}

export type ShiftFact = { time: ClockTime; dir: 'later' | 'earlier' };

export function level8({ time, dir }: ShiftFact, rng: Rng): Exercise {
  const k = dir === 'later' ? 60 : -60;
  const right = plus(time, k);
  const set = choiceSet(rng, right, [{ time: plus(time, -k) }, { time: plus(time, 2 * k) }]);
  const ex = same(time, at(2, 0)) ? at(6, 30) : at(2, 0);
  const solved = (from: ClockTime) =>
    say(dir === 'later' ? 'ex.clock.later.solution' : 'ex.clock.earlier.solution', {
      from: timeWords(from),
      to: timeWords(plus(from, k)),
    });
  const promptKey = dir === 'later' ? 'ex.clock.later.prompt' : 'ex.clock.earlier.prompt';
  return exercise({
    factId: `clock8:${dir}:${key(time)}`,
    topicId: ID,
    level: 8,
    prompt: t(promptKey),
    display: '',
    spoken: say(promptKey),
    visual: clock(time),
    answer: set.answer,
    input: labelledChoices(set.options.map(timeWords)),
    hints: [
      hint(say(dir === 'later' ? 'ex.clock.later.hint1' : 'ex.clock.earlier.hint1')),
      hint(say('ex.clock.shift.hint2')),
      pictureExample(solved(ex), dir === 'later' ? clock(ex, plus(ex, k)) : clock(plus(ex, k), ex)),
    ],
    solution: solved(time),
  });
}

/* ---------- How much time passed ---------- */

const DURATIONS = [30, 60, 90, 120, 150, 180];

/** Durations in words, with the verb agreeing ("עברה שעה", "עברו שעתיים"). */
function passed(minutes: number): string {
  return minutes <= 90 ? 'עברה' : 'עברו';
}

type ElapsedFact = { from: ClockTime; d: number };

/** Every start on a whole or half hour, every duration, without going round past twelve. */
const elapsedFacts = (): ElapsedFact[] =>
  HOURS.flatMap((h) => [at(h, 0), at(h, 30)])
    .filter((from) => from.h !== 12)
    .flatMap((from) =>
      DURATIONS.filter((d) => toMinutes(from) + d <= 12 * 60).map((d) => ({ from, d })),
    );

function durationChoices(rng: Rng, d: number) {
  const near = [d - 30, d + 30, d + 60, d - 60].filter((x) => x > 0 && x <= 240 && x !== d);
  const options = shuffle(rng, [d, ...near.slice(0, 2)]);
  return { options, answer: options.indexOf(d) };
}

function elapsedSaid(from: ClockTime, d: number): Said {
  return say('ex.clock.elapsed.solution', {
    from: timeWords(from),
    to: timeWords(plus(from, d)),
    passed: passed(d),
    d: durationWords(d),
  });
}

function level9({ from, d }: ElapsedFact, rng: Rng): Exercise {
  const to = plus(from, d);
  const set = durationChoices(rng, d);
  const ex =
    same(from, at(3, 0)) && d === 120 ? { from: at(1, 30), d: 90 } : { from: at(3, 0), d: 120 };
  return exercise({
    factId: `clock9:${key(from)}+${d}`,
    topicId: ID,
    level: 9,
    prompt: t('ex.clock.elapsed.prompt'),
    display: '',
    spoken: say('ex.clock.elapsed.prompt'),
    visual: clock(from, to),
    answer: set.answer,
    input: labelledChoices(set.options.map(durationWords)),
    hints: [
      hint(say('ex.clock.elapsed.hint1')),
      hint(say('ex.clock.elapsed.hint2')),
      pictureExample(elapsedSaid(ex.from, ex.d), clock(ex.from, plus(ex.from, ex.d))),
    ],
    solution: elapsedSaid(from, d),
  });
}

/* ---------- Stories ---------- */

const STORY_PEOPLE: readonly Character[] = [CHARACTERS[0], CHARACTERS[1]].filter(
  (c): c is Character => c !== undefined,
);

type StoryFact = { kind: 'play' | 'trip'; who: Character; from: ClockTime; d: number };

const storyFacts = (): StoryFact[] =>
  range(2, 9)
    .flatMap((h) => [at(h, 0), at(h, 30)])
    .flatMap((from) =>
      [30, 60, 90, 120].flatMap((d) =>
        STORY_PEOPLE.flatMap((who) =>
          (['play', 'trip'] as const).map((kind) => ({ kind, who, from, d })),
        ),
      ),
    );

function level10({ kind, who, from, d }: StoryFact, rng: Rng): Exercise {
  const to = plus(from, d);
  const g = { gender: who.gender };
  const storyKey = kind === 'play' ? 'ex.clock.play.story' : 'ex.clock.trip.story';
  const spoken = say(
    storyKey,
    { name: who.name, start: timeWords(from), end: timeWords(to), d: durationWords(d) },
    who.gender,
  );
  let answer: number;
  let labels: string[];
  if (kind === 'play') {
    const set = choiceSet(rng, to, [{ time: plus(to, 30) }, { time: plus(to, -30) }]);
    answer = set.answer;
    labels = set.options.map(timeWords);
  } else {
    const set = durationChoices(rng, d);
    answer = set.answer;
    labels = set.options.map(durationWords);
  }
  const ex =
    same(from, at(4, 0)) && d === 60 ? { from: at(5, 0), d: 90 } : { from: at(4, 0), d: 60 };
  return exercise({
    factId: `clock10:${kind}:${who.name}:${key(from)}+${d}`,
    topicId: ID,
    level: 10,
    prompt: shown(spoken),
    display: '',
    spoken,
    answer,
    input: labelledChoices(labels),
    hints: [
      hint(say('ex.clock.story.hint1')),
      hint(say(kind === 'play' ? 'ex.clock.play.hint2' : 'ex.clock.trip.hint2'), {
        visual: kind === 'play' ? clock(from) : clock(from, to),
      }),
      pictureExample(elapsedSaid(ex.from, ex.d), clock(ex.from, plus(ex.from, ex.d))),
    ],
    solution:
      kind === 'play'
        ? say('ex.clock.play.solution', { name: who.name, end: timeWords(to) }, g.gender)
        : say('ex.clock.trip.solution', { d: durationWords(d) }),
  });
}

export const clockTopic = defineTopic({
  id: ID,
  labelKey: 'topic.clock',
  grades: [2],
  startLevel: () => 1,
  levels: [
    closed(L(1), wholeHours, (f: ClockTime, rng) => level1(f, rng)),
    closed(L(2), wholeHours, (f: ClockTime, rng) => level2(f, rng)),
    closed(L(3), halfHours, (f: ClockTime, rng) => level3(f, rng)),
    closed(
      L(4),
      () =>
        [...wholeHours(), ...halfHours()].flatMap((time): DigitalFact[] => [
          { time, to: 'analog' },
          { time, to: 'digital' },
        ]),
      (f: DigitalFact, rng) => level4(f, rng),
    ),
    closed(
      L(5),
      () => HOURS.map((h) => at(h, 15)),
      (f: ClockTime, rng) => level5(f, rng),
    ),
    closed(
      L(6),
      () => HOURS.map((h) => at(h, 45)),
      (f: ClockTime, rng) => level6(f, rng),
    ),
    closed(
      L(7),
      () => HOURS.flatMap((h) => [at(h, 15), at(h, 45)]),
      (f: ClockTime, rng) => level7(f, rng),
    ),
    closed(
      L(8),
      () =>
        [...wholeHours(), ...halfHours()].flatMap((time): ShiftFact[] => [
          { time, dir: 'later' },
          { time, dir: 'earlier' },
        ]),
      (f: ShiftFact, rng) => level8(f, rng),
    ),
    closed(L(9), elapsedFacts, (f: ElapsedFact, rng) => level9(f, rng)),
    closed(L(10), storyFacts, (f: StoryFact, rng) => level10(f, rng)),
  ],
});
