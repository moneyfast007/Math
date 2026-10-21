import type { Grade } from '@/ui/ageBand';
import type { ProfileProgress } from '@/state/schema';
import { addSub100 } from './topics/addSub100';
import { anglesTopic } from './topics/angles';
import { areasTopic } from './topics/areas';
import { addSub20 } from './topics/addSub20';
import { bigNumbers } from './topics/bigNumbers';
import { circleVolume } from './topics/circleVolume';
import { clockTopic } from './topics/clock';
import { clockMoney1 } from './topics/clockMoney1';
import { count10 } from './topics/count10';
import { data } from './topics/data';
import { dataStats } from './topics/dataStats';
import { decimalOps } from './topics/decimalOps';
import { decimals } from './topics/decimals';
import { divisibility } from './topics/divisibility';
import { fractionMulDiv } from './topics/fractionMulDiv';
import { fractionOps } from './topics/fractionOps';
import { fractions1 } from './topics/fractions1';
import { longMulDiv } from './topics/longMulDiv';
import { measureTopic } from './topics/measure';
import { measure1 } from './topics/measure1';
import { moneyTopic } from './topics/money';
import { multIntro } from './topics/multIntro';
import { multTable } from './topics/multTable';
import { numbers100 } from './topics/numbers100';
import { numbers1000 } from './topics/numbers1000';
import { numbers10000 } from './topics/numbers10000';
import { orderOps } from './topics/orderOps';
import { patterns1 } from './topics/patterns1';
import { perimeterArea } from './topics/perimeterArea';
import { polygons } from './topics/polygons';
import { percent } from './topics/percent';
import { percentIntro } from './topics/percentIntro';
import { ratio } from './topics/ratio';
import { shapesTopic } from './topics/shapes';
import { solids1 } from './topics/solids1';
import { vertical2, vertical3, vertical4 } from './topics/vertical';
import type { LevelInfo, Topic } from './types';

/** All topics (worlds), in curriculum order (Ministry of Education, 2006/2024). */
export const TOPICS: readonly Topic[] = [
  // Gan
  count10,
  addSub20, // gan and grade 1
  shapesTopic,
  // Grade 1
  numbers100,
  polygons, // grades 1–2
  clockMoney1,
  patterns1,
  solids1,
  measure1,
  // Grade 2
  addSub100,
  numbers1000,
  moneyTopic,
  multIntro,
  clockTopic,
  vertical2,
  // Grade 3
  multTable,
  numbers10000,
  fractions1,
  measureTopic,
  anglesTopic, // grades 3–4
  vertical3,
  // Grade 4
  bigNumbers,
  longMulDiv,
  divisibility,
  fractionOps, // grades 4–5
  perimeterArea,
  vertical4,
  // Grade 5
  decimals,
  percentIntro, // grades 5–6
  orderOps,
  areasTopic,
  // Grade 6
  fractionMulDiv,
  decimalOps,
  percent,
  ratio,
  circleVolume,
  data, // grades 1–3, last in each
  dataStats, // grades 4–6, last in each
];

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

/**
 * The order of the worlds in each grade, where it differs from TOPICS: a world
 * shared by two grades comes early in one and late in the other (angles are
 * grade 3's fifth world and grade 4's sixth).
 */
const ORDER: Partial<Record<Grade, readonly Topic[]>> = {
  // Patterns after the numbers to 100 they count in; solids beside the flat shapes.
  1: [addSub20, numbers100, patterns1, polygons, solids1, measure1, clockMoney1, data],
  2: [addSub100, numbers1000, moneyTopic, multIntro, clockTopic, polygons, vertical2, data],
  4: [
    bigNumbers,
    longMulDiv,
    divisibility,
    fractionOps,
    perimeterArea,
    anglesTopic,
    vertical4,
    dataStats,
  ],
  5: [fractionOps, decimals, percentIntro, orderOps, areasTopic, dataStats],
  6: [fractionMulDiv, decimalOps, percentIntro, percent, ratio, circleVolume, dataStats],
};

/** The worlds of the child's grade, in curriculum order (every grade has some). */
export function topicsForGrade(grade: Grade): Topic[] {
  const all = TOPICS.filter((t) => t.grades.includes(grade));
  const order = ORDER[grade];
  if (!order) return all;
  // Every world of the grade appears once: the listed order first, any other after.
  return [...order.filter((t) => all.includes(t)), ...all.filter((t) => !order.includes(t))];
}

/** The levels of a world for a child of this grade (a younger grade may end earlier). */
export function levelsFor(topic: Topic, grade: Grade): readonly LevelInfo[] {
  const last = topic.lastLevel?.(grade) ?? Infinity;
  return topic.levels.filter((l) => l.level <= last);
}

export function currentLevel(
  topic: Topic,
  grade: Grade,
  progress: ProfileProgress | undefined,
): number {
  return progress?.topics[topic.id]?.level ?? topic.startLevel(grade);
}

/** Everything any topic can say aloud, for the audio bank. */
export function allSpokenTexts(): string[] {
  return [...new Set(TOPICS.flatMap((t) => t.spokenBank()))];
}
