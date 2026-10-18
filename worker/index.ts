import { DurableObject } from 'cloudflare:workers';
import {
  FamilyCore,
  PairingCore,
  handleApi,
  type Credentials,
  type FamilyApi,
  type PairingApi,
} from './core';
import type { SyncRequest } from '../src/sync/protocol';

/**
 * The Cloudflare Worker in front of the app. Requests under /api/ (sync) come
 * here; everything else is the static app, served as before (wrangler.json:
 * run_worker_first). Each family is a Durable Object with its own storage;
 * pairing codes live in one more, shared by all.
 */

interface Env {
  ASSETS: Fetcher;
  FAMILY: DurableObjectNamespace<Family>;
  PAIRING: DurableObjectNamespace<Pairing>;
}

export class Family extends DurableObject<Env> {
  private readonly core = new FamilyCore(this.ctx.storage);

  create(familyId: string, deviceName: string, req: SyncRequest) {
    return this.core.create(familyId, deviceName, req);
  }
  join(deviceName: string) {
    return this.core.join(deviceName);
  }
  sync(auth: Credentials, req: SyncRequest) {
    return this.core.sync(auth, req);
  }
  verify(auth: Credentials) {
    return this.core.verify(auth);
  }
  removeDevice(auth: Credentials, deviceId: string) {
    return this.core.removeDevice(auth, deviceId);
  }
  destroy(auth: Credentials) {
    return this.core.destroy(auth);
  }
}

export class Pairing extends DurableObject<Env> {
  private readonly core = new PairingCore(this.ctx.storage);

  start(familyId: string) {
    return this.core.start(familyId);
  }
  redeem(code: string, address: string) {
    return this.core.redeem(code, address);
  }
  allowFamily(address: string) {
    return this.core.allowFamily(address);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await handleApi(request, {
        family: (id) => env.FAMILY.get(env.FAMILY.idFromName(id)) as unknown as FamilyApi,
        pairing: () => env.PAIRING.get(env.PAIRING.idFromName('pairing')) as unknown as PairingApi,
      });
    } catch {
      return new Response(JSON.stringify({ error: 'unavailable' }), {
        status: 503,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      });
    }
  },
};
