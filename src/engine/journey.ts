import type { ProfileProgress } from '@/state/schema';
import type { Grade } from '@/ui/ageBand';
import { currentLevel, levelsFor, topicsForGrade } from './registry';
import type { Topic } from './types';

/**
 * The journey: every topic is a world, every level a station on its path, and
 * the world ends with one more station, a mixed review of all its levels.
 *
 * Pure functions over progress; the journey screen only draws what comes back.
 *
 * Station states:
 *   done     passed once (completedLevels), or below the level she is at now
 *   current  the level she practices next
 *   locked   above the current level
 * The review opens when the last level is done and stays "done" once passed.
 */

export type StationState = 'done' | 'current' | 'locked';

export interface WorldStation {
  level: number;
  labelKey: string;
  state: StationState;
}

export interface World {
  topic: Topic;
  /** 1-based position among the child's worlds. */
  index: number;
  stations: WorldStation[];
  review: StationState;
  /** Stations done out of all stations (levels plus the review). */
  done: number;
  total: number;
  /** All stations and the review are done. */
  completed: boolean;
}

export type NextStop = { kind: 'level'; level: number } | { kind: 'review' };

export function worldFor(
  topic: Topic,
  index: number,
  grade: Grade,
  progress: ProfileProgress | undefined,
): World {
  const stats = progress?.topics[topic.id];
  const level = currentLevel(topic, grade, progress);
  const completed = new Set(stats?.completedLevels ?? []);
  const stations: WorldStation[] = levelsFor(topic, grade).map((l) => ({
    level: l.level,
    labelKey: l.labelKey,
    state:
      completed.has(l.level) || l.level < level ? 'done' : l.level === level ? 'current' : 'locked',
  }));
  const lastDone = stations.length > 0 && stations.every((s) => s.state === 'done');
  const review: StationState = stats?.reviewPassed ? 'done' : lastDone ? 'current' : 'locked';
  const done = stations.filter((s) => s.state === 'done').length + (review === 'done' ? 1 : 0);
  return {
    topic,
    index,
    stations,
    review,
    done,
    total: stations.length + 1,
    completed: review === 'done' && lastDone,
  };
}

/** The child's worlds, in curriculum order. */
export function worldsFor(grade: Grade, progress: ProfileProgress | undefined): World[] {
  return topicsForGrade(grade).map((topic, i) => worldFor(topic, i + 1, grade, progress));
}

/** The world she is in: the first one not completed, else the last. */
export function activeWorld(
  grade: Grade,
  progress: ProfileProgress | undefined,
): World | undefined {
  const worlds = worldsFor(grade, progress);
  return worlds.find((w) => !w.completed) ?? worlds.at(-1);
}

/** What the big button starts: the current level, or the review once every level is done. */
export function nextStop(world: World): NextStop {
  if (world.review === 'current') return { kind: 'review' };
  const current = world.stations.find((s) => s.state === 'current');
  if (current) return { kind: 'level', level: current.level };
  // Everything done: free practice at the top level, review stays available.
  const last = world.stations.at(-1);
  return { kind: 'level', level: last?.level ?? 1 };
}

/** Stickers collected: one per completed world. */
export function stickersEarned(worlds: readonly World[]): number {
  return worlds.filter((w) => w.completed).length;
}

/** Where a world stands on the map of all the child's worlds. */
export type WorldMapState = 'done' | 'current' | 'locked';

export interface WorldMapEntry {
  world: World;
  state: WorldMapState;
  /** A locked world opens once this one (the closest unfinished world before it) is finished. */
  after: World | null;
}

/**
 * All the child's worlds in order, for the map of worlds: the finished ones,
 * the one the journey shows now (the first unfinished), and the locked ones
 * after it. Worlds open in curriculum order only; there is no skipping ahead.
 */
export function worldsMap(grade: Grade, progress: ProfileProgress | undefined): WorldMapEntry[] {
  let open: World | null = null;
  return worldsFor(grade, progress).map((world): WorldMapEntry => {
    if (world.completed) return { world, state: 'done', after: null };
    const entry: WorldMapEntry =
      open === null
        ? { world, state: 'current', after: null }
        : { world, state: 'locked', after: open };
    open = world;
    return entry;
  });
}
