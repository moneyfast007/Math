// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { emptyProgress, emptyTopicStats } from '@/state/schema';
import { dailyPool, pickDaily, worldPool } from './daily';
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

describe('more of this world', () => {
  it('is empty before a station of the world is passed, then holds its passed stations alike', async () => {
    const { worldsFor } = await import('./journey');
    const p = emptyProgress();
    p.topics['add-sub-100'] = { ...emptyTopicStats(4), completedLevels: [1, 2, 3] };
    const worlds = worldsFor(2, p);
    const addSub = worlds[0]!;
    const numbers = worlds[1]!;
    expect(addSub.topic.id).toBe('add-sub-100');
    expect(worldPool(numbers, p)).toEqual([]);
    const pool = worldPool(addSub, p);
    expect(pool.map((i) => `${i.topic.id}:${i.level}:${i.weight}`)).toEqual([
      'add-sub-100:1:1',
      'add-sub-100:2:1',
      'add-sub-100:3:1',
    ]);
  });

  it('leaves out the warm-up stations shown as done but never practised', async () => {
    const { worldsFor } = await import('./journey');
    // Grade 2 starts polygons at station 6: stations 1–5 are warm-ups, not passed by her.
    const p = emptyProgress();
    p.topics['polygons'] = { ...emptyTopicStats(7), completedLevels: [6] };
    const polygons = worldsFor(2, p).find((w) => w.topic.id === 'polygons')!;
    expect(worldPool(polygons, p).map((i) => i.level)).toEqual([6]);
  });
});
