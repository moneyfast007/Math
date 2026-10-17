import { describe, expect, it } from 'vitest';
import { createPinRecord, isValidPin, verifyPin } from './pin';

describe('pin', () => {
  it('accepts exactly four digits', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
  });

  it('verifies the right code and rejects others', async () => {
    const record = await createPinRecord('2580');
    expect(record.hash).not.toContain('2580');
    await expect(verifyPin('2580', record)).resolves.toBe(true);
    await expect(verifyPin('0000', record)).resolves.toBe(false);
    await expect(verifyPin('abc', record)).resolves.toBe(false);
  });

  it('salts each record', async () => {
    const a = await createPinRecord('1111');
    const b = await createPinRecord('1111');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
});
