import { closed, defineTopic, open, type LevelDef } from '../build';
import type { ClockTime, Exercise, Rng } from '../types';
import { level1, level2, level8, wholeHours, type ShiftFact } from './clock';
import {
  change,
  COINS,
  count,
  enoughFrom,
  know,
  smallCoinSets,
  storyBank,
  tinyCoinSets,
  walletsWith,
  type KnowFact,
} from './money';

/**
 * World "שעון וכסף", grade 1 (phase 6): the first steps of the grade-2 money
 * and clock worlds, alternating so neither tires her: the coins, counting up
 * to twenty shekels, whole hours, an hour later, enough money, half hours,
 * which wallet has more, change from ten and twenty. Whole hours come before
 * half hours: the stations open in order. The exercises are the grade-2 ones
 * with small numbers; only their world and station change.
 */

const ID = 'clock-money-1';
const L = (n: number) => `level.clockMoney1.${n}`;

/** The same exercise, filed under this world's station. */
const here =
  (level: number) =>
  (e: Exercise): Exercise => ({ ...e, topicId: ID, level });

/** `label`: a label of its own, for a station that moved (the labels follow the stations). */
function closedHere<F>(
  level: number,
  facts: () => readonly F[],
  build: (f: F, rng: Rng) => Exercise,
  label = L(level),
): LevelDef {
  return closed(label, facts, (f: F, rng) => here(level)(build(f, rng)));
}

function openHere(level: number, gen: (rng: Rng) => Exercise, label = L(level)): LevelDef {
  return open(label, (rng) => here(level)(gen(rng)));
}

export const clockMoney1 = defineTopic({
  id: ID,
  labelKey: 'topic.clockMoney1',
  grades: [1],
  startLevel: () => 1,
  levels: [
    closedHere(
      1,
      () =>
        COINS.flatMap((v): KnowFact[] => [
          { kind: 'value', v },
          { kind: 'pick', v },
        ]),
      (f) => know(f),
    ),
    closedHere(2, tinyCoinSets, count(2, tinyCoinSets)),
    closedHere(3, wholeHours, (f: ClockTime, rng) => level1(f, rng)),
    closedHere(4, wholeHours, (f: ClockTime, rng) => level2(f, rng)),
    closedHere(5, smallCoinSets, count(3, smallCoinSets)),
    closedHere(
      6,
      () => wholeHours().map((time): ShiftFact => ({ time, dir: 'later' })),
      (f: ShiftFact, rng) => level8(f, rng),
      'level.clockMoney1.hourLater',
    ),
    openHere(7, enoughFrom(smallCoinSets)),
    // Whole hours only: half hours are grade 2 (the clock world there teaches them).
    closedHere(
      8,
      () => wholeHours().map((time): ShiftFact => ({ time, dir: 'earlier' })),
      (f: ShiftFact, rng) => level8(f, rng),
      'level.clockMoney1.hourEarlier',
    ),
    openHere(9, walletsWith([5, 10, 10])),
    // From ten and from twenty: from ten alone there are only seven prices, too few for a round.
    openHere(10, change(8, [10, 20]), 'level.clockMoney1.change'),
  ],
  extraBank: storyBank,
});
