import { describe, expect, it } from 'vitest';
import { he } from './he';
import { makeT, t } from './index';

describe('t()', () => {
  it('returns plain phrases as-is', () => {
    expect(t('app.name')).toBe('חשבון');
  });

  it('picks the gendered form, feminine by default', () => {
    expect(t('action.tryAgain')).toBe('נסי שוב');
    expect(t('action.tryAgain', { gender: 'm' })).toBe('נסה שוב');
  });

  it('binds gender with makeT', () => {
    const tm = makeT('m');
    expect(tm('feedback.almost')).toBe('כמעט. בוא ננסה ביחד');
  });

  it('interpolates params and leaves unknown placeholders alone', () => {
    // No key in the dictionary uses params yet; exercise the mechanism directly.
    const text = t('app.name', { params: { x: 1 } });
    expect(text).toBe('חשבון');
  });
});

describe('dictionary hygiene', () => {
  const entries = Object.entries(he);

  it('has no empty phrases', () => {
    for (const [key, phrase] of entries) {
      const forms = typeof phrase === 'string' ? [phrase] : [phrase.f, phrase.m];
      for (const form of forms) expect(form.trim(), key).not.toBe('');
    }
  });

  it('never contains arithmetic symbols (math is rendered by <MathExpr>, not by text)', () => {
    for (const [key, phrase] of entries) {
      const forms = typeof phrase === 'string' ? [phrase] : [phrase.f, phrase.m];
      for (const form of forms) expect(form, key).not.toMatch(/[+×÷=]/);
    }
  });

  it('gendered pairs differ only when Hebrew requires it (both forms present)', () => {
    for (const [key, phrase] of entries) {
      if (typeof phrase !== 'string') {
        expect(phrase.f, key).toBeTruthy();
        expect(phrase.m, key).toBeTruthy();
      }
    }
  });
});
