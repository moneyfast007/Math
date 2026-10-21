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
export const SCHEMA_VERSION = 3;
/** Versions `parseAppData` still accepts and migrates forward. */
export const SUPPORTED_SCHEMA_VERSIONS: readonly number[] = [1, 2, 3];

export const MAX_PROFILES = 6;
export const MAX_NAME_LENGTH = 20;
/** How many recent results per topic are kept for "struggling / strong" signals. */
export const RECENT_WINDOW = 20;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

/** How long a child's rounds are, relative to her age; a parent's choice. */
export type RoundLength = 'short' | 'normal' | 'long';
export const ROUND_LENGTH_OPTIONS: readonly RoundLength[] = ['short', 'normal', 'long'];
export function isRoundLength(value: unknown): value is RoundLength {
  return ROUND_LENGTH_OPTIONS.includes(value as RoundLength);
}

/** A day's goal in rounds; a parent's choice, off when absent. */
export type DailyGoal = 1 | 2 | 3;
export const DAILY_GOAL_OPTIONS: readonly DailyGoal[] = [1, 2, 3];
export function isDailyGoal(value: unknown): value is DailyGoal {
  return DAILY_GOAL_OPTIONS.includes(value as DailyGoal);
}

export interface ProfileSettings {
  /** Whether the child may change the difficulty level herself. */
  allowLevelChange: boolean;
  /** The small sounds of practice (a ding, a boop). Absent: on. Optional, so older data stays valid. */
  sounds?: boolean;
  /** Exercises per round, relative to the child's age (engine/session ROUND_LENGTHS). Absent: normal. */
  roundLength?: RoundLength;
  /** Rounds a day the parent asks for, shown to the child on the journey. Absent: no goal. */
  dailyGoal?: DailyGoal;
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
  /**
   * When the journey's first-time explainer ("how the worlds open") was shown
   * to this child. Absent until then. Optional, so data and backups saved
   * before it existed stay valid without a schema change.
   */
  journeyIntroSeenAt?: number;
}

/** What a parent fills in; id and timestamps are added by the store. */
export type ProfileInput = Pick<Profile, 'name' | 'avatar' | 'grade' | 'gender' | 'settings'>;

/**
 * Kinds of mistakes the exercise engine recognizes (phase 3). Stored as plain
 * strings so a backup from a newer version with a new kind still imports.
 */
export type MistakeKind =
  | 'wrongOperation'
  | 'offByOne'
  | 'digitReversal'
  | 'placeValue'
  | 'remainder'
  | 'carry'
  /** Subtracted the smaller digit from the bigger in a column, without borrowing (column subtraction). */
  | 'borrow'
  | 'offByTen'
  /** Counted the coins instead of what they are worth (phase 6). */
  | 'countedCoins'
  /** Read the hour from the minute hand, or the other way round (phase 6). */
  | 'clockHands'
  /** Order of operations: worked left to right instead of multiplying (or the brackets) first. */
  | 'order'
  /** Area, perimeter or volume mixed up (added the edges for a volume, the perimeter for an area). */
  | 'shapeFormula'
  /** The right digits with the decimal point in the wrong place (2.4 × 0.5 → 12 or 0.12). */
  | 'decimalPoint'
  | 'other';

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
  /** Levels ("stations") whose round was passed, ascending, no duplicates (phase 4). */
  completedLevels: number[];
  /** The topic's final station, a mixed review of all levels, was passed (phase 4). */
  reviewPassed: boolean;
}

/**
 * Days practiced in a row. A day counts once a round is finished. Saturdays
 * never break the streak (they are skipped, not counted), so a child who
 * practices Sunday to Friday keeps her streak.
 */
export interface Streak {
  count: number;
  /** Local calendar day of the last finished round, "YYYY-MM-DD", or null. */
  lastDay: string | null;
}

/** One day of practice (schema 3), for the parents' weekly report. */
export interface DayStats {
  /** Exercises finished (answered right, or revealed). */
  exercises: number;
  /** Of them, right on the first try. */
  correct: number;
  /** Rounds finished. */
  rounds: number;
  /** The day's review ("חזרה של היום") was done. */
  daily: boolean;
}

/** Days kept in `ProfileProgress.days`: about two months. */
export const DAYS_KEPT = 62;

export interface ProfileProgress {
  topics: Record<string, TopicStats>;
  streak: Streak;
  /** "YYYY-MM-DD" (local) → that day's practice; the last DAYS_KEPT days only. */
  days: Record<string, DayStats>;
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
  return { topics: {}, streak: emptyStreak(), days: {} };
}

export function emptyStreak(): Streak {
  return { count: 0, lastDay: null };
}

export function emptyTopicStats(level: number): TopicStats {
  return {
    level,
    attempts: 0,
    correct: 0,
    lastPracticedAt: 0,
    recent: [],
    mistakes: {},
    completedLevels: [],
    reviewPassed: false,
  };
}
