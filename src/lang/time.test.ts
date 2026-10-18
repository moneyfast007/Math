import { describe, expect, it } from 'vitest';
import { digitalTime, durationWords, fromMinutes, timeWords, toMinutes, wrapHour } from './time';

describe('telling the time in Hebrew', () => {
  it('reads whole, half and quarter hours', () => {
    expect(timeWords({ h: 3, m: 0 })).toBe('שלוש');
    expect(timeWords({ h: 3, m: 30 })).toBe('שלוש וחצי');
    expect(timeWords({ h: 3, m: 15 })).toBe('שלוש ורבע');
    expect(timeWords({ h: 2, m: 45 })).toBe('רבע לשלוש');
    expect(timeWords({ h: 12, m: 45 })).toBe('רבע לאחת');
    expect(timeWords({ h: 11, m: 45 })).toBe('רבע לשתים עשרה');
    expect(timeWords({ h: 1, m: 45 })).toBe('רבע לשתיים');
  });

  it('refuses minutes it does not teach', () => {
    expect(() => timeWords({ h: 3, m: 10 })).toThrow();
  });

  it('wraps hours around the dial', () => {
    expect(wrapHour(13)).toBe(1);
    expect(wrapHour(0)).toBe(12);
    expect(wrapHour(12)).toBe(12);
    expect(digitalTime({ h: 13, m: 5 })).toBe('1:05');
    expect(fromMinutes(toMinutes({ h: 11, m: 30 }) + 60)).toEqual({ h: 12, m: 30 });
    expect(fromMinutes(toMinutes({ h: 12, m: 30 }) + 60)).toEqual({ h: 1, m: 30 });
  });

  it('reads durations', () => {
    expect(durationWords(30)).toBe('חצי שעה');
    expect(durationWords(60)).toBe('שעה');
    expect(durationWords(90)).toBe('שעה וחצי');
    expect(durationWords(120)).toBe('שעתיים');
    expect(durationWords(150)).toBe('שעתיים וחצי');
    expect(durationWords(180)).toBe('שלוש שעות');
  });
});
