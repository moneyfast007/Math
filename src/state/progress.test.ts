import { describe, expect, it } from 'vitest';
import { completeRound, recordAttempt, summarizeProgress } from './progress';
import {
  emptyProgress,
  emptyTopicStats,
  MAX_LEVEL,
  RECENT_WINDOW,
  type ProfileProgress,
} from './schema';

function practice(results: boolean[], topicId = 't', start: ProfileProgress = emptyProgress()) {
  return results.reduce(
    (p, correct, i) =>
      recordAttempt(p, {
        topicId,
        level: 2,
        correct,
        at: 1000 + i,
        ...(correct ? {} : { mistake: 'wrongOperation' as const }),
      }),
    start,
  );
}

describe('recordAttempt', () => {
  it('counts attempts, correct answers and mistakes', () => {
    const p = practice([true, false, true]);
    const t = p.topics['t'];
    expect(t?.attempts).toBe(3);
    expect(t?.correct).toBe(2);
    expect(t?.recent).toEqual([true, false, true]);
    expect(t?.mistakes).toEqual({ wrongOperation: 1 });
    expect(t?.lastPracticedAt).toBe(1002);
  });

  it('keeps a bounded recent window', () => {
    const p = practice(Array.from({ length: RECENT_WINDOW + 5 }, () => true));
    expect(p.topics['t']?.recent.length).toBe(RECENT_WINDOW);
    expect(p.topics['t']?.attempts).toBe(RECENT_WINDOW + 5);
  });

  it('does not mutate its input', () => {
    const before = practice([true]);
    const snapshot = JSON.stringify(before);
    recordAttempt(before, { topicId: 't', level: 2, correct: false, at: 5 });
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('clamps the level', () => {
    const p = recordAttempt(emptyProgress(), { topicId: 't', level: 99, correct: true, at: 0 });
    expect(p.topics['t']?.level).toBe(10);
  });
});

describe('summarizeProgress', () => {
  it('is empty before any practice', () => {
    expect(summarizeProgress(undefined)).toEqual({
      topicsPracticed: 0,
      attempts: 0,
      successRate: null,
      struggling: [],
      strong: [],
      topMistakes: [],
      lastPracticedAt: null,
    });
  });

  it('flags struggling and strong topics from recent results', () => {
    let p = practice([false, false, true, false, false, true], 'hard');
    p = practice(
      Array.from({ length: 10 }, () => true),
      'easy',
      p,
    );
    p = practice([false, false], 'tooFew', p); // not enough data to judge
    const s = summarizeProgress(p);
    expect(s.topicsPracticed).toBe(3);
    expect(s.attempts).toBe(18);
    expect(s.successRate).toBeCloseTo(12 / 18);
    expect(s.struggling).toEqual(['hard']);
    expect(s.strong).toEqual(['easy']);
    expect(s.topMistakes).toEqual([{ kind: 'wrongOperation', count: 6 }]);
  });
});

describe('completeRound', () => {
  const day = new Date(2026, 9, 14, 12).getTime();
  const base = (level: number) => {
    const p = emptyProgress();
    p.topics['t'] = { ...emptyTopicStats(level) };
    return p;
  };

  it('a passed station is recorded and the child moves on to the next level', () => {
    const out = completeRound(base(3), {
      topicId: 't',
      station: 3,
      firstTry: 8,
      length: 10,
      at: day,
    });
    expect(out.passed).toBe(true);
    expect(out.newlyCompleted).toBe(true);
    expect(out.advancedTo).toBe(4);
    expect(out.progress.topics['t']).toMatchObject({ level: 4, completedLevels: [3] });
    expect(out.progress.streak).toEqual({ count: 1, lastDay: '2026-10-14' });
  });

  it('a round below the pass rate changes only the streak', () => {
    const out = completeRound(base(3), {
      topicId: 't',
      station: 3,
      firstTry: 6,
      length: 10,
      at: day,
    });
    expect(out.passed).toBe(false);
    expect(out.advancedTo).toBeNull();
    expect(out.progress.topics['t']).toMatchObject({ level: 3, completedLevels: [] });
    expect(out.progress.streak.count).toBe(1);
  });

  it('revisiting an earlier station does not move the level', () => {
    const p = base(7);
    const out = completeRound(p, { topicId: 't', station: 2, firstTry: 10, length: 10, at: day });
    expect(out.advancedTo).toBeNull();
    expect(out.progress.topics['t']).toMatchObject({ level: 7, completedLevels: [2] });
    const again = completeRound(out.progress, {
      topicId: 't',
      station: 2,
      firstTry: 10,
      length: 10,
      at: day,
    });
    expect(again.newlyCompleted).toBe(false);
    expect(again.progress.topics['t']?.completedLevels).toEqual([2]);
  });

  it('the top level has nowhere to advance to', () => {
    const out = completeRound(base(MAX_LEVEL), {
      topicId: 't',
      station: MAX_LEVEL,
      firstTry: 9,
      length: 10,
      at: day,
    });
    expect(out.passed).toBe(true);
    expect(out.advancedTo).toBeNull();
    expect(out.progress.topics['t']?.level).toBe(MAX_LEVEL);
  });

  it('the review needs a higher rate and completes the world once', () => {
    const low = completeRound(base(MAX_LEVEL), {
      topicId: 't',
      station: 'review',
      firstTry: 7,
      length: 10,
      at: day,
    });
    expect(low.passed).toBe(false);
    expect(low.worldCompleted).toBe(false);
    const high = completeRound(base(MAX_LEVEL), {
      topicId: 't',
      station: 'review',
      firstTry: 8,
      length: 10,
      at: day,
    });
    expect(high.passed).toBe(true);
    expect(high.worldCompleted).toBe(true);
    expect(high.progress.topics['t']?.reviewPassed).toBe(true);
    const again = completeRound(high.progress, {
      topicId: 't',
      station: 'review',
      firstTry: 10,
      length: 10,
      at: day,
    });
    expect(again.worldCompleted).toBe(false);
  });

  it('works for a topic never practiced before', () => {
    const out = completeRound(emptyProgress(), {
      topicId: 'new',
      station: 1,
      firstTry: 6,
      length: 6,
      at: day,
    });
    expect(out.progress.topics['new']).toMatchObject({ level: 2, completedLevels: [1] });
  });
});

describe('the week and the days of practice (schema 3)', () => {
  it('records each exercise on its day, and the review and rounds', async () => {
    const { recordAttempt, completeRound, completeDaily, weekSummary } = await import('./progress');
    const { emptyProgress } = await import('./schema');
    const day = new Date(2026, 9, 18, 10).getTime();
    let p = emptyProgress();
    p = recordAttempt(p, { topicId: 'money', level: 1, correct: true, at: day });
    p = recordAttempt(p, { topicId: 'money', level: 1, correct: false, at: day });
    p = completeRound(p, { topicId: 'money', station: 1, firstTry: 1, length: 2, at: day }).progress;
    p = completeDaily(p, day);
    const week = weekSummary(p, day);
    expect(week.days).toHaveLength(7);
    expect(week.days.at(-1)).toMatchObject({ exercises: 2, correct: 1, daily: true });
    expect(week.daysPracticed).toBe(1);
    expect(week.rate).toBe(0.5);
    expect(week.dailyReviews).toBe(1);
    expect(p.days['2026-10-18']?.rounds).toBe(2);
  });

  it('keeps only about two months of days', async () => {
    const { bumpDay } = await import('./progress');
    const { DAYS_KEPT } = await import('./schema');
    let days = {};
    for (let i = 0; i < 100; i++)
      days = bumpDay(days, new Date(2026, 0, 1 + i, 12).getTime(), (d) => ({
        ...d,
        exercises: d.exercises + 1,
      }));
    expect(Object.keys(days)).toHaveLength(DAYS_KEPT);
  });
});
