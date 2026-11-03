import { t, type TranslationKey } from '@/i18n';
import { closed, defineTopic, exercise, type Said } from '../build';
import { shuffle } from '../rng';
import type { Exercise, Hint, Rng } from '../types';

/**
 * A bonus world beside the journey (Topic.track 'idioms'): sixty Hebrew idioms
 * and what they mean, as a multiple-choice test with four answers. Ten
 * stations, six idioms each, in the list's order; each idiom is asked both
 * ways: what it means, and which idiom has this meaning. The wrong answers are
 * the station's other idioms (or their meanings), so a station is learnt as a
 * group.
 *
 * Shown to the children of one family only (app/bonus.ts). Silent: the texts are
 * shown, never read aloud; what a screen reader reads is the shown text.
 */

const ID = 'idioms';
const COUNT = 60;
const PER_STATION = 6;

export interface Idiom {
  /** 1–60, the list's own number. */
  n: number;
  phrase: string;
  meaning: string;
}

export function idiom(n: number): Idiom {
  return {
    n,
    phrase: t(`idiom.${n}.phrase` as TranslationKey),
    meaning: t(`idiom.${n}.meaning` as TranslationKey),
  };
}

/** The idioms of a station (1–10), in the list's order. */
export function stationIdioms(level: number): Idiom[] {
  const first = (level - 1) * PER_STATION + 1;
  return Array.from({ length: PER_STATION }, (_, i) => idiom(first + i)).filter(
    (x) => x.n <= COUNT,
  );
}

type Ask = 'meaning' | 'phrase';
interface Fact {
  n: number;
  ask: Ask;
}

/** Shown text as the "spoken" one: a screen reader's label, never played. */
const said = (text: string): Said => ({ text, parts: [] });
const tx = (key: string, params?: Record<string, string | number>) =>
  t(key as TranslationKey, params ? { params } : undefined);
const note = (text: string): Hint => ({ text, spoken: text });

function question(level: number, fact: Fact, rng: Rng): Exercise {
  const group = stationIdioms(level);
  const right = group.find((x) => x.n === fact.n) ?? idiom(fact.n);
  const others = shuffle(
    rng,
    group.filter((x) => x.n !== right.n),
  ).slice(0, 3);
  const options = shuffle(rng, [right, ...others]);
  const answer = options.indexOf(right);
  const asksMeaning = fact.ask === 'meaning';
  const label = (x: Idiom) => (asksMeaning ? x.meaning : x.phrase);
  // Hints 2 and 3 each take a wrong answer away: whose it really is.
  const away = (x: Idiom) =>
    asksMeaning
      ? note(tx('idioms.meaning.not', { option: x.meaning, other: x.phrase }))
      : note(tx('idioms.phrase.not', { option: x.phrase, other: x.meaning }));
  const [first, second] = others;
  const prompt = tx(`idioms.${fact.ask}.prompt`);
  const shown = asksMeaning ? right.phrase : right.meaning;
  const solution = tx('idioms.solution', { phrase: right.phrase, meaning: right.meaning });
  return exercise({
    factId: `idiom:${fact.ask}:${right.n}`,
    topicId: ID,
    level,
    prompt,
    display: '',
    spoken: said(`${prompt} ${shown}`),
    visual: { type: 'phrase', text: shown, kind: asksMeaning ? 'idiom' : 'meaning' },
    answer,
    input: {
      type: 'choices',
      choices: options.map((_, i) => i),
      labels: options.map(label),
      stack: true,
    },
    hints: [
      note(tx(`idioms.${fact.ask}.hint1`)),
      first ? away(first) : note(tx(`idioms.${fact.ask}.hint1`)),
      second ? away(second) : note(solution),
    ],
    // A wrong answer: what that answer really belongs to.
    advice: options.flatMap((x, i) =>
      x === right
        ? []
        : [
            {
              value: i,
              say: said(
                asksMeaning
                  ? tx('idioms.meaning.advice', { other: x.phrase })
                  : tx('idioms.phrase.advice', { other: x.meaning }),
              ),
            },
          ],
    ),
    solution: said(solution),
  });
}

const station = (level: number) =>
  closed(
    `level.idioms.${level}`,
    () =>
      stationIdioms(level).flatMap((x) => [
        { n: x.n, ask: 'meaning' as const },
        { n: x.n, ask: 'phrase' as const },
      ]),
    (fact: Fact, rng) => question(level, fact, rng),
  );

export const idioms = defineTopic({
  id: ID,
  labelKey: 'topic.idioms',
  // Every grade: the family the world is for decides who sees it (app/bonus.ts).
  grades: [0, 1, 2, 3, 4, 5, 6],
  startLevel: () => 1,
  silent: true,
  track: 'idioms',
  // Station 3 is not easier than station 4, only other idioms: a stuck round stays.
  parts: true,
  levels: Array.from({ length: 10 }, (_, i) => station(i + 1)),
});
