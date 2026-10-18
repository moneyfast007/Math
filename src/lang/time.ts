import type { ClockTime } from '@/engine/types';

/**
 * Telling the time in Hebrew, the way children hear it: "שלוש", "שלוש וחצי",
 * "שלוש ורבע", "רבע לשלוש". Hours 1–12 (feminine, as for hours). Only whole,
 * half and quarter hours: minutes are grade 3.
 */
export const HOUR_WORDS = [
  'אחת',
  'שתיים',
  'שלוש',
  'ארבע',
  'חמש',
  'שש',
  'שבע',
  'שמונה',
  'תשע',
  'עשר',
  'אחת עשרה',
  'שתים עשרה',
] as const;

/** 1–12, wrapping: 13 → 1, 0 → 12. */
export function wrapHour(h: number): number {
  return ((((h - 1) % 12) + 12) % 12) + 1;
}

export function hourWord(h: number): string {
  return HOUR_WORDS[wrapHour(h) - 1] as string;
}

export function timeWords({ h, m }: ClockTime): string {
  switch (m) {
    case 0:
      return hourWord(h);
    case 15:
      return `${hourWord(h)} ורבע`;
    case 30:
      return `${hourWord(h)} וחצי`;
    case 45:
      return `רבע ל${hourWord(h + 1)}`;
    default:
      throw new RangeError(`timeWords: only whole, half and quarter hours (${h}:${m})`);
  }
}

/** "3:30", as on a digital clock (no leading zero on the hour, as children see it). */
export function digitalTime({ h, m }: ClockTime): string {
  return `${wrapHour(h)}:${String(m).padStart(2, '0')}`;
}

/** Minutes since 12:00, for comparing and adding times on a 12-hour dial. */
export function toMinutes({ h, m }: ClockTime): number {
  return (wrapHour(h) % 12) * 60 + m;
}

export function fromMinutes(total: number): ClockTime {
  const t = ((total % 720) + 720) % 720;
  return { h: wrapHour(Math.floor(t / 60)), m: t % 60 };
}

/** A length of time in half hours, as words: "חצי שעה", "שעה וחצי", "שעתיים", "שלוש שעות". */
export function durationWords(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const half = minutes % 60 === 30;
  if (minutes % 30 !== 0 || minutes <= 0) throw new RangeError(`durationWords: ${minutes}`);
  const whole =
    hours === 0 ? '' : hours === 1 ? 'שעה' : hours === 2 ? 'שעתיים' : `${hourWord(hours)} שעות`;
  if (!half) return whole;
  return whole ? `${whole} וחצי` : 'חצי שעה';
}
