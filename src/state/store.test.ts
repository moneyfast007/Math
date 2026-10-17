import { describe, expect, it } from 'vitest';
import { MAX_PROFILES, type AppData, type ProfileInput } from './schema';
import { createMemoryStorage, type StorageAdapter } from './storage';
import { createAppStore, PARENT_UNLOCK_MS } from './store';
import { makeData, makeProfile } from './testData';

const input: ProfileInput = {
  name: 'נועה',
  avatar: 'fox',
  grade: 2,
  gender: 'f',
  settings: { allowLevelChange: true },
};

/** Lets pending promise chains (the write queue) settle. */
const flush = () => new Promise((r) => setTimeout(r, 0));

function setup(initial?: unknown, now = { t: 1_000 }) {
  const storage = createMemoryStorage(initial);
  const store = createAppStore(storage, () => now.t);
  return { storage, store, now };
}

describe('app store', () => {
  it('starts empty and ready when nothing is stored', async () => {
    const { store } = setup();
    expect(store.getState().status).toBe('loading');
    await store.getState().hydrate();
    expect(store.getState().status).toBe('ready');
    expect(store.getState().data.profiles).toEqual([]);
    expect(store.getState().storageIssue).toBeNull();
  });

  it('persists a new profile and restores it on the next launch', async () => {
    const { store, storage } = setup();
    await store.getState().hydrate();
    const p = store.getState().addProfile({ ...input, name: '  נועה ' });
    expect(p.name).toBe('נועה');
    await flush();

    const relaunched = createAppStore(storage);
    await relaunched.getState().hydrate();
    expect(relaunched.getState().data.profiles.map((x) => x.name)).toEqual(['נועה']);
    expect(relaunched.getState().data.progress[p.id]).toEqual({ topics: {} });
  });

  it('rejects an empty name and enforces the profile limit', async () => {
    const { store } = setup();
    await store.getState().hydrate();
    expect(() => store.getState().addProfile({ ...input, name: '   ' })).toThrow();
    for (let i = 0; i < MAX_PROFILES; i++) store.getState().addProfile(input);
    expect(() => store.getState().addProfile(input)).toThrow();
  });

  it('updates and removes profiles, dropping progress and active selection', async () => {
    const { store } = setup();
    await store.getState().hydrate();
    const p = store.getState().addProfile(input);
    store.getState().updateProfile(p.id, { ...input, name: 'נועה ל.', grade: 3 });
    expect(store.getState().data.profiles[0]).toMatchObject({
      name: 'נועה ל.',
      grade: 3,
      id: p.id,
    });

    store.getState().selectProfile(p.id);
    store.getState().removeProfile(p.id);
    expect(store.getState().data.profiles).toEqual([]);
    expect(store.getState().data.progress).toEqual({});
    expect(store.getState().activeProfileId).toBeNull();
  });

  it('ignores selecting an unknown profile', async () => {
    const { store } = setup();
    await store.getState().hydrate();
    store.getState().selectProfile('nope');
    expect(store.getState().activeProfileId).toBeNull();
  });

  it('quarantines unreadable data instead of overwriting it', async () => {
    const garbage = { schemaVersion: 1, profiles: 'oops' };
    const { store, storage } = setup(garbage);
    await store.getState().hydrate();
    expect(store.getState().storageIssue).toBe('recovered');
    expect([...storage.quarantined().values()]).toEqual([garbage]);
  });

  it('reports unavailable storage and keeps working in memory', async () => {
    const broken: StorageAdapter = {
      ...createMemoryStorage(),
      load: () => Promise.reject(new Error('no idb')),
      save: () => Promise.reject(new Error('no idb')),
    };
    const store = createAppStore(broken);
    await store.getState().hydrate();
    expect(store.getState().storageIssue).toBe('unavailable');
    store.getState().addProfile(input);
    await flush();
    expect(store.getState().data.profiles).toHaveLength(1);
    expect(store.getState().storageIssue).toBe('unavailable');
  });

  it('flags a failed write', async () => {
    let fail = false;
    const base = createMemoryStorage();
    const flaky: StorageAdapter = {
      ...base,
      save: (d) => (fail ? Promise.reject(new Error('quota')) : base.save(d)),
    };
    const store = createAppStore(flaky);
    await store.getState().hydrate();
    fail = true;
    store.getState().addProfile(input);
    await flush();
    expect(store.getState().storageIssue).toBe('writeFailed');
    fail = false;
    store.getState().markBackedUp();
    await flush();
    expect(store.getState().storageIssue).toBeNull();
  });

  it('keeps the parent area open for a limited time', async () => {
    const { store, now } = setup();
    await store.getState().hydrate();
    expect(store.getState().isParentUnlocked()).toBe(false);
    store.getState().unlockParent();
    expect(store.getState().isParentUnlocked()).toBe(true);
    now.t += PARENT_UNLOCK_MS + 1;
    expect(store.getState().isParentUnlocked()).toBe(false);
    store.getState().unlockParent();
    store.getState().lockParent();
    expect(store.getState().isParentUnlocked()).toBe(false);
  });

  it('sets, verifies and clears a PIN', async () => {
    const { store } = setup();
    await store.getState().hydrate();
    await expect(store.getState().verifyPin('1234')).resolves.toBe(false);
    await store.getState().setPin('1234');
    await expect(store.getState().verifyPin('1234')).resolves.toBe(true);
    await expect(store.getState().verifyPin('4321')).resolves.toBe(false);
    await store.getState().setPin(null);
    expect(store.getState().data.parent.pin).toBeNull();
  });

  it('replaces all data on import and records backups', async () => {
    const { store, storage, now } = setup();
    await store.getState().hydrate();
    store.getState().addProfile(input);
    const imported: AppData = makeData({
      profiles: [makeProfile({ id: 'x', name: 'מאיה' })],
      progress: { x: { topics: {} } },
    });
    store.getState().replaceData(imported);
    expect(store.getState().data.profiles.map((p) => p.name)).toEqual(['מאיה']);

    now.t = 5_000;
    store.getState().markBackedUp();
    await flush();
    expect((storage.peek() as AppData).meta.lastBackupAt).toBe(5_000);
  });

  it('records attempts and sets topic levels for a profile', async () => {
    const { store } = setup();
    await store.getState().hydrate();
    const p = store.getState().addProfile(input);
    store.getState().setTopicLevel(p.id, 'add-sub-20', 8);
    expect(store.getState().data.progress[p.id]?.topics['add-sub-20']).toMatchObject({
      level: 8,
      attempts: 0,
    });
    store.getState().recordAttempt(p.id, { topicId: 'add-sub-20', level: 8, correct: true, at: 5 });
    store
      .getState()
      .recordAttempt(p.id, {
        topicId: 'add-sub-20',
        level: 8,
        correct: false,
        mistake: 'offByOne',
        at: 6,
      });
    expect(store.getState().data.progress[p.id]?.topics['add-sub-20']).toMatchObject({
      level: 8,
      attempts: 2,
      correct: 1,
      recent: [true, false],
      mistakes: { offByOne: 1 },
    });
    store.getState().setTopicLevel(p.id, 'add-sub-20', 99);
    expect(store.getState().data.progress[p.id]?.topics['add-sub-20']?.level).toBe(10);
    // Unknown profiles are ignored.
    store.getState().recordAttempt('ghost', { topicId: 't', level: 1, correct: true, at: 1 });
    expect(store.getState().data.progress['ghost']).toBeUndefined();
  });
});
