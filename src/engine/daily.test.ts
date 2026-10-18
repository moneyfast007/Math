import { describe, expect, it } from 'vitest';
import { emptyProgress, emptyTopicStats } from '@/state/schema';
import { dailyPool, pickDaily } from './daily';
import { seededRng } from './rng';

describe('daily review', () => {
  it('is empty before any station is passed (a new child in grade 4)', () => {
    expect(dailyPool(4, undefined)).toEqual([]);
  });

  it('holds the passed stations, and a weaker world weighs more', () => {
    const p = emptyProgress();
    p.topics['big-numbers'] = {
      ...emptyTopicStats(3),
      completedLevels: [1, 2],
      recent: Array.from({ length: 10 }, (_, i) => i < 4), // 40%
    };
    p.topics['long-mul-div'] = {
      ...emptyTopicStats(2),
      completedLevels: [1],
      recent: Array.from({ length: 10 }, () => true), // 100%
    };
    const pool = dailyPool(4, p);
    expect(pool.map((i) => `${i.topic.id}:${i.level}`)).toEqual([
      'big-numbers:1',
      'big-numbers:2',
      'long-mul-div:1',
    ]);
    const weightOf = (id: string) =>
      pool.filter((i) => i.topic.id === id).reduce((s, i) => s + i.weight, 0);
    expect(weightOf('big-numbers')).toBeGreaterThan(weightOf('long-mul-div'));

    const rng = seededRng(3);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) {
      const id = pickDaily(pool, rng).topic.id;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts['big-numbers'] ?? 0).toBeGreaterThan(counts['long-mul-div'] ?? 0);
  });
});
