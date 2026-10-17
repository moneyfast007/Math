import { describe, expect, it } from 'vitest';
import { vocalizeForTts } from './pronunciation';

describe('vocalizeForTts', () => {
  it('reads the feminine teens as esre', () => {
    expect(vocalizeForTts('אחת עשרה בובות')).toBe('אחת עֶשְׂרֵה בובות');
    expect(vocalizeForTts('שבע עשרה גולות ועוד שלוש עשרה גולות.')).toBe(
      'שֶׁבַע עֶשְׂרֵה גֻּלּוֹת ועוד שלוש עֶשְׂרֵה גֻּלּוֹת.',
    );
  });

  it('reads masculine ten as asara and feminine ten as eser', () => {
    expect(vocalizeForTts('עשרה כדורים')).toBe('עֲשָׂרָה כדורים');
    expect(vocalizeForTts('עשר בובות')).toBe('עֶשֶׂר בובות');
  });

  it('leaves the masculine teens plain (they read correctly as they are)', () => {
    expect(vocalizeForTts('אחד עשר כדורים')).toBe('אחד עשר כדורים');
  });

  it('vocalizes tens, hundreds and thousands', () => {
    expect(vocalizeForTts('עשרים ואחת בובות')).toBe('עֶשְׂרִים ואחת בובות');
    expect(vocalizeForTts('אלף מאתיים שלושים וארבע')).toBe('אֶלֶף מָאתַיִם שְׁלוֹשִׁים וארבע');
    expect(vocalizeForTts('שבע מאות שבעים ושבע')).toBe('שֶׁבַע מֵאוֹת שִׁבְעִים וְשֶׁבַע');
  });

  it('gives the conjunction ו its vowel: וּ before sheva and labials, וְ otherwise', () => {
    expect(vocalizeForTts('עשרים ושתיים')).toBe('עֶשְׂרִים וּשְׁתַּיִם');
    expect(vocalizeForTts('עשרים ואחד אלף ושש')).toBe('עֶשְׂרִים ואחד אֶלֶף וְשֵׁשׁ');
    expect(vocalizeForTts('מאה ומאתיים')).toBe('מֵאָה וּמָאתַיִם');
  });

  it('does not split words that only start with ו', () => {
    expect(vocalizeForTts('ועוד')).toBe('ועוד');
    expect(vocalizeForTts('וילון')).toBe('וילון');
  });

  it('vocalizes the words flagged in listening tests, keeping punctuation', () => {
    expect(vocalizeForTts('כמה זה שתים עשרה לחלק לשלוש?')).toBe(
      'כמה זה שְׁתֵּים עֶשְׂרֵה לְחַלֵּק לשלוש?',
    );
    expect(vocalizeForTts('כמעט. בואי ננסה ביחד.')).toBe('כמעט. בואי נְנַסֶּה ביחד.');
    expect(vocalizeForTts('הם מתחלקים לשש קבוצות שוות.')).toBe('הם מתחלקים לְשֵׁשׁ קבוצות שָׁווֹת.');
  });

  it('does not carry context across a sentence boundary', () => {
    expect(vocalizeForTts('יש שבע. עשרה כדורים')).toBe('יש שֶׁבַע. עֲשָׂרָה כדורים');
  });

  it('leaves unambiguous text untouched', () => {
    expect(vocalizeForTts('כמה זה שלוש ועוד ארבע?')).toBe('כמה זה שלוש ועוד ארבע?');
  });
});
