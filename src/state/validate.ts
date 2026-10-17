import { isAvatarId } from '@/profiles/avatars';
import type { Grade } from '@/ui/ageBand';
import {
  MAX_LEVEL,
  MAX_NAME_LENGTH,
  MAX_PROFILES,
  MIN_LEVEL,
  RECENT_WINDOW,
  SCHEMA_VERSION,
  type AppData,
  type PinRecord,
  type Profile,
  type ProfileProgress,
  type TopicStats,
} from './schema';

/**
 * Strict validation of anything read from storage or from a backup file.
 *
 * Nothing from outside is trusted: a hand-edited backup, a file from another
 * app, or a half-written IndexedDB entry must be rejected with a reason a
 * parent can understand, never half-imported.
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
  return {
    id: nonEmptyString(p['id'], 64, `${where}, מזהה`),
    name: nonEmptyString(p['name'], MAX_NAME_LENGTH, `${where}, שם`),
    avatar,
    grade: intInRange(p['grade'], 0, 6, `${where}, כיתה`) as Grade,
    gender,
    createdAt: finiteNumber(p['createdAt'], `${where}, תאריך`),
    settings: { allowLevelChange },
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
  return {
    level: intInRange(s['level'], MIN_LEVEL, MAX_LEVEL, `${where}, רמה`),
    attempts,
    correct,
    lastPracticedAt: finiteNumber(s['lastPracticedAt'], `${where}, תאריך`),
    recent: (recentRaw as boolean[]).slice(-RECENT_WINDOW),
    mistakes,
  };
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
    const topicsRaw = record(record(raw, 'התקדמות')['topics'], 'התקדמות');
    const topics: Record<string, TopicStats> = {};
    for (const [topicId, stats] of Object.entries(topicsRaw)) {
      topics[topicId] = parseTopicStats(stats, `התקדמות בנושא ${topicId}`);
    }
    out[profileId] = { topics };
  }
  return out;
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
  if (d['schemaVersion'] !== SCHEMA_VERSION) {
    fail(`גרסת נתונים לא נתמכת (${String(d['schemaVersion'])})`);
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
