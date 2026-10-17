import type { Streak } from './schema';

/**
 * Days-in-a-row logic. Pure; the caller passes the clock.
 *
 * Rules (approved in phase 4):
 * - A day counts once, when a round is finished.
 * - Saturdays are skipped: they neither count nor break the streak. A child who
 *   practices Sunday–Friday has a streak that keeps growing week after week.
 *   Practicing on a Saturday still counts as a day.
 * - Any other missed day resets the count.
 *
 * Days are local calendar days ("YYYY-MM-DD"), because "today" for a child is
 * the day on her clock, not UTC.
 */

export function dayKey(at: number): string {
  const d = new Date(at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local midnight of a day key, as a Date. */
function dateOf(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

const SATURDAY = 6;

/** True when every day strictly between the two keys is a Saturday (or there is none). */
export function onlySaturdaysBetween(fromKey: string, toKey: string): boolean {
  const cursor = dateOf(fromKey);
  const end = dateOf(toKey);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor < end) {
    if (cursor.getDay() !== SATURDAY) return false;
    cursor.setDate(cursor.getDate() + 1);
  }
  return true;
}

/** The streak after finishing a round at `at`. */
export function advanceStreak(streak: Streak, at: number): Streak {
  const today = dayKey(at);
  if (streak.lastDay === today) return streak;
  if (
    streak.lastDay !== null &&
    streak.lastDay < today &&
    onlySaturdaysBetween(streak.lastDay, today)
  ) {
    return { count: streak.count + 1, lastDay: today };
  }
  // First ever day, a gap, or a clock that went backwards: start over.
  return { count: 1, lastDay: today };
}

/**
 * The number to show today: the stored count while the streak is still alive
 * (practiced today, or the only days since were Saturdays and today is not
 * over yet), otherwise zero.
 */
export function currentStreak(streak: Streak, now: number): number {
  if (streak.lastDay === null) return 0;
  const today = dayKey(now);
  if (streak.lastDay > today) return 0;
  return onlySaturdaysBetween(streak.lastDay, today) ? streak.count : 0;
}
