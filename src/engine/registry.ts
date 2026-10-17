import type { Grade } from '@/ui/ageBand';
import type { ProfileProgress } from '@/state/schema';
import { addSub100 } from './topics/addSub100';
import { addSub20 } from './topics/addSub20';
import { bigNumbers } from './topics/bigNumbers';
import { count10 } from './topics/count10';
import { decimalOps } from './topics/decimalOps';
import { decimals } from './topics/decimals';
import { fractionMulDiv } from './topics/fractionMulDiv';
import { fractionOps } from './topics/fractionOps';
import { fractions1 } from './topics/fractions1';
import { longMulDiv } from './topics/longMulDiv';
import { multIntro } from './topics/multIntro';
import { multTable } from './topics/multTable';
import { numbers100 } from './topics/numbers100';
import { numbers10000 } from './topics/numbers10000';
import { orderOps } from './topics/orderOps';
import { perimeterArea } from './topics/perimeterArea';
import { percentIntro } from './topics/percentIntro';
import type { Topic } from './types';

/** All topics (worlds), in curriculum order (Ministry of Education, 2006/2024). */
export const TOPICS: readonly Topic[] = [
  count10,
  addSub20,
  numbers100,
  addSub100,
  multIntro,
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
];

export function topicById(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}

/** Topics in the child's grade band; older children also see earlier topics for review. */
export function topicsForGrade(grade: Grade): Topic[] {
  const inGrade = TOPICS.filter((t) => t.grades.includes(grade));
  return inGrade.length > 0 ? inGrade : [...TOPICS];
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
