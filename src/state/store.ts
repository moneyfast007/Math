import { useStore } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import { createPinRecord, verifyPin as checkPin } from './pin';
import {
  completeDaily as finishDaily,
  completeRound as finishRound,
  recordAttempt as addAttempt,
  type Attempt,
  type RoundOutcome,
  type RoundResult,
} from './progress';
import {
  emptyAppData,
  emptyProgress,
  emptyTopicStats,
  MAX_LEVEL,
  MAX_NAME_LENGTH,
  MAX_PROFILES,
  MIN_LEVEL,
  type AppData,
  type Profile,
  type ProfileInput,
} from './schema';
import { createIdbStorage, createMemoryStorage, type StorageAdapter } from './storage';
import { parseAppData } from './validate';

/**
 * Application state: the persisted document plus session-only UI state.
 *
 * Every mutation of `data` is written to storage right away. Writes are
 * chained so they land in order even if two happen in the same tick.
 */

/** Problems a parent should know about; shown on the parent screen. */
export type StorageIssue =
  /** IndexedDB is not usable (e.g. private browsing). Data lives only in memory. */
  | 'unavailable'
  /** A save failed. The in-memory data is fine but not persisted. */
  | 'writeFailed'
  /** Stored data was unreadable; it was set aside and the app started fresh. */
  | 'recovered';

/** How long the parent area stays open after passing the gate. */
export const PARENT_UNLOCK_MS = 10 * 60 * 1000;

export interface AppState {
  status: 'loading' | 'ready';
  data: AppData;
  storageIssue: StorageIssue | null;
  persisted: boolean;
  /** Session only: which child is playing. */
  activeProfileId: string | null;
  /** Session only: when the parent gate was last passed. */
  parentUnlockedAt: number | null;

  hydrate: () => Promise<void>;
  addProfile: (input: ProfileInput) => Profile;
  updateProfile: (id: string, input: ProfileInput) => void;
  removeProfile: (id: string) => void;
  selectProfile: (id: string | null) => void;
  unlockParent: () => void;
  lockParent: () => void;
  isParentUnlocked: () => boolean;
  setPin: (pin: string | null) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  replaceData: (data: AppData) => void;
  markBackedUp: () => void;
  recordAttempt: (profileId: string, attempt: Attempt) => void;
  /** A round finished: stations, streak and the next level are updated together. */
  completeRound: (profileId: string, result: RoundResult) => RoundOutcome | null;
  setTopicLevel: (profileId: string, topicId: string, level: number) => void;
  /** The day's review finished: the streak and the day's record. */
  completeDaily: (profileId: string) => void;
}

export type AppStore = StoreApi<AppState>;

function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanInput(input: ProfileInput): ProfileInput {
  const name = input.name.trim().slice(0, MAX_NAME_LENGTH);
  if (name.length === 0) throw new RangeError('Profile name is required');
  return { ...input, name, settings: { ...input.settings } };
}

export function createAppStore(storage: StorageAdapter, clock: () => number = Date.now): AppStore {
  let writes: Promise<void> = Promise.resolve();

  return createStore<AppState>()((set, get) => {
    /** Applies a change to the document and persists it. */
    const commit = (next: AppData) => {
      set({ data: next });
      writes = writes
        .then(() => storage.save(next))
        .then(() => {
          if (get().storageIssue === 'writeFailed') set({ storageIssue: null });
        })
        .catch(() => {
          if (get().storageIssue !== 'unavailable') set({ storageIssue: 'writeFailed' });
        });
    };

    return {
      status: 'loading',
      data: emptyAppData(clock()),
      storageIssue: null,
      persisted: false,
      activeProfileId: null,
      parentUnlockedAt: null,

      hydrate: async () => {
        let raw: unknown;
        try {
          raw = await storage.load();
        } catch {
          set({ status: 'ready', storageIssue: 'unavailable' });
          return;
        }
        if (raw === undefined) {
          set({ status: 'ready' });
        } else {
          const parsed = parseAppData(raw);
          if (parsed.ok) {
            set({ status: 'ready', data: parsed.data });
          } else {
            // Never overwrite data we could not read: keep it aside first.
            await storage.quarantine(raw, clock()).catch(() => undefined);
            set({ status: 'ready', storageIssue: 'recovered' });
          }
        }
        set({ persisted: await storage.isPersisted().catch(() => false) });
      },

      addProfile: (input) => {
        const { data } = get();
        if (data.profiles.length >= MAX_PROFILES) {
          throw new RangeError(`At most ${MAX_PROFILES} profiles`);
        }
        const profile: Profile = { ...cleanInput(input), id: newId(), createdAt: clock() };
        commit({
          ...data,
          profiles: [...data.profiles, profile],
          progress: { ...data.progress, [profile.id]: emptyProgress() },
        });
        // The first profile is the moment data starts to matter: ask the browser to keep it.
        if (data.profiles.length === 0) {
          void storage
            .requestPersistence()
            .then((persisted) => set({ persisted }))
            .catch(() => undefined);
        }
        return profile;
      },

      updateProfile: (id, input) => {
        const { data } = get();
        const clean = cleanInput(input);
        commit({
          ...data,
          profiles: data.profiles.map((p) => (p.id === id ? { ...p, ...clean } : p)),
        });
      },

      removeProfile: (id) => {
        const { data, activeProfileId } = get();
        const progress = { ...data.progress };
        delete progress[id];
        commit({ ...data, profiles: data.profiles.filter((p) => p.id !== id), progress });
        if (activeProfileId === id) set({ activeProfileId: null });
      },

      selectProfile: (id) => {
        if (id !== null && !get().data.profiles.some((p) => p.id === id)) return;
        set({ activeProfileId: id });
      },

      unlockParent: () => set({ parentUnlockedAt: clock() }),
      lockParent: () => set({ parentUnlockedAt: null }),
      isParentUnlocked: () => {
        const at = get().parentUnlockedAt;
        return at !== null && clock() - at < PARENT_UNLOCK_MS;
      },

      setPin: async (pin) => {
        const record = pin === null ? null : await createPinRecord(pin);
        const { data } = get();
        commit({ ...data, parent: { ...data.parent, pin: record } });
      },

      verifyPin: async (pin) => {
        const record = get().data.parent.pin;
        return record !== null && (await checkPin(pin, record));
      },

      replaceData: (data) => {
        commit(data);
        set({ activeProfileId: null, storageIssue: null });
      },

      markBackedUp: () => {
        const { data } = get();
        commit({ ...data, meta: { ...data.meta, lastBackupAt: clock() } });
      },

      recordAttempt: (profileId, attempt) => {
        const { data } = get();
        if (!data.profiles.some((p) => p.id === profileId)) return;
        const progress = addAttempt(data.progress[profileId] ?? emptyProgress(), attempt);
        commit({ ...data, progress: { ...data.progress, [profileId]: progress } });
      },

      completeRound: (profileId, result) => {
        const { data } = get();
        if (!data.profiles.some((p) => p.id === profileId)) return null;
        const outcome = finishRound(data.progress[profileId] ?? emptyProgress(), result);
        commit({ ...data, progress: { ...data.progress, [profileId]: outcome.progress } });
        return outcome;
      },

      completeDaily: (profileId) => {
        const { data } = get();
        if (!data.profiles.some((p) => p.id === profileId)) return;
        const progress = finishDaily(data.progress[profileId] ?? emptyProgress(), clock());
        commit({ ...data, progress: { ...data.progress, [profileId]: progress } });
      },

      setTopicLevel: (profileId, topicId, level) => {
        const { data } = get();
        if (!data.profiles.some((p) => p.id === profileId)) return;
        const progress = data.progress[profileId] ?? emptyProgress();
        const current = progress.topics[topicId];
        const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
        const stats = current ? { ...current, level: clamped } : emptyTopicStats(clamped);
        commit({
          ...data,
          progress: {
            ...data.progress,
            [profileId]: { ...progress, topics: { ...progress.topics, [topicId]: stats } },
          },
        });
      },
    };
  });
}

function defaultStorage(): StorageAdapter {
  return typeof indexedDB === 'undefined' ? createMemoryStorage() : createIdbStorage();
}

/** The app-wide store. */
export const appStore: AppStore = createAppStore(defaultStorage());

/** React hook. Select the smallest slice you need; selectors must return stable values. */
export function useApp<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector);
}

export function useActiveProfile(): Profile | undefined {
  return useApp((s) => s.data.profiles.find((p) => p.id === s.activeProfileId));
}
