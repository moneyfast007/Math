import type { ProfileProgress } from '@/state/schema';
import { worldsFor } from './journey';
import type { Grade } from '@/ui/ageBand';
import type { Rng, Topic } from './types';

/**
 * "חזרה של היום": a short round of exercises from stations she has already
 * passed, in any of her worlds, so what she learned is not forgotten. Worlds
 * where her recent answers were weaker come up more often.
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

/** Every passed station of her grade's worlds, weighted (weaker worlds weigh more). */
export function dailyPool(grade: Grade, progress: ProfileProgress | undefined): DailyItem[] {
  const out: DailyItem[] = [];
  for (const world of worldsFor(grade, progress)) {
    const done = world.stations.filter((s) => s.state === 'done').map((s) => s.level);
    if (done.length === 0) continue;
    const weight = 0.5 + 2 * (1 - recentRate(progress?.topics[world.topic.id]?.recent));
    for (const level of done) out.push({ topic: world.topic, level, weight: weight / done.length });
  }
  return out;
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
