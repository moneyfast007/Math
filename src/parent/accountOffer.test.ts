import { describe, expect, it } from 'vitest';
import { countPracticeDays, putOff, shouldOffer, type OfferState } from './accountOffer';

const fresh: OfferState = { later: 0, until: 0, done: false };
const base = { linked: false, practiceDays: 3, otherOfferToday: false, state: fresh, now: 1000 };

describe('the offer to sign in with an email', () => {
  it('waits for a few days of practice', () => {
    expect(shouldOffer({ ...base, practiceDays: 0 })).toBe(false);
    expect(shouldOffer({ ...base, practiceDays: 2 })).toBe(false);
    expect(shouldOffer(base)).toBe(true);
  });

  it('is not shown on a synced device or on the day of another offer', () => {
    expect(shouldOffer({ ...base, linked: true })).toBe(false);
    expect(shouldOffer({ ...base, otherOfferToday: true })).toBe(false);
  });

  it('waits a month after "not now", and ends after the second', () => {
    const once = putOff(fresh, 1000);
    expect(shouldOffer({ ...base, state: once, now: 2000 })).toBe(false);
    expect(shouldOffer({ ...base, state: once, now: once.until })).toBe(true);
    const twice = putOff(once, once.until);
    expect(twice.done).toBe(true);
    expect(shouldOffer({ ...base, state: twice, now: once.until * 2 })).toBe(false);
  });

  it('counts days across children once', () => {
    expect(
      countPracticeDays({
        a: { days: { '2026-10-01': {}, '2026-10-02': {} } },
        b: { days: { '2026-10-02': {}, '2026-10-03': {} } },
        c: {},
      }),
    ).toBe(3);
  });
});
