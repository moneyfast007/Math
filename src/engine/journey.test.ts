// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { emptyProgress, emptyTopicStats, type ProfileProgress } from '@/state/schema';
import { activeWorld, nextStop, stickersEarned, worldFor, worldsFor, worldsMap } from './journey';
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

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('worldFor', () => {
  it('gan stops world 2 at level 5; a gan child placed past it still has her stations to pass', () => {
    const fresh = worldFor(addSub20, 2, 0, undefined);
    expect(fresh.stations.map((s) => s.level)).toEqual([1, 2, 3, 4, 5]);
    // Gan starts at 3: stations 1–2 are warm-ups, not needed.
    expect(fresh.total).toBe(4);
    const past = worldFor(addSub20, 2, 0, progressAt(8));
    expect(past.stations.map((s) => s.state)).toEqual([
      'warmup',
      'warmup',
      'current',
      'skipped',
      'skipped',
    ]);
    expect(past.review).toBe('locked');
    expect(nextStop(past)).toEqual({ kind: 'level', level: 3 });
  });

  it('a new grade-2 child starts at her grade level; the stations before it are warm-ups', () => {
    const w = worldFor(addSub20, 1, 2, undefined);
    expect(w.stations.map((s) => s.state)).toEqual([
      ...Array.from({ length: 7 }, () => 'warmup'),
      'current',
      'locked',
      'locked',
    ]);
    expect(w.review).toBe('locked');
    expect(w.total).toBe(4);
    expect(w.done).toBe(0);
    expect(nextStop(w)).toEqual({ kind: 'level', level: 8 });
  });

  it('a kindergartener arrives at add-sub-20 past the counting stations (world 1 taught them)', () => {
    const w = worldFor(addSub20, 2, 0, undefined);
    expect(w.stations[2]?.state).toBe('current');
    expect(w.done).toBe(0);
  });

  it('only a passed station gets a check: jumping ahead leaves the stations between open', () => {
    // Grade 1 starts at 4; she jumped to 7 and passed it, so she is at 8.
    const w = worldFor(addSub20, 1, 1, progressAt(8, [4, 7]));
    expect(w.stations.map((s) => s.state)).toEqual([
      'warmup',
      'warmup',
      'warmup',
      'done',
      'skipped',
      'skipped',
      'done',
      'current',
      'locked',
      'locked',
    ]);
    expect(w.done).toBe(2);
  });

  it('after the last station, the big button goes back to the first one skipped', () => {
    const w = worldFor(addSub20, 1, 1, progressAt(10, [4, 5, 8, 9, 10]));
    expect(w.review).toBe('locked');
    expect(nextStop(w)).toEqual({ kind: 'level', level: 6 });
    expect(w.stations.find((s) => s.level === 6)?.state).toBe('current');
    expect(w.stations.find((s) => s.level === 7)?.state).toBe('skipped');
  });

  it('passed stations above the current level stay done after a level-down', () => {
    const w = worldFor(addSub20, 1, 1, progressAt(6, [4, 5, 8]));
    expect(w.stations.find((s) => s.level === 8)?.state).toBe('done');
    expect(w.stations.find((s) => s.level === 7)?.state).toBe('skipped');
    expect(w.stations.find((s) => s.level === 6)?.state).toBe('current');
    expect(w.stations.find((s) => s.level === 9)?.state).toBe('locked');
  });

  it('opens the review when every station of her grade is passed, and completes the world when it is passed', () => {
    const allDone = worldFor(addSub20, 1, 2, progressAt(10, range(8, 10)));
    expect(allDone.stations.filter((s) => !s.warmup).every((s) => s.state === 'done')).toBe(true);
    expect(allDone.review).toBe('current');
    expect(nextStop(allDone)).toEqual({ kind: 'review' });
    expect(allDone.completed).toBe(false);

    const passed = worldFor(addSub20, 1, 2, progressAt(10, range(8, 10), true));
    expect(passed.review).toBe('done');
    expect(passed.completed).toBe(true);
    expect(passed.done).toBe(4);
    // After the world: free practice at the top level.
    expect(nextStop(passed)).toEqual({ kind: 'level', level: 10 });
  });

  it('the review stays shut while a station of her grade is open', () => {
    const w = worldFor(addSub20, 1, 2, progressAt(10, [8, 10]));
    expect(w.review).toBe('locked');
    expect(nextStop(w)).toEqual({ kind: 'level', level: 9 });
  });

  it('the review passed early (imported data) does not complete a world with open stations', () => {
    const w = worldFor(addSub20, 1, 2, progressAt(8, [], true));
    expect(w.review).toBe('done');
    expect(w.completed).toBe(false);
  });
});

describe('worlds', () => {
  it('lists the grade’s topics in order and picks the first unfinished one', () => {
    const worlds = worldsFor(1, undefined);
    expect(worlds.map((w) => w.index)).toEqual(worlds.map((_, i) => i + 1));
    // Data is grade 1's last world, as in every grade that has it.
    expect(worlds.at(-1)?.topic.id).toBe('data');
    expect(worlds[0]?.topic.id).toBe(addSub20.id);
    expect(activeWorld(1, undefined)?.topic.id).toBe(addSub20.id);
    expect(stickersEarned(worlds)).toBe(0);
    const done = progressAt(10, range(1, 10), true);
    expect(stickersEarned(worldsFor(1, done))).toBe(1);
    expect(activeWorld(1, done)?.topic.id).toBe('numbers-100');
  });

  it('every grade has at least one world, in curriculum order', () => {
    for (const grade of [0, 1, 2, 3, 4, 5, 6] as const) {
      expect(worldsFor(grade, undefined).length, `grade ${grade}`).toBeGreaterThan(0);
    }
    expect(worldsFor(0, undefined).map((w) => w.topic.id)).toEqual([
      'count-10',
      'add-sub-20',
      'shapes',
    ]);
  });

  it('an older child without topics of her own gets the whole list', () => {
    expect(worldsFor(6, undefined).length).toBeGreaterThan(0);
  });
});

describe('worldsFor', () => {
  it('every grade, gan to grade 6, has worlds of its own, starting with world 1', () => {
    for (const grade of [0, 1, 2, 3, 4, 5, 6] as const) {
      const worlds = worldsFor(grade, undefined);
      expect(worlds.length, `grade ${grade}`).toBeGreaterThan(0);
      expect(worlds.every((w) => w.topic.grades.includes(grade))).toBe(true);
      expect(worlds[0]?.index).toBe(1);
    }
  });

  it('a grade-4 child starts in big numbers, not in counting', () => {
    expect(activeWorld(4, undefined)?.topic.id).toBe('big-numbers');
  });
});

describe('worldsMap', () => {
  it('a new child: the first world is open, every other one waits for the one before it', () => {
    const map = worldsMap(1, undefined);
    expect(map.map((e) => e.state)).toEqual(['current', ...map.slice(1).map(() => 'locked')]);
    expect(map[0]?.after).toBeNull();
    expect(map.slice(1).map((e) => e.after?.index)).toEqual(map.slice(1).map((_, i) => i + 1));
  });

  it('finished worlds are done wherever they are; a locked one waits for the closest unfinished', () => {
    const p = progressAt(10, range(1, 10), true); // world 1 (add-sub-20) finished
    p.topics['polygons'] = {
      ...emptyTopicStats(5),
      completedLevels: range(1, 5),
      reviewPassed: true,
    };
    const map = worldsMap(1, p);
    expect(map.slice(0, 4).map((e) => [e.world.topic.id, e.state])).toEqual([
      ['add-sub-20', 'done'],
      ['numbers-100', 'current'],
      ['polygons', 'done'],
      ['clock-money-1', 'locked'],
    ]);
    expect(map.at(-1)?.world.topic.id).toBe('data');
    expect(map.slice(4).every((e) => e.state === 'locked')).toBe(true);
    // World 3 is already done, so world 4 opens after world 2.
    expect(map[3]?.after?.topic.id).toBe('numbers-100');
    // The current world is the one the journey shows.
    expect(map.find((e) => e.state === 'current')?.world.topic.id).toBe(
      activeWorld(1, p)?.topic.id,
    );
  });

  it('everything finished: every world is done, none current', () => {
    const p = emptyProgress();
    for (const w of worldsFor(0, undefined)) {
      const last = w.stations.at(-1)?.level ?? 1;
      p.topics[w.topic.id] = {
        ...emptyTopicStats(last),
        completedLevels: range(1, last),
        reviewPassed: true,
      };
    }
    expect(worldsMap(0, p).every((e) => e.state === 'done')).toBe(true);
  });
});
