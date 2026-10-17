import type { Grade } from '@/ui/ageBand';
import type { ProfileProgress } from '@/state/schema';
import { addSub20 } from './topics/addSub20';
import type { Topic } from './types';

/** All topics, in curriculum order. Phase 5 adds the rest of gan–grade 6. */
export const TOPICS: readonly Topic[] = [addSub20];

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
