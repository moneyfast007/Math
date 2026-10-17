import { describe, expect, it } from 'vitest';
import { recordAttempt, summarizeProgress } from './progress';
import { emptyProgress, RECENT_WINDOW, type ProfileProgress } from './schema';

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
