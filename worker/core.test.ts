// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeProfile } from '../src/state/testData';
import {
  emptyShared,
  emptySlice,
  PAIR_CODE_TTL_MS,
  type LinkResponse,
  type PairCodeResponse,
  type SharedDoc,
  type SyncResponse,
} from '../src/sync/protocol';
import { handleApi, memoryServices, type Services } from './core';

const ORIGIN = 'https://math.example';

function server(clock = { now: 1_000_000 }) {
  const services = memoryServices(() => clock.now);
  return { services, clock };
}

async function call<T>(
  services: Services,
  path: string,
  body: unknown,
  options: { token?: string; ip?: string; origin?: string } = {},
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.token) headers['authorization'] = `Bearer ${options.token}`;
  if (options.ip) headers['cf-connecting-ip'] = options.ip;
  if (options.origin) headers['origin'] = options.origin;
  const res = await handleApi(
    new Request(`${ORIGIN}${path}`, { method: 'POST', headers, body: JSON.stringify(body) }),
    services,
  );
  return { status: res.status, body: (await res.json()) as T };
}

function sharedWith(name: string): SharedDoc {
  return {
    ...emptyShared(),
    profiles: { noa: { value: makeProfile({ id: 'noa', name }), at: 1 } },
  };
}

async function newFamily(services: Services) {
  const res = await call<LinkResponse>(services, '/api/family', {
    deviceName: 'אייפד',
    shared: sharedWith('נועה'),
    slice: emptySlice(),
  });
  expect(res.status).toBe(200);
  return res.body;
}

async function pair(services: Services, token: string, ip = '1.1.1.1') {
  const start = await call<PairCodeResponse>(services, '/api/pair/start', {}, { token });
  expect(start.status).toBe(200);
  expect(start.body.code).toMatch(/^\d{6}$/);
  return call<LinkResponse>(
    services,
    '/api/pair/join',
    { code: start.body.code, deviceName: 'טלפון' },
    { ip },
  );
}

describe('the sync server', () => {
  it('creates a family, links a second device with a code, and shares the data', async () => {
    const { services } = server();
    const a = await newFamily(services);
    expect(a.token).toMatch(/^v1\./);
    expect(a.devices).toHaveLength(1);

    const b = await pair(services, a.token);
    expect(b.status).toBe(200);
    expect(b.body.familyId).toBe(a.familyId);
    expect(b.body.shared.profiles['noa']?.value?.name).toBe('נועה');
    expect(b.body.devices.map((d) => d.name)).toEqual(['אייפד', 'טלפון']);

    // B renames the child; A sees it on its next sync, and B's slice.
    const slice = { ...emptySlice(), at: 5 };
    const renamed: SharedDoc = {
      ...emptyShared(),
      profiles: { noa: { value: makeProfile({ id: 'noa', name: 'נועי' }), at: 2 } },
    };
    const synced = await call<SyncResponse>(
      services,
      '/api/sync',
      { shared: renamed, slice },
      { token: b.body.token },
    );
    expect(synced.status).toBe(200);
    const seen = await call<SyncResponse>(
      services,
      '/api/sync',
      { shared: emptyShared(), slice: emptySlice() },
      { token: a.token },
    );
    expect(seen.body.shared.profiles['noa']?.value?.name).toBe('נועי');
    expect(seen.body.slices[b.body.deviceId]).toEqual(slice);
    expect(seen.body.slices[a.deviceId]).toBeUndefined();
  });

  it('a code works once and expires after ten minutes', async () => {
    const { services, clock } = server();
    const a = await newFamily(services);
    const start = await call<PairCodeResponse>(services, '/api/pair/start', {}, { token: a.token });
    const join = (ip: string) =>
      call(services, '/api/pair/join', { code: start.body.code, deviceName: 'x' }, { ip });
    expect((await join('1.1.1.1')).status).toBe(200);
    expect((await join('1.1.1.2')).status).toBe(400);

    const late = await call<PairCodeResponse>(services, '/api/pair/start', {}, { token: a.token });
    clock.now += PAIR_CODE_TTL_MS + 1;
    const res = await call<{ error: string }>(
      services,
      '/api/pair/join',
      { code: late.body.code, deviceName: 'x' },
      { ip: '1.1.1.3' },
    );
    expect(res.body.error).toBe('invalidCode');
  });

  it('guessing codes is stopped after ten wrong tries from one address', async () => {
    const { services } = server();
    const a = await newFamily(services);
    for (let i = 0; i < 10; i++) {
      const res = await call(services, '/api/pair/join', { code: '000000' }, { ip: '6.6.6.6' });
      expect(res.status).toBe(400);
    }
    const start = await call<PairCodeResponse>(services, '/api/pair/start', {}, { token: a.token });
    const blocked = await call<{ error: string }>(
      services,
      '/api/pair/join',
      { code: start.body.code },
      { ip: '6.6.6.6' },
    );
    expect(blocked.status).toBe(429);
    // Another address still gets in with the right code.
    const ok = await call(services, '/api/pair/join', { code: start.body.code }, { ip: '7.7.7.7' });
    expect(ok.status).toBe(200);
  });

  it('rejects a wrong or missing token, another origin, and oversized data', async () => {
    const { services } = server();
    const a = await newFamily(services);
    const body = { shared: emptyShared(), slice: emptySlice() };
    expect((await call(services, '/api/sync', body)).status).toBe(401);
    const forged = a.token.slice(0, -4) + 'AAAA';
    expect((await call(services, '/api/sync', body, { token: forged })).status).toBe(401);
    const cross = await call(services, '/api/sync', body, {
      token: a.token,
      origin: 'https://evil.example',
    });
    expect(cross.status).toBe(401);
    const huge = { ...emptySlice(), progress: { x: { pad: 'x'.repeat(300_000) } } };
    const big = await call(
      services,
      '/api/sync',
      { shared: emptyShared(), slice: huge },
      {
        token: a.token,
      },
    );
    expect(big.status).toBe(413);
    const bad = await call(services, '/api/sync', { shared: 5, slice: [] }, { token: a.token });
    expect(bad.status).toBe(400);
  });

  it('a removed device can no longer sync, and its practice stays counted', async () => {
    const { services } = server();
    const a = await newFamily(services);
    const b = (await pair(services, a.token)).body;
    const slice = { ...emptySlice(), at: 9 };
    await call(services, '/api/sync', { shared: emptyShared(), slice }, { token: b.token });

    const removed = await call(
      services,
      '/api/device/remove',
      { deviceId: b.deviceId },
      { token: a.token },
    );
    expect(removed.status).toBe(200);
    const after = await call<SyncResponse>(
      services,
      '/api/sync',
      { shared: emptyShared(), slice: emptySlice() },
      { token: b.token },
    );
    expect(after.status).toBe(401);
    const seen = await call<SyncResponse>(
      services,
      '/api/sync',
      { shared: emptyShared(), slice: emptySlice() },
      { token: a.token },
    );
    expect(seen.body.devices).toHaveLength(1);
    expect(seen.body.slices[b.deviceId]).toEqual(slice);
  });

  it('deleting the family removes everything; its devices are unlinked', async () => {
    const { services } = server();
    const a = await newFamily(services);
    const b = (await pair(services, a.token)).body;
    expect((await call(services, '/api/family/delete', {}, { token: b.token })).status).toBe(200);
    const body = { shared: emptyShared(), slice: emptySlice() };
    expect((await call(services, '/api/sync', body, { token: a.token })).status).toBe(401);
    expect((await call(services, '/api/sync', body, { token: b.token })).status).toBe(401);
  });

  it('only POST under /api is answered', async () => {
    const { services } = server();
    const res = await handleApi(new Request(`${ORIGIN}/api/sync`), services);
    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });
});
