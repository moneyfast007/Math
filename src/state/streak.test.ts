import { describe, expect, it } from 'vitest';
import { advanceStreak, currentStreak, dayKey, onlySaturdaysBetween } from './streak';

/** Local noon of a date, so the day key is unambiguous. */
function at(y: number, m: number, d: number): number {
  return new Date(y, m - 1, d, 12).getTime();
}

// October 2026: Thu 15, Fri 16, Sat 17, Sun 18, Mon 19.
describe('streak', () => {
  it('uses local calendar days', () => {
    expect(dayKey(at(2026, 10, 17))).toBe('2026-10-17');
    expect(dayKey(new Date(2026, 9, 17, 23, 59).getTime())).toBe('2026-10-17');
  });

  it('counts a day once', () => {
    const s1 = advanceStreak({ count: 0, lastDay: null }, at(2026, 10, 15));
    expect(s1).toEqual({ count: 1, lastDay: '2026-10-15' });
    expect(advanceStreak(s1, at(2026, 10, 15) + 3600_000)).toEqual(s1);
  });

  it('grows on consecutive days and resets after a missed weekday', () => {
    let s = advanceStreak({ count: 0, lastDay: null }, at(2026, 10, 12)); // Mon
    s = advanceStreak(s, at(2026, 10, 13));
    s = advanceStreak(s, at(2026, 10, 14));
    expect(s.count).toBe(3);
    s = advanceStreak(s, at(2026, 10, 16)); // skipped Thursday
    expect(s).toEqual({ count: 1, lastDay: '2026-10-16' });
  });

  it('skips Shabbat: Friday to Sunday keeps the streak', () => {
    const fri = advanceStreak({ count: 4, lastDay: '2026-10-15' }, at(2026, 10, 16));
    expect(fri.count).toBe(5);
    const sun = advanceStreak(fri, at(2026, 10, 18));
    expect(sun).toEqual({ count: 6, lastDay: '2026-10-18' });
    expect(onlySaturdaysBetween('2026-10-16', '2026-10-18')).toBe(true);
    expect(onlySaturdaysBetween('2026-10-15', '2026-10-18')).toBe(false);
  });

  it('still counts a round on Shabbat itself', () => {
    const sat = advanceStreak({ count: 5, lastDay: '2026-10-16' }, at(2026, 10, 17));
    expect(sat).toEqual({ count: 6, lastDay: '2026-10-17' });
  });

  it('shows the count while the streak is alive, zero once it is broken', () => {
    const s = { count: 5, lastDay: '2026-10-16' }; // Friday
    expect(currentStreak(s, at(2026, 10, 16))).toBe(5);
    expect(currentStreak(s, at(2026, 10, 17))).toBe(5); // Saturday
    expect(currentStreak(s, at(2026, 10, 18))).toBe(5); // Sunday, not over yet
    expect(currentStreak(s, at(2026, 10, 19))).toBe(0); // Sunday was missed
    expect(currentStreak({ count: 0, lastDay: null }, at(2026, 10, 19))).toBe(0);
  });

  it('a clock that went backwards starts over instead of crashing', () => {
    expect(advanceStreak({ count: 3, lastDay: '2026-10-20' }, at(2026, 10, 18))).toEqual({
      count: 1,
      lastDay: '2026-10-18',
    });
    expect(currentStreak({ count: 3, lastDay: '2026-10-20' }, at(2026, 10, 18))).toBe(0);
  });
});
