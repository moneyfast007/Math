/**
 * When to offer signing in with an email, at the top of "מה היה היום?".
 *
 * Not on the first visit: only once there is something worth keeping (a few
 * days of practice), never on a device that already syncs, and never on the
 * day the parents' code was offered (one offer at a time). "לא עכשיו" puts it
 * off for a month; the second time is the end of it.
 *
 * Kept in browser storage: a convenience. Without it the banner may come
 * back, and nothing depends on it.
 */

export const OFFER_KEY = 'account-offer';
/** Days of practice (any child) before the offer. */
export const OFFER_AFTER_DAYS = 3;
const MONTH = 30 * 24 * 60 * 60 * 1000;

export interface OfferState {
  /** How many times "לא עכשיו" was tapped. */
  later: number;
  /** Not before this time (ms). */
  until: number;
  /** Signed up, or put off twice. */
  done: boolean;
}

const FRESH: OfferState = { later: 0, until: 0, done: false };

export function readOffer(): OfferState {
  try {
    const raw = localStorage.getItem(OFFER_KEY);
    if (!raw) return FRESH;
    const v = JSON.parse(raw) as Partial<OfferState>;
    return {
      later: typeof v.later === 'number' ? v.later : 0,
      until: typeof v.until === 'number' ? v.until : 0,
      done: v.done === true,
    };
  } catch {
    return { ...FRESH, done: true };
  }
}

function write(state: OfferState): void {
  try {
    localStorage.setItem(OFFER_KEY, JSON.stringify(state));
  } catch {
    // See above.
  }
}

export function shouldOffer({
  linked,
  practiceDays,
  otherOfferToday,
  state,
  now,
}: {
  linked: boolean;
  practiceDays: number;
  otherOfferToday: boolean;
  state: OfferState;
  now: number;
}): boolean {
  if (linked || state.done || otherOfferToday) return false;
  if (practiceDays < OFFER_AFTER_DAYS) return false;
  return now >= state.until;
}

/** "לא עכשיו": a month later, and the second time never again. */
export function putOff(state: OfferState, now: number): OfferState {
  const later = state.later + 1;
  return later >= 2 ? { later, until: 0, done: true } : { later, until: now + MONTH, done: false };
}

export function putOffOffer(now: number): void {
  write(putOff(readOffer(), now));
}

export function endOffer(): void {
  write({ ...readOffer(), done: true });
}

/** Distinct days on which any child practised. */
export function countPracticeDays(progress: Record<string, { days?: Record<string, unknown> }>): number {
  const days = new Set<string>();
  for (const p of Object.values(progress)) for (const d of Object.keys(p.days ?? {})) days.add(d);
  return days.size;
}
