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
  let buffer = '';
  const flush = () => {
    const piece = buffer.trim();
    if (piece && !ONLY_PUNCTUATION.test(piece)) parts.push(piece);
    buffer = '';
  };
  const tokens = template.split(/(\{\w+\})/);
  for (const token of tokens) {
    const m = /^\{(\w+)\}$/.exec(token);
    if (!m) {
      text += token;
      buffer += token;
      continue;
    }
    const slot = slots[m[1] ?? ''];
    if (slot === undefined) {
      text += token;
      buffer += token;
      continue;
    }
    const { words, clips, tail } = resolve(slot);
    text += words;
    if (clips.length > 0) {
      // A number: everything before it is a clip of its own, then the number's clips.
      flush();
      parts.push(...clips);
    }
    buffer += tail;
  }
  flush();
  return { text, parts };
}
