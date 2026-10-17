import { he } from '../../src/i18n/he';
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

export function uiPhrases(): Phrase[] {
  const out: Phrase[] = [];
  for (const [key, value] of Object.entries(he)) {
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

export function allPhrases(): Phrase[] {
  const all = [...uiPhrases(), ...numberPhrases()];
  // De-duplicate by text: two ids may legitimately share a text (e.g. "שמונה" f/m).
  const seen = new Set<string>();
  return all.filter((p) => {
    if (seen.has(p.text)) return false;
    seen.add(p.text);
    return true;
  });
}
