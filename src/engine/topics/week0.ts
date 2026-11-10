import { closed, defineTopic, type LevelDef } from '../build';
import type { Gender } from '@/lang/gender';
import type { ClockTime, Exercise, Rng } from '../types';
import { level1, level2, level8, wholeHours, type ShiftFact } from './clock';
import {
  dayOrder,
  measure1Facts,
  relative,
  story,
  type OrderFact,
  type RelFact,
  type StoryFact,
} from './measure1';

/**
 * World 15, gan hova: "ימי השבוע והשעון". The days of the week in order (the
 * day after, the day before), tomorrow and yesterday both ways, how many days
 * until Shabbat, and whole hours on the clock (what time it is, which clock,
 * an hour later). The exercises are grade 1's, recorded already; only their
 * world and station change.
 */

const ID = 'week-0';
const L = (n: number) => `level.week0.${n}`;

/** The same exercise, filed under this world's station. */
const here =
  (level: number) =>
  (e: Exercise): Exercise => ({ ...e, topicId: ID, level });

function closedHere<F>(
  level: number,
  facts: () => readonly F[],
  build: (f: F, rng: Rng, gender: Gender) => Exercise,
): LevelDef {
  return closed(L(level), facts, (f: F, rng, gender) => here(level)(build(f, rng, gender)));
}

const orders = (dir: OrderFact['dir']) => () =>
  measure1Facts.orderFacts().filter((f) => f.dir === dir);
const rels = (kind: RelFact['kind']) => () =>
  measure1Facts.relFacts().filter((f) => f.kind === kind);
const shabbat = () => measure1Facts.storyFacts().filter((f: StoryFact) => f.kind === 'shabbat');

export const week0 = defineTopic({
  id: ID,
  labelKey: 'topic.week0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closedHere(1, orders('after'), dayOrder),
    closedHere(2, orders('before'), dayOrder),
    closedHere(3, rels('tomorrow'), relative),
    closedHere(4, rels('yesterday'), relative),
    closedHere(5, rels('fromTomorrow'), relative),
    closedHere(6, rels('fromYesterday'), relative),
    closedHere(7, shabbat, story),
    closedHere(8, wholeHours, (f: ClockTime, rng) => level1(f, rng)),
    closedHere(9, wholeHours, (f: ClockTime, rng) => level2(f, rng)),
    closedHere(
      10,
      () => wholeHours().map((time): ShiftFact => ({ time, dir: 'later' })),
      (f: ShiftFact, rng) => level8(f, rng),
    ),
  ],
});
