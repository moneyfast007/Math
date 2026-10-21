import {
  DAYS_KEPT,
  MAX_PROFILES,
  emptyProgress,
  type AppData,
  type DayStats,
  type Profile,
  type ProfileProgress,
  type Streak,
  type TopicStats,
} from '@/state/schema';
import { emptyShared, type SharedDoc, type Slice, type Stamped } from './protocol';

/**
 * How the app turns the family's data into what it shows, and back.
 *
 * The app keeps working on one plain AppData, exactly as before sync existed
 * (the "view"). This file:
 * - `applyDiff`: records a change of the view into this device's own slice
 *   (counters by how much they grew, the rest as the latest value);
 * - `stampShared`: records changed profiles and PIN into the shared document;
 * - `buildView`: rebuilds the view from the shared document and all slices.
 *
 * Counters (exercises, right answers, mistakes, days) are added up across
 * devices. A topic's level comes from the device that set it last; the recent
 * results from the device that practiced it last; stations passed are united.
 */

/* ---------- Small helpers ---------- */

function union(a: readonly number[], b: readonly number[]): number[] {
  return [...new Set([...a, ...b])].sort((x, y) => x - y);
}

function grew(next: number, prev: number | undefined): number {
  return Math.max(0, next - (prev ?? 0));
}

function newestDays(days: Record<string, DayStats>): Record<string, DayStats> {
  const keys = Object.keys(days).sort().slice(-DAYS_KEPT);
  const out: Record<string, DayStats> = {};
  for (const k of keys) {
    const d = days[k];
    if (d) out[k] = d;
  }
  return out;
}

function laterStreak(a: Streak, b: Streak): Streak {
  if (a.lastDay === b.lastDay) return a.count >= b.count ? a : b;
  if (a.lastDay === null) return b;
  if (b.lastDay === null) return a;
  return a.lastDay > b.lastDay ? a : b;
}

/* ---------- View → own slice ---------- */

function diffTopic(own: TopicStats | undefined, prev: TopicStats | undefined, next: TopicStats) {
  const mistakes: Record<string, number> = { ...(own?.mistakes ?? {}) };
  for (const [kind, count] of Object.entries(next.mistakes)) {
    const added = grew(count, prev?.mistakes[kind]);
    if (added > 0) mistakes[kind] = (mistakes[kind] ?? 0) + added;
  }
  const attempts = (own?.attempts ?? 0) + grew(next.attempts, prev?.attempts);
  const correct = Math.min(attempts, (own?.correct ?? 0) + grew(next.correct, prev?.correct));
  return {
    level: next.level,
    attempts,
    correct,
    lastPracticedAt: Math.max(own?.lastPracticedAt ?? 0, next.lastPracticedAt),
    recent: next.recent,
    mistakes,
    completedLevels: union(own?.completedLevels ?? [], next.completedLevels),
    reviewPassed: (own?.reviewPassed ?? false) || next.reviewPassed,
    ...withStars(bestStars(own?.stars, next.stars)),
  };
}

/** The better of two records of best stars, station by station. */
function bestStars(
  a: Record<string, number> | undefined,
  b: Record<string, number> | undefined,
): Record<string, number> | undefined {
  if (!a) return b;
  if (!b) return a;
  const out = { ...a };
  for (const [k, n] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, n);
  return out;
}

function withStars(stars: Record<string, number> | undefined): { stars?: Record<string, number> } {
  return stars && Object.keys(stars).length > 0 ? { stars } : {};
}

function diffDay(own: DayStats | undefined, prev: DayStats | undefined, next: DayStats): DayStats {
  const exercises = (own?.exercises ?? 0) + grew(next.exercises, prev?.exercises);
  return {
    exercises,
    correct: Math.min(exercises, (own?.correct ?? 0) + grew(next.correct, prev?.correct)),
    rounds: (own?.rounds ?? 0) + grew(next.rounds, prev?.rounds),
    daily: (own?.daily ?? false) || next.daily,
  };
}

/**
 * This device's slice after the view changed from `prev` to `next`. Counters
 * only grow: a view that went down (a backup restored over newer progress)
 * adds nothing, and the family's totals stay as they were.
 */
export function applyDiff(
  own: Slice,
  prev: Record<string, ProfileProgress>,
  next: Record<string, ProfileProgress>,
  now: number,
): Slice {
  const progress: Record<string, ProfileProgress> = {};
  const levelAt: Record<string, Record<string, number>> = {};
  let changed = false;

  for (const [pid, n] of Object.entries(next)) {
    const mine = own.progress[pid];
    const mineLevels = own.levelAt[pid] ?? {};
    const p = prev[pid];
    if (p === n) {
      if (mine) progress[pid] = mine;
      if (own.levelAt[pid]) levelAt[pid] = mineLevels;
      continue;
    }
    changed = true;
    const base = mine ?? emptyProgress();
    const old = p ?? emptyProgress();
    const topics = { ...base.topics };
    const levels = { ...mineLevels };
    for (const [tid, nt] of Object.entries(n.topics)) {
      const ot = old.topics[tid];
      if (ot === nt) continue;
      topics[tid] = diffTopic(base.topics[tid], ot, nt);
      if (!ot || ot.level !== nt.level) levels[tid] = now;
    }
    const days = { ...base.days };
    for (const [key, nd] of Object.entries(n.days)) {
      const od = old.days[key];
      if (od === nd) continue;
      days[key] = diffDay(base.days[key], od, nd);
    }
    progress[pid] = {
      topics,
      streak: n.streak === old.streak ? base.streak : n.streak,
      days: newestDays(days),
    };
    levelAt[pid] = levels;
  }
  // A profile gone from the view: its progress on this device goes with it.
  if (Object.keys(own.progress).some((pid) => !(pid in next))) changed = true;
  return changed ? { progress, levelAt, at: now } : own;
}

/* ---------- View → shared document ---------- */

/** The shared document after the view's profiles or PIN changed from `prev` to `next`. */
export function stampShared(
  shared: SharedDoc,
  prev: AppData,
  next: AppData,
  now: number,
): SharedDoc {
  if (prev.profiles === next.profiles && prev.parent.pin === next.parent.pin) return shared;
  const profiles = { ...shared.profiles };
  const before = new Map(prev.profiles.map((p) => [p.id, p]));
  for (const p of next.profiles) {
    const old = before.get(p.id);
    if (!old || JSON.stringify(old) !== JSON.stringify(p)) profiles[p.id] = { value: p, at: now };
    before.delete(p.id);
  }
  for (const id of before.keys()) profiles[id] = { value: null, at: now };
  const pin =
    JSON.stringify(prev.parent.pin) === JSON.stringify(next.parent.pin)
      ? shared.pin
      : { value: next.parent.pin, at: now };
  return { profiles, pin };
}

/* ---------- Shared document + slices → view ---------- */

interface Part {
  progress: ProfileProgress;
  levelAt: Record<string, number>;
}

function mergeTopic(parts: { stats: TopicStats; levelAt: number }[]): TopicStats {
  let attempts = 0;
  let correct = 0;
  let lastPracticedAt = 0;
  let completedLevels: number[] = [];
  let reviewPassed = false;
  let stars: Record<string, number> | undefined;
  const mistakes: Record<string, number> = {};
  for (const { stats } of parts) {
    stars = bestStars(stars, stats.stars);
    attempts += stats.attempts;
    correct += stats.correct;
    lastPracticedAt = Math.max(lastPracticedAt, stats.lastPracticedAt);
    completedLevels = union(completedLevels, stats.completedLevels);
    reviewPassed ||= stats.reviewPassed;
    for (const [kind, count] of Object.entries(stats.mistakes)) {
      mistakes[kind] = (mistakes[kind] ?? 0) + count;
    }
  }
  const byLevel = parts.reduce((a, b) =>
    b.levelAt > a.levelAt ||
    (b.levelAt === a.levelAt && b.stats.lastPracticedAt > a.stats.lastPracticedAt)
      ? b
      : a,
  );
  const byRecent = parts.reduce((a, b) =>
    b.stats.lastPracticedAt > a.stats.lastPracticedAt ? b : a,
  );
  return {
    level: byLevel.stats.level,
    attempts,
    correct,
    lastPracticedAt,
    recent: byRecent.stats.recent,
    mistakes,
    completedLevels,
    reviewPassed,
    ...withStars(stars),
  };
}

/** One child's progress, added up over the slices that have any. */
export function mergeProgress(slices: readonly Slice[], pid: string): ProfileProgress | undefined {
  const parts: Part[] = [];
  for (const s of slices) {
    const progress = s.progress[pid];
    if (progress) parts.push({ progress, levelAt: s.levelAt[pid] ?? {} });
  }
  if (parts.length === 0) return undefined;
  if (parts.length === 1 && parts[0]) return parts[0].progress;

  const topicIds = new Set(parts.flatMap((p) => Object.keys(p.progress.topics)));
  const topics: Record<string, TopicStats> = {};
  for (const tid of topicIds) {
    const entries = parts.flatMap((p) => {
      const stats = p.progress.topics[tid];
      return stats ? [{ stats, levelAt: p.levelAt[tid] ?? -1 }] : [];
    });
    topics[tid] = mergeTopic(entries);
  }

  const days: Record<string, DayStats> = {};
  for (const p of parts) {
    for (const [key, d] of Object.entries(p.progress.days)) {
      const sum = days[key];
      days[key] = sum
        ? {
            exercises: sum.exercises + d.exercises,
            correct: sum.correct + d.correct,
            rounds: sum.rounds + d.rounds,
            daily: sum.daily || d.daily,
          }
        : d;
    }
  }
  const streak = parts.map((p) => p.progress.streak).reduce(laterStreak);
  return { topics, streak, days: newestDays(days) };
}

/** The profiles the family has now, oldest first, at most MAX_PROFILES. */
export function liveProfiles(shared: SharedDoc): Profile[] {
  return Object.values(shared.profiles)
    .map((s) => s.value)
    .filter((p): p is Profile => p !== null)
    .sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1))
    .slice(0, MAX_PROFILES);
}

/** The view: the family's profiles and PIN, and every child's progress added up. */
export function buildView(base: AppData, shared: SharedDoc, slices: readonly Slice[]): AppData {
  const profiles = liveProfiles(shared);
  const progress: Record<string, ProfileProgress> = {};
  for (const p of profiles) progress[p.id] = mergeProgress(slices, p.id) ?? emptyProgress();
  return { ...base, profiles, progress, parent: { ...base.parent, pin: shared.pin.value } };
}

/* ---------- Linking a device ---------- */

/** When each topic was last practiced: the level's time for data that predates sync. */
function levelTimes(progress: Record<string, ProfileProgress>) {
  const out: Record<string, Record<string, number>> = {};
  for (const [pid, p] of Object.entries(progress)) {
    out[pid] = Object.fromEntries(
      Object.entries(p.topics).map(([tid, t]) => [tid, t.lastPracticedAt]),
    );
  }
  return out;
}

/** The first device of a new family: everything it has becomes the family's. */
export function startFamily(data: AppData, now: number): { shared: SharedDoc; own: Slice } {
  const profiles: Record<string, Stamped<Profile | null>> = {};
  for (const p of data.profiles) profiles[p.id] = { value: p, at: now };
  const pin = data.parent.pin ? { value: data.parent.pin, at: now } : emptyShared().pin;
  return {
    shared: { profiles, pin },
    own: { progress: data.progress, levelAt: levelTimes(data.progress), at: now },
  };
}

export interface JoinPlan {
  shared: SharedDoc;
  own: Slice;
  /** Children this device already had who were found in the family (by name). */
  matched: string[];
  /** Children this device had who are new to the family. */
  added: string[];
  /** Together there would be more than MAX_PROFILES children. */
  tooMany: boolean;
}

function sameName(a: string, b: string): boolean {
  return a.trim().replace(/\s+/g, ' ') === b.trim().replace(/\s+/g, ' ');
}

/** What this device had beyond `family`, field by field (for a shared history). */
function excess(mine: ProfileProgress, family: ProfileProgress | undefined): ProfileProgress {
  if (!family) return mine;
  const topics: Record<string, TopicStats> = {};
  for (const [tid, t] of Object.entries(mine.topics)) {
    const f = family.topics[tid];
    if (!f) {
      topics[tid] = t;
      continue;
    }
    const mistakes: Record<string, number> = {};
    for (const [kind, count] of Object.entries(t.mistakes)) {
      const extra = grew(count, f.mistakes[kind]);
      if (extra > 0) mistakes[kind] = extra;
    }
    const attempts = grew(t.attempts, f.attempts);
    topics[tid] = {
      ...t,
      attempts,
      correct: Math.min(attempts, grew(t.correct, f.correct)),
      mistakes,
    };
  }
  const days: Record<string, DayStats> = {};
  for (const [key, d] of Object.entries(mine.days)) {
    const f = family.days[key];
    const exercises = grew(d.exercises, f?.exercises);
    days[key] = {
      exercises,
      correct: Math.min(exercises, grew(d.correct, f?.correct)),
      rounds: grew(d.rounds, f?.rounds),
      daily: d.daily,
    };
  }
  return { topics, streak: mine.streak, days };
}

/**
 * A device joining a family it may already share children with.
 *
 * A child this device has is the family's child when the profile id is the
 * same (data moved by a backup: only what this device has beyond the family
 * is added, so shared history is not counted twice) or the name is the same
 * (two devices set up separately: both devices' practice is added up). Other
 * children of this device are added to the family.
 */
export function planJoin(
  data: AppData,
  family: { shared: SharedDoc; slices: readonly Slice[] },
  now: number,
): JoinPlan {
  const familyProfiles = liveProfiles(family.shared);
  const taken = new Set<string>();
  const profiles = { ...family.shared.profiles };
  const progress: Record<string, ProfileProgress> = {};
  const matched: string[] = [];
  const added: string[] = [];

  for (const p of data.profiles) {
    const mine = data.progress[p.id] ?? emptyProgress();
    const byId = familyProfiles.find((f) => f.id === p.id && !taken.has(f.id));
    const byName = byId ?? familyProfiles.find((f) => !taken.has(f.id) && sameName(f.name, p.name));
    if (byId) {
      taken.add(byId.id);
      matched.push(byId.name);
      progress[byId.id] = excess(mine, mergeProgress(family.slices, byId.id));
    } else if (byName) {
      taken.add(byName.id);
      matched.push(byName.name);
      progress[byName.id] = mine;
    } else {
      added.push(p.name);
      profiles[p.id] = { value: p, at: now };
      progress[p.id] = mine;
    }
  }

  const pin =
    family.shared.pin.at === 0 && data.parent.pin
      ? { value: data.parent.pin, at: now }
      : family.shared.pin;
  const shared = { profiles, pin };
  const total = Object.values(profiles).filter((s) => s.value !== null).length;
  return {
    shared,
    own: { progress, levelAt: levelTimes(progress), at: now },
    matched,
    added,
    tooMany: total > MAX_PROFILES,
  };
}
