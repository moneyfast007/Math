import { createStore as createIdb, del, get, keys, set } from 'idb-keyval';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { AppData, Profile, ProfileProgress } from '@/state/schema';
import type { AppStore } from '@/state/store';
import { dayKey } from '@/state/streak';
import { parseAppData, safePin, safeProfile, safeProgress } from '@/state/validate';
import { applyDiff, buildView, planJoin, stampShared, startFamily } from './merge';
import {
  mergeShared,
  type DeviceInfo,
  type LinkResponse,
  type PairCodeResponse,
  type SharedDoc,
  type Slice,
  type Stamped,
  type SyncErrorCode,
  type SyncResponse,
} from './protocol';

/**
 * The app's side of sync.
 *
 * The app keeps working on its one AppData as before; this engine watches it.
 * Every change is recorded into this device's slice and the shared document
 * (merge.ts), saved, and sent a few seconds later. Each answer from the
 * server brings the other devices' slices, and the view is rebuilt from all
 * of them. Without a connection nothing changes for the child: the app works
 * as before and catches up when the connection is back.
 *
 * Before data from the server first changes the view on a given day, the
 * view as it was is kept on this device (the last three days), so a sync
 * problem can always be undone from the parent area.
 */

/** What is kept on this device about its link to the family. */
export interface SyncState {
  token: string;
  familyId: string;
  deviceId: string;
  shared: SharedDoc;
  own: Slice;
  /** The other devices' slices, as last received. */
  remote: Record<string, Slice>;
  devices: DeviceInfo[];
  lastSyncAt: number | null;
}

export interface Snapshot {
  day: string;
  data: AppData;
}

export interface SyncStorage {
  load: () => Promise<unknown>;
  save: (state: SyncState | null) => Promise<void>;
  saveSnapshot: (day: string, data: AppData) => Promise<void>;
  snapshots: () => Promise<Snapshot[]>;
}

export const SNAPSHOTS_KEPT = 3;

export function createIdbSyncStorage(): SyncStorage {
  const store = createIdb('heshbon', 'kv');
  const PREFIX = 'snapshot-';
  const snapshotKeys = async () =>
    (await keys(store))
      .filter((k): k is string => typeof k === 'string' && k.startsWith(PREFIX))
      .sort();
  return {
    load: () => get<unknown>('sync', store),
    save: (state) => (state ? set('sync', state, store) : del('sync', store)),
    saveSnapshot: async (day, data) => {
      await set(`${PREFIX}${day}`, data, store);
      const all = await snapshotKeys();
      for (const k of all.slice(0, Math.max(0, all.length - SNAPSHOTS_KEPT))) await del(k, store);
    },
    snapshots: async () => {
      const out: Snapshot[] = [];
      for (const k of (await snapshotKeys()).reverse()) {
        const data = await get<unknown>(k, store);
        const parsed = parseAppData(data);
        if (parsed.ok) out.push({ day: k.slice(PREFIX.length), data: parsed.data });
      }
      return out;
    },
  };
}

export function createMemorySyncStorage(): SyncStorage & { peek: () => SyncState | null } {
  let state: SyncState | null = null;
  const snaps = new Map<string, AppData>();
  return {
    load: () => Promise.resolve(state === null ? undefined : structuredClone(state)),
    save: (s) => {
      state = s === null ? null : structuredClone(s);
      return Promise.resolve();
    },
    saveSnapshot: (day, data) => {
      snaps.set(day, structuredClone(data));
      const days = [...snaps.keys()].sort();
      for (const d of days.slice(0, Math.max(0, days.length - SNAPSHOTS_KEPT))) snaps.delete(d);
      return Promise.resolve();
    },
    snapshots: () =>
      Promise.resolve(
        [...snaps.entries()]
          .sort(([a], [b]) => (a < b ? 1 : -1))
          .map(([day, data]) => ({ day, data: structuredClone(data) })),
      ),
    peek: () => state,
  };
}

/* ---------- Checking what comes from the server (or from storage) ---------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function readShared(value: unknown): SharedDoc | null {
  if (!isRecord(value) || !isRecord(value['profiles']) || !isRecord(value['pin'])) return null;
  const profiles: Record<string, Stamped<Profile | null>> = {};
  for (const [id, entry] of Object.entries(value['profiles'])) {
    if (!isRecord(entry) || !finite(entry['at'])) continue;
    if (entry['value'] === null) {
      profiles[id] = { value: null, at: entry['at'] };
      continue;
    }
    const profile = safeProfile(entry['value']);
    if (profile && profile.id === id) profiles[id] = { value: profile, at: entry['at'] };
  }
  const pin = safePin(value['pin']['value']);
  const pinAt = value['pin']['at'];
  if (pin === undefined || !finite(pinAt)) return null;
  return { profiles, pin: { value: pin, at: pinAt } };
}

function readSlice(value: unknown): Slice | null {
  if (!isRecord(value) || !isRecord(value['progress']) || !isRecord(value['levelAt'])) return null;
  const progress: Record<string, ProfileProgress> = {};
  for (const [pid, raw] of Object.entries(value['progress'])) {
    const p = safeProgress(raw);
    if (p) progress[pid] = p;
  }
  const levelAt: Record<string, Record<string, number>> = {};
  for (const [pid, raw] of Object.entries(value['levelAt'])) {
    if (!isRecord(raw)) continue;
    levelAt[pid] = Object.fromEntries(Object.entries(raw).filter(([, at]) => finite(at))) as Record<
      string,
      number
    >;
  }
  return { progress, levelAt, at: finite(value['at']) ? value['at'] : 0 };
}

function readDevices(value: unknown): DeviceInfo[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((d) =>
    isRecord(d) &&
    typeof d['id'] === 'string' &&
    typeof d['name'] === 'string' &&
    finite(d['createdAt']) &&
    finite(d['lastSeenAt'])
      ? [{ id: d['id'], name: d['name'], createdAt: d['createdAt'], lastSeenAt: d['lastSeenAt'] }]
      : [],
  );
}

function readSlices(value: unknown): Record<string, Slice> {
  const out: Record<string, Slice> = {};
  if (!isRecord(value)) return out;
  for (const [id, raw] of Object.entries(value)) {
    const slice = readSlice(raw);
    if (slice) out[id] = slice;
  }
  return out;
}

function readResponse(value: unknown): SyncResponse | null {
  if (!isRecord(value) || typeof value['deviceId'] !== 'string') return null;
  const shared = readShared(value['shared']);
  if (!shared) return null;
  return {
    deviceId: value['deviceId'],
    shared,
    slices: readSlices(value['slices']),
    devices: readDevices(value['devices']),
  };
}

function readLink(value: unknown): LinkResponse | null {
  const res = readResponse(value);
  if (!res || !isRecord(value)) return null;
  const { token, familyId } = value;
  if (typeof token !== 'string' || typeof familyId !== 'string') return null;
  return { ...res, token, familyId };
}

/** A saved SyncState, checked as strictly as data from the server. */
export function readState(value: unknown): SyncState | null {
  if (!isRecord(value)) return null;
  const { token, familyId, deviceId, lastSyncAt } = value;
  if (typeof token !== 'string' || typeof familyId !== 'string' || typeof deviceId !== 'string') {
    return null;
  }
  const shared = readShared(value['shared']);
  const own = readSlice(value['own']);
  if (!shared || !own) return null;
  return {
    token,
    familyId,
    deviceId,
    shared,
    own,
    remote: readSlices(value['remote']),
    devices: readDevices(value['devices']),
    lastSyncAt: finite(lastSyncAt) ? lastSyncAt : null,
  };
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(b, k) &&
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

/* ---------- The engine ---------- */

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'offline' | 'error';

export interface SyncUi {
  linked: boolean;
  status: SyncStatus;
  lastSyncAt: number | null;
  deviceId: string | null;
  devices: DeviceInfo[];
  /** This device was unlinked elsewhere (or the family was deleted). */
  removed: boolean;
}

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: SyncProblem };

/** Why an action failed, for the parent: the server's reason, or no connection. */
export type SyncProblem = SyncErrorCode | 'offline' | 'tooManyChildren' | 'unavailable';

export interface JoinResult {
  matched: string[];
  added: string[];
}

export interface SyncDeps {
  app: AppStore;
  storage: SyncStorage;
  fetch: (input: string, init: RequestInit) => Promise<Response>;
  now?: () => number;
  deviceName?: () => string;
}

/** Sends after a change once things have been quiet this long, and at the latest after the max. */
const DEBOUNCE_MS = 4000;
const MAX_WAIT_MS = 20_000;
/** While the app is open, the other devices' news is fetched this often. */
export const PULL_EVERY_MS = 60_000;

export class SyncEngine {
  readonly ui: StoreApi<SyncUi>;
  private state: SyncState | null = null;
  private applying = false;
  private inFlight: Promise<void> | null = null;
  private again = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private firstChangeAt: number | null = null;
  private started = false;
  private readonly now: () => number;
  private readonly deviceName: () => string;

  constructor(private readonly deps: SyncDeps) {
    this.now = deps.now ?? Date.now;
    this.deviceName = deps.deviceName ?? (() => 'מכשיר');
    this.ui = createStore<SyncUi>()(() => ({
      linked: false,
      status: 'off',
      lastSyncAt: null,
      deviceId: null,
      devices: [],
      removed: false,
    }));
  }

  /** Call once the app's data is loaded. Starts watching it, and syncs if linked. */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.state = readState(await this.deps.storage.load().catch(() => undefined));
    this.publish(this.state ? 'idle' : 'off');
    this.deps.app.subscribe((s, prev) => {
      if (this.applying || !this.state || s.data === prev.data) return;
      const at = this.now();
      this.state = {
        ...this.state,
        own: applyDiff(this.state.own, prev.data.progress, s.data.progress, at),
        shared: stampShared(this.state.shared, prev.data, s.data, at),
      };
      void this.persist();
      this.schedule();
    });
    if (this.state) {
      // What this device last received may be newer than what it shows (closed mid-way).
      await this.applyView();
      void this.sync();
    }
  }

  private publish(status: SyncStatus, extra: Partial<SyncUi> = {}): void {
    const s = this.state;
    this.ui.setState({
      linked: s !== null,
      status: s ? status : 'off',
      lastSyncAt: s?.lastSyncAt ?? null,
      deviceId: s?.deviceId ?? null,
      devices: s?.devices ?? [],
      ...extra,
    });
  }

  private persist(): Promise<void> {
    return this.deps.storage.save(this.state).catch(() => undefined);
  }

  private schedule(): void {
    if (!this.state) return;
    const at = this.now();
    this.firstChangeAt ??= at;
    const wait = Math.max(0, Math.min(DEBOUNCE_MS, this.firstChangeAt + MAX_WAIT_MS - at));
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.sync(), wait);
  }

  private async post(
    path: string,
    body: unknown,
    token?: string,
  ): Promise<{ ok: true; body: unknown } | { ok: false; error: SyncProblem }> {
    let res: Response;
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (token) headers['authorization'] = `Bearer ${token}`;
      res = await this.deps.fetch(path, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        cache: 'no-store',
      });
    } catch {
      return { ok: false, error: 'offline' };
    }
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      // A page instead of JSON (a captive portal, an old service worker): no connection to us.
      return { ok: false, error: 'offline' };
    }
    if (res.ok) return { ok: true, body: json };
    const code = isRecord(json) && typeof json['error'] === 'string' ? json['error'] : '';
    const known: SyncProblem[] = [
      'badRequest',
      'tooLarge',
      'unauthorized',
      'invalidCode',
      'rateLimited',
      'tooManyDevices',
      'notFound',
    ];
    return {
      ok: false,
      error: (known as string[]).includes(code) ? (code as SyncProblem) : 'unavailable',
    };
  }

  private viewOf(s: SyncState, data: AppData): AppData {
    return buildView(data, s.shared, [s.own, ...Object.values(s.remote)]);
  }

  /** Rebuilds the view from everything known; applies it if it differs. */
  private async applyView(): Promise<void> {
    const before = this.state;
    if (!before) return;
    const current = this.deps.app.getState().data;
    if (deepEqual(this.viewOf(before, current), current)) return;
    await this.snapshot(current);
    // Recomputed after the wait: a change made meanwhile must not be undone.
    const s = this.state;
    if (!s) return;
    const data = this.deps.app.getState().data;
    const view = this.viewOf(s, data);
    if (deepEqual(view, data)) return;
    const parsed = parseAppData(view);
    if (!parsed.ok) {
      this.publish('error');
      return;
    }
    this.applying = true;
    try {
      this.deps.app.getState().applySynced(parsed.data);
    } finally {
      this.applying = false;
    }
  }

  private async snapshot(data: AppData): Promise<void> {
    const day = dayKey(this.now());
    const existing = await this.deps.storage.snapshots().catch(() => []);
    if (existing.some((s) => s.day === day)) return;
    await this.deps.storage.saveSnapshot(day, data).catch(() => undefined);
  }

  /** Sends this device's news and takes the family's. Safe to call any time. */
  sync(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.firstChangeAt = null;
    if (!this.state) return Promise.resolve();
    if (this.inFlight) {
      this.again = true;
      return this.inFlight;
    }
    this.inFlight = this.run().finally(() => {
      this.inFlight = null;
      if (this.again) {
        this.again = false;
        void this.sync();
      }
    });
    return this.inFlight;
  }

  private async run(): Promise<void> {
    const sent = this.state;
    if (!sent) return;
    this.publish('syncing');
    const res = await this.post('/api/sync', { shared: sent.shared, slice: sent.own }, sent.token);
    if (!this.state || this.state.token !== sent.token) return;
    if (!res.ok) {
      if (res.error === 'unauthorized') {
        await this.unlinkHere(true);
        return;
      }
      this.publish(res.error === 'offline' ? 'offline' : 'error');
      return;
    }
    const body = readResponse(res.body);
    if (!body) {
      this.publish('error');
      return;
    }
    this.state = {
      ...this.state,
      shared: mergeShared(this.state.shared, body.shared),
      remote: body.slices,
      devices: body.devices,
      lastSyncAt: this.now(),
    };
    await this.persist();
    await this.applyView();
    this.publish('idle');
  }

  /** The first device: the family is created from everything this device has. */
  async createFamily(): Promise<ActionResult> {
    if (this.state) return { ok: true };
    const at = this.now();
    const { shared, own } = startFamily(this.deps.app.getState().data, at);
    const res = await this.post('/api/family', {
      deviceName: this.deviceName(),
      shared,
      slice: own,
    });
    if (!res.ok) return res;
    const link = readLink(res.body);
    if (!link) return { ok: false, error: 'unavailable' };
    // Anything changed while waiting is included (the next sync sends it).
    const fresh = startFamily(this.deps.app.getState().data, this.now());
    this.state = {
      token: link.token,
      familyId: link.familyId,
      deviceId: link.deviceId,
      shared: mergeShared(fresh.shared, link.shared),
      own: fresh.own,
      remote: link.slices,
      devices: link.devices,
      lastSyncAt: at,
    };
    await this.persist();
    this.publish('idle', { removed: false });
    return { ok: true };
  }

  /** Joins the family whose code was shown on one of its devices. */
  async join(code: string): Promise<ActionResult<JoinResult>> {
    if (this.state) return { ok: false, error: 'badRequest' };
    const res = await this.post('/api/pair/join', { code, deviceName: this.deviceName() });
    if (!res.ok) return res;
    const link = readLink(res.body);
    if (!link) return { ok: false, error: 'unavailable' };
    const data = this.deps.app.getState().data;
    const at = this.now();
    const plan = planJoin(data, { shared: link.shared, slices: Object.values(link.slices) }, at);
    if (plan.tooMany) {
      await this.post('/api/device/remove', { deviceId: link.deviceId }, link.token);
      return { ok: false, error: 'tooManyChildren' };
    }
    await this.snapshot(data);
    this.state = {
      token: link.token,
      familyId: link.familyId,
      deviceId: link.deviceId,
      shared: plan.shared,
      own: plan.own,
      remote: link.slices,
      devices: link.devices,
      lastSyncAt: at,
    };
    await this.persist();
    await this.applyView();
    this.publish('idle', { removed: false });
    await this.sync();
    return { ok: true, matched: plan.matched, added: plan.added };
  }

  /** A code another device can join with (ten minutes, once). */
  async pairingCode(): Promise<ActionResult<PairCodeResponse>> {
    const s = this.state;
    if (!s) return { ok: false, error: 'unauthorized' };
    const res = await this.post('/api/pair/start', {}, s.token);
    if (!res.ok) {
      if (res.error === 'unauthorized') await this.unlinkHere(true);
      return res;
    }
    const b = res.body;
    if (!isRecord(b) || typeof b['code'] !== 'string' || !finite(b['expiresAt'])) {
      return { ok: false, error: 'unavailable' };
    }
    return { ok: true, code: b['code'], expiresAt: b['expiresAt'] };
  }

  /** Unlinks a device of the family: another one, or this one (it keeps its data). */
  async removeDevice(deviceId: string): Promise<ActionResult> {
    const s = this.state;
    if (!s) return { ok: false, error: 'unauthorized' };
    await this.sync();
    const res = await this.post('/api/device/remove', { deviceId }, s.token);
    if (!res.ok && res.error !== 'unauthorized' && res.error !== 'notFound') return res;
    if (deviceId === s.deviceId || (!res.ok && res.error === 'unauthorized')) {
      await this.unlinkHere(false);
    } else {
      await this.sync();
    }
    return { ok: true };
  }

  /** Deletes everything the server has; every device keeps what it shows now. */
  async deleteFamily(): Promise<ActionResult> {
    const s = this.state;
    if (!s) return { ok: true };
    const res = await this.post('/api/family/delete', {}, s.token);
    if (!res.ok && res.error !== 'unauthorized') return res;
    await this.unlinkHere(false);
    return { ok: true };
  }

  /** The views kept before sync changed this device's data, newest first. */
  snapshots(): Promise<Snapshot[]> {
    return this.deps.storage.snapshots().catch(() => []);
  }

  /** Goes back to a kept view. The device leaves the family first, so it is not merged again. */
  async restore(snapshot: Snapshot): Promise<ActionResult> {
    if (this.state) {
      const res = await this.removeDevice(this.state.deviceId);
      if (!res.ok) return res;
    }
    this.deps.app.getState().replaceData(snapshot.data);
    return { ok: true };
  }

  /** Forgets the link on this device; what it shows stays as it is. */
  private async unlinkHere(removed: boolean): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.state = null;
    await this.persist();
    this.publish('off', { removed });
  }

  /** Clears the "unlinked elsewhere" notice. */
  dismissRemoved(): void {
    this.ui.setState({ removed: false });
  }
}
