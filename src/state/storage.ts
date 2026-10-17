import { createStore, get, set } from 'idb-keyval';
import type { AppData } from './schema';

/**
 * Where AppData lives. The app uses IndexedDB; tests use the memory adapter.
 *
 * IndexedDB rather than localStorage: it is not size-limited to ~5 MB, it is
 * asynchronous, and on iOS a home-screen web app keeps it indefinitely
 * (Safari's 7-day eviction applies only to sites used in the browser).
 */
export interface StorageAdapter {
  /** Returns the stored document, or undefined if nothing was ever saved. Throws if storage is unusable. */
  load: () => Promise<unknown>;
  save: (data: AppData) => Promise<void>;
  /** Keeps an unreadable document aside instead of overwriting it. */
  quarantine: (raw: unknown, at: number) => Promise<void>;
  /** Asks the browser not to evict our data. Resolves to whether it agreed. */
  requestPersistence: () => Promise<boolean>;
  isPersisted: () => Promise<boolean>;
}

const KEY = 'app';

export function createIdbStorage(): StorageAdapter {
  const store = createStore('heshbon', 'kv');
  return {
    load: () => get<unknown>(KEY, store),
    save: (data) => set(KEY, data, store),
    quarantine: (raw, at) => set(`corrupt-${at}`, raw, store),
    requestPersistence: async () => (await navigator.storage?.persist?.()) ?? false,
    isPersisted: async () => (await navigator.storage?.persisted?.()) ?? false,
  };
}

/** In-memory adapter: for tests, and as a fallback when IndexedDB is unavailable. */
export function createMemoryStorage(initial?: unknown): StorageAdapter & {
  peek: () => unknown;
  quarantined: () => Map<string, unknown>;
} {
  let value: unknown = initial === undefined ? undefined : structuredClone(initial);
  const corrupt = new Map<string, unknown>();
  return {
    load: () => Promise.resolve(value === undefined ? undefined : structuredClone(value)),
    save: (data) => {
      value = structuredClone(data);
      return Promise.resolve();
    },
    quarantine: (raw, at) => {
      corrupt.set(`corrupt-${at}`, raw);
      return Promise.resolve();
    },
    requestPersistence: () => Promise.resolve(false),
    isPersisted: () => Promise.resolve(false),
    peek: () => value,
    quarantined: () => corrupt,
  };
}
