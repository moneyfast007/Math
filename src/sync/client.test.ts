// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleApi, memoryServices, type Services } from '../../worker/core';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryStorage } from '@/state/storage';
import type { ProfileInput } from '@/state/schema';
import { createMemorySyncStorage, SyncEngine } from './client';

const NOA: ProfileInput = {
  name: 'נועה',
  avatar: 'fox',
  grade: 2,
  gender: 'f',
  settings: { allowLevelChange: true },
};

interface Device {
  app: AppStore;
  engine: SyncEngine;
  storage: ReturnType<typeof createMemorySyncStorage>;
  online: { value: boolean };
}

async function device(services: Services, name: string, clock: { now: number }): Promise<Device> {
  const app = createAppStore(createMemoryStorage(), () => clock.now);
  await app.getState().hydrate();
  const storage = createMemorySyncStorage();
  const online = { value: true };
  const engine = new SyncEngine({
    app,
    storage,
    now: () => clock.now,
    deviceName: () => name,
    kdfIterations: 1000,
    fetch: async (input, init) => {
      if (!online.value) throw new TypeError('Failed to fetch');
      return handleApi(new Request(`https://app.test${input}`, init), services);
    },
  });
  await engine.start();
  return { app, engine, storage, online };
}

function practice(d: Device, pid: string, n: number, at: number) {
  for (let i = 0; i < n; i++) {
    d.app
      .getState()
      .recordAttempt(pid, { topicId: 'addSub20', level: 1, correct: true, at: at + i });
  }
}

const attempts = (d: Device, pid: string) =>
  d.app.getState().data.progress[pid]?.topics['addSub20']?.attempts ?? 0;

async function linked(clock = { now: new Date(2026, 9, 18, 9).getTime() }) {
  const services = memoryServices(() => clock.now);
  const a = await device(services, 'אייפד', clock);
  const noa = a.app.getState().addProfile(NOA);
  practice(a, noa.id, 3, clock.now);
  expect(await a.engine.createFamily()).toEqual({ ok: true });
  const code = await a.engine.pairingCode();
  if (!code.ok) throw new Error(code.error);
  const b = await device(services, 'טלפון', clock);
  const joined = await b.engine.join(code.code);
  expect(joined.ok).toBe(true);
  return { services, clock, a, b, noa };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('sync between two devices', () => {
  it('a joining device gets the family: children and their progress', async () => {
    const { a, b, noa } = await linked();
    expect(b.app.getState().data.profiles.map((p) => p.name)).toEqual(['נועה']);
    expect(attempts(b, noa.id)).toBe(3);
    expect(b.engine.ui.getState()).toMatchObject({ linked: true, status: 'idle' });
    expect(
      b.engine.ui
        .getState()
        .devices.map((d) => d.name)
        .sort(),
    ).toEqual(['אייפד', 'טלפון'].sort());
    await a.engine.sync();
    expect(a.engine.ui.getState().devices).toHaveLength(2);
  });

  it('practice on both devices is added up on both', async () => {
    const { a, b, noa, clock } = await linked();
    practice(b, noa.id, 2, clock.now + 1000);
    practice(a, noa.id, 1, clock.now + 2000);
    await b.engine.sync();
    await a.engine.sync();
    await b.engine.sync();
    expect(attempts(a, noa.id)).toBe(6);
    expect(attempts(b, noa.id)).toBe(6);
  });

  it('profile changes and removals reach the other device', async () => {
    const { a, b, noa, clock } = await linked();
    clock.now += 1000;
    a.app.getState().updateProfile(noa.id, { ...NOA, name: 'נועי' });
    const maya = a.app.getState().addProfile({ ...NOA, name: 'מאיה' });
    await a.engine.sync();
    await b.engine.sync();
    expect(b.app.getState().data.profiles.map((p) => p.name)).toEqual(['נועי', 'מאיה']);
    clock.now += 1000;
    b.app.getState().removeProfile(maya.id);
    await b.engine.sync();
    await a.engine.sync();
    expect(a.app.getState().data.profiles.map((p) => p.name)).toEqual(['נועי']);
  });

  it('without a connection the device keeps working and catches up later', async () => {
    const { a, b, noa, clock } = await linked();
    b.online.value = false;
    practice(b, noa.id, 4, clock.now + 1000);
    await b.engine.sync();
    expect(b.engine.ui.getState().status).toBe('offline');
    expect(attempts(b, noa.id)).toBe(7);
    b.online.value = true;
    await b.engine.sync();
    await a.engine.sync();
    expect(attempts(a, noa.id)).toBe(7);
  });

  it('a device removed elsewhere is told so and keeps what it shows', async () => {
    const { a, b, noa } = await linked();
    const bId = b.engine.ui.getState().deviceId ?? '';
    expect(await a.engine.removeDevice(bId)).toEqual({ ok: true });
    await b.engine.sync();
    expect(b.engine.ui.getState()).toMatchObject({ linked: false, removed: true });
    expect(attempts(b, noa.id)).toBe(3);
    expect(b.storage.peek()).toBeNull();
  });

  it('deleting the family unlinks every device', async () => {
    const { a, b } = await linked();
    expect(await b.engine.deleteFamily()).toEqual({ ok: true });
    expect(b.engine.ui.getState().linked).toBe(false);
    await a.engine.sync();
    expect(a.engine.ui.getState()).toMatchObject({ linked: false, removed: true });
  });

  it('keeps a copy of what the device showed before joining, and can go back to it', async () => {
    const clock = { now: new Date(2026, 9, 18, 9).getTime() };
    const services = memoryServices(() => clock.now);
    const a = await device(services, 'אייפד', clock);
    a.app.getState().addProfile(NOA);
    await a.engine.createFamily();
    const code = await a.engine.pairingCode();
    if (!code.ok) throw new Error(code.error);

    const b = await device(services, 'טלפון', clock);
    clock.now += 1000;
    b.app.getState().addProfile({ ...NOA, name: 'מאיה' });
    const joined = await b.engine.join(code.code);
    expect(joined).toEqual({ ok: true, matched: [], added: ['מאיה'] });
    expect(b.app.getState().data.profiles.map((p) => p.name)).toEqual(['נועה', 'מאיה']);

    const [snap] = await b.engine.snapshots();
    expect(snap?.data.profiles.map((p) => p.name)).toEqual(['מאיה']);
    if (!snap) throw new Error('no snapshot');
    expect(await b.engine.restore(snap)).toEqual({ ok: true });
    expect(b.engine.ui.getState().linked).toBe(false);
    expect(b.app.getState().data.profiles.map((p) => p.name)).toEqual(['מאיה']);
  });

  it('a child with the same name on the joining device is the same child', async () => {
    const clock = { now: new Date(2026, 9, 18, 9).getTime() };
    const services = memoryServices(() => clock.now);
    const a = await device(services, 'אייפד', clock);
    const noaA = a.app.getState().addProfile(NOA);
    practice(a, noaA.id, 2, clock.now);
    await a.engine.createFamily();
    const code = await a.engine.pairingCode();
    if (!code.ok) throw new Error(code.error);

    const b = await device(services, 'טלפון', clock);
    const noaB = b.app.getState().addProfile(NOA);
    practice(b, noaB.id, 5, clock.now);
    const joined = await b.engine.join(code.code);
    expect(joined).toEqual({ ok: true, matched: ['נועה'], added: [] });
    expect(b.app.getState().data.profiles).toHaveLength(1);
    expect(attempts(b, noaA.id)).toBe(7);
    await a.engine.sync();
    expect(attempts(a, noaA.id)).toBe(7);
  });

  it('a wrong code is reported and nothing changes', async () => {
    const clock = { now: Date.now() };
    const services = memoryServices(() => clock.now);
    const b = await device(services, 'טלפון', clock);
    expect(await b.engine.join('123456')).toEqual({ ok: false, error: 'invalidCode' });
    expect(b.engine.ui.getState().linked).toBe(false);
  });

  it('the link survives the app being closed and opened again', async () => {
    const { b, noa, services, clock } = await linked();
    const saved = b.storage.peek();
    const app = createAppStore(createMemoryStorage(), () => clock.now);
    await app.getState().hydrate();
    const storage = createMemorySyncStorage();
    await storage.save(saved);
    const engine = new SyncEngine({
      app,
      storage,
      now: () => clock.now,
      fetch: (input, init) => handleApi(new Request(`https://app.test${input}`, init), services),
    });
    await engine.start();
    await engine.sync();
    expect(engine.ui.getState().linked).toBe(true);
    expect(app.getState().data.progress[noa.id]?.topics['addSub20']?.attempts).toBe(3);
  });
});

describe('signing in with an email and a password', () => {
  it('sets one on a new device (starting the family), and opens it on another', async () => {
    const clock = { now: new Date(2026, 9, 24, 9).getTime() };
    const services = memoryServices(() => clock.now);
    const a = await device(services, 'אייפד', clock);
    const noa = a.app.getState().addProfile(NOA);
    practice(a, noa.id, 2, clock.now);
    expect(await a.engine.setAccount(' Dana@Example.com', 'secret1')).toEqual({ ok: true });
    expect(a.engine.ui.getState()).toMatchObject({
      linked: true,
      hasAccount: true,
      accountEmail: 'dana@example.com',
    });

    const b = await device(services, 'טלפון', clock);
    expect(await b.engine.login('dana@example.com', 'wrong12')).toEqual({
      ok: false,
      error: 'badLogin',
    });
    const res = await b.engine.login('dana@example.com', 'secret1');
    expect(res.ok).toBe(true);
    expect(b.app.getState().data.profiles.map((p) => p.name)).toEqual(['נועה']);
    expect(attempts(b, noa.id)).toBe(2);
    expect(b.engine.ui.getState()).toMatchObject({ hasAccount: true });
  });

  it("checks the family's password for a forgotten parents' code, changing nothing", async () => {
    const clock = { now: new Date(2026, 9, 24, 9).getTime() };
    const services = memoryServices(() => clock.now);
    const a = await device(services, 'אייפד', clock);
    expect(await a.engine.checkAccount('dana@example.com', 'secret1')).toEqual({
      ok: false,
      error: 'unauthorized',
    });
    expect(await a.engine.setAccount('dana@example.com', 'secret1')).toEqual({ ok: true });
    expect(await a.engine.checkAccount('dana@example.com', 'wrong12')).toEqual({
      ok: false,
      error: 'badLogin',
    });
    expect(await a.engine.checkAccount('dana@example.com', '123')).toEqual({
      ok: false,
      error: 'badLogin',
    });
    expect(await a.engine.checkAccount(' Dana@Example.com', 'secret1')).toEqual({ ok: true });
    expect(a.engine.ui.getState()).toMatchObject({ linked: true, hasAccount: true });
  });

  it('checks the email and the password before asking the server', async () => {
    const clock = { now: new Date(2026, 9, 24, 9).getTime() };
    const a = await device(
      memoryServices(() => clock.now),
      'אייפד',
      clock,
    );
    expect(await a.engine.setAccount('dana', 'secret1')).toEqual({ ok: false, error: 'badEmail' });
    expect(await a.engine.setAccount('dana@example.com', '123')).toEqual({
      ok: false,
      error: 'shortPassword',
    });
    expect(a.engine.ui.getState().linked).toBe(false);
  });

  it('a second device learns that the family signs in with an email, and it can be removed', async () => {
    const { a, b } = await linked();
    expect(await a.engine.setAccount('dana@example.com', 'secret1')).toEqual({ ok: true });
    await b.engine.refreshAccount();
    expect(b.engine.ui.getState()).toMatchObject({ hasAccount: true, accountEmail: null });
    expect(await b.engine.removeAccount()).toEqual({ ok: true });
    await a.engine.refreshAccount();
    expect(a.engine.ui.getState().hasAccount).toBe(false);
  });
});
