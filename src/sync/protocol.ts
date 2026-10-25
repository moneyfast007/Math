import type { PinRecord, Profile, ProfileProgress } from '../state/schema';

/**
 * The sync protocol, shared by the app and the server (worker/).
 *
 * A family's data on the server has two parts:
 *
 * - The shared document: the children's profiles and the parents' PIN. Each
 *   entry carries the time it was last changed, and the later change wins
 *   (a removed profile is kept as a stamped `null`, so the removal wins too).
 * - One progress "slice" per device: what was practiced on that device. A
 *   device only ever writes its own slice, so two devices never overwrite each
 *   other; the app adds the slices up (src/sync/merge.ts). A child who
 *   practiced in the morning on the iPad and in the evening on the phone has
 *   both counted.
 *
 * This file has no imports at run time: the server bundles it as is.
 */

export interface Stamped<T> {
  value: T;
  /** When the value was last changed (the changing device's clock, ms). */
  at: number;
}

export interface SharedDoc {
  /** Profile id → the profile, or null once removed. */
  profiles: Record<string, Stamped<Profile | null>>;
  pin: Stamped<PinRecord | null>;
}

export interface Slice {
  /** Profile id → what was practiced on this device. */
  progress: Record<string, ProfileProgress>;
  /** Profile id → topic id → when this device last set the topic's level. */
  levelAt: Record<string, Record<string, number>>;
  /** When the slice was last changed. */
  at: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  createdAt: number;
  lastSeenAt: number;
}

export interface SyncRequest {
  shared: SharedDoc;
  slice: Slice;
}

export interface SyncResponse {
  deviceId: string;
  shared: SharedDoc;
  /** The other devices' slices (device id → slice), including removed devices'. */
  slices: Record<string, Slice>;
  devices: DeviceInfo[];
}

/** Creating a family or joining one: the device's credentials plus the family's data. */
export interface LinkResponse extends SyncResponse {
  token: string;
  familyId: string;
}

export interface PairCodeResponse {
  code: string;
  expiresAt: number;
}

export interface ErrorResponse {
  error: SyncErrorCode;
}

export type SyncErrorCode =
  | 'badRequest'
  | 'tooLarge'
  | 'unauthorized'
  | 'invalidCode'
  | 'rateLimited'
  | 'tooManyDevices'
  | 'notFound'
  | 'emailTaken'
  | 'badLogin';

export const LIMITS = {
  /** Request body, bytes. */
  body: 512_000,
  /** Shared document, serialized. */
  shared: 64_000,
  /** One device's slice, serialized. */
  slice: 256_000,
  devices: 10,
  deviceName: 40,
} as const;

export const PAIR_CODE_LENGTH = 6;

/* ---------- Signing in with an email and a password ---------- */

/**
 * The email is only a user name: no mail is ever sent to it, and the server
 * keeps a keyed hash of it, not the address. The password never leaves the
 * device either: the app stretches it (PBKDF2, salted with the email) into a
 * 32-byte key and sends that, base64url (src/sync/account.ts).
 */
export const PASSWORD_MIN = 6;
export const EMAIL_MAX = 254;
export const ACCOUNT_KEY = /^[A-Za-z0-9_-]{43}$/;

/** Lower case, no spaces around: the same address however it was typed. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmail(email: string): boolean {
  return email.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** An id for the "I want the extended version" tap: one per device. */
export const INTEREST_ID = /^[0-9a-f]{32}$/;
export const PAIR_CODE_TTL_MS = 10 * 60 * 1000;

export function emptyShared(): SharedDoc {
  return { profiles: {}, pin: { value: null, at: 0 } };
}

export function emptySlice(): Slice {
  return { progress: {}, levelAt: {}, at: 0 };
}

/** The later of two stamped values; a tie is broken the same way everywhere. */
export function newer<T>(a: Stamped<T>, b: Stamped<T>): Stamped<T> {
  if (a.at !== b.at) return a.at > b.at ? a : b;
  return JSON.stringify(a.value) >= JSON.stringify(b.value) ? a : b;
}

/** Merges two shared documents entry by entry; the later change wins. */
export function mergeShared(a: SharedDoc, b: SharedDoc): SharedDoc {
  const profiles: Record<string, Stamped<Profile | null>> = { ...a.profiles };
  for (const [id, entry] of Object.entries(b.profiles)) {
    const mine = profiles[id];
    profiles[id] = mine ? newer(mine, entry) : entry;
  }
  return { profiles, pin: newer(a.pin, b.pin) };
}

/* ---------- Light structural checks (the server's; the app validates fully) ---------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStamp(value: unknown): value is Stamped<unknown> {
  return (
    isRecord(value) &&
    typeof value['at'] === 'number' &&
    Number.isFinite(value['at']) &&
    (value['value'] === null || isRecord(value['value']))
  );
}

export function isSharedDoc(value: unknown): value is SharedDoc {
  if (!isRecord(value) || !isRecord(value['profiles']) || !isStamp(value['pin'])) return false;
  return Object.values(value['profiles']).every(isStamp);
}

export function isSlice(value: unknown): value is Slice {
  if (!isRecord(value) || typeof value['at'] !== 'number') return false;
  const progress = value['progress'];
  const levelAt = value['levelAt'];
  if (!isRecord(progress) || !isRecord(levelAt)) return false;
  return Object.values(progress).every(isRecord) && Object.values(levelAt).every(isRecord);
}

export function isSyncRequest(value: unknown): value is SyncRequest {
  return isRecord(value) && isSharedDoc(value['shared']) && isSlice(value['slice']);
}

/* ---------- Anonymous reports: "found a mistake" and the app's own errors ---------- */

/** Why a parent reported an exercise. */
export const MISTAKE_REASONS = ['answer', 'unclear', 'visual', 'other'] as const;
export type MistakeReason = (typeof MISTAKE_REASONS)[number];

/** An exercise reported as wrong. Nothing about the child: the exercise itself only. */
export interface MistakeReport {
  topic: string;
  level: number;
  fact: string;
  display: string;
  spoken: string;
  answer: number;
  /** The child's last wrong answer, when there was one. */
  given: number | null;
  reason: MistakeReason;
}

/** An error in the app: its message and where in the code (no data, no device). */
export interface CrashReport {
  message: string;
  where: string;
}

const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function isMistakeReport(v: unknown): v is MistakeReport {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    text(r['topic'], 60) &&
    num(r['level']) &&
    text(r['fact'], 120) &&
    text(r['display'], 200) &&
    text(r['spoken'], 400) &&
    num(r['answer']) &&
    (r['given'] === null || num(r['given'])) &&
    MISTAKE_REASONS.includes(r['reason'] as MistakeReason)
  );
}

export function isCrashReport(v: unknown): v is CrashReport {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return text(r['message'], 300) && r['message'] !== '' && text(r['where'], 300);
}
