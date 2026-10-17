import type { Noun } from '@/lang/hebrewNumbers';
import type { ObjectKind } from './types';

/**
 * Countable things for picture exercises and word problems. Each has its
 * grammatical gender and its plural spelled out, because Hebrew plurals do
 * not follow the gender (דבורה is feminine, its plural is דבורים).
 * Concrete, friendly objects a five-year-old knows by sight.
 */
export interface CountableNoun extends Noun, ObjectKind {}

export const NOUNS: readonly CountableNoun[] = [
  { id: 'apple', emoji: '🍎', singular: 'תפוח', plural: 'תפוחים', gender: 'm' },
  { id: 'balloon', emoji: '🎈', singular: 'בלון', plural: 'בלונים', gender: 'm' },
  { id: 'star', emoji: '⭐', singular: 'כוכב', plural: 'כוכבים', gender: 'm' },
  { id: 'fish', emoji: '🐟', singular: 'דג', plural: 'דגים', gender: 'm' },
  { id: 'butterfly', emoji: '🦋', singular: 'פרפר', plural: 'פרפרים', gender: 'm' },
  { id: 'cookie', emoji: '🍪', singular: 'עוגייה', plural: 'עוגיות', gender: 'f' },
  { id: 'candy', emoji: '🍬', singular: 'סוכרייה', plural: 'סוכריות', gender: 'f' },
  { id: 'bee', emoji: '🐝', singular: 'דבורה', plural: 'דבורים', gender: 'f' },
];
