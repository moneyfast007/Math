import { countNoun, type Noun } from './hebrewNumbers';

/**
 * Fraction words: "שלושה רבעים", "חמישית אחת", "שני שלישים". The unit fraction
 * is a noun with its own gender and plural, so `countNoun` gives the agreement.
 */
export const FRACTION_NOUNS: Readonly<Record<number, Noun>> = {
  2: { singular: 'חצי', plural: 'חצאים', gender: 'm' },
  3: { singular: 'שליש', plural: 'שלישים', gender: 'm' },
  4: { singular: 'רבע', plural: 'רבעים', gender: 'm' },
  5: { singular: 'חמישית', plural: 'חמישיות', gender: 'f' },
  6: { singular: 'שישית', plural: 'שישיות', gender: 'f' },
  7: { singular: 'שביעית', plural: 'שביעיות', gender: 'f' },
  8: { singular: 'שמינית', plural: 'שמיניות', gender: 'f' },
  9: { singular: 'תשיעית', plural: 'תשיעיות', gender: 'f' },
  10: { singular: 'עשירית', plural: 'עשיריות', gender: 'f' },
  100: { singular: 'מאית', plural: 'מאיות', gender: 'f' },
  1000: { singular: 'אלפית', plural: 'אלפיות', gender: 'f' },
};

export function fractionNoun(den: number): Noun {
  const noun = FRACTION_NOUNS[den];
  if (!noun) throw new RangeError(`No Hebrew word for a denominator of ${den}`);
  return noun;
}

/** "3/4" for the screen (always inside <MathExpr>). */
export function displayFraction(num: number, den: number): string {
  return `${num}/${den}`;
}

/** "2 3/4": a mixed number for the screen. */
export function displayMixed(whole: number, num: number, den: number): string {
  return num === 0 ? String(whole) : `${whole} ${num}/${den}`;
}

/**
 * A fraction read aloud: "רבע", "שלושה רבעים", "שתי חמישיות", "חמש שמיניות".
 * A numerator of one is the unit word alone ("רבע", not "רבע אחד"), as people say it.
 * Half is special: "חצי", and "שני חצאים" for 2/2.
 */
export function fractionWords(num: number, den: number): string {
  const noun = fractionNoun(den);
  if (num === 1) return noun.singular;
  return countNoun(num, noun);
}
