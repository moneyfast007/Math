import { he } from '../../src/i18n/he';
import { allSpokenTexts } from '../../src/engine/registry';
import { numberToWords, vavForms } from '../../src/lang/hebrewNumbers';
import { spokenLabel } from '../../src/lang/spokenLabel';
import { NUMBER_PREFIXES } from '../../src/lang/compose';

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
  'journey.',
  'album.',
  'topic.',
  'level.',
  'plusi.',
  'audio.',
  'explain.',
  'practice.',
] as const;

function isSpoken(key: string): boolean {
  return SPOKEN_PREFIXES.some((p) => key.startsWith(p));
}

/** The literal pieces of a template, as `compose` will ask for them. */
function templatePieces(text: string): string[] {
  return text
    .split(/\{\w+\}/)
    .map((p) => p.trim())
    .filter((p) => p && !/^[\s.,:;!?()"'־-]*$/.test(p));
}

export function uiPhrases(): Phrase[] {
  const out: Phrase[] = [];
  for (const [key, value] of Object.entries(he)) {
    if (!isSpoken(key)) continue;
    const forms =
      typeof value === 'string' ? { f: value } : value.m === value.f ? { f: value.f } : value;
    for (const [g, raw] of Object.entries(forms)) {
      const id = typeof value === 'string' ? `ui.${key}` : `ui.${key}.${g}`;
      if (raw.includes('{')) {
        // Assembled at runtime (lang/compose): record the pieces between the slots.
        templatePieces(raw).forEach((text, i) => out.push({ id: `${id}.piece${i}`, text }));
      } else {
        out.push({ id, text: spokenLabel(raw) });
      }
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
  // The first clip of a number with a letter glued to it ("מעשר", "לשמונה"): see compose.ts.
  const plain = [...out.map((p) => p.text), 'אלף'];
  for (const prefix of NUMBER_PREFIXES)
    for (const text of new Set(plain))
      out.push({ id: `num.pre.${prefix}.${text}`, text: `${prefix}${text}` });
  out.push({ id: 'num.word.elef', text: 'אלף' });
  out.push({ id: 'num.word.million', text: 'מיליון' });
  out.push({ id: 'num.word.twoMillion', text: 'שני מיליון' });
  out.push({ id: 'num.word.point', text: 'נקודה' });
  // Groups after thousands or millions carry the ו ("ארבעת אלפים ושלוש מאות"); see numberParts.
  for (const g of ['f', 'm'] as const) {
    for (const text of vavForms(g)) out.push({ id: `num.vav.${g}.${text}`, text });
  }
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
