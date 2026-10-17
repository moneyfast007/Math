import { numberToWords } from './hebrewNumbers';

/**
 * Spoken forms of arithmetic expressions.
 *
 * The displayed text ("3 + 5 = ?") and the spoken text ("כמה זה שלוש ועוד חמש?")
 * are always two separate fields; this module builds the spoken one. Abstract
 * arithmetic is read in the feminine, as teachers do.
 */

export type Operator = '+' | '-' | '×' | '÷';

const OPERATOR_WORD: Record<Operator, string> = {
  '+': 'ועוד',
  '-': 'פחות',
  '×': 'כפול',
  '÷': 'לחלק ל',
};

/** "שלוש ועוד חמש", "תשע פחות ארבע", "שלוש כפול ארבע", "שתים עשרה לחלק לשלוש". */
export function spokenBinary(a: number, op: Operator, b: number): string {
  const left = numberToWords(a);
  const right = numberToWords(b);
  if (op === '÷') return `${left} ${OPERATOR_WORD[op]}${right}`;
  return `${left} ${OPERATOR_WORD[op]} ${right}`;
}

/** "כמה זה שלוש ועוד חמש?" */
export function spokenQuestion(a: number, op: Operator, b: number): string {
  return `כמה זה ${spokenBinary(a, op, b)}?`;
}

/** "שלוש ועוד חמש זה שמונה." Used for worked examples and hints. */
export function spokenEquation(a: number, op: Operator, b: number, result: number): string {
  return `${spokenBinary(a, op, b)} זה ${numberToWords(result)}.`;
}

/**
 * Display form, left-to-right, with proper typographic operators. The result
 * must always be rendered inside the `<MathExpr>` component so it keeps LTR order
 * inside the RTL page.
 */
export function displayBinary(a: number, op: Operator, b: number, result?: number): string {
  const rhs = result === undefined ? '?' : String(result);
  const opChar = op === '-' ? '−' : op;
  return `${a} ${opChar} ${b} = ${rhs}`;
}
