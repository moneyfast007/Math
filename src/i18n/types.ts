import type { Gender } from '@/lang/gender';

/**
 * A UI phrase. Either a plain string or a pair of gendered forms, because
 * Hebrew addresses the child differently: "נסי שוב" / "נסה שוב".
 *
 * `{name}`-style placeholders are interpolated by `t()`.
 */
export type Phrase = string | Readonly<Record<Gender, string>>;

export type Dictionary = Readonly<Record<string, Phrase>>;

/** Keys of a dictionary type, for typed `t()` calls. */
export type KeyOf<D extends Dictionary> = keyof D & string;

export interface TranslateOptions {
  /** Grammatical gender of the person being addressed. Defaults to feminine. */
  gender?: Gender;
  /** Values for `{placeholder}` tokens. */
  params?: Readonly<Record<string, string | number>>;
}
