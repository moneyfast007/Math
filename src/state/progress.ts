import {
  DAYS_KEPT,
  emptyTopicStats,
  MAX_LEVEL,
  MIN_LEVEL,
  RECENT_WINDOW,
  type DayStats,
  type MistakeKind,
  type ProfileProgress,
  type TopicStats,
} from './schema';
import { advanceStreak, dayKey } from './streak';

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
  return {
    ...progress,
    topics: { ...progress.topics, [attempt.topicId]: next },
    days: bumpDay(progress.days, attempt.at, (d) => ({
      ...d,
      exercises: d.exercises + 1,
      correct: d.correct + (attempt.correct ? 1 : 0),
    })),
  };
}

const EMPTY_DAY: DayStats = { exercises: 0, correct: 0, rounds: 0, daily: false };

/** Updates one day's record, keeping only the most recent DAYS_KEPT days. */
export function bumpDay(
  days: Record<string, DayStats> | undefined,
  at: number,
  change: (d: DayStats) => DayStats,
): Record<string, DayStats> {
  const key = dayKey(at);
  const next = { ...(days ?? {}), [key]: change(days?.[key] ?? EMPTY_DAY) };
  const keys = Object.keys(next).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - DAYS_KEPT))) delete next[old];
  return next;
}

/**
 * A finished mixed round (more exercises from this world's passed stations):
 * counts for the streak and the day's rounds, passes and opens nothing.
 */
export function completeMixedRound(progress: ProfileProgress, at: number): ProfileProgress {
  return {
    ...progress,
    streak: advanceStreak(progress.streak, at),
    days: bumpDay(progress.days, at, (d) => ({ ...d, rounds: d.rounds + 1 })),
  };
}

/** A finished daily review: a mixed round that is also marked on the day. */
export function completeDaily(progress: ProfileProgress, at: number): ProfileProgress {
  const next = completeMixedRound(progress, at);
  return { ...next, days: bumpDay(next.days, at, (d) => ({ ...d, daily: true })) };
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
  /** The world's last level for this child (a younger grade may end earlier); 10 when absent. */
  lastLevel?: number;
  /**
   * The round dropped to an easier level part of the way (the child was stuck): it
   * counts for the streak, but it does not pass the station it was for.
   */
  eased?: boolean;
}

/**
 * Stars for a round, from its share of first-try answers: three from 90%, two from
 * the pass mark (70% for a station, 80% for the final challenge), one from 40%. Two
 * stars and more is a pass.
 */
export function starsFor(
  firstTry: number,
  length: number,
  passRate: number = STATION_PASS_RATE,
): 0 | 1 | 2 | 3 {
  const rate = length > 0 ? firstTry / length : 0;
  return rate >= 0.9 ? 3 : rate >= passRate ? 2 : rate >= 0.4 ? 1 : 0;
}

/** The best stars recorded for a station ('review' for the final challenge), or 0. */
export function bestStarsOf(stats: TopicStats | undefined, station: number | 'review'): number {
  return stats?.stars?.[String(station)] ?? 0;
}

/** The record of best stars with this round's, when it beats the old one. */
function withBest(stats: TopicStats, station: number | 'review', stars: number): TopicStats {
  if (stars <= bestStarsOf(stats, station)) return stats;
  return { ...stats, stars: { ...(stats.stars ?? {}), [String(station)]: stars } };
}

export interface RoundOutcome {
  progress: ProfileProgress;
  passed: boolean;
  /** This round's stars (0–3; a round that eased gets none past one), and the best before it. */
  stars: number;
  bestBefore: number;
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
    const stars = starsFor(r.firstTry, r.length, REVIEW_PASS_RATE);
    const stats: TopicStats = withBest(
      { ...prev, reviewPassed: prev.reviewPassed || passed, lastPracticedAt: r.at },
      'review',
      stars,
    );
    return {
      progress: {
        ...progress,
        streak,
        topics: { ...progress.topics, [r.topicId]: stats },
        days: bumpDay(progress.days, r.at, (d) => ({ ...d, rounds: d.rounds + 1 })),
      },
      passed,
      stars,
      bestBefore: bestStarsOf(prev, 'review'),
      newlyCompleted,
      advancedTo: null,
      worldCompleted: newlyCompleted,
    };
  }

  const passed = rate >= STATION_PASS_RATE && r.eased !== true;
  const newlyCompleted = passed && !prev.completedLevels.includes(r.station);
  const completedLevels = newlyCompleted
    ? [...prev.completedLevels, r.station].sort((a, b) => a - b)
    : prev.completedLevels;
  // Move on only from the level she is at now; a revisit of an old station stays put.
  const advancedTo =
    passed && prev.level === r.station && r.station < Math.min(MAX_LEVEL, r.lastLevel ?? MAX_LEVEL)
      ? r.station + 1
      : null;
  // A round that eased to an easier level shows its stars but can earn at most one.
  const stars = r.eased === true ? Math.min(1, starsFor(r.firstTry, r.length)) : starsFor(r.firstTry, r.length);
  const stats: TopicStats = withBest(
    { ...prev, level: advancedTo ?? prev.level, completedLevels, lastPracticedAt: r.at },
    r.station,
    stars,
  );
  return {
    progress: {
      ...progress,
      streak,
      topics: { ...progress.topics, [r.topicId]: stats },
      days: bumpDay(progress.days, r.at, (d) => ({ ...d, rounds: d.rounds + 1 })),
    },
    passed,
    stars,
    bestBefore: bestStarsOf(prev, r.station),
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
  /** Exercises answered right on the first try. */
  correct: number;
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
  // "Other" is every mistake the engine could not name: nothing a parent can act on.
  const topMistakes = [...mistakeTotals.entries()]
    .filter(([kind, count]) => count > 0 && kind !== 'other')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([kind, count]) => ({ kind, count }));

  const lastPracticedAt = entries.length
    ? Math.max(...entries.map(([, s]) => s.lastPracticedAt))
    : null;

  return {
    topicsPracticed: entries.length,
    attempts,
    correct,
    successRate: attempts > 0 ? correct / attempts : null,
    struggling,
    strong,
    topMistakes,
    lastPracticedAt,
  };
}

/** One day in the parents' weekly view. */
export interface WeekDay {
  key: string;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  exercises: number;
  correct: number;
  daily: boolean;
  /** Rounds finished that day (stations, the final challenge, mixed rounds). */
  rounds: number;
}

export interface WeekSummary {
  /** The last seven days, oldest first, ending today. */
  days: WeekDay[];
  daysPracticed: number;
  exercises: number;
  /** First-try rate over the week, or null without exercises. */
  rate: number | null;
  dailyReviews: number;
}

/** Rounds finished today: what the daily goal counts. */
export function roundsToday(progress: ProfileProgress | undefined, now: number): number {
  return progress?.days[dayKey(now)]?.rounds ?? 0;
}

/** Days of the week whose rounds reached the goal. */
export function goalDays(week: WeekSummary, goal: number): number {
  return week.days.filter((d) => d.rounds >= goal).length;
}

/** The last seven days of practice, for the parents' report. */
export function weekSummary(progress: ProfileProgress | undefined, now: number): WeekSummary {
  const days: WeekDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = new Date(now);
    date.setDate(date.getDate() - back);
    const key = dayKey(date.getTime());
    const d = progress?.days[key];
    days.push({
      key,
      weekday: date.getDay(),
      exercises: d?.exercises ?? 0,
      correct: d?.correct ?? 0,
      daily: d?.daily ?? false,
      rounds: d?.rounds ?? 0,
    });
  }
  const exercises = days.reduce((n, d) => n + d.exercises, 0);
  const correct = days.reduce((n, d) => n + d.correct, 0);
  return {
    days,
    daysPracticed: days.filter((d) => d.exercises > 0).length,
    exercises,
    rate: exercises > 0 ? correct / exercises : null,
    dailyReviews: days.filter((d) => d.daily).length,
  };
}
