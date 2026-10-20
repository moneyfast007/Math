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
  /** The audio clips (/audio/<id>.mp3), too many files for the static assets. */
  AUDIO?: R2Bucket;
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

/** /audio/<16 hex>.mp3: a clip in the bucket (the per-grade index files stay static assets). */
const CLIP_PATH = /^\/audio\/[0-9a-f]{16}\.mp3$/;

/**
 * A clip from R2, with byte ranges (Safari plays audio only from servers that
 * answer them) and conditional requests. Cached for a day: a clip's name comes
 * from its text, and a new voice keeps the name, so it must not be cached forever.
 */
async function serveClip(
  request: Request,
  bucket: R2Bucket,
  key: string,
): Promise<Response | null> {
  const object = await bucket.get(key, { range: request.headers, onlyIf: request.headers });
  if (!object) return null;
  const headers = new Headers({
    'content-type': 'audio/mpeg',
    'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=86400',
    etag: object.httpEtag,
  });
  if (!('body' in object) || !object.body) return new Response(null, { status: 304, headers });
  const range = object.range;
  if (range && request.headers.has('range')) {
    const suffix = range.suffix;
    const offset = suffix !== undefined ? object.size - suffix : (range.offset ?? 0);
    const length = suffix ?? range.length ?? object.size - offset;
    headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set('content-length', String(length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set('content-length', String(object.size));
  return new Response(object.body, { status: 200, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (env.AUDIO && CLIP_PATH.test(pathname)) {
      // Not in the bucket (yet): the static assets may still have it.
      return (await serveClip(request, env.AUDIO, pathname.slice(1))) ?? env.ASSETS.fetch(request);
    }
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
