import type { Gender } from './gender';

/**
 * Hebrew number words, 0 to 999,999,999, in both grammatical genders.
 *
 * This is the backbone of every `spokenText`: the TTS engine never receives a
 * digit. Rules implemented (standard Israeli school usage, which is what the
 * girls hear from their teachers):
 *
 * - Units and teens change with gender (שלוש / שלושה, שלוש עשרה / שלושה עשר).
 * - Tens (עשרים...) do not. Hundreds take the feminine unit (שלוש מאות) because
 *   מאה is feminine. Thousands take the construct form for 3–10 (שלושת אלפים)
 *   and the masculine cardinal for 11+ (אחד עשר אלף, עשרים אלף).
 * - 2 is שתיים / שניים on its own; the construct form (שתי / שני) is used only
 *   before a noun, see `countNoun`.
 * - The conjunction ו is attached to the last group only:
 *   123 → מאה עשרים ושלוש, 105 → מאה וחמש, 1013 → אלף ושלוש עשרה.
 *
 * Abstract counting in arithmetic ("כמה זה שלוש ועוד חמש") is feminine, which
 * is the default here.
 */

const UNITS: Record<Gender, readonly string[]> = {
  f: ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'],
  m: ['', 'אחד', 'שניים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה'],
};

const TEENS: Record<Gender, readonly string[]> = {
  f: [
    'עשר',
    'אחת עשרה',
    'שתים עשרה',
    'שלוש עשרה',
    'ארבע עשרה',
    'חמש עשרה',
    'שש עשרה',
    'שבע עשרה',
    'שמונה עשרה',
    'תשע עשרה',
  ],
  m: [
    'עשרה',
    'אחד עשר',
    'שנים עשר',
    'שלושה עשר',
    'ארבעה עשר',
    'חמישה עשר',
    'שישה עשר',
    'שבעה עשר',
    'שמונה עשר',
    'תשעה עשר',
  ],
};

const TENS = ['', '', 'עשרים', 'שלושים', 'ארבעים', 'חמישים', 'שישים', 'שבעים', 'שמונים', 'תשעים'];

const HUNDREDS = [
  '',
  'מאה',
  'מאתיים',
  'שלוש מאות',
  'ארבע מאות',
  'חמש מאות',
  'שש מאות',
  'שבע מאות',
  'שמונה מאות',
  'תשע מאות',
];

/** Construct-state forms used before אלפים (3–10 thousand). */
const THOUSANDS_CONSTRUCT = [
  '',
  'אלף',
  'אלפיים',
  'שלושת אלפים',
  'ארבעת אלפים',
  'חמשת אלפים',
  'ששת אלפים',
  'שבעת אלפים',
  'שמונת אלפים',
  'תשעת אלפים',
  'עשרת אלפים',
];

export const MAX_NUMBER = 999_999_999;

/** Splits 0–999 into its spoken groups, without the conjunction. */
function groupsUnderThousand(n: number, gender: Gender): string[] {
  const groups: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) groups.push(HUNDREDS[hundreds] as string);
  if (rest >= 10 && rest < 20) {
    groups.push(TEENS[gender][rest - 10] as string);
  } else {
    const tens = Math.floor(rest / 10);
    const units = rest % 10;
    if (tens > 0) groups.push(TENS[tens] as string);
    if (units > 0) groups.push(UNITS[gender][units] as string);
  }
  return groups;
}

/** Spoken groups for the thousands part (1–999 thousand). */
function thousandsGroups(k: number): string[] {
  if (k <= 10) return [THOUSANDS_CONSTRUCT[k] as string];
  // 11 and up: masculine cardinal followed by the singular אלף.
  // The cardinal itself may be several groups (e.g. מאה עשרים ושלושה אלף).
  const words = joinWithVav(groupsUnderThousand(k, 'm'));
  return [`${words} אלף`];
}

function millionsGroups(k: number): string[] {
  if (k === 1) return ['מיליון'];
  if (k === 2) return ['שני מיליון'];
  const words = joinWithVav(groupsUnderThousand(k, 'm'));
  return [`${words} מיליון`];
}

/** Joins spoken groups, attaching ו to the final group when there is more than one. */
function joinWithVav(groups: string[]): string {
  if (groups.length === 0) return '';
  if (groups.length === 1) return groups[0] as string;
  const head = groups.slice(0, -1).join(' ');
  const last = groups[groups.length - 1] as string;
  return `${head} ו${last}`;
}

function assertValidInteger(n: number): void {
  if (!Number.isInteger(n)) throw new RangeError(`numberToWords: expected an integer, got ${n}`);
  if (n < 0) throw new RangeError(`numberToWords: negative numbers are not supported (${n})`);
  if (n > MAX_NUMBER) throw new RangeError(`numberToWords: ${n} exceeds ${MAX_NUMBER}`);
}

/**
 * Converts a non-negative integer to Hebrew words.
 *
 * @param n       0 ≤ n ≤ 999,999,999
 * @param gender  'f' (default, abstract counting) or 'm'
 */
export function numberToWords(n: number, gender: Gender = 'f'): string {
  assertValidInteger(n);
  if (n === 0) return 'אפס';

  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  const groups: string[] = [];
  if (millions > 0) groups.push(...millionsGroups(millions));
  if (thousands > 0) groups.push(...thousandsGroups(thousands));
  if (rest > 0) groups.push(...groupsUnderThousand(rest, gender));
  return joinWithVav(groups);
}

/**
 * A countable noun with the data needed to put a number in front of it.
 * The plural is stored explicitly because Hebrew plurals are irregular
 * (בובה → בובות, ילד → ילדים, שולחן → שולחנות).
 */
export interface Noun {
  singular: string;
  plural: string;
  gender: Gender;
}

/**
 * Number + noun phrase with correct agreement:
 *   1 → "בובה אחת" / "כדור אחד"      (noun first, number after)
 *   2 → "שתי בובות" / "שני כדורים"   (construct form)
 *   3+ → "שלוש בובות" / "שלושה כדורים", "אחת עשרה בובות", "עשרים ואחד כדורים"
 *   0 → "אפס בובות"
 */
export function countNoun(n: number, noun: Noun): string {
  assertValidInteger(n);
  if (n === 1) return `${noun.singular} ${UNITS[noun.gender][1] as string}`;
  if (n === 2) return `${noun.gender === 'f' ? 'שתי' : 'שני'} ${noun.plural}`;
  return `${numberToWords(n, noun.gender)} ${noun.plural}`;
}

/**
 * The same words as `numberToWords`, split into the clips the audio bank holds:
 * numbers under a thousand are one clip each (both genders), and bigger
 * numbers are assembled from them plus "אלף" / "מיליון". The invariant
 * `numberParts(n, g).join(' ') === numberToWords(n, g)` is property-tested.
 *
 * A single trailing group after thousands or millions carries the ו
 * ("ארבעת אלפים ושלוש מאות"), so those forms are clips of their own.
 */
export function numberParts(n: number, gender: Gender = 'f'): string[] {
  assertValidInteger(n);
  if (n < 1000) return [numberToWords(n, gender)];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions > 0) {
    if (millions === 1) parts.push('מיליון');
    else if (millions === 2) parts.push('שני מיליון');
    else parts.push(numberToWords(millions, 'm'), 'מיליון');
  }
  if (thousands > 0) {
    // After millions, a thousands group that ends the number carries the ו.
    const vav = millions > 0 && rest === 0 ? 'ו' : '';
    if (thousands <= 10) parts.push(`${vav}${THOUSANDS_CONSTRUCT[thousands] as string}`);
    else parts.push(`${vav}${numberToWords(thousands, 'm')}`, 'אלף');
  }
  if (rest > 0) {
    const words = numberToWords(rest, gender);
    parts.push(groupsUnderThousand(rest, gender).length === 1 ? `ו${words}` : words);
  }
  return parts;
}

/** The ו-prefixed forms `numberParts` emits for numbers up to a million, for the audio bank. */
export function vavForms(gender: Gender): string[] {
  const out: string[] = [];
  for (let n = 1; n <= 999; n++) {
    if (groupsUnderThousand(n, gender).length === 1) out.push(`ו${numberToWords(n, gender)}`);
  }
  if (gender === 'm') for (let k = 1; k <= 10; k++) out.push(`ו${THOUSANDS_CONSTRUCT[k] as string}`);
  return out;
}
