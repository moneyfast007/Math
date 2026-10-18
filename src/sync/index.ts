import { useStore } from 'zustand';
import { appStore } from '@/state/store';
import { createIdbSyncStorage, createMemorySyncStorage, PULL_EVERY_MS, SyncEngine, type SyncUi } from './client';

/** A name a parent recognizes in the list of devices. */
export function deviceName(): string {
  const ua = navigator.userAgent;
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'אייפד';
  if (/iPhone/.test(ua)) return 'אייפון';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'טלפון אנדרואיד' : 'טאבלט אנדרואיד';
  return 'מחשב';
}

export const syncEngine = new SyncEngine({
  app: appStore,
  storage: typeof indexedDB === 'undefined' ? createMemorySyncStorage() : createIdbSyncStorage(),
  fetch: (input, init) => fetch(input, init),
  deviceName,
});

/**
 * Starts sync once the app's data is loaded: on opening, when the app comes
 * back to the screen or the connection returns, every minute while open, and
 * right away when it is put away (so the other devices see the last round).
 */
export function startSync(): void {
  void syncEngine.start();
  document.addEventListener('visibilitychange', () => void syncEngine.sync());
  window.addEventListener('online', () => void syncEngine.sync());
  setInterval(() => {
    if (document.visibilityState === 'visible') void syncEngine.sync();
  }, PULL_EVERY_MS);
}

export function useSync<T>(selector: (s: SyncUi) => T): T {
  return useStore(syncEngine.ui, selector);
}
