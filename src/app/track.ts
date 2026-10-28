import { activeWorld, trackWorlds, type World } from '@/engine/journey';
import type { Profile, ProfileProgress } from '@/state/schema';

/**
 * A world beside the journey that the child is playing now (grade 4's practice
 * for the school's test): chosen on its own screen, left with "חזרה למסע". While
 * one is chosen, the journey's map and its rounds are that world's; the journey
 * itself stays where it was.
 *
 * Kept for this browser session (so an update's reload keeps her there), per
 * child. Browser storage is a convenience: without it the choice lives in memory.
 */

const PREFIX = 'plusi:track:';
const memory = new Map<string, string>();

export function trackOf(profileId: string): string | null {
  try {
    const kept = sessionStorage.getItem(PREFIX + profileId);
    if (kept) return kept;
  } catch {
    // Storage blocked: memory only.
  }
  return memory.get(profileId) ?? null;
}

export function enterTrack(profileId: string, topicId: string): void {
  memory.set(profileId, topicId);
  try {
    sessionStorage.setItem(PREFIX + profileId, topicId);
  } catch {
    // As above.
  }
}

export function leaveTrack(profileId: string): void {
  memory.delete(profileId);
  try {
    sessionStorage.removeItem(PREFIX + profileId);
  } catch {
    // As above.
  }
}

/** Grade 4's test practice shows for this child (the parent can hide it). */
export function showsTestPrep(profile: Profile): boolean {
  return profile.grade === 4 && profile.settings.testPrep !== false;
}

/** The world beside the journey she is playing, if any (and still hers). */
export function trackedWorld(
  profile: Profile,
  progress: ProfileProgress | undefined,
): World | undefined {
  const id = trackOf(profile.id);
  if (!id) return undefined;
  return trackWorlds(profile.grade, progress).find((w) => w.topic.id === id);
}

/** The world her map and rounds are about: one beside the journey she chose, else the journey's. */
export function currentWorld(
  profile: Profile,
  progress: ProfileProgress | undefined,
): World | undefined {
  return trackedWorld(profile, progress) ?? activeWorld(profile.grade, progress);
}
