import { numberToWords } from './hebrewNumbers';

/**
 * A short label read aloud: digits become words, because the voice must never
 * receive a digit (it would guess the gender and the reading).
 *
 *   "מספרים עד 10"   → "מספרים עד עשר"
 *   "כפל ב-10 וב-5"  → "כפל בעשר ובחמש"   (the hyphen after a prefix letter goes)
 *   "מספרים עד 10,000" → "מספרים עד עשרת אלפים"
 *
 * Abstract numbers are read in the feminine, as in the exercises.
 */
export function spokenLabel(text: string): string {
  return text.replace(
    /([בלמו])?-?(\d{1,3}(?:,\d{3})+|\d+)/g,
    (_m, prefix: string | undefined, num: string) => {
      return `${prefix ?? ''}${numberToWords(Number(num.replace(/,/g, '')))}`;
    },
  );
}
