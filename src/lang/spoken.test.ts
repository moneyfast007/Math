import { describe, expect, it } from 'vitest';
import { displayBinary, spokenEquation, spokenQuestion } from './spoken';

describe('spokenQuestion', () => {
  it('reads the four operations in the feminine', () => {
    expect(spokenQuestion(3, '+', 5)).toBe('כמה זה שלוש ועוד חמש?');
    expect(spokenQuestion(9, '-', 4)).toBe('כמה זה תשע פחות ארבע?');
    expect(spokenQuestion(3, '×', 4)).toBe('כמה זה שלוש כפול ארבע?');
    expect(spokenQuestion(12, '÷', 3)).toBe('כמה זה שתים עשרה לחלק לשלוש?');
    expect(spokenQuestion(10, '÷', 2)).toBe('כמה זה עשר לחלק לשתיים?');
  });
});

describe('spokenEquation', () => {
  it('reads a worked example', () => {
    expect(spokenEquation(3, '+', 5, 8)).toBe('שלוש ועוד חמש זה שמונה.');
  });
});

describe('displayBinary', () => {
  it('uses typographic operators and a question mark for the unknown', () => {
    expect(displayBinary(3, '+', 5)).toBe('3 + 5 = ?');
    expect(displayBinary(9, '-', 4, 5)).toBe('9 − 4 = 5');
    expect(displayBinary(3, '×', 4)).toBe('3 × 4 = ?');
    expect(displayBinary(12, '÷', 3)).toBe('12 ÷ 3 = ?');
  });
});
