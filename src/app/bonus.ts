import type { AppStore } from '@/state/store';
import { normalizeEmail } from '@/sync/protocol';
import type { SyncUi } from '@/sync/client';
import type { StoreApi } from 'zustand/vanilla';

/**
 * The bonus world of idioms is one family's: it opens for their children once a
 * device of theirs is signed in with the family's email. The code is public, so
 * the email itself is not in it, only its SHA-256. Once opened, the flag is in
 * each child's settings, and sync brings it to the family's other devices.
 */
const IDIOMS_FAMILY = '2bdd6d24f102efa67fb67c0a107c079ca9eea1a0f33a5edbf21da690a8a9f4e7';

export async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Whether this email is the family the idioms world is for. */
export async function opensIdioms(email: string): Promise<boolean> {
  try {
    return (await sha256(normalizeEmail(email))) === IDIOMS_FAMILY;
  } catch {
    // No crypto.subtle (an old browser, a page not served securely): nothing opens.
    return false;
  }
}

/** Every child of the family gets the world (and one added later, the next time). */
function openForAll(appStore: AppStore): void {
  const ids = appStore.getState().data.profiles.map((p) => p.id);
  for (const id of ids) {
    // Read again each time: each change below is a new list of children.
    const { data, updateProfile } = appStore.getState();
    const p = data.profiles.find((x) => x.id === id);
    if (!p || p.settings.idioms) continue;
    updateProfile(p.id, {
      name: p.name,
      avatar: p.avatar,
      grade: p.grade,
      gender: p.gender,
      settings: { ...p.settings, idioms: true },
    });
  }
}

/** Watches the device's account email (sync), and the children, from the app's start. */
export function startBonus(sync: StoreApi<SyncUi>, appStore: AppStore): void {
  let open = false;
  let opening = false;
  const check = async () => {
    const email = sync.getState().accountEmail;
    if (!open && email) open = await opensIdioms(email);
    if (opening || !open) return;
    if (!appStore.getState().data.profiles.some((p) => !p.settings.idioms)) return;
    opening = true;
    try {
      openForAll(appStore);
    } finally {
      opening = false;
    }
  };
  sync.subscribe((s, prev) => {
    if (s.accountEmail !== prev.accountEmail) {
      open = false;
      void check();
    }
  });
  appStore.subscribe((s, prev) => {
    if (open && s.data.profiles !== prev.data.profiles) void check();
  });
  void check();
}
