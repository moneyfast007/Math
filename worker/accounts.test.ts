// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { makeProfile } from '../src/state/testData';
import {
  emptyShared,
  emptySlice,
  type LinkResponse,
  type SharedDoc,
  type SyncResponse,
} from '../src/sync/protocol';
import { handleApi, memoryServices, type Services } from './core';

const ORIGIN = 'https://math.example';
const KEY_A = 'A'.repeat(43);
const KEY_B = 'B'.repeat(43);
const STATS_KEY = 'owner-secret-0123456789';

function server() {
  const clock = { now: Date.UTC(2026, 9, 24, 9) };
  return { services: memoryServices(() => clock.now, STATS_KEY), clock };
}

async function call<T>(
  services: Services,
  path: string,
  body: unknown,
  options: { token?: string; ip?: string } = {},
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options.token) headers['authorization'] = `Bearer ${options.token}`;
  if (options.ip) headers['cf-connecting-ip'] = options.ip;
  const res = await handleApi(
    new Request(`${ORIGIN}${path}`, { method: 'POST', headers, body: JSON.stringify(body) }),
    services,
  );
  return { status: res.status, body: (await res.json()) as T };
}

function shared(): SharedDoc {
  return {
    ...emptyShared(),
    profiles: {
      noa: { value: makeProfile({ id: 'noa', name: 'נועה', grade: 2 }), at: 1 },
      uri: { value: makeProfile({ id: 'uri', name: 'אורי', grade: 0 }), at: 1 },
    },
  };
}

async function newFamily(services: Services) {
  const res = await call<LinkResponse>(services, '/api/family', {
    deviceName: 'אייפד',
    shared: shared(),
    slice: emptySlice(),
  });
  expect(res.status).toBe(200);
  return res.body;
}

describe('signing in with an email and a password', () => {
  it('opens the family on a new device, and only with the right password', async () => {
    const { services } = server();
    const family = await newFamily(services);
    const set = await call(
      services,
      '/api/account/set',
      { email: ' Dana@Example.com ', key: KEY_A },
      { token: family.token },
    );
    expect(set.status).toBe(200);

    const wrong = await call<{ error: string }>(services, '/api/account/login', {
      email: 'dana@example.com',
      key: KEY_B,
    });
    expect(wrong).toEqual({ status: 401, body: { error: 'badLogin' } });

    const login = await call<LinkResponse>(services, '/api/account/login', {
      email: 'DANA@example.com',
      key: KEY_A,
      deviceName: 'טלפון',
    });
    expect(login.status).toBe(200);
    expect(login.body.familyId).toBe(family.familyId);
    expect(login.body.devices.map((d) => d.name).sort()).toEqual(['אייפד', 'טלפון'].sort());
    expect(Object.keys(login.body.shared.profiles).sort()).toEqual(['noa', 'uri']);
  });

  it('keeps no email address or password, only hashes', async () => {
    const { services } = server();
    const family = await newFamily(services);
    await call(
      services,
      '/api/account/set',
      { email: 'dana@example.com', key: KEY_A },
      { token: family.token },
    );
    const kept = JSON.stringify([
      ...(
        await (
          services as unknown as {
            accountsCore: {
              kv: { list: (o: { prefix: string }) => Promise<Map<string, unknown>> };
            };
          }
        ).accountsCore.kv.list({ prefix: '' })
      ).entries(),
    ]);
    expect(kept).not.toContain('dana');
    expect(kept).not.toContain(KEY_A);
  });

  it('gives one email to one family only, and lets a family change its own', async () => {
    const { services } = server();
    const a = await newFamily(services);
    const b = await newFamily(services);
    const body = { email: 'dana@example.com', key: KEY_A };
    expect((await call(services, '/api/account/set', body, { token: a.token })).status).toBe(200);
    expect(await call(services, '/api/account/set', body, { token: b.token })).toEqual({
      status: 409,
      body: { error: 'emailTaken' },
    });
    // A new email for family a: the old one opens nothing any more.
    await call(
      services,
      '/api/account/set',
      { email: 'new@example.com', key: KEY_B },
      { token: a.token },
    );
    expect(
      (await call(services, '/api/account/login', { email: 'dana@example.com', key: KEY_A }))
        .status,
    ).toBe(401);
    expect(
      (await call(services, '/api/account/login', { email: 'new@example.com', key: KEY_B })).status,
    ).toBe(200);
  });

  it('needs a linked device to set one, and checks what it gets', async () => {
    const { services } = server();
    const family = await newFamily(services);
    expect(
      (await call(services, '/api/account/set', { email: 'dana@example.com', key: KEY_A })).status,
    ).toBe(401);
    expect(
      (
        await call(
          services,
          '/api/account/set',
          { email: 'not an email', key: KEY_A },
          { token: family.token },
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await call(
          services,
          '/api/account/set',
          { email: 'dana@example.com', key: 'short' },
          { token: family.token },
        )
      ).status,
    ).toBe(400);
  });

  it('tells a device whether the family has one, and removes it', async () => {
    const { services } = server();
    const family = await newFamily(services);
    const status = () =>
      call<{ account: boolean }>(services, '/api/account/status', {}, { token: family.token });
    expect((await status()).body.account).toBe(false);
    await call(
      services,
      '/api/account/set',
      { email: 'dana@example.com', key: KEY_A },
      { token: family.token },
    );
    expect((await status()).body.account).toBe(true);
    await call(services, '/api/account/remove', {}, { token: family.token });
    expect((await status()).body.account).toBe(false);
    expect(
      (await call(services, '/api/account/login', { email: 'dana@example.com', key: KEY_A }))
        .status,
    ).toBe(401);
  });

  it("checks the family's password on one of its devices (a forgotten parents' code), and only its own", async () => {
    const { services } = server();
    const family = await newFamily(services);
    const other = await newFamily(services);
    await call(
      services,
      '/api/account/set',
      { email: 'dana@example.com', key: KEY_A },
      { token: family.token },
    );
    await call(
      services,
      '/api/account/set',
      { email: 'noa@example.com', key: KEY_B },
      { token: other.token },
    );
    const check = (token: string, email: string, key: string) =>
      call(services, '/api/account/check', { email, key }, { token });
    expect((await check(family.token, 'dana@example.com', KEY_A)).status).toBe(200);
    expect((await check(family.token, 'dana@example.com', KEY_B)).status).toBe(401);
    // Another family's right password opens nothing here.
    expect((await check(family.token, 'noa@example.com', KEY_B)).status).toBe(401);
    expect(
      (await call(services, '/api/account/check', { email: 'dana@example.com', key: KEY_A }))
        .status,
    ).toBe(401);
  });

  it('stops guessing: ten wrong passwords from one address in an hour', async () => {
    const { services, clock } = server();
    const family = await newFamily(services);
    await call(
      services,
      '/api/account/set',
      { email: 'dana@example.com', key: KEY_A },
      { token: family.token },
    );
    for (let i = 0; i < 10; i++) {
      await call(
        services,
        '/api/account/login',
        { email: 'dana@example.com', key: KEY_B },
        { ip: '9.9.9.9' },
      );
    }
    const right = { email: 'dana@example.com', key: KEY_A };
    expect((await call(services, '/api/account/login', right, { ip: '9.9.9.9' })).status).toBe(429);
    clock.now += 61 * 60 * 1000;
    expect((await call(services, '/api/account/login', right, { ip: '9.9.9.9' })).status).toBe(200);
  });

  it('goes with the family when the family is deleted', async () => {
    const { services } = server();
    const family = await newFamily(services);
    await call(
      services,
      '/api/account/set',
      { email: 'dana@example.com', key: KEY_A },
      { token: family.token },
    );
    expect((await call(services, '/api/family/delete', {}, { token: family.token })).status).toBe(
      200,
    );
    expect(
      (await call(services, '/api/account/login', { email: 'dana@example.com', key: KEY_A }))
        .status,
    ).toBe(401);
  });
});

describe('the usage counts', () => {
  async function page(services: Services, key: string) {
    const res = await handleApi(new Request(`${ORIGIN}/api/stats?key=${key}`), services);
    return { status: res.status, text: await res.text() };
  }

  it('counts families, children by grade, active days and "I want more", without names', async () => {
    const { services, clock } = server();
    const family = await newFamily(services);
    await newFamily(services);
    // A sync the same day is not counted again; the next day it is.
    const sync = () =>
      call<SyncResponse>(
        services,
        '/api/sync',
        { shared: shared(), slice: emptySlice() },
        { token: family.token },
      );
    expect((await sync()).body).not.toHaveProperty('firstToday');
    clock.now += 24 * 60 * 60 * 1000;
    expect((await sync()).body).not.toHaveProperty('firstToday');
    await call(services, '/api/interest', { id: 'a'.repeat(32) });
    await call(services, '/api/interest', { id: 'a'.repeat(32) });

    const report = await (
      services as unknown as { statsCore: { report: () => Promise<Record<string, unknown>> } }
    ).statsCore.report();
    expect(report).toMatchObject({
      families: 2,
      activeToday: 1,
      active7: 2,
      children: 4,
      wants: 1,
      grades: { '0': 2, '2': 2 },
      kidsPerFamily: { '2': 2 },
    });

    const shown = await page(services, STATS_KEY);
    expect(shown.status).toBe(200);
    expect(shown.text).toContain('נתוני שימוש');
    expect(shown.text).not.toContain('נועה');
  });

  it('shows the page only with the right key', async () => {
    const { services } = server();
    expect((await page(services, 'wrong')).status).toBe(404);
    expect(
      (await handleApi(new Request(`${ORIGIN}/api/stats?key=x`), memoryServices())).status,
    ).toBe(404);
  });

  it('forgets a deleted family', async () => {
    const { services } = server();
    const family = await newFamily(services);
    await call(services, '/api/family/delete', {}, { token: family.token });
    const report = await (
      services as unknown as { statsCore: { report: () => Promise<{ families: number }> } }
    ).statsCore.report();
    expect(report.families).toBe(0);
  });

  it("keeps exercises reported as wrong, and the app's errors, without anything about the child", async () => {
    const { services } = server();
    const report = {
      topic: 'fractionMul',
      level: 1,
      fact: 'fmul:8x1/4',
      display: '8 × 1/4 = ?',
      spoken: 'כמה זה שמונה כפול רבע?',
      answer: 2,
      given: 3,
      reason: 'answer',
    };
    expect((await call(services, '/api/mistake', { report })).status).toBe(200);
    expect(
      (await call(services, '/api/mistake', { report: { ...report, reason: 'x' } })).status,
    ).toBe(400);
    const crash = {
      message: "Cannot read properties of undefined (reading 'x')",
      where: 'assets/index.js:1:2',
    };
    await call(services, '/api/crash', { report: crash });
    await call(services, '/api/crash', { report: crash });
    expect(
      (await call(services, '/api/crash', { report: { message: '', where: '' } })).status,
    ).toBe(400);

    const stats = await (
      services as unknown as {
        statsCore: {
          report: () => Promise<{
            mistakeCount: number;
            mistakes: unknown[];
            crashes: Array<{ count: number }>;
          }>;
        };
      }
    ).statsCore.report();
    expect(stats.mistakeCount).toBe(1);
    expect(stats.mistakes[0]).toMatchObject({ display: '8 × 1/4 = ?', reason: 'answer' });
    expect(stats.crashes).toHaveLength(1);
    expect(stats.crashes[0]?.count).toBe(2);
    const shown = await page(services, STATS_KEY);
    expect(shown.text).toContain('8 × 1/4 = ?');
    expect(shown.text).toContain('התשובה הנכונה שגויה');
  });

  it('limits reports from one address to 20 a day', async () => {
    const { services } = server();
    const report = { message: 'boom', where: '' };
    let last = 0;
    for (let i = 0; i < 21; i++)
      last = (await call(services, '/api/crash', { report }, { ip: '1.2.3.4' })).status;
    expect(last).toBe(429);
  });

  it('tells how many families came back after a week', async () => {
    const { services, clock } = server();
    const family = await newFamily(services);
    await newFamily(services);
    clock.now += 8 * 24 * 60 * 60 * 1000;
    await call(
      services,
      '/api/sync',
      { shared: shared(), slice: emptySlice() },
      { token: family.token },
    );
    const stats = await (
      services as unknown as {
        statsCore: { report: () => Promise<{ retention: { week: { back: number; of: number } } }> };
      }
    ).statsCore.report();
    expect(stats.retention.week).toEqual({ back: 1, of: 2 });
  });
});
