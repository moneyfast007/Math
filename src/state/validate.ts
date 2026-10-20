import { isAvatarId } from '@/profiles/avatars';
import type { Grade } from '@/ui/ageBand';
import {
  DAYS_KEPT,
  MAX_LEVEL,
  MAX_NAME_LENGTH,
  MAX_PROFILES,
  MIN_LEVEL,
  RECENT_WINDOW,
  SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
  emptyStreak,
  type AppData,
  type DayStats,
  type PinRecord,
  type Profile,
  type ProfileProgress,
  type Streak,
  type TopicStats,
} from './schema';

/**
 * Strict validation of anything read from storage or from a backup file.
 *
 * Nothing from outside is trusted: a hand-edited backup, a file from another
 * app, or a half-written IndexedDB entry must be rejected with a reason a
 * parent can understand, never half-imported.
 *
 * Older schema versions are migrated while parsing: fields added later get
 * their defaults, so a backup from version 1 still imports (tested).
 */

export type ParseResult = { ok: true; data: AppData } | { ok: false; error: string };

class InvalidData extends Error {}

function fail(message: string): never {
  throw new InvalidData(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown, where: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${where}: צפוי אובייקט`);
  return value;
}

function finiteNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${where}: צפוי מספר`);
  return value;
}

function intInRange(value: unknown, min: number, max: number, where: string): number {
  const n = finiteNumber(value, where);
  if (!Number.isInteger(n) || n < min || n > max) fail(`${where}: ערך לא חוקי (${n})`);
  return n;
}

function nonEmptyString(value: unknown, maxLength: number, where: string): string {
  if (typeof value !== 'string') fail(`${where}: צפוי טקסט`);
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) fail(`${where}: אורך לא חוקי`);
  return trimmed;
}

function parseProfile(value: unknown, index: number): Profile {
  const where = `פרופיל ${index + 1}`;
  const p = record(value, where);
  const settings = record(p['settings'], `${where}, הגדרות`);
  const avatar = p['avatar'];
  const gender = p['gender'];
  const allowLevelChange = settings['allowLevelChange'];
  if (!isAvatarId(avatar)) fail(`${where}: דמות לא מוכרת`);
  if (gender !== 'f' && gender !== 'm') fail(`${where}: פנייה לא חוקית`);
  if (typeof allowLevelChange !== 'boolean') fail(`${where}: הגדרה לא חוקית`);
  const sounds = settings['sounds'];
  if (sounds !== undefined && typeof sounds !== 'boolean') fail(`${where}: הגדרה לא חוקית`);
  // Added later and optional: absent in older data.
  const introSeen = p['journeyIntroSeenAt'];
  return {
    id: nonEmptyString(p['id'], 64, `${where}, מזהה`),
    name: nonEmptyString(p['name'], MAX_NAME_LENGTH, `${where}, שם`),
    avatar,
    grade: intInRange(p['grade'], 0, 6, `${where}, כיתה`) as Grade,
    gender,
    createdAt: finiteNumber(p['createdAt'], `${where}, תאריך`),
    settings: { allowLevelChange, ...(sounds === undefined ? {} : { sounds }) },
    ...(introSeen === undefined
      ? {}
      : { journeyIntroSeenAt: finiteNumber(introSeen, `${where}, הסבר המסע`) }),
  };
}

function parseTopicStats(value: unknown, where: string): TopicStats {
  const s = record(value, where);
  const attempts = intInRange(s['attempts'], 0, Number.MAX_SAFE_INTEGER, `${where}, ניסיונות`);
  const correct = intInRange(s['correct'], 0, attempts, `${where}, תשובות נכונות`);
  const recentRaw = s['recent'];
  if (!Array.isArray(recentRaw) || recentRaw.some((r) => typeof r !== 'boolean')) {
    fail(`${where}: היסטוריה לא חוקית`);
  }
  const mistakesRaw = record(s['mistakes'], `${where}, טעויות`);
  const mistakes: Record<string, number> = {};
  for (const [kind, count] of Object.entries(mistakesRaw)) {
    mistakes[kind] = intInRange(count, 0, Number.MAX_SAFE_INTEGER, `${where}, טעויות`);
  }
  // Added in schema 2; absent in version 1 data.
  const completedRaw = s['completedLevels'] ?? [];
  if (!Array.isArray(completedRaw)) fail(`${where}: תחנות לא חוקיות`);
  const completedLevels = [
    ...new Set(completedRaw.map((l) => intInRange(l, MIN_LEVEL, MAX_LEVEL, `${where}, תחנה`))),
  ].sort((a, b) => a - b);
  const reviewPassed = s['reviewPassed'] ?? false;
  if (typeof reviewPassed !== 'boolean') fail(`${where}: סיכום לא חוקי`);
  return {
    level: intInRange(s['level'], MIN_LEVEL, MAX_LEVEL, `${where}, רמה`),
    attempts,
    correct,
    lastPracticedAt: finiteNumber(s['lastPracticedAt'], `${where}, תאריך`),
    recent: (recentRaw as boolean[]).slice(-RECENT_WINDOW),
    mistakes,
    completedLevels,
    reviewPassed,
  };
}

function parseStreak(value: unknown): Streak {
  if (value === undefined) return emptyStreak(); // schema 1
  const s = record(value, 'רצף');
  const raw = s['lastDay'];
  let lastDay: string | null = null;
  if (raw !== null) {
    if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) fail('רצף: תאריך לא חוקי');
    lastDay = raw;
  }
  return { count: intInRange(s['count'], 0, Number.MAX_SAFE_INTEGER, 'רצף'), lastDay };
}

/** Days of practice (schema 3); absent before. The most recent DAYS_KEPT are kept. */
function parseDays(value: unknown): Record<string, DayStats> {
  if (value === undefined) return {};
  const all = record(value, 'ימי תרגול');
  const out: Record<string, DayStats> = {};
  const keys = Object.keys(all)
    .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort()
    .slice(-DAYS_KEPT);
  for (const key of keys) {
    const d = record(all[key], 'יום תרגול');
    const exercises = intInRange(d['exercises'] ?? 0, 0, Number.MAX_SAFE_INTEGER, 'יום תרגול');
    out[key] = {
      exercises,
      correct: intInRange(d['correct'] ?? 0, 0, exercises, 'יום תרגול'),
      rounds: intInRange(d['rounds'] ?? 0, 0, Number.MAX_SAFE_INTEGER, 'יום תרגול'),
      daily: d['daily'] === true,
    };
  }
  return out;
}

function parseProgress(
  value: unknown,
  profileIds: ReadonlySet<string>,
): Record<string, ProfileProgress> {
  const all = record(value, 'התקדמות');
  const out: Record<string, ProfileProgress> = {};
  for (const [profileId, raw] of Object.entries(all)) {
    // Progress of a profile that no longer exists is dropped, not an error.
    if (!profileIds.has(profileId)) continue;
    out[profileId] = parseOneProgress(raw);
  }
  return out;
}

function parseOneProgress(raw: unknown): ProfileProgress {
  const p = record(raw, 'התקדמות');
  const topicsRaw = record(p['topics'], 'התקדמות');
  const topics: Record<string, TopicStats> = {};
  for (const [topicId, stats] of Object.entries(topicsRaw)) {
    topics[topicId] = parseTopicStats(stats, `התקדמות בנושא ${topicId}`);
  }
  return { topics, streak: parseStreak(p['streak']), days: parseDays(p['days']) };
}

function parsePin(value: unknown): PinRecord | null {
  if (value === null) return null;
  const pin = record(value, 'קוד הורים');
  return {
    salt: nonEmptyString(pin['salt'], 128, 'קוד הורים'),
    hash: nonEmptyString(pin['hash'], 128, 'קוד הורים'),
  };
}

function parseData(value: unknown): AppData {
  const d = record(value, 'נתונים');
  const version = d['schemaVersion'];
  if (typeof version !== 'number' || !SUPPORTED_SCHEMA_VERSIONS.includes(version)) {
    fail(`גרסת נתונים לא נתמכת (${String(version)})`);
  }
  const profilesRaw = d['profiles'];
  if (!Array.isArray(profilesRaw)) fail('רשימת הפרופילים חסרה');
  if (profilesRaw.length > MAX_PROFILES) fail(`יותר מ-${MAX_PROFILES} פרופילים`);
  const profiles = profilesRaw.map(parseProfile);
  const ids = new Set(profiles.map((p) => p.id));
  if (ids.size !== profiles.length) fail('מזהה פרופיל כפול');

  const parent = record(d['parent'], 'הגדרות הורים');
  const meta = record(d['meta'], 'מידע כללי');
  const lastBackupAt = meta['lastBackupAt'];

  return {
    schemaVersion: SCHEMA_VERSION,
    profiles,
    progress: parseProgress(d['progress'], ids),
    parent: { pin: parsePin(parent['pin']) },
    meta: {
      createdAt: finiteNumber(meta['createdAt'], 'מידע כללי'),
      lastBackupAt: lastBackupAt === null ? null : finiteNumber(lastBackupAt, 'תאריך גיבוי'),
    },
  };
}

function orNull<T>(parse: () => T): T | null {
  try {
    return parse();
  } catch (err) {
    if (err instanceof InvalidData) return null;
    throw err;
  }
}

/** One profile from elsewhere (the sync server), or null if it is not valid. */
export function safeProfile(value: unknown): Profile | null {
  return orNull(() => parseProfile(value, 0));
}

/** One child's progress from elsewhere (the sync server), or null if it is not valid. */
export function safeProgress(value: unknown): ProfileProgress | null {
  return orNull(() => parseOneProgress(value));
}

/** A PIN record from elsewhere: the record, null for "no PIN", undefined if not valid. */
export function safePin(value: unknown): PinRecord | null | undefined {
  try {
    return parsePin(value);
  } catch (err) {
    if (err instanceof InvalidData) return undefined;
    throw err;
  }
}

/** Validates a stored AppData document. */
export function parseAppData(value: unknown): ParseResult {
  try {
    return { ok: true, data: parseData(value) };
  } catch (err) {
    if (err instanceof InvalidData) return { ok: false, error: err.message };
    throw err;
  }
}

export const BACKUP_APP_ID = 'heshbon';

export interface BackupEnvelope {
  app: typeof BACKUP_APP_ID;
  kind: 'backup';
  schemaVersion: number;
  exportedAt: string;
  data: AppData;
}

/** Validates the contents of a backup file (the envelope around AppData). */
export function parseBackup(value: unknown): ParseResult {
  if (!isRecord(value) || value['app'] !== BACKUP_APP_ID || value['kind'] !== 'backup') {
    return { ok: false, error: 'זה לא קובץ גיבוי של האתר הזה' };
  }
  return parseAppData(value['data']);
}
