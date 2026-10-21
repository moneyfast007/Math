import type { ProfileProgress } from '@/state/schema';
import { worldsFor, type World } from './journey';
import type { Grade } from '@/ui/ageBand';
import type { Rng, Topic } from './types';

/**
 * Mixed rounds from stations she has already passed, so what she learned is
 * not forgotten. Two kinds:
 * - "תרגילי חזרה מכל העולמות" (daily, on the map of all worlds): from any of her worlds; worlds where her recent
 *   answers were weaker come up more often.
 * - "עוד תרגילים בעולם הזה" (world mix): from the world she is in only, every
 *   passed station alike.
 * Neither changes the journey: nothing is passed or opened by them.
 */

export interface DailyItem {
  topic: Topic;
  level: number;
  weight: number;
}

/** Recent first-try rate of a world, or a neutral 0.7 with too few answers to tell. */
function recentRate(recent: readonly boolean[] | undefined): number {
  if (!recent || recent.length < 3) return 0.7;
  return recent.filter(Boolean).length / recent.length;
}

/**
 * Stations she passed herself in a world. Those below where her grade starts
 * the world are shown as done, but she has not practised them here.
 */
export function passedStations(world: World, progress: ProfileProgress | undefined): number[] {
  const passed = new Set(progress?.topics[world.topic.id]?.completedLevels ?? []);
  return world.stations
    .filter((s) => s.state === 'done' && passed.has(s.level))
    .map((s) => s.level);
}

/** Every passed station of her grade's worlds, weighted (weaker worlds weigh more). */
export function dailyPool(grade: Grade, progress: ProfileProgress | undefined): DailyItem[] {
  const out: DailyItem[] = [];
  for (const world of worldsFor(grade, progress)) {
    const done = passedStations(world, progress);
    if (done.length === 0) continue;
    const weight = 0.5 + 2 * (1 - recentRate(progress?.topics[world.topic.id]?.recent));
    for (const level of done) out.push({ topic: world.topic, level, weight: weight / done.length });
  }
  return out;
}

/** The passed stations of one world, all alike; empty before the first station is passed. */
export function worldPool(world: World, progress: ProfileProgress | undefined): DailyItem[] {
  return passedStations(world, progress).map((level) => ({ topic: world.topic, level, weight: 1 }));
}

export function pickDaily(pool: readonly DailyItem[], rng: Rng): DailyItem {
  const total = pool.reduce((sum, i) => sum + i.weight, 0);
  let r = rng() * total;
  for (const item of pool) {
    r -= item.weight;
    if (r < 0) return item;
  }
  const last = pool.at(-1);
  if (!last) throw new RangeError('pickDaily: empty pool');
  return last;
}
