import { describe, expect, it } from 'vitest';
import { compose, decimalParts } from './compose';

const apple = { singular: 'תפוח', plural: 'תפוחים', gender: 'm' as const };

describe('compose', () => {
  it('splits a sentence into literal clips and number clips', () => {
    const s = compose('כמה זה {a} ועוד {b}?', { a: 4352, b: 7 });
    expect(s.text).toBe('כמה זה ארבעת אלפים שלוש מאות חמישים ושתיים ועוד שבע?');
    expect(s.parts).toEqual(['כמה זה', 'ארבעת אלפים', 'שלוש מאות חמישים ושתיים', 'ועוד', 'שבע']);
  });

  it('keeps names and plurals inside the surrounding clip', () => {
    const s = compose('{name} קנתה {a}. כמה {plural} יש?', {
      name: 'דנה',
      a: { n: 12, noun: apple },
      plural: apple.plural,
    });
    expect(s.text).toBe('דנה קנתה שנים עשר תפוחים. כמה תפוחים יש?');
    expect(s.parts).toEqual(['דנה קנתה', 'שנים עשר', 'תפוחים. כמה תפוחים יש?']);
  });

  it('a one or a two with a noun is literal text', () => {
    expect(compose('יש {a}.', { a: { n: 1, noun: apple } })).toEqual({
      text: 'יש תפוח אחד.',
      parts: ['יש תפוח אחד.'],
    });
    expect(compose('יש {a}.', { a: { n: 2, noun: apple } }).parts).toEqual(['יש שני תפוחים.']);
  });

  it('reads a number in the requested gender and drops punctuation-only pieces', () => {
    const s = compose('{a}, {b}.', { a: { n: 3, gender: 'm' }, b: 3 });
    expect(s.text).toBe('שלושה, שלוש.');
    expect(s.parts).toEqual(['שלושה', 'שלוש']);
  });

  it('leaves unknown placeholders alone', () => {
    expect(compose('שלום {x}', {}).text).toBe('שלום {x}');
  });
});

describe('decimals', () => {
  it('reads the part after the point as a number, leading zeros as אפס', () => {
    expect(decimalParts(3.45)).toEqual(['שלוש', 'נקודה', 'ארבעים וחמש']);
    expect(decimalParts(0.05)).toEqual(['אפס', 'נקודה', 'אפס', 'חמש']);
    expect(decimalParts(12.5)).toEqual(['שתים עשרה', 'נקודה', 'חמש']);
    expect(decimalParts(0.1 + 0.2)).toEqual(['אפס', 'נקודה', 'שלוש']);
  });

  it('a decimal slot in a sentence', () => {
    const s = compose('כמה זה {a} ועוד {b}?', { a: 1.5, b: 2.25 });
    expect(s.text).toBe('כמה זה אחת נקודה חמש ועוד שתיים נקודה עשרים וחמש?');
    expect(s.parts).toEqual(['כמה זה', 'אחת', 'נקודה', 'חמש', 'ועוד', 'שתיים', 'נקודה', 'עשרים וחמש']);
  });
});
