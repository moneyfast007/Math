import type { Gender } from '@/lang/gender';
import { he, type HebrewKey } from './he';
import type { Phrase, TranslateOptions } from './types';

export type { Gender };
export type TranslationKey = HebrewKey;

/** The active dictionary. Only Hebrew exists today; the shape is language-neutral. */
const dictionary: Readonly<Record<TranslationKey, Phrase>> = he;

function resolve(phrase: Phrase, gender: Gender): string {
  return typeof phrase === 'string' ? phrase : phrase[gender];
}

function interpolate(text: string, params?: TranslateOptions['params']): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

/**
 * Looks up a UI phrase.
 *
 *   t('action.tryAgain', { gender: 'f' })   → "נסי שוב"
 *   t('greeting', { params: { name: 'נועה' } })
 */
export function t(key: TranslationKey, options: TranslateOptions = {}): string {
  const phrase = dictionary[key];
  return interpolate(resolve(phrase, options.gender ?? 'f'), options.params);
}

/** Convenience for components that address one child: binds the gender once. */
export function makeT(gender: Gender) {
  return (key: TranslationKey, params?: TranslateOptions['params']): string =>
    t(key, params === undefined ? { gender } : { gender, params });
}
