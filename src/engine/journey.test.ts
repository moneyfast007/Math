import { describe, expect, it } from 'vitest';
import { emptyProgress, emptyTopicStats, type ProfileProgress } from '@/state/schema';
import { activeWorld, nextStop, stickersEarned, worldFor, worldsFor } from './journey';
import { addSub20 } from './topics/addSub20';

function progressAt(
  level: number,
  completed: number[] = [],
  reviewPassed = false,
): ProfileProgress {
  const p = emptyProgress();
  p.topics[addSub20.id] = { ...emptyTopicStats(level), completedLevels: completed, reviewPassed };
  return p;
}

describe('worldFor', () => {
  it('a new grade-2 child starts at her grade level with earlier stations done', () => {
    const w = worldFor(addSub20, 1, 2, undefined);
    expect(w.stations.map((s) => s.state)).toEqual([
      ...Array.from({ length: 7 }, () => 'done'),
      'current',
      'locked',
      'locked',
    ]);
    expect(w.review).toBe('locked');
    expect(w.total).toBe(11);
    expect(w.done).toBe(7);
    expect(nextStop(w)).toEqual({ kind: 'level', level: 8 });
  });

  it('a kindergartener starts at the first station', () => {
    const w = worldFor(addSub20, 1, 0, undefined);
    expect(w.stations[0]?.state).toBe('current');
    expect(w.done).toBe(0);
  });

  it('passed stations above the current level stay done after a level-down', () => {
    const w = worldFor(addSub20, 1, 2, progressAt(6, [8]));
    expect(w.stations.find((s) => s.level === 8)?.state).toBe('done');
    expect(w.stations.find((s) => s.level === 7)?.state).toBe('locked');
    expect(w.stations.find((s) => s.level === 6)?.state).toBe('current');
  });

  it('opens the review when every level is done, and completes the world when it is passed', () => {
    const allDone = worldFor(addSub20, 1, 2, progressAt(10, [10]));
    expect(allDone.stations.every((s) => s.state === 'done')).toBe(true);
    expect(allDone.review).toBe('current');
    expect(nextStop(allDone)).toEqual({ kind: 'review' });
    expect(allDone.completed).toBe(false);

    const passed = worldFor(addSub20, 1, 2, progressAt(10, [10], true));
    expect(passed.review).toBe('done');
    expect(passed.completed).toBe(true);
    expect(passed.done).toBe(11);
    // After the world: free practice at the top level.
    expect(nextStop(passed)).toEqual({ kind: 'level', level: 10 });
  });

  it('the review passed early (imported data) does not complete a world with open stations', () => {
    const w = worldFor(addSub20, 1, 2, progressAt(8, [], true));
    expect(w.review).toBe('done');
    expect(w.completed).toBe(false);
  });
});

describe('worlds', () => {
  it('lists the grade’s topics in order and picks the first unfinished one', () => {
    const worlds = worldsFor(2, undefined);
    expect(worlds.map((w) => w.index)).toEqual([1]);
    expect(activeWorld(2, undefined)?.topic.id).toBe(addSub20.id);
    expect(stickersEarned(worlds)).toBe(0);
    expect(stickersEarned(worldsFor(2, progressAt(10, [10], true)))).toBe(1);
  });

  it('an older child without topics of her own gets the whole list', () => {
    expect(worldsFor(6, undefined).length).toBeGreaterThan(0);
  });
});
