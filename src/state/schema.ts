import type { Gender } from '@/lang/gender';
import type { AvatarId } from '@/profiles/avatars';
import type { Grade } from '@/ui/ageBand';

/**
 * Everything the app stores, as one document.
 *
 * One document (not one row per profile) keeps saving atomic and makes the
 * backup file a plain copy of it. It is a few kilobytes even after a year of
 * practice, because attempts are aggregated per topic, not logged one by one.
 *
 * Changing this shape means bumping SCHEMA_VERSION and adding a migration in
 * validate.ts; old backups must keep importing.
 */
export const SCHEMA_VERSION = 1;

export const MAX_PROFILES = 6;
export const MAX_NAME_LENGTH = 20;
/** How many recent results per topic are kept for "struggling / strong" signals. */
export const RECENT_WINDOW = 20;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

export interface ProfileSettings {
  /** Whether the child may change the difficulty level herself. */
  allowLevelChange: boolean;
}

export interface Profile {
  id: string;
  name: string;
  avatar: AvatarId;
  grade: Grade;
  /** Grammatical gender used to address the child. */
  gender: Gender;
  createdAt: number;
  settings: ProfileSettings;
}

/** What a parent fills in; id and timestamps are added by the store. */
export type ProfileInput = Pick<Profile, 'name' | 'avatar' | 'grade' | 'gender' | 'settings'>;

/**
 * Kinds of mistakes the exercise engine recognizes (phase 3). Stored as plain
 * strings so a backup from a newer version with a new kind still imports.
 */
export type MistakeKind =
  'wrongOperation' | 'offByOne' | 'digitReversal' | 'placeValue' | 'remainder' | 'other';

export interface TopicStats {
  /** Current difficulty level within the topic. */
  level: number;
  attempts: number;
  correct: number;
  lastPracticedAt: number;
  /** Most recent results, oldest first, at most RECENT_WINDOW entries. */
  recent: boolean[];
  /** Mistake kind → count. */
  mistakes: Record<string, number>;
}

export interface ProfileProgress {
  topics: Record<string, TopicStats>;
}

export interface PinRecord {
  salt: string;
  hash: string;
}

export interface ParentSettings {
  /** Optional 4-digit code that replaces the arithmetic question at the parent gate. */
  pin: PinRecord | null;
}

export interface AppMeta {
  createdAt: number;
  lastBackupAt: number | null;
}

export interface AppData {
  schemaVersion: typeof SCHEMA_VERSION;
  profiles: Profile[];
  /** profileId → progress. */
  progress: Record<string, ProfileProgress>;
  parent: ParentSettings;
  meta: AppMeta;
}

export function emptyAppData(now: number): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    profiles: [],
    progress: {},
    parent: { pin: null },
    meta: { createdAt: now, lastBackupAt: null },
  };
}

export function emptyProgress(): ProfileProgress {
  return { topics: {} };
}
