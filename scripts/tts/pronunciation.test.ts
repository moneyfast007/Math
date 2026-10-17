import { describe, expect, it } from 'vitest';
import { vocalizeForTts } from './pronunciation';

describe('vocalizeForTts', () => {
  it('reads the feminine teens as esre', () => {
    expect(vocalizeForTts('אחת עשרה בובות')).toBe('אחת עֶשְׂרֵה בובות');
    expect(vocalizeForTts('שבע עשרה גולות ועוד שלוש עשרה גולות.')).toBe(
      'שבע עֶשְׂרֵה גֻּלּוֹת ועוד שלוש עֶשְׂרֵה גֻּלּוֹת.',
    );
  });

  it('reads masculine ten as asara and feminine ten as eser', () => {
    expect(vocalizeForTts('עשרה כדורים')).toBe('עֲשָׂרָה כדורים');
    expect(vocalizeForTts('עשר בובות')).toBe('עֶשֶׂר בובות');
  });

  it('reads the masculine teens as asar', () => {
    expect(vocalizeForTts('אחד עשר כדורים')).toBe('אחד עָשָׂר כדורים');
    expect(vocalizeForTts('שנים עשר כדורים')).toBe('שְׁנֵים עָשָׂר כדורים');
  });

  it('vocalizes context-free words, keeping a ו prefix and punctuation', () => {
    expect(vocalizeForTts('כמה זה שתים עשרה לחלק לשלוש?')).toBe(
      'כמה זה שְׁתֵּים עֶשְׂרֵה לְחַלֵּק לשלוש?',
    );
    expect(vocalizeForTts('עשרים ושתיים')).toBe('עשרים ושְׁתַּיִם');
  });

  it('does not carry context across a sentence boundary', () => {
    expect(vocalizeForTts('יש שבע. עשרה כדורים')).toBe('יש שבע. עֲשָׂרָה כדורים');
  });

  it('leaves everything else untouched', () => {
    expect(vocalizeForTts('כמה זה שלוש ועוד חמש?')).toBe('כמה זה שלוש ועוד חמש?');
  });
});
