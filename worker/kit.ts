/**
 * Small pieces shared by the server's parts (core.ts, accounts.ts, stats.ts):
 * the storage interface, an in-memory version of it, a few crypto helpers and
 * windowed counters for rate limits.
 */

/** The subset of Durable Object storage used here (the KV interface). */
export interface KV {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T = unknown>(options: { prefix: string }): Promise<Map<string, T>>;
  deleteAll(): Promise<void>;
}

export function memoryKV(): KV {
  const map = new Map<string, unknown>();
  const clone = <T>(v: T): T => structuredClone(v);
  return {
    get: <T>(key: string) => Promise.resolve(map.get(key) as T | undefined).then(clone),
    put: (key, value) => {
      map.set(key, clone(value));
      return Promise.resolve();
    },
    delete: (key) => Promise.resolve(map.delete(key)),
    list: <T>({ prefix }: { prefix: string }) =>
      Promise.resolve(
        new Map(
          [...map.entries()]
            .filter(([k]) => k.startsWith(prefix))
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([k, v]) => [k, clone(v) as T]),
        ),
      ),
    deleteAll: () => {
      map.clear();
      return Promise.resolve();
    },
  };
}

/* ---------- Crypto ---------- */

export function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomHex(bytes: number): string {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return hex(new Uint8Array(digest));
}

export async function hmac(keyHex: string, text: string): Promise<string> {
  const raw = new Uint8Array((keyHex.match(/../g) ?? []).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return hex(new Uint8Array(mac));
}

/** Compares two strings in time that does not depend on where they differ. */
export function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------- Counters in a time window (rate limits) ---------- */

export const HOUR = 60 * 60 * 1000;

export interface Counter {
  count: number;
  since: number;
}

/** Adds one to a counter in a time window; returns the count before. */
export async function bump(kv: KV, key: string, window: number, now: number): Promise<number> {
  const c = await kv.get<Counter>(key);
  const current = c && now - c.since < window ? c : { count: 0, since: now };
  await kv.put(key, { ...current, count: current.count + 1 });
  return current.count;
}

export async function count(kv: KV, key: string, window: number, now: number): Promise<number> {
  const c = await kv.get<Counter>(key);
  return c && now - c.since < window ? c.count : 0;
}

/** Drops counters under these prefixes older than a day. */
export async function sweepCounters(kv: KV, prefixes: string[], now: number): Promise<void> {
  for (const prefix of prefixes) {
    for (const [key, c] of await kv.list<Counter>({ prefix })) {
      if (now - c.since > 24 * HOUR) await kv.delete(key);
    }
  }
}
