import { describe, expect, it } from 'vitest';
import { fractionWords } from './fractions';

describe('fractionWords', () => {
  it('reads unit fractions as the word alone', () => {
    expect(fractionWords(1, 2)).toBe('חצי');
    expect(fractionWords(1, 4)).toBe('רבע');
    expect(fractionWords(1, 5)).toBe('חמישית');
  });

  it('agrees with the gender of the unit word', () => {
    expect(fractionWords(3, 4)).toBe('שלושה רבעים');
    expect(fractionWords(2, 3)).toBe('שני שלישים');
    expect(fractionWords(2, 5)).toBe('שתי חמישיות');
    expect(fractionWords(5, 8)).toBe('חמש שמיניות');
    expect(fractionWords(7, 10)).toBe('שבע עשיריות');
  });

  it('refuses a denominator it has no word for', () => {
    expect(() => fractionWords(1, 11)).toThrow(RangeError);
  });
});
