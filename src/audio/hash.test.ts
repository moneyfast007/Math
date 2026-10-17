import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CLIP_ID_LENGTH, clipId, normalizeSpokenText } from './hash';

describe('clipId', () => {
  it('matches the Node implementation used by the build script', async () => {
    const text = 'כמה זה שלוש ועוד חמש?';
    const expected = createHash('sha256').update(text, 'utf8').digest('hex').slice(0, CLIP_ID_LENGTH);
    await expect(clipId(text)).resolves.toBe(expected);
  });

  it('ignores whitespace and normalization differences', async () => {
    const a = await clipId('  כמה זה   שלוש ועוד חמש?\n');
    const b = await clipId('כמה זה שלוש ועוד חמש?');
    expect(a).toBe(b);
  });

  it('is 16 lowercase hex characters', async () => {
    await expect(clipId('אפס')).resolves.toMatch(/^[0-9a-f]{16}$/);
  });

  it('normalizeSpokenText collapses whitespace', () => {
    expect(normalizeSpokenText(' א  ב\tג ')).toBe('א ב ג');
  });
});
