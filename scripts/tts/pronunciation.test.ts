import { describe, expect, it } from 'vitest';
import { vocalizeForTts } from './pronunciation';

describe('vocalizeForTts', () => {
  it('reads the feminine teens as esre', () => {
    expect(vocalizeForTts('אחת עשרה בובות')).toBe('אַחַת עֶשְׂרֵה בובות');
    // The unit is vocalized together with עשרה (shlosh esre), as the native speaker spelled it.
    expect(vocalizeForTts('שבע עשרה גולות ועוד שלוש עשרה גולות.')).toBe(
      'שְׁבַע עֶשְׂרֵה גֻּלּוֹת ועוד שְׁלוֹשׁ עֶשְׂרֵה גֻּלּוֹת.',
    );
  });

  it('reads masculine ten as asara and feminine ten as eser', () => {
    expect(vocalizeForTts('עשרה כדורים')).toBe('עֲשָׂרָה כדורים');
    expect(vocalizeForTts('עשר בובות')).toBe('עֶשֶׂר בובות');
  });

  it('leaves the masculine teens plain (they read correctly as they are)', () => {
    expect(vocalizeForTts('אחד עשר כדורים')).toBe('אחד עשר כדורים');
  });

  it('leaves number words that read well plain untouched', () => {
    expect(vocalizeForTts('כמה זה שבע כפול שמונה?')).toBe('כמה זה שבע כפול שמונה?');
    // Round 5: a native speaker's readings of ארבע and שתיים are applied everywhere.
    expect(vocalizeForTts('ארבע מאות שלושים ושתיים')).toBe('אַרְבַּע מאות שלושים וּשְׁתַּיִם');
    expect(vocalizeForTts('שלושה רבעים')).toBe('שלושה רבעים');
  });

  it('vocalizes the listed words and gives a ו prefix its vowel', () => {
    expect(vocalizeForTts('שלושת אלפים וחמש')).toBe('שלושת אֲלָפִים וחמש');
    expect(vocalizeForTts('כמה זה שש ועוד שבע?')).toBe('כמה זה שש ועוד שבע?');
    expect(vocalizeForTts('עשרים ושש')).toBe('עֶשְׂרִים ושש');
    expect(vocalizeForTts('הם מתחלקים לשש קבוצות שוות.')).toBe(
      'הם מתחלקים לְשֵׁשׁ קבוצות שָׁווֹת.',
    );
    expect(vocalizeForTts('כמה זה שתים עשרה לחלק לשלוש?')).toBe(
      'כמה זה שְׁתֵּים עֶשְׂרֵה לְחַלֵּק לשלוש?',
    );
  });

  it('does not split words that only start with ו', () => {
    expect(vocalizeForTts('ועוד')).toBe('ועוד');
    expect(vocalizeForTts('וילון')).toBe('וילון');
  });

  it('does not carry context across a sentence boundary', () => {
    expect(vocalizeForTts('יש שבע. עשרה כדורים')).toBe('יש שבע. עֲשָׂרָה כדורים');
  });
});
