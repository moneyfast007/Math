/**
 * The few Cloudflare Workers types this worker uses, declared here instead of
 * depending on @cloudflare/workers-types (the runtime provides the real ones).
 */

declare module 'cloudflare:workers' {
  export abstract class DurableObject<Env = unknown> {
    protected readonly ctx: DurableObjectState;
    protected readonly env: Env;
    constructor(ctx: DurableObjectState, env: Env);
  }
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T = unknown>(options: { prefix: string }): Promise<Map<string, T>>;
  deleteAll(): Promise<void>;
}

interface DurableObjectState {
  readonly storage: DurableObjectStorage;
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectNamespace<T> {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub<T>;
}

/** A stub's methods are T's, called remotely; callers cast it to the interface they use. */
interface DurableObjectStub<T> {
  readonly id: DurableObjectId;
  readonly __object?: T;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}
