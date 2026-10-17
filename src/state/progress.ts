import {
  emptyTopicStats,
  MAX_LEVEL,
  MIN_LEVEL,
  RECENT_WINDOW,
  type MistakeKind,
  type ProfileProgress,
  type TopicStats,
} from './schema';
import { advanceStreak } from './streak';

/**
 * Pure functions over progress data. The exercise engine (phase 3) calls
 * `recordAttempt`; the parent screen calls `summarizeProgress`.
 */

export interface Attempt {
  topicId: string;
  level: number;
  correct: boolean;
  mistake?: MistakeKind;
  at: number;
}

export function recordAttempt(progress: ProfileProgress, attempt: Attempt): ProfileProgress {
  const prev = progress.topics[attempt.topicId];
  const mistakes = { ...(prev?.mistakes ?? {}) };
  if (!attempt.correct && attempt.mistake) {
    mistakes[attempt.mistake] = (mistakes[attempt.mistake] ?? 0) + 1;
  }
  const next: TopicStats = {
    ...(prev ?? emptyTopicStats(attempt.level)),
    level: Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, attempt.level)),
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (attempt.correct ? 1 : 0),
    lastPracticedAt: attempt.at,
    recent: [...(prev?.recent ?? []), attempt.correct].slice(-RECENT_WINDOW),
    mistakes,
  };
  return { ...progress, topics: { ...progress.topics, [attempt.topicId]: next } };
}

/** Share of first-try answers that passes a station. */
export const STATION_PASS_RATE = 0.7;
/** The final station (mixed review) asks for a little more. */
export const REVIEW_PASS_RATE = 0.8;

export interface RoundResult {
  topicId: string;
  /** The level practiced, or 'review' for the topic's final station. */
  station: number | 'review';
  /** First-try answers out of `length`. */
  firstTry: number;
  length: number;
  at: number;
}

export interface RoundOutcome {
  progress: ProfileProgress;
  passed: boolean;
  /** The station was passed for the first time. */
  newlyCompleted: boolean;
  /** The level moved on to after passing (null when it did not change). */
  advancedTo: number | null;
  /** This round finished the whole topic: the review was passed just now. */
  worldCompleted: boolean;
}

/**
 * Applies a finished round: the day counts for the streak, a passed level is
 * marked as a completed station, and the child moves on to the next level.
 * A level that was not passed changes nothing but the streak (and the
 * per-attempt stats, recorded separately): there is no failure.
 */
export function completeRound(progress: ProfileProgress, r: RoundResult): RoundOutcome {
  const streak = advanceStreak(progress.streak, r.at);
  const prev =
    progress.topics[r.topicId] ??
    emptyTopicStats(typeof r.station === 'number' ? r.station : MAX_LEVEL);
  const rate = r.length > 0 ? r.firstTry / r.length : 0;

  if (r.station === 'review') {
    const passed = rate >= REVIEW_PASS_RATE;
    const newlyCompleted = passed && !prev.reviewPassed;
    const stats: TopicStats = {
      ...prev,
      reviewPassed: prev.reviewPassed || passed,
      lastPracticedAt: r.at,
    };
    return {
      progress: { ...progress, streak, topics: { ...progress.topics, [r.topicId]: stats } },
      passed,
      newlyCompleted,
      advancedTo: null,
      worldCompleted: newlyCompleted,
    };
  }

  const passed = rate >= STATION_PASS_RATE;
  const newlyCompleted = passed && !prev.completedLevels.includes(r.station);
  const completedLevels = newlyCompleted
    ? [...prev.completedLevels, r.station].sort((a, b) => a - b)
    : prev.completedLevels;
  // Move on only from the level she is at now; a revisit of an old station stays put.
  const advancedTo =
    passed && prev.level === r.station && r.station < MAX_LEVEL ? r.station + 1 : null;
  const stats: TopicStats = {
    ...prev,
    level: advancedTo ?? prev.level,
    completedLevels,
    lastPracticedAt: r.at,
  };
  return {
    progress: { ...progress, streak, topics: { ...progress.topics, [r.topicId]: stats } },
    passed,
    newlyCompleted,
    advancedTo,
    worldCompleted: false,
  };
}

/** A topic is "struggling" with at least this many recent results and a low recent rate. */
export const STRUGGLE_MIN_RECENT = 5;
export const STRUGGLE_THRESHOLD = 0.6;
/** A topic is "strong" with at least this many recent results and a high recent rate. */
export const STRONG_MIN_RECENT = 8;
export const STRONG_THRESHOLD = 0.9;

export interface ChildSummary {
  topicsPracticed: number;
  attempts: number;
  /** 0–1, or null before any attempt. */
  successRate: number | null;
  /** Topic ids, worst first. */
  struggling: string[];
  /** Topic ids, best first. */
  strong: string[];
  /** Most frequent mistake kinds across all topics, at most three. */
  topMistakes: { kind: string; count: number }[];
  lastPracticedAt: number | null;
}

function recentRate(stats: TopicStats): number {
  if (stats.recent.length === 0) return 0;
  return stats.recent.filter(Boolean).length / stats.recent.length;
}

export function summarizeProgress(progress: ProfileProgress | undefined): ChildSummary {
  const entries = Object.entries(progress?.topics ?? {}).filter(([, s]) => s.attempts > 0);
  const attempts = entries.reduce((n, [, s]) => n + s.attempts, 0);
  const correct = entries.reduce((n, [, s]) => n + s.correct, 0);

  const struggling = entries
    .filter(([, s]) => s.recent.length >= STRUGGLE_MIN_RECENT && recentRate(s) < STRUGGLE_THRESHOLD)
    .sort(([, a], [, b]) => recentRate(a) - recentRate(b))
    .map(([id]) => id);

  const strong = entries
    .filter(([, s]) => s.recent.length >= STRONG_MIN_RECENT && recentRate(s) >= STRONG_THRESHOLD)
    .sort(([, a], [, b]) => recentRate(b) - recentRate(a))
    .map(([id]) => id);

  const mistakeTotals = new Map<string, number>();
  for (const [, s] of entries) {
    for (const [kind, count] of Object.entries(s.mistakes)) {
      mistakeTotals.set(kind, (mistakeTotals.get(kind) ?? 0) + count);
    }
  }
  const topMistakes = [...mistakeTotals.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([kind, count]) => ({ kind, count }));

  const lastPracticedAt = entries.length
    ? Math.max(...entries.map(([, s]) => s.lastPracticedAt))
    : null;

  return {
    topicsPracticed: entries.length,
    attempts,
    successRate: attempts > 0 ? correct / attempts : null,
    struggling,
    strong,
    topMistakes,
    lastPracticedAt,
  };
}
