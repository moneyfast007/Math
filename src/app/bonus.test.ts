// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { opensIdioms, sha256 } from './bonus';

// The family's email is not written here either (the code is public): only what it is checked with.
describe("one family's bonus world", () => {
  it('compares SHA-256 digests in hex', async () => {
    expect(await sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('stays closed for any other email', async () => {
    expect(await opensIdioms('someone@example.com')).toBe(false);
    expect(await opensIdioms('')).toBe(false);
  });
});
