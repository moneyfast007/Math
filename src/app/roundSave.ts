import type { SessionState } from '@/engine/session';

/**
 * A round left in the middle: kept on this device, so a child who comes back
 * to the same station (or the same final challenge) goes on from the exercise
 * she was at, not from the first. One round per child; kept for a week. The
 * exercises she answered were already counted in her progress as she went;
 * this keeps only where the round stood (how many done, how they went, the
 * scene's marks).
 *
 * Browser storage: a convenience. Without it a round starts over, as before.
 */

const PREFIX = 'plusi:round:';
const VERSION = 1;
const KEPT_MS = 7 * 24 * 60 * 60 * 1000;

export type SavedMode = 'level' | 'review';

export interface SavedRound {
  version: number;
  mode: SavedMode;
  savedAt: number;
  state: SessionState;
  marks: boolean[];
  seen: string[];
}

function looksLikeState(v: unknown): v is SessionState {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  const e = s['exercise'] as Record<string, unknown> | undefined;
  return (
    typeof s['topicId'] === 'string' &&
    typeof s['startLevel'] === 'number' &&
    typeof s['level'] === 'number' &&
    typeof s['done'] === 'number' &&
    typeof s['length'] === 'number' &&
    Array.isArray(s['history']) &&
    typeof e === 'object' &&
    e !== null &&
    typeof e['factId'] === 'string' &&
    typeof e['answer'] === 'number'
  );
}

/** The round to go on with: the same station, the same kind of round, from the last week. */
export function savedRound(
  profileId: string,
  match: { mode: SavedMode; topicId: string; startLevel: number },
  now = Date.now(),
): SavedRound | null {
  try {
    const raw = localStorage.getItem(PREFIX + profileId);
    if (!raw) return null;
    const r = JSON.parse(raw) as Partial<SavedRound>;
    if (r.version !== VERSION || r.mode !== match.mode) return null;
    if (typeof r.savedAt !== 'number' || now - r.savedAt > KEPT_MS) return null;
    if (!looksLikeState(r.state) || !Array.isArray(r.marks) || !Array.isArray(r.seen)) return null;
    if (r.state.topicId !== match.topicId || r.state.startLevel !== match.startLevel) return null;
    if (r.state.done <= 0 || r.state.done >= r.state.length) return null;
    if (r.state.phase === 'finished') return null;
    return r as SavedRound;
  } catch {
    return null;
  }
}

export function saveRound(
  profileId: string,
  round: Omit<SavedRound, 'version' | 'savedAt'>,
  now = Date.now(),
): void {
  try {
    localStorage.setItem(
      PREFIX + profileId,
      JSON.stringify({ ...round, version: VERSION, savedAt: now } satisfies SavedRound),
    );
  } catch {
    // Without storage the round starts over next time; nothing else changes.
  }
}

export function clearRound(profileId: string): void {
  try {
    localStorage.removeItem(PREFIX + profileId);
  } catch {
    // As above.
  }
}
