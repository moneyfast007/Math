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
 *   done     passed (completedLevels); only a passed station gets a check
 *   current  the station the big button starts: the level she is at, or, once
 *            that is passed, the first station of her grade still to pass
 *   skipped  of her grade, below where she got to, not passed (she jumped ahead):
 *            open to play, and still needed to finish the world
 *   warmup   before her grade's starting station (last year's material): open to
 *            play, never needed
 *   locked   above where she got to
 * The final challenge (the review) opens once every station of her grade is passed,
 * and the world is finished when it is passed.
 */

export type StationState = 'done' | 'current' | 'skipped' | 'warmup' | 'locked';
/** The final challenge is never skipped or a warm-up. */
export type ReviewState = 'done' | 'current' | 'locked';

export interface WorldStation {
  level: number;
  labelKey: string;
  state: StationState;
  /** Before the grade's starting station: optional, never needed to finish the world. */
  warmup: boolean;
}

export interface World {
  topic: Topic;
  /** 1-based position among the child's worlds. */
  index: number;
  stations: WorldStation[];
  review: ReviewState;
  /** Stations done out of the stations needed (her grade's levels plus the review). */
  done: number;
  total: number;
  /** Every needed station and the review are done. */
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
  const start = topic.startLevel(grade);
  const completed = new Set(stats?.completedLevels ?? []);
  const levels = levelsFor(topic, grade);
  // How far she got: the level she is at, or a passed station above it.
  const reach = Math.max(level, ...completed);
  const needed = levels.filter((l) => l.level >= start);
  const target =
    !completed.has(level) && levels.some((l) => l.level === level)
      ? level
      : needed.find((l) => !completed.has(l.level))?.level;
  const stations: WorldStation[] = levels.map((l) => {
    const warmup = l.level < start;
    const state: StationState = completed.has(l.level)
      ? 'done'
      : l.level === target
        ? 'current'
        : warmup
          ? 'warmup'
          : l.level < reach
            ? 'skipped'
            : 'locked';
    return { level: l.level, labelKey: l.labelKey, state, warmup };
  });
  const lastDone = needed.length > 0 && needed.every((l) => completed.has(l.level));
  const review: ReviewState = stats?.reviewPassed ? 'done' : lastDone ? 'current' : 'locked';
  const done =
    stations.filter((s) => !s.warmup && s.state === 'done').length + (review === 'done' ? 1 : 0);
  return {
    topic,
    index,
    stations,
    review,
    done,
    total: needed.length + 1,
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
  if (world.review === 'current' && !world.stations.some((s) => s.state === 'current'))
    return { kind: 'review' };
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
