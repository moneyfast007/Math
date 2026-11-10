import { closed, defineTopic, type LevelDef } from '../build';
import type { Gender } from '@/lang/gender';
import type { Exercise, Rng } from '../types';
import {
  buildFacts,
  buildShape,
  countFacts,
  countShapes,
  halfFacts,
  lineFacts,
  lines,
  symmetry,
  type BuildFact,
} from './polygons';

/**
 * World 16, gan hova: "קווים, חצאים ובנייה". Straight, curved and broken lines,
 * counting the shapes in a picture, completing a picture's other half (a
 * mirror), and which two shapes build a square, a rectangle, a house. The
 * exercises are grade 1's (world "מצולעים"), recorded already; only their world
 * and station change.
 */

const ID = 'build-0';
const L = (n: number) => `level.build0.${n}`;

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

const linesOf = (ask: string) => () => lineFacts().filter((f) => f.ask === ask);
const halves = (first: boolean) => () => {
  const all = halfFacts();
  // Each picture's halves, split in two: the first other half offered, then the second.
  return all.filter((_, i) => (i % 2 === 0) === first);
};
const builds = (targets: readonly BuildFact['target'][]) => () =>
  buildFacts().filter((f) => targets.includes(f.target));

export const build0 = defineTopic({
  id: ID,
  labelKey: 'topic.build0',
  grades: [0],
  startLevel: () => 1,
  levels: [
    closedHere(1, linesOf('straight'), lines),
    closedHere(2, linesOf('curved'), lines),
    closedHere(3, linesOf('broken'), lines),
    closedHere(4, () => countFacts().filter((f) => f.kind === 'tri'), countShapes),
    closedHere(5, () => countFacts().filter((f) => f.kind !== 'tri'), countShapes),
    closedHere(6, halves(true), symmetry),
    closedHere(7, halves(false), symmetry),
    closedHere(8, builds(['square', 'wideRect']), buildShape),
    closedHere(9, builds(['house', 'tallTri']), buildShape),
    closedHere(10, buildFacts, buildShape),
  ],
});
