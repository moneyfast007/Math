import type { Grade } from '@/ui/ageBand';
import type { ProfileProgress } from '@/state/schema';
import { addSub100 } from './topics/addSub100';
import { addSub20 } from './topics/addSub20';
import { bigNumbers } from './topics/bigNumbers';
import { circleVolume } from './topics/circleVolume';
import { clockTopic } from './topics/clock';
import { clockMoney1 } from './topics/clockMoney1';
import { count10 } from './topics/count10';
import { decimalOps } from './topics/decimalOps';
import { decimals } from './topics/decimals';
import { fractionMulDiv } from './topics/fractionMulDiv';
import { fractionOps } from './topics/fractionOps';
import { fractions1 } from './topics/fractions1';
import { longMulDiv } from './topics/longMulDiv';
import { moneyTopic } from './topics/money';
import { multIntro } from './topics/multIntro';
import { multTable } from './topics/multTable';
import { numbers100 } from './topics/numbers100';
import { numbers10000 } from './topics/numbers10000';
import { orderOps } from './topics/orderOps';
import { perimeterArea } from './topics/perimeterArea';
import { percent } from './topics/percent';
import { percentIntro } from './topics/percentIntro';
import { ratio } from './topics/ratio';
import type { Topic } from './types';

/** All topics (worlds), in curriculum order (Ministry of Education, 2006/2024). */
export const TOPICS: readonly Topic[] = [
  count10,
  addSub20,
  numbers100,
  clockMoney1,
  addSub100,
  moneyTopic,
  multIntro,
  clockTopic,
  multTable,
  numbers10000,
  fractions1,
  bigNumbers,
  longMulDiv,
  fractionOps,
  decimals,
  perimeterArea,
  fractionMulDiv,
  decimalOps,
  percentIntro,
  orderOps,
  percent,
  ratio,
  circleVolume,
];

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

/** The worlds of the child's grade, in curriculum order (every grade has some). */
export function topicsForGrade(grade: Grade): Topic[] {
  return TOPICS.filter((t) => t.grades.includes(grade));
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
