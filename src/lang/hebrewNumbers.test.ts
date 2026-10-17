import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Gender } from './gender';
import { countNoun, MAX_NUMBER, numberParts, numberToWords, vavForms } from './hebrewNumbers';

describe('numberToWords, feminine (default)', () => {
  it.each<[number, string]>([
    [0, 'אפס'],
    [1, 'אחת'],
    [2, 'שתיים'],
    [3, 'שלוש'],
    [8, 'שמונה'],
    [10, 'עשר'],
    [11, 'אחת עשרה'],
    [12, 'שתים עשרה'],
    [15, 'חמש עשרה'],
    [19, 'תשע עשרה'],
    [20, 'עשרים'],
    [21, 'עשרים ואחת'],
    [22, 'עשרים ושתיים'],
    [30, 'שלושים'],
    [47, 'ארבעים ושבע'],
    [99, 'תשעים ותשע'],
    [100, 'מאה'],
    [101, 'מאה ואחת'],
    [105, 'מאה וחמש'],
    [110, 'מאה ועשר'],
    [113, 'מאה ושלוש עשרה'],
    [120, 'מאה ועשרים'],
    [123, 'מאה עשרים ושלוש'],
    [200, 'מאתיים'],
    [300, 'שלוש מאות'],
    [999, 'תשע מאות תשעים ותשע'],
    [1000, 'אלף'],
    [1001, 'אלף ואחת'],
    [1013, 'אלף ושלוש עשרה'],
    [1234, 'אלף מאתיים שלושים וארבע'],
    [2000, 'אלפיים'],
    [2005, 'אלפיים וחמש'],
    [3000, 'שלושת אלפים'],
    [10000, 'עשרת אלפים'],
    [11000, 'אחד עשר אלף'],
    [12000, 'שנים עשר אלף'],
    [20000, 'עשרים אלף'],
    [21000, 'עשרים ואחד אלף'],
    [100000, 'מאה אלף'],
    [200000, 'מאתיים אלף'],
    [300000, 'שלוש מאות אלף'],
    [432000, 'ארבע מאות שלושים ושניים אלף'],
    [432001, 'ארבע מאות שלושים ושניים אלף ואחת'],
    [1000000, 'מיליון'],
    [1000001, 'מיליון ואחת'],
    [2000000, 'שני מיליון'],
    [3500000, 'שלושה מיליון וחמש מאות אלף'],
  ])('%i → %s', (n, words) => {
    expect(numberToWords(n)).toBe(words);
  });
});

describe('numberToWords, masculine', () => {
  it.each<[number, string]>([
    [1, 'אחד'],
    [2, 'שניים'],
    [3, 'שלושה'],
    [5, 'חמישה'],
    [10, 'עשרה'],
    [11, 'אחד עשר'],
    [12, 'שנים עשר'],
    [13, 'שלושה עשר'],
    [21, 'עשרים ואחד'],
    [22, 'עשרים ושניים'],
    // Hundreds stay feminine regardless of the counted noun's gender.
    [300, 'שלוש מאות'],
    [303, 'שלוש מאות ושלושה'],
    [1002, 'אלף ושניים'],
  ])('%i → %s', (n, words) => {
    expect(numberToWords(n, 'm')).toBe(words);
  });
});

describe('numberToWords, input validation', () => {
  it('rejects negatives, fractions and out-of-range values', () => {
    expect(() => numberToWords(-1)).toThrow(RangeError);
    expect(() => numberToWords(1.5)).toThrow(RangeError);
    expect(() => numberToWords(MAX_NUMBER + 1)).toThrow(RangeError);
  });
});

describe('numberToWords, properties', () => {
  const anyInt = fc.integer({ min: 0, max: MAX_NUMBER });

  it('never contains a digit', () => {
    fc.assert(
      fc.property(anyInt, fc.constantFrom('f', 'm'), (n, g) => {
        expect(numberToWords(n, g)).not.toMatch(/\d/);
      }),
    );
  });

  it('has no double spaces or leading/trailing spaces', () => {
    fc.assert(
      fc.property(anyInt, (n) => {
        const w = numberToWords(n);
        expect(w).toBe(w.trim());
        expect(w).not.toMatch(/ {2}/);
      }),
    );
  });

  it('contains at most one conjunction per spoken group boundary and never a bare "ו"', () => {
    fc.assert(
      fc.property(anyInt, (n) => {
        const w = numberToWords(n);
        expect(w).not.toMatch(/(^| )ו( |$)/); // no standalone ו
        expect(w).not.toMatch(/וו/); // no doubled prefix
      }),
    );
  });

  it('gender affects only the unit/teen words, so 20, 30…90 and hundreds are identical', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 9 }), (t) => {
        expect(numberToWords(t * 10, 'f')).toBe(numberToWords(t * 10, 'm'));
        expect(numberToWords(t * 100, 'f')).toBe(numberToWords(t * 100, 'm'));
      }),
    );
  });

  it('is injective on 0–99,999: different numbers never produce the same words', () => {
    const seen = new Map<string, number>();
    for (let n = 0; n <= 99_999; n++) {
      const w = numberToWords(n);
      const prev = seen.get(w);
      expect(prev, `${n} and ${prev ?? ''} both read "${w}"`).toBeUndefined();
      seen.set(w, n);
    }
  });
});

describe('countNoun', () => {
  const doll = { singular: 'בובה', plural: 'בובות', gender: 'f' } as const;
  const ball = { singular: 'כדור', plural: 'כדורים', gender: 'm' } as const;

  it.each<[number, string, string]>([
    [0, 'אפס בובות', 'אפס כדורים'],
    [1, 'בובה אחת', 'כדור אחד'],
    [2, 'שתי בובות', 'שני כדורים'],
    [3, 'שלוש בובות', 'שלושה כדורים'],
    [10, 'עשר בובות', 'עשרה כדורים'],
    [11, 'אחת עשרה בובות', 'אחד עשר כדורים'],
    [12, 'שתים עשרה בובות', 'שנים עשר כדורים'],
    [21, 'עשרים ואחת בובות', 'עשרים ואחד כדורים'],
    [22, 'עשרים ושתיים בובות', 'עשרים ושניים כדורים'],
    [100, 'מאה בובות', 'מאה כדורים'],
  ])('%i → %s / %s', (n, fem, masc) => {
    expect(countNoun(n, doll)).toBe(fem);
    expect(countNoun(n, ball)).toBe(masc);
  });

  it('always ends with the noun (singular only for 1)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9999 }), (n) => {
        const phrase = countNoun(n, ball);
        if (n === 1) expect(phrase.startsWith(ball.singular)).toBe(true);
        else expect(phrase.endsWith(ball.plural)).toBe(true);
      }),
    );
  });
});

describe('numberParts', () => {
  it('is one clip under a thousand', () => {
    expect(numberParts(352)).toEqual(['שלוש מאות חמישים ושתיים']);
    expect(numberParts(7, 'm')).toEqual(['שבעה']);
  });

  it('assembles thousands and millions from clips, with the ו on a single last group', () => {
    expect(numberParts(4352)).toEqual(['ארבעת אלפים', 'שלוש מאות חמישים ושתיים']);
    expect(numberParts(4300)).toEqual(['ארבעת אלפים', 'ושלוש מאות']);
    expect(numberParts(4005)).toEqual(['ארבעת אלפים', 'וחמש']);
    expect(numberParts(23_000)).toEqual(['עשרים ושלושה', 'אלף']);
    expect(numberParts(23_017, 'm')).toEqual(['עשרים ושלושה', 'אלף', 'ושבעה עשר']);
    expect(numberParts(1_000_000)).toEqual(['מיליון']);
    expect(numberParts(1_004_000)).toEqual(['מיליון', 'וארבעת אלפים']);
    expect(numberParts(2_500_000)).toEqual(['שני מיליון', 'וחמש מאות', 'אלף']);
  });

  it('joins back to exactly the words, for every number and gender', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 999_999_999 }), fc.constantFrom('f', 'm'), (n, g) => {
        expect(numberParts(n, g as Gender).join(' ')).toBe(numberToWords(n, g as Gender));
      }),
    );
  });

  it('lists the ו forms the bank needs', () => {
    const f = vavForms('f');
    expect(f).toContain('ושלוש');
    expect(f).toContain('ושלוש מאות');
    expect(f).toContain('ואחת עשרה');
    expect(f).not.toContain('ושלוש מאות חמישים');
    expect(vavForms('m')).toContain('ועשרת אלפים');
  });
});
