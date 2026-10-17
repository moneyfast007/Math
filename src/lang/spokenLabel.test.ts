import { describe, expect, it } from 'vitest';
import { he } from '@/i18n/he';
import { spokenLabel } from './spokenLabel';

describe('spokenLabel', () => {
  it('turns digits into words', () => {
    expect(spokenLabel('מספרים עד 10')).toBe('מספרים עד עשר');
    expect(spokenLabel('חיבור וחיסור עד 20')).toBe('חיבור וחיסור עד עשרים');
    expect(spokenLabel('מספרים עד 10,000')).toBe('מספרים עד עשרת אלפים');
  });

  it('drops the hyphen after a prefix letter', () => {
    expect(spokenLabel('כפל ב-10 וב-5')).toBe('כפל בעשר ובחמש');
    expect(spokenLabel('כפל ב-2')).toBe('כפל בשתיים');
  });

  it('leaves text without digits alone', () => {
    expect(spokenLabel('חיבור דו-ספרתי')).toBe('חיבור דו-ספרתי');
  });

  it('every topic and level name reads without digits', () => {
    for (const [key, value] of Object.entries(he)) {
      if (!key.startsWith('topic.') && !key.startsWith('level.')) continue;
      const text = typeof value === 'string' ? value : value.f;
      expect(spokenLabel(text), key).not.toMatch(/\d/);
    }
  });
});
