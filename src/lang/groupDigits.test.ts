import { describe, expect, it } from 'vitest';
import { groupDigits } from './groupDigits';

describe('groupDigits', () => {
  it('groups whole numbers of five digits or more', () => {
    expect(groupDigits('529206')).toBe('529,206');
    expect(groupDigits('529206   339196')).toBe('529,206   339,196');
    expect(groupDigits('24315 + 13472 = ?')).toBe('24,315 + 13,472 = ?');
    expect(groupDigits('1000000')).toBe('1,000,000');
    expect(groupDigits('10000')).toBe('10,000');
  });

  it('leaves short numbers, decimals and text alone', () => {
    expect(groupDigits('3456 + 12 = ?')).toBe('3456 + 12 = ?');
    expect(groupDigits('3.14159')).toBe('3.14159');
    expect(groupDigits('12345.678')).toBe('12,345.678');
    expect(groupDigits('305,000 > 298,999')).toBe('305,000 > 298,999');
    expect(groupDigits('מה ערך הספרה 5 במספר 352418?')).toBe('מה ערך הספרה 5 במספר 352,418?');
  });
});
