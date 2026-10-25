import {
  ACCOUNT_KEY,
  INTEREST_ID,
  isCrashReport,
  isMistakeReport,
  LIMITS,
  PAIR_CODE_LENGTH,
  PAIR_CODE_TTL_MS,
  emptyShared,
  isSharedDoc,
  isSlice,
  isEmail,
  isSyncRequest,
  mergeShared,
  normalizeEmail,
  type DeviceInfo,
  type LinkResponse,
  type PairCodeResponse,
  type SharedDoc,
  type Slice,
  type SyncErrorCode,
  type SyncRequest,
  type SyncResponse,
} from '../src/sync/protocol';
import { AccountsCore, type AccountsApi } from './accounts';
import { memoryKV, randomHex, sameText, sha256, type KV } from './kit';
import { StatsCore, dayOf, renderStats, summarize, type StatsApi } from './stats';

export { memoryKV, randomHex, type KV };

/**
 * The sync server's logic, independent of Cloudflare so it can be tested (and
 * used by the end-to-end tests as a stand-in server).
 *
 * - One `FamilyCore` per family (a Durable Object in production): its devices,
 *   the shared document, and one progress slice per device.
 * - One `PairingCore` for everyone: the short-lived codes that link a new
 *   device to a family, and the limits that stop guessing them.
 *
 * - One `AccountsCore` (accounts.ts): signing in with an email and a password,
 *   kept as hashes only.
 * - One `StatsCore` (stats.ts): anonymous counts of families, for the owner.
 *
 * What is stored about a family is exactly what the app sends: the children's
 * profiles (name, avatar, grade), their progress, and the parents' PIN as a
 * salted hash. No email address (only a keyed hash of it, if the parents chose
 * to sign in with one), no IP address (only counters of failed attempts per
 * address, for an hour), no third-party analytics.
 */

function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** A uniformly random code of PAIR_CODE_LENGTH digits. */
function randomCode(): string {
  const range = 10 ** PAIR_CODE_LENGTH;
  const limit = Math.floor(0x1_0000_0000 / range) * range;
  for (;;) {
    const [n = 0] = crypto.getRandomValues(new Uint32Array(1));
    if (n < limit) return String(n % range).padStart(PAIR_CODE_LENGTH, '0');
  }
}

function cleanName(name: unknown): string {
  const text = typeof name === 'string' ? name.trim().slice(0, LIMITS.deviceName) : '';
  return text || 'מכשיר';
}

const size = (value: unknown) => JSON.stringify(value).length;

/* ---------- A family ---------- */

interface DeviceRecord extends DeviceInfo {
  tokenHash: string;
}

export interface Credentials {
  deviceId: string;
  secret: string;
}

type Result<T> = T | { error: SyncErrorCode };

export function isError<T>(value: Result<T>): value is { error: SyncErrorCode } {
  return typeof value === 'object' && value !== null && 'error' in value;
}

/** What the request handler needs from a family (a Durable Object stub in production). */
export interface FamilyApi {
  create(familyId: string, deviceName: string, req: SyncRequest): Promise<Result<LinkCore>>;
  join(deviceName: string): Promise<Result<LinkCore>>;
  sync(auth: Credentials, req: SyncRequest): Promise<Result<SyncResult>>;
  verify(auth: Credentials): Promise<boolean>;
  removeDevice(auth: Credentials, deviceId: string): Promise<Result<{ ok: true }>>;
  destroy(auth: Credentials): Promise<Result<{ ok: true }>>;
}

/** A sync's answer, and whether it is the family's first sync today (counted once a day). */
export interface SyncResult extends SyncResponse {
  firstToday?: true;
}

/** A new device's credentials and the family's data (the handler adds the token). */
export interface LinkCore extends SyncResponse {
  secret: string;
}

export class FamilyCore implements FamilyApi {
  constructor(
    private readonly kv: KV,
    private readonly now: () => number = Date.now,
  ) {}

  private async devices(): Promise<DeviceRecord[]> {
    return [...(await this.kv.list<DeviceRecord>({ prefix: 'device:' })).values()];
  }

  private async newDevice(name: string): Promise<{ id: string; secret: string }> {
    const id = randomHex(8);
    const secret = randomSecret();
    const at = this.now();
    const record: DeviceRecord = {
      id,
      name: cleanName(name),
      createdAt: at,
      lastSeenAt: at,
      tokenHash: await sha256(secret),
    };
    await this.kv.put(`device:${id}`, record);
    return { id, secret };
  }

  private async authed(auth: Credentials): Promise<DeviceRecord | null> {
    if (!/^[0-9a-f]{16}$/.test(auth.deviceId)) return null;
    const record = await this.kv.get<DeviceRecord>(`device:${auth.deviceId}`);
    if (!record) return null;
    return sameText(record.tokenHash, await sha256(auth.secret)) ? record : null;
  }

  /** The family's data as one device sees it. */
  private async state(deviceId: string): Promise<SyncResponse> {
    const shared = (await this.kv.get<SharedDoc>('shared')) ?? emptyShared();
    const slices: Record<string, Slice> = {};
    for (const [key, slice] of await this.kv.list<Slice>({ prefix: 'slice:' })) {
      const id = key.slice('slice:'.length);
      if (id !== deviceId) slices[id] = slice;
    }
    const devices = (await this.devices())
      .map(({ id, name, createdAt, lastSeenAt }) => ({ id, name, createdAt, lastSeenAt }))
      .sort((a, b) => a.createdAt - b.createdAt);
    return { deviceId, shared, slices, devices };
  }

  /** Stores what a device sent: its slice, and its shared document merged in. */
  private async store(deviceId: string, req: SyncRequest): Promise<SyncErrorCode | null> {
    if (!isSharedDoc(req.shared) || !isSlice(req.slice)) return 'badRequest';
    if (size(req.slice) > LIMITS.slice) return 'tooLarge';
    const current = (await this.kv.get<SharedDoc>('shared')) ?? emptyShared();
    const shared = mergeShared(current, req.shared);
    if (size(shared) > LIMITS.shared) return 'tooLarge';
    await this.kv.put('shared', shared);
    await this.kv.put(`slice:${deviceId}`, req.slice);
    return null;
  }

  async create(familyId: string, deviceName: string, req: SyncRequest): Promise<Result<LinkCore>> {
    if (await this.kv.get('family')) return { error: 'badRequest' };
    if (!isSyncRequest(req)) return { error: 'badRequest' };
    await this.kv.put('family', { id: familyId, createdAt: this.now() });
    await this.kv.put('activeDay', dayOf(this.now()));
    const device = await this.newDevice(deviceName);
    const problem = await this.store(device.id, req);
    if (problem) {
      await this.kv.deleteAll();
      return { error: problem };
    }
    return { ...(await this.state(device.id)), secret: device.secret };
  }

  async join(deviceName: string): Promise<Result<LinkCore>> {
    if (!(await this.kv.get('family'))) return { error: 'notFound' };
    if ((await this.devices()).length >= LIMITS.devices) return { error: 'tooManyDevices' };
    const device = await this.newDevice(deviceName);
    return { ...(await this.state(device.id)), secret: device.secret };
  }

  async verify(auth: Credentials): Promise<boolean> {
    return (await this.authed(auth)) !== null;
  }

  async sync(auth: Credentials, req: SyncRequest): Promise<Result<SyncResult>> {
    const device = await this.authed(auth);
    if (!device) return { error: 'unauthorized' };
    const problem = await this.store(device.id, req);
    if (problem) return { error: problem };
    await this.kv.put(`device:${device.id}`, { ...device, lastSeenAt: this.now() });
    const today = dayOf(this.now());
    const firstToday = (await this.kv.get<string>('activeDay')) !== today;
    if (firstToday) await this.kv.put('activeDay', today);
    const state = await this.state(device.id);
    return firstToday ? { ...state, firstToday: true } : state;
  }

  /** Unlinks a device (this one, or another of the family's). What it practiced stays counted. */
  async removeDevice(auth: Credentials, deviceId: string): Promise<Result<{ ok: true }>> {
    if (!(await this.authed(auth))) return { error: 'unauthorized' };
    if (!(await this.kv.delete(`device:${deviceId}`))) return { error: 'notFound' };
    return { ok: true };
  }

  /** Deletes everything the server has about the family. */
  async destroy(auth: Credentials): Promise<Result<{ ok: true }>> {
    if (!(await this.authed(auth))) return { error: 'unauthorized' };
    await this.kv.deleteAll();
    return { ok: true };
  }
}

/* ---------- Pairing codes and limits ---------- */

interface CodeRecord {
  familyId: string;
  expiresAt: number;
}

interface Counter {
  count: number;
  since: number;
}

const HOUR = 60 * 60 * 1000;
/** Wrong codes allowed per address per hour, and from everywhere per ten minutes. */
const FAILS_PER_ADDRESS = 10;
const FAILS_EVERYWHERE = 300;
/** New families per address per day. */
const FAMILIES_PER_ADDRESS = 20;

export interface PairingApi {
  start(familyId: string): Promise<PairCodeResponse>;
  redeem(code: string, address: string): Promise<Result<{ familyId: string }>>;
  allowFamily(address: string): Promise<boolean>;
}

export class PairingCore implements PairingApi {
  constructor(
    private readonly kv: KV,
    private readonly now: () => number = Date.now,
  ) {}

  /** Adds one to a counter in a time window; returns the count before. */
  private async bump(key: string, window: number): Promise<number> {
    const at = this.now();
    const c = await this.kv.get<Counter>(key);
    const current = c && at - c.since < window ? c : { count: 0, since: at };
    await this.kv.put(key, { ...current, count: current.count + 1 });
    return current.count;
  }

  private async count(key: string, window: number): Promise<number> {
    const c = await this.kv.get<Counter>(key);
    return c && this.now() - c.since < window ? c.count : 0;
  }

  /** Drops expired codes and old counters (there are only ever a handful). */
  private async sweep(): Promise<void> {
    const at = this.now();
    for (const [key, code] of await this.kv.list<CodeRecord>({ prefix: 'code:' })) {
      if (code.expiresAt <= at) await this.kv.delete(key);
    }
    for (const prefix of ['fail:', 'families:']) {
      for (const [key, c] of await this.kv.list<Counter>({ prefix })) {
        if (at - c.since > 24 * HOUR) await this.kv.delete(key);
      }
    }
  }

  async start(familyId: string): Promise<PairCodeResponse> {
    await this.sweep();
    // One live code per family: a new one replaces the last.
    const previous = await this.kv.get<string>(`family:${familyId}`);
    if (previous) await this.kv.delete(`code:${previous}`);
    let code = randomCode();
    while (await this.kv.get(`code:${code}`)) code = randomCode();
    const expiresAt = this.now() + PAIR_CODE_TTL_MS;
    await this.kv.put(`code:${code}`, { familyId, expiresAt });
    await this.kv.put(`family:${familyId}`, code);
    return { code, expiresAt };
  }

  async redeem(code: string, address: string): Promise<Result<{ familyId: string }>> {
    if (
      (await this.count(`fail:${address}`, HOUR)) >= FAILS_PER_ADDRESS ||
      (await this.count('fail:*', HOUR / 6)) >= FAILS_EVERYWHERE
    ) {
      return { error: 'rateLimited' };
    }
    const record = /^\d+$/.test(code) ? await this.kv.get<CodeRecord>(`code:${code}`) : undefined;
    if (!record || record.expiresAt <= this.now()) {
      await this.bump(`fail:${address}`, HOUR);
      await this.bump('fail:*', HOUR / 6);
      return { error: 'invalidCode' };
    }
    // A code links one device only.
    await this.kv.delete(`code:${code}`);
    await this.kv.delete(`family:${record.familyId}`);
    return { familyId: record.familyId };
  }

  async allowFamily(address: string): Promise<boolean> {
    return (await this.bump(`families:${address}`, 24 * HOUR)) < FAMILIES_PER_ADDRESS;
  }
}

/* ---------- HTTP ---------- */

export interface Services {
  family(familyId: string): FamilyApi;
  pairing(): PairingApi;
  accounts(): AccountsApi;
  stats(): StatsApi;
  /** Opens the usage page (/api/stats?key=…); without it the page does not exist. */
  statsKey?: string;
}

const STATUS: Record<SyncErrorCode, number> = {
  badRequest: 400,
  unauthorized: 401,
  notFound: 404,
  tooLarge: 413,
  invalidCode: 400,
  tooManyDevices: 409,
  rateLimited: 429,
  emailTaken: 409,
  badLogin: 401,
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

const fail = (error: SyncErrorCode) => json({ error }, STATUS[error]);

const TOKEN = /^v1\.([0-9a-f]{32})\.([0-9a-f]{16})\.([A-Za-z0-9_-]{43})$/;

function credentials(request: Request): (Credentials & { familyId: string }) | null {
  const header = request.headers.get('authorization') ?? '';
  const m = TOKEN.exec(header.replace(/^Bearer\s+/i, ''));
  if (!m?.[1] || !m[2] || !m[3]) return null;
  return { familyId: m[1], deviceId: m[2], secret: m[3] };
}

function token(familyId: string, deviceId: string, secret: string): string {
  return `v1.${familyId}.${deviceId}.${secret}`;
}

async function readBody(request: Request): Promise<Record<string, unknown> | SyncErrorCode> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > LIMITS.body) return 'tooLarge';
  const text = await request.text();
  if (text.length > LIMITS.body) return 'tooLarge';
  try {
    const value: unknown = JSON.parse(text || '{}');
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : 'badRequest';
  } catch {
    return 'badRequest';
  }
}

function link(familyId: string, result: LinkCore): LinkResponse {
  const { secret, ...state } = result;
  return { ...state, familyId, token: token(familyId, result.deviceId, secret) };
}

/** Counting never gets in the way: a failure there is ignored. */
async function quietly(work: () => Promise<unknown>): Promise<void> {
  try {
    await work();
  } catch {
    // The counts miss one; the request goes on.
  }
}

/** The email and the derived key of a sign-in request, checked. */
function readAccount(body: Record<string, unknown>): { email: string; key: string } | null {
  const email = typeof body['email'] === 'string' ? normalizeEmail(body['email']) : '';
  const key = typeof body['key'] === 'string' ? body['key'] : '';
  return isEmail(email) && ACCOUNT_KEY.test(key) ? { email, key } : null;
}

/** The usage page: GET /api/stats?key=…, only with the right key (otherwise as if it did not exist). */
async function statsPage(url: URL, services: Services): Promise<Response> {
  const given = url.searchParams.get('key') ?? '';
  const key = services.statsKey ?? '';
  if (key.length < 16 || !sameText(given, key)) return fail('notFound');
  return new Response(renderStats(await services.stats().report()), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}

/** Handles a request under /api/. Same-origin only; everything is a JSON POST (but the usage page). */
export async function handleApi(request: Request, services: Services): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/stats') return statsPage(url, services);
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return fail('unauthorized');
  if (request.method !== 'POST') return fail('notFound');
  const body = await readBody(request);
  if (typeof body === 'string') return fail(body);
  const address = request.headers.get('cf-connecting-ip') ?? 'unknown';

  switch (url.pathname) {
    case '/api/family': {
      const req = { shared: body['shared'], slice: body['slice'] };
      if (!isSyncRequest(req)) return fail('badRequest');
      if (!(await services.pairing().allowFamily(address))) return fail('rateLimited');
      const familyId = randomHex(16);
      const result = await services
        .family(familyId)
        .create(familyId, cleanName(body['deviceName']), req);
      if (isError(result)) return fail(result.error);
      await quietly(() =>
        services.stats().active(familyId, summarize(result.shared.profiles), true),
      );
      return json(link(familyId, result));
    }
    case '/api/pair/join': {
      const code = typeof body['code'] === 'string' ? body['code'] : '';
      const redeemed = await services.pairing().redeem(code, address);
      if (isError(redeemed)) return fail(redeemed.error);
      const result = await services.family(redeemed.familyId).join(cleanName(body['deviceName']));
      if (isError(result)) return fail(result.error);
      await quietly(() => services.stats().event('join'));
      return json(link(redeemed.familyId, result));
    }
    case '/api/account/login': {
      const account = readAccount(body);
      if (!account) return fail('badLogin');
      const found = await services.accounts().login(account.email, account.key, address);
      if (isError(found)) return fail(found.error);
      const result = await services.family(found.familyId).join(cleanName(body['deviceName']));
      if (isError(result)) {
        // The family was deleted but its sign-in was left behind: it opens nothing any more.
        if (result.error === 'notFound') {
          await services.accounts().remove(found.familyId);
          return fail('badLogin');
        }
        return fail(result.error);
      }
      await quietly(() => services.stats().event('login'));
      return json(link(found.familyId, result));
    }
    case '/api/mistake': {
      const report = body['report'];
      if (!isMistakeReport(report)) return fail('badRequest');
      return (await services.stats().mistake(report, address))
        ? json({ ok: true })
        : fail('rateLimited');
    }
    case '/api/crash': {
      const report = body['report'];
      if (!isCrashReport(report)) return fail('badRequest');
      return (await services.stats().crash(report, address))
        ? json({ ok: true })
        : fail('rateLimited');
    }
    case '/api/interest': {
      const id = typeof body['id'] === 'string' ? body['id'] : '';
      if (!INTEREST_ID.test(id)) return fail('badRequest');
      return (await services.stats().want(id, address)) ? json({ ok: true }) : fail('rateLimited');
    }
  }

  const auth = credentials(request);
  if (!auth) return fail('unauthorized');
  const family = services.family(auth.familyId);

  switch (url.pathname) {
    case '/api/sync': {
      const req = { shared: body['shared'], slice: body['slice'] };
      if (!isSyncRequest(req)) return fail('badRequest');
      const result = await family.sync(auth, req);
      if (isError(result)) return fail(result.error);
      const { firstToday, ...answer } = result;
      if (firstToday) {
        await quietly(() =>
          services.stats().active(auth.familyId, summarize(answer.shared.profiles), false),
        );
      }
      return json(answer);
    }
    case '/api/account/set': {
      if (!(await family.verify(auth))) return fail('unauthorized');
      const account = readAccount(body);
      if (!account) return fail('badRequest');
      const result = await services.accounts().set(auth.familyId, account.email, account.key);
      if (isError(result)) return fail(result.error);
      await quietly(async () => {
        await services.stats().event('account');
        await services.stats().setAccount(auth.familyId, true);
      });
      return json(result);
    }
    case '/api/account/status': {
      if (!(await family.verify(auth))) return fail('unauthorized');
      return json({ account: await services.accounts().has(auth.familyId) });
    }
    case '/api/account/remove': {
      if (!(await family.verify(auth))) return fail('unauthorized');
      await services.accounts().remove(auth.familyId);
      await quietly(() => services.stats().setAccount(auth.familyId, false));
      return json({ ok: true });
    }
    case '/api/pair/start': {
      if (!(await family.verify(auth))) return fail('unauthorized');
      return json(await services.pairing().start(auth.familyId));
    }
    case '/api/device/remove': {
      const target = typeof body['deviceId'] === 'string' ? body['deviceId'] : '';
      const result = await family.removeDevice(auth, target);
      return isError(result) ? fail(result.error) : json(result);
    }
    case '/api/family/delete': {
      const result = await family.destroy(auth);
      if (isError(result)) return fail(result.error);
      // Everything about the family goes: its sign-in and its line in the counts too.
      await services.accounts().remove(auth.familyId);
      await quietly(() => services.stats().forget(auth.familyId));
      return json(result);
    }
    default:
      return fail('notFound');
  }
}

/** An in-memory server (tests and the end-to-end stand-in). */
export function memoryServices(
  now: () => number = Date.now,
  statsKey?: string,
): Services & { accountsCore: AccountsCore; statsCore: StatsCore } {
  const families = new Map<string, FamilyCore>();
  const pairing = new PairingCore(memoryKV(), now);
  const accountsCore = new AccountsCore(memoryKV(), now);
  const statsCore = new StatsCore(memoryKV(), now);
  return {
    accountsCore,
    statsCore,
    accounts: () => accountsCore,
    stats: () => statsCore,
    ...(statsKey ? { statsKey } : {}),
    family(familyId) {
      let f = families.get(familyId);
      if (!f) families.set(familyId, (f = new FamilyCore(memoryKV(), now)));
      return f;
    },
    pairing: () => pairing,
  };
}
