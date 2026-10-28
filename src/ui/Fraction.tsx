import type { ReactNode } from 'react';

/**
 * Fractions written as in a school book: the numerator over the denominator,
 * a line between them; a mixed number with its whole beside them. The engine
 * writes "7/9" and "1 7/9"; this turns them into that wherever a child reads
 * them (the exercise, its buttons, its hints and its answer). A screen reader
 * gets the plain "1 7/9".
 */

/** A mixed number ("1 7/9") or a fraction ("7/9"); a whole needs one space before its fraction. */
const FRACTION = /(?:(\d+) )?(\d+)\/(\d+)/g;

export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="frac" aria-hidden="true">
      <span className="frac__num">{num}</span>
      <span className="frac__den">{den}</span>
    </span>
  );
}

/** One fraction or mixed number, stacked, with its plain form for screen readers. */
function Written({ whole, num, den }: { whole: string | undefined; num: string; den: string }) {
  const plain = `${whole ? `${whole} ` : ''}${num}/${den}`;
  return (
    <span className="mixed" dir="ltr">
      <span className="visually-hidden">{plain}</span>
      {whole ? (
        <span className="mixed__whole" aria-hidden="true">
          {whole}
        </span>
      ) : null}
      <Frac num={num} den={den} />
    </span>
  );
}

/** "או" between two numbers to choose from: smaller and lighter than the numbers (units stay as they are). */
const WORD = /(?<![\u05d0-\u05ea])או(?![\u05d0-\u05ea])/g;

function withWords(text: string): ReactNode {
  if (!text.includes('או')) return text;
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <span key={`w${at}`} className="math__word">
        {m[0]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/**
 * The text with every fraction and mixed number in it written stacked; `words`
 * (inside an expression): its Hebrew words set apart as words.
 */
export function withFractions(text: string, words = false): ReactNode {
  const plain = (part: string): ReactNode => (words ? withWords(part) : part);
  if (!text.includes('/')) return plain(text);
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(FRACTION)) {
    const at = m.index ?? 0;
    // Not part of a longer number before it ("12/3" is read whole; "a1 2/3" is not a mixed number).
    if (at > 0 && /[\d/]/.test(text[at - 1] ?? '')) continue;
    if (at > last) out.push(plain(text.slice(last, at)));
    out.push(<Written key={at} whole={m[1]} num={m[2] ?? ''} den={m[3] ?? ''} />);
    last = at + m[0].length;
  }
  if (out.length === 0) return plain(text);
  if (last < text.length) out.push(plain(text.slice(last)));
  return <>{out}</>;
}

/**
 * Where the answer slot is a fraction's numerator ("?/8") or denominator ("3/?"):
 * the text before and after it without that fraction's other number, and that
 * number, so the slot is drawn inside a stacked fraction. Null otherwise.
 */
export function slotFraction(
  before: string,
  after: string,
):
  | { before: string; after: string; den: string }
  | { before: string; after: string; num: string }
  | null {
  const den = /^\/(\d+)/.exec(after);
  if (den && !/\/\s*$/.test(before))
    return { before, after: after.slice(den[0].length), den: den[1] ?? '' };
  const num = /(\d+)\/$/.exec(before);
  if (num) return { before: before.slice(0, num.index), after, num: num[1] ?? '' };
  return null;
}
