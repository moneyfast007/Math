import {
  MAX_LEVEL,
  MIN_LEVEL,
  RECENT_WINDOW,
  type MistakeKind,
  type ProfileProgress,
  type TopicStats,
} from './schema';

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
    level: Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, attempt.level)),
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + (attempt.correct ? 1 : 0),
    lastPracticedAt: attempt.at,
    recent: [...(prev?.recent ?? []), attempt.correct].slice(-RECENT_WINDOW),
    mistakes,
  };
  return { topics: { ...progress.topics, [attempt.topicId]: next } };
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
