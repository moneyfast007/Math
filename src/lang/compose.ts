import type { Gender } from './gender';
import { countNoun, numberParts, numberToWords, type Noun } from './hebrewNumbers';

/**
 * Spoken sentences assembled from clips.
 *
 * The audio bank cannot hold a recording of every sentence once numbers reach
 * the thousands, so a sentence is a template ("כמה זה {a} ועוד {b}?") whose
 * literal pieces are recorded once and whose numbers are recorded as number
 * clips. `compose` returns both the full text (for the screen reader and for
 * the small topics, which record whole sentences) and the clips to play.
 *
 * Slots:
 *   number            read in the feminine (abstract arithmetic)
 *   { n, gender }     read in that gender
 *   { n, noun }       number + noun with agreement: "שלושה תפוחים", "תפוח אחד"
 *   string            a word that becomes part of the surrounding clip (a name, a plural)
 */
export type Slot = number | { n: number; gender?: Gender; noun?: Noun } | string;

export interface Spoken {
  text: string;
  parts: string[];
  /**
   * The same sentence as it is written on screen: numbers in digits ("לסבא יש
   * 523 שקלים", not "חמש מאות עשרים ושלושה שקלים"), so a child reads the numbers
   * she has to work with. Absent for sentences not built by `compose`.
   */
  written?: string;
}

/**
 * Nouns a bare number in a template agrees with ("{n} קבוצות" → "שתי קבוצות",
 * "{k} שקלים" → "שבעה שקלים", "{t} עשרות" → "עשרת אחת"). Without this, a bare
 * number is read in the abstract (feminine) form: "שתיים קבוצות", "שבע שקלים".
 */
const AGREES: Record<string, Noun> = Object.fromEntries(
  (
    [
      ['קבוצה', 'קבוצות', 'f'],
      ['שורה', 'שורות', 'f'],
      ['נקודה', 'נקודות', 'f'],
      ['פעם', 'פעמים', 'f'],
      ['עשרת', 'עשרות', 'f'],
      ['יחידה', 'אחדות', 'f'],
      ['משבצת', 'משבצות', 'f'],
      ['צלע', 'צלעות', 'f'],
      ['זווית', 'זוויות', 'f'],
      ['פינה', 'פינות', 'f'],
      ['קודקוד', 'קודקודים', 'm'],
      ['חלק', 'חלקים', 'm'],
      ['שקל', 'שקלים', 'm'],
      ['ילד', 'ילדים', 'm'],
      ['מטר', 'מטרים', 'm'],
      ['סנטימטר', 'סנטימטרים', 'm'],
      ['קילומטר', 'קילומטרים', 'm'],
      ['אחוז', 'אחוזים', 'm'],
      ['מחלק', 'מחלקים', 'm'],
    ] as const
  ).map(([singular, plural, gender]) => [plural, { singular, plural, gender }]),
);

/** What to show for a sentence: digits when it has numbers. */
export function shown(s: Spoken): string {
  return s.written ?? s.text;
}

/** A slot as written: digits, with its noun. */
function writtenSlot(slot: Slot): string {
  if (typeof slot === 'string') return slot;
  const n = typeof slot === 'number' ? slot : slot.n;
  // Grouped (529,206) where it is shown, by groupDigits.
  const digits = String(n);
  if (typeof slot !== 'number' && slot.noun)
    return `${digits} ${n === 1 ? slot.noun.singular : slot.noun.plural}`;
  return digits;
}

interface Resolved {
  /** The slot as it appears in the text. */
  words: string;
  /** Number clips to play; empty when the whole slot is literal text. */
  clips: string[];
  /** Literal text that follows the clips (a noun's plural), or the whole slot. */
  tail: string;
}

/** A 1 or 2 with a noun is literal ("תפוח אחד", "שני תפוחים"): one clip with its surroundings. */
function resolve(slot: Slot): Resolved {
  if (typeof slot === 'string') return { words: slot, clips: [], tail: slot };
  const n = typeof slot === 'number' ? slot : slot.n;
  const gender = typeof slot === 'number' ? 'f' : (slot.noun?.gender ?? slot.gender ?? 'f');
  if (typeof slot !== 'number' && slot.noun && !Number.isInteger(n)) {
    // A decimal with its unit: "שלוש נקודה חמש סנטימטרים" (the unit in the plural, as said).
    const clips = decimalParts(n);
    return { words: `${clips.join(' ')} ${slot.noun.plural}`, clips, tail: slot.noun.plural };
  }
  if (typeof slot !== 'number' && slot.noun) {
    const words = countNoun(n, slot.noun);
    if (n <= 2) return { words, clips: [], tail: words };
    return { words, clips: numberParts(n, gender), tail: slot.noun.plural };
  }
  if (!Number.isInteger(n)) {
    const clips = decimalParts(n);
    return { words: clips.join(' '), clips, tail: '' };
  }
  return { words: numberToWords(n, gender), clips: numberParts(n, gender), tail: '' };
}

/**
 * A decimal read the way Israeli schools read it: the whole part, "נקודה", then
 * the digits after the point as a number, each leading zero read as "אפס".
 *   3.45 → שלוש נקודה ארבעים וחמש,  0.05 → אפס נקודה אפס חמש,  12.5 → שתים עשרה נקודה חמש
 */
export function decimalParts(x: number): string[] {
  if (x < 0) throw new RangeError('decimalParts: negative numbers are not supported');
  // Up to six decimal places; String() of such a number never uses exponent notation.
  const [whole = '0', frac = ''] = String(Math.round(x * 1e6) / 1e6).split('.');
  const parts = [...numberParts(Number(whole)), 'נקודה'];
  const zeros = /^0*/.exec(frac)?.[0].length ?? 0;
  for (let i = 0; i < zeros; i++) parts.push('אפס');
  const rest = frac.slice(zeros);
  if (rest) parts.push(...numberParts(Number(rest)));
  return parts;
}

const ONLY_PUNCTUATION = /^[\s.,:;!?()"'־-]*$/;

export function compose(template: string, slots: Readonly<Record<string, Slot>> = {}): Spoken {
  const parts: string[] = [];
  let text = '';
  let written = '';
  let buffer = '';
  const flush = () => {
    const piece = buffer.trim();
    if (piece && !ONLY_PUNCTUATION.test(piece)) parts.push(piece);
    buffer = '';
  };
  const tokens = template.split(/(\{\w+\})/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] ?? '';
    const m = /^\{(\w+)\}$/.exec(token);
    if (!m) {
      text += token;
      written += token;
      buffer += token;
      continue;
    }
    let slot = slots[m[1] ?? ''];
    // A bare whole number followed by a counted noun agrees with it (the noun moves into the slot).
    const n =
      typeof slot === 'number' ? slot : typeof slot === 'object' && !slot.noun ? slot.n : null;
    const next = /^ ([א-ת]+)/.exec(tokens[i + 1] ?? '');
    const noun = next ? AGREES[next[1] ?? ''] : undefined;
    if (n !== null && Number.isInteger(n) && n >= 1 && noun && next) {
      slot = { n, noun };
      tokens[i + 1] = (tokens[i + 1] ?? '').slice(next[0].length);
    }
    if (slot === undefined) {
      text += token;
      written += token;
      buffer += token;
      continue;
    }
    const { words, clips, tail } = resolve(slot);
    text += words;
    const w = writtenSlot(slot);
    // A prefix letter right before a number takes a hyphen: "מ-20", "ב-5".
    written += /[א-ת]$/.test(written) && /^\d/.test(w) ? `-${w}` : w;
    if (clips.length > 0) {
      // A number: everything before it is a clip of its own, then the number's clips.
      flush();
      parts.push(...clips);
    }
    buffer += tail;
  }
  flush();
  return { text, parts, written };
}
