import { t, makeT, type TranslationKey } from '@/i18n';
import { topicLabel } from '@/i18n/labels';
import { summarizeProgress } from '@/state/progress';
import { nextStop, type World } from '@/engine/journey';
import type { Profile, ProfileProgress } from '@/state/schema';
import { dayKey } from '@/state/streak';

/**
 * Shared by design C's entry screen and parents' area (?ui=c): what a child did
 * today, where she is, and one sentence of guidance. Pure, over stored data only.
 */

/* ---------- "Create the first child" straight from the welcome ---------- */

let newChildRequested = false;

/** The welcome asks the parents' area to open the new-profile form at once. Used once. */
export function requestNewChild(): void {
  newChildRequested = true;
}

export function takeNewChild(): boolean {
  const asked = newChildRequested;
  newChildRequested = false;
  return asked;
}

/* ---------- Today ---------- */

export interface Today {
  exercises: number;
  correct: number;
  rounds: number;
  daily: boolean;
  practised: boolean;
}

export function todayOf(progress: ProfileProgress | undefined, now: number): Today {
  const d = progress?.days[dayKey(now)];
  const exercises = d?.exercises ?? 0;
  const rounds = d?.rounds ?? 0;
  return {
    exercises,
    correct: d?.correct ?? 0,
    rounds,
    daily: d?.daily ?? false,
    practised: exercises > 0 || rounds > 0,
  };
}

/** "Last time: yesterday" or a date; null when today or never. */
export function isYesterday(at: number, now: number): boolean {
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return dayKey(at) === dayKey(y.getTime());
}

/* ---------- Where she is ---------- */

/** A name kept whole inside a sentence (a number in it is not carried across the colon). */
export function isolate(name: string): string {
  return `⁨${name}⁩`;
}

export function worldName(world: World): string {
  return t('journey.world', { params: { index: world.index, name: topicLabel(world.topic.id) } });
}

/** The station the big button starts, by number and name. */
export function nowAt(world: World): string {
  const stop = nextStop(world);
  if (stop.kind === 'review') return t('parent.nowAtReview');
  const station = world.stations.find((s) => s.level === stop.level);
  const name = station ? t(station.labelKey as TranslationKey) : '';
  return t('parent.nowAt', { params: { n: stop.level, name } });
}

/* ---------- One sentence of guidance ---------- */

const TIP_KINDS = [
  'wrongOperation',
  'offByOne',
  'digitReversal',
  'placeValue',
  'remainder',
  'carry',
  'borrow',
  'offByTen',
  'countedCoins',
  'clockHands',
  'order',
  'shapeFormula',
  'decimalPoint',
] as const;
type TipKind = (typeof TIP_KINDS)[number];
function isTipKind(kind: string): kind is TipKind {
  return (TIP_KINDS as readonly string[]).includes(kind);
}

/** A mistake counts as a pattern from this many times on. */
const MISTAKE_MIN = 2;
const STRUGGLE_MIN = 5;

/**
 * What a parent could do, in one plain sentence: from the mistakes that keep
 * coming back (in today's topics when she practised today), else a topic that
 * is still hard, else a word on a good day. Null when there is nothing to say.
 */
export function guidance(
  profile: Profile,
  progress: ProfileProgress | undefined,
  now: number,
): string | null {
  const tc = makeT(profile.gender);
  const today = todayOf(progress, now);
  const key = dayKey(now);
  const all = Object.entries(progress?.topics ?? {}).filter(([, s]) => s.attempts > 0);
  if (all.length === 0) return null;
  const todays = all.filter(([, s]) => dayKey(s.lastPracticedAt) === key);
  const pool = today.practised && todays.length > 0 ? todays : all;

  if (today.practised && today.exercises >= 5 && today.correct / today.exercises >= 0.9) {
    return tc('c.tip.greatDay');
  }

  const totals = new Map<TipKind, number>();
  for (const [, s] of pool) {
    for (const [kind, count] of Object.entries(s.mistakes)) {
      if (isTipKind(kind)) totals.set(kind, (totals.get(kind) ?? 0) + count);
    }
  }
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= MISTAKE_MIN) return tc(`c.tip.${top[0]}`);

  const hard = pool
    .filter(([, s]) => s.recent.length >= STRUGGLE_MIN)
    .map(([id, s]) => ({ id, rate: s.recent.filter(Boolean).length / s.recent.length }))
    .filter((x) => x.rate < 0.6)
    .sort((a, b) => a.rate - b.rate)[0];
  if (hard) return tc('c.tip.struggling', { topic: isolate(topicLabel(hard.id)) });

  return today.practised ? t('c.tip.steady') : null;
}

/* ---------- Welcome back ---------- */

const WELCOME_KEY = 'welcome-back';

/** Calendar days between two moments (by the local date, not 24-hour periods). */
function daysBetween(a: number, b: number): number {
  const day = (x: number) => {
    const d = new Date(x);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
  };
  return Math.round(day(b) - day(a));
}

/** Two days or more since she last played (never for a child who has not played yet). */
export function backAfterBreak(progress: ProfileProgress | undefined, now: number): boolean {
  const last = summarizeProgress(progress).lastPracticedAt;
  return last !== null && daysBetween(last, now) >= 2;
}

/** The welcome back is said once a day per child: kept on this device (a convenience only). */
function welcomedToday(id: string, now: number): boolean {
  try {
    const kept = JSON.parse(localStorage.getItem(WELCOME_KEY) ?? '{}') as Record<string, unknown>;
    return kept[id] === dayKey(now);
  } catch {
    return false;
  }
}

export function markWelcomed(id: string, now: number): void {
  try {
    const kept = JSON.parse(localStorage.getItem(WELCOME_KEY) ?? '{}') as Record<string, unknown>;
    localStorage.setItem(WELCOME_KEY, JSON.stringify({ ...kept, [id]: dayKey(now) }));
  } catch {
    // Without storage the welcome may come again today; nothing else depends on it.
  }
}

/** Should Plusi welcome this child back now? */
export function welcomeBack(
  profile: Profile,
  progress: ProfileProgress | undefined,
  now: number,
): boolean {
  return backAfterBreak(progress, now) && !welcomedToday(profile.id, now);
}
