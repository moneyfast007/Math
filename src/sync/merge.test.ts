import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { recordAttempt, completeRound } from '@/state/progress';
import { emptyProgress, MAX_PROFILES, type AppData, type ProfileProgress } from '@/state/schema';
import { makeData, makeProfile } from '@/state/testData';
import {
  applyDiff,
  buildView,
  liveProfiles,
  mergeProgress,
  planJoin,
  stampShared,
  startFamily,
} from './merge';
import { emptyShared, emptySlice, mergeShared, type SharedDoc, type Slice } from './protocol';

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 9, 18, 9).getTime();
const NOA = makeProfile({ id: 'noa', name: 'נועה' });

/** A device: what it shows, and what it practiced. */
interface Device {
  view: AppData;
  own: Slice;
}

function withProgress(view: AppData, pid: string, p: ProfileProgress): AppData {
  return { ...view, progress: { ...view.progress, [pid]: p } };
}

function change(d: Device, next: AppData, at: number): Device {
  return { view: next, own: applyDiff(d.own, d.view.progress, next.progress, at) };
}

function practice(d: Device, pid: string, topicId: string, correct: boolean, at: number): Device {
  const p = recordAttempt(d.view.progress[pid] ?? emptyProgress(), {
    topicId,
    level: d.view.progress[pid]?.topics[topicId]?.level ?? 1,
    correct,
    at,
    ...(correct ? {} : { mistake: 'offByOne' as const }),
  });
  return change(d, withProgress(d.view, pid, p), at);
}

function setLevel(d: Device, pid: string, topicId: string, level: number, at: number): Device {
  const p = d.view.progress[pid] ?? emptyProgress();
  const t = p.topics[topicId];
  if (!t) throw new Error('no topic');
  const next = { ...p, topics: { ...p.topics, [topicId]: { ...t, level } } };
  return change(d, withProgress(d.view, pid, next), at);
}

function sync(devices: Device[], shared: SharedDoc): Device[] {
  const slices = devices.map((d) => d.own);
  return devices.map((d) => ({ ...d, view: buildView(d.view, shared, slices) }));
}

function family(): { shared: SharedDoc; a: Device; b: Device } {
  const data = makeData({ profiles: [NOA], progress: { noa: emptyProgress() } });
  const { shared, own } = startFamily(data, T0);
  const a: Device = { view: data, own };
  const b: Device = { view: buildView(makeData(), shared, [own]), own: emptySlice() };
  return { shared, a, b };
}

describe('a single device', () => {
  it('rebuilds exactly the view it has, whatever was practiced', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            topic: fc.constantFrom('count10', 'addSub20', 'clock'),
            correct: fc.boolean(),
            day: fc.integer({ min: 0, max: 90 }),
          }),
          { maxLength: 60 },
        ),
        (steps) => {
          const { shared, a } = family();
          let d = a;
          let at = T0;
          for (const s of steps) {
            at += s.day * DAY + 1000;
            d = practice(d, 'noa', s.topic, s.correct, at);
          }
          expect(buildView(d.view, shared, [d.own])).toEqual(d.view);
        },
      ),
      { numRuns: 60 },
    );
  });

  it('finishing a round keeps the view and the slice in step (stations, streak, level)', () => {
    const { shared, a } = family();
    let d = a;
    for (let i = 0; i < 10; i++) d = practice(d, 'noa', 'count10', true, T0 + i * 1000);
    const outcome = completeRound(d.view.progress['noa'] ?? emptyProgress(), {
      topicId: 'count10',
      station: 1,
      firstTry: 10,
      length: 10,
      at: T0 + 20_000,
    });
    d = change(d, withProgress(d.view, 'noa', outcome.progress), T0 + 20_000);
    expect(buildView(d.view, shared, [d.own])).toEqual(d.view);
  });
});

describe('two devices', () => {
  it('practice on both is added up, with the most recent results from the later one', () => {
    const f = family();
    let a = practice(f.a, 'noa', 'count10', true, T0 + 1000);
    a = practice(a, 'noa', 'count10', false, T0 + 2000);
    let b = practice(f.b, 'noa', 'count10', true, T0 + 3000);
    b = practice(b, 'noa', 'count10', true, T0 + 4000);
    b = practice(b, 'noa', 'addSub20', true, T0 + 5000);
    [a, b] = sync([a, b], f.shared) as [Device, Device];

    for (const d of [a, b]) {
      const p = d.view.progress['noa'];
      expect(p?.topics['count10']?.attempts).toBe(4);
      expect(p?.topics['count10']?.correct).toBe(3);
      expect(p?.topics['count10']?.mistakes).toEqual({ offByOne: 1 });
      expect(p?.topics['count10']?.recent).toEqual([true, true]);
      expect(p?.topics['addSub20']?.attempts).toBe(1);
      expect(Object.values(p?.days ?? {})[0]?.exercises).toBe(5);
    }
    expect(a.view).toEqual(b.view);
  });

  it('after a sync, more practice on one device still adds up (no double counting)', () => {
    const f = family();
    let a = practice(f.a, 'noa', 'count10', true, T0 + 1000);
    let b = practice(f.b, 'noa', 'count10', true, T0 + 2000);
    [a, b] = sync([a, b], f.shared) as [Device, Device];
    b = practice(b, 'noa', 'count10', false, T0 + 3000);
    [a, b] = sync([a, b], f.shared) as [Device, Device];
    [a, b] = sync([a, b], f.shared) as [Device, Device];
    expect(a.view.progress['noa']?.topics['count10']?.attempts).toBe(3);
    expect(b.view.progress['noa']?.topics['count10']?.attempts).toBe(3);
  });

  it("a topic's level comes from the device that set it last", () => {
    const f = family();
    let a = practice(f.a, 'noa', 'count10', true, T0 + 1000);
    let b = f.b;
    [a, b] = sync([a, b], f.shared) as [Device, Device];
    a = setLevel(a, 'noa', 'count10', 4, T0 + 2000);
    b = practice(b, 'noa', 'count10', true, T0 + 2500); // practiced at the old level
    [a, b] = sync([a, b], f.shared) as [Device, Device];
    expect(b.view.progress['noa']?.topics['count10']?.level).toBe(4);
    b = setLevel(b, 'noa', 'count10', 2, T0 + 3000);
    [a, b] = sync([a, b], f.shared) as [Device, Device];
    expect(a.view.progress['noa']?.topics['count10']?.level).toBe(2);
  });

  it('a view that went down (an older backup restored) adds nothing', () => {
    const f = family();
    let a = practice(f.a, 'noa', 'count10', true, T0 + 1000);
    const before = a.own;
    a = change(a, withProgress(a.view, 'noa', emptyProgress()), T0 + 2000);
    expect(a.own.progress['noa']?.topics['count10']?.attempts).toBe(
      before.progress['noa']?.topics['count10']?.attempts,
    );
  });
});

describe('the shared document', () => {
  it('stamps added, changed and removed profiles, and the PIN', () => {
    const maya = makeProfile({ id: 'maya', name: 'מאיה' });
    const prev = makeData({ profiles: [NOA, maya] });
    const renamed = { ...NOA, name: 'נועה ל' };
    const next = { ...prev, profiles: [renamed], parent: { pin: { salt: 's', hash: 'h' } } };
    const shared = stampShared(emptyShared(), prev, next, 5);
    expect(shared.profiles['noa']).toEqual({ value: renamed, at: 5 });
    expect(shared.profiles['maya']).toEqual({ value: null, at: 5 });
    expect(shared.pin).toEqual({ value: { salt: 's', hash: 'h' }, at: 5 });
    expect(stampShared(shared, next, next, 6)).toBe(shared);
  });

  it('the later change wins, a removal included, and the merge is order-independent', () => {
    const a: SharedDoc = {
      profiles: { noa: { value: NOA, at: 1 }, maya: { value: null, at: 9 } },
      pin: { value: null, at: 0 },
    };
    const b: SharedDoc = {
      profiles: {
        noa: { value: { ...NOA, name: 'נועי' }, at: 2 },
        maya: { value: makeProfile({ id: 'maya' }), at: 3 },
      },
      pin: { value: { salt: 's', hash: 'h' }, at: 4 },
    };
    const ab = mergeShared(a, b);
    expect(ab).toEqual(mergeShared(b, a));
    expect(ab.profiles['noa']?.value?.name).toBe('נועי');
    expect(ab.profiles['maya']?.value).toBeNull();
    expect(ab.pin.at).toBe(4);
  });

  it(`shows at most ${MAX_PROFILES} children, the oldest first`, () => {
    const shared = emptyShared();
    for (let i = 0; i < MAX_PROFILES + 2; i++) {
      shared.profiles[`p${i}`] = {
        value: makeProfile({ id: `p${i}`, createdAt: 100 - i }),
        at: 1,
      };
    }
    const live = liveProfiles(shared);
    expect(live).toHaveLength(MAX_PROFILES);
    expect(live[0]?.id).toBe(`p${MAX_PROFILES + 1}`);
  });
});

describe('joining a family', () => {
  function familyWithPractice() {
    const f = family();
    let a = practice(f.a, 'noa', 'count10', true, T0 + 1000);
    a = practice(a, 'noa', 'count10', true, T0 + 2000);
    return { shared: f.shared, slices: [a.own] };
  }

  it('a child with the same name is the same child: both devices count', () => {
    const fam = familyWithPractice();
    const mine = makeProfile({ id: 'other-id', name: ' נועה ' });
    let local = makeData({ profiles: [mine], progress: { 'other-id': emptyProgress() } });
    local = withProgress(
      local,
      'other-id',
      recordAttempt(emptyProgress(), { topicId: 'count10', level: 1, correct: false, at: T0 }),
    );
    const plan = planJoin(local, fam, T0 + 5000);
    expect(plan.matched).toEqual(['נועה']);
    expect(plan.added).toEqual([]);
    const view = buildView(local, plan.shared, [...fam.slices, plan.own]);
    expect(view.profiles.map((p) => p.id)).toEqual(['noa']);
    expect(view.progress['noa']?.topics['count10']?.attempts).toBe(3);
  });

  it('the same child moved by a backup is not counted twice', () => {
    const fam = familyWithPractice();
    const copy = buildView(makeData(), fam.shared, fam.slices); // as restored from a backup
    const local = withProgress(
      copy,
      'noa',
      recordAttempt(copy.progress['noa'] ?? emptyProgress(), {
        topicId: 'count10',
        level: 1,
        correct: true,
        at: T0 + 3000,
      }),
    );
    const plan = planJoin(local, fam, T0 + 5000);
    const view = buildView(local, plan.shared, [...fam.slices, plan.own]);
    expect(view.progress['noa']?.topics['count10']?.attempts).toBe(3);
  });

  it('other children join the family; too many together is reported', () => {
    const fam = familyWithPractice();
    const extra = Array.from({ length: MAX_PROFILES }, (_, i) =>
      makeProfile({ id: `x${i}`, name: `ילד ${i}` }),
    );
    const plan = planJoin(makeData({ profiles: extra.slice(0, 2) }), fam, T0);
    expect(plan.added).toEqual(['ילד 0', 'ילד 1']);
    expect(plan.tooMany).toBe(false);
    expect(planJoin(makeData({ profiles: extra }), fam, T0).tooMany).toBe(true);
  });

  it('a progress no slice has is an empty one', () => {
    expect(mergeProgress([emptySlice()], 'nobody')).toBeUndefined();
  });
});
