import { he } from '../../src/i18n/he';
import { allSpokenTexts } from '../../src/engine/registry';
import { numberToWords } from '../../src/lang/hebrewNumbers';

/**
 * The fixed phrase bank: everything the app can say that does not depend on a
 * generated exercise. Each phrase is identified by a stable id (for diffing and
 * review) and stored by the hash of its text (how the app finds it).
 *
 * Phase 1 covers UI phrases and the number words; later phases add hints,
 * encouragement, fractions, decimals and the word-problem templates.
 */
export interface Phrase {
  id: string;
  text: string;
}

/**
 * Only child-facing UI is spoken. Parent screens, install instructions and
 * labels are read by adults and are never voiced, so they are not generated.
 */
const SPOKEN_PREFIXES = [
  'action.',
  'feedback.',
  'child.',
  'audio.',
  'explain.',
  'practice.',
] as const;

function isSpoken(key: string, text: string): boolean {
  // Phrases with {placeholders} are assembled at runtime from smaller clips.
  return SPOKEN_PREFIXES.some((p) => key.startsWith(p)) && !text.includes('{');
}

export function uiPhrases(): Phrase[] {
  const out: Phrase[] = [];
  for (const [key, value] of Object.entries(he)) {
    const sample = typeof value === 'string' ? value : value.f;
    if (!isSpoken(key, sample)) continue;
    if (typeof value === 'string') out.push({ id: `ui.${key}`, text: value });
    else {
      out.push({ id: `ui.${key}.f`, text: value.f });
      if (value.m !== value.f) out.push({ id: `ui.${key}.m`, text: value.m });
    }
  }
  return out;
}

/** 0–999 in both genders, plus the round thousands and millions used as building blocks. */
export function numberPhrases(): Phrase[] {
  const out: Phrase[] = [];
  for (let n = 0; n <= 999; n++) {
    out.push({ id: `num.f.${n}`, text: numberToWords(n, 'f') });
    const m = numberToWords(n, 'm');
    if (m !== numberToWords(n, 'f')) out.push({ id: `num.m.${n}`, text: m });
  }
  for (const k of [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]) {
    out.push({ id: `num.${k}`, text: numberToWords(k) });
  }
  out.push({ id: 'num.word.elef', text: 'אלף' });
  out.push({ id: 'num.word.million', text: 'מיליון' });
  return out;
}

/** Every sentence the exercise engine can say: questions, hints, solutions. */
export function exercisePhrases(): Phrase[] {
  return allSpokenTexts().map((text, i) => ({ id: `ex.${i}`, text }));
}

export function allPhrases(): Phrase[] {
  const all = [...uiPhrases(), ...numberPhrases(), ...exercisePhrases()];
  // De-duplicate by text: two ids may legitimately share a text (e.g. "שמונה" f/m).
  const seen = new Set<string>();
  return all.filter((p) => {
    if (seen.has(p.text)) return false;
    seen.add(p.text);
    return true;
  });
}
