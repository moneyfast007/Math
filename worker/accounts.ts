import type { SyncErrorCode } from '../src/sync/protocol';
import {
  HOUR,
  bump,
  count,
  hmac,
  randomHex,
  sameText,
  sha256,
  sweepCounters,
  type KV,
} from './kit';

/**
 * Signing in with an email and a password: one record per family, in one
 * shared store (a Durable Object in production).
 *
 * What is kept: a keyed hash of the email (HMAC with a random key that never
 * leaves this store), the family it opens, and a salted hash of the key the
 * app derived from the password. Not the email, not the password. No mail is
 * ever sent, so a forgotten password cannot be recovered (the app says so).
 *
 * Wrong attempts are limited per address and per account, like pairing codes.
 */

interface AccountRecord {
  familyId: string;
  salt: string;
  verifier: string;
  createdAt: number;
}

type Result<T> = T | { error: SyncErrorCode };

/** Wrong passwords allowed per address and per account per hour, and from everywhere per ten minutes. */
const FAILS_PER_ADDRESS = 10;
const FAILS_PER_ACCOUNT = 20;
const FAILS_EVERYWHERE = 300;

export interface AccountsApi {
  set(familyId: string, email: string, key: string): Promise<Result<{ ok: true }>>;
  login(email: string, key: string, address: string): Promise<Result<{ familyId: string }>>;
  has(familyId: string): Promise<boolean>;
  remove(familyId: string): Promise<void>;
}

export class AccountsCore implements AccountsApi {
  constructor(
    private readonly kv: KV,
    private readonly now: () => number = Date.now,
  ) {}

  /** The hashing key: made once, kept only here. */
  private async macKey(): Promise<string> {
    const existing = await this.kv.get<string>('key');
    if (existing) return existing;
    const made = randomHex(32);
    await this.kv.put('key', made);
    return made;
  }

  private async id(email: string): Promise<string> {
    return hmac(await this.macKey(), email);
  }

  /** Sets (or replaces) the family's email and password. One email opens one family. */
  async set(familyId: string, email: string, key: string): Promise<Result<{ ok: true }>> {
    const id = await this.id(email);
    const existing = await this.kv.get<AccountRecord>(`acct:${id}`);
    if (existing && existing.familyId !== familyId) return { error: 'emailTaken' };
    const previous = await this.kv.get<string>(`fam:${familyId}`);
    if (previous && previous !== id) await this.kv.delete(`acct:${previous}`);
    const salt = randomHex(16);
    await this.kv.put<AccountRecord>(`acct:${id}`, {
      familyId,
      salt,
      verifier: await sha256(salt + key),
      createdAt: existing?.createdAt ?? this.now(),
    });
    await this.kv.put(`fam:${familyId}`, id);
    return { ok: true };
  }

  async login(email: string, key: string, address: string): Promise<Result<{ familyId: string }>> {
    const at = this.now();
    await sweepCounters(this.kv, ['fail:'], at);
    const id = await this.id(email);
    if (
      (await count(this.kv, `fail:ip:${address}`, HOUR, at)) >= FAILS_PER_ADDRESS ||
      (await count(this.kv, `fail:acct:${id}`, HOUR, at)) >= FAILS_PER_ACCOUNT ||
      (await count(this.kv, 'fail:*', HOUR / 6, at)) >= FAILS_EVERYWHERE
    ) {
      return { error: 'rateLimited' };
    }
    const record = await this.kv.get<AccountRecord>(`acct:${id}`);
    if (!record || !sameText(record.verifier, await sha256(record.salt + key))) {
      await bump(this.kv, `fail:ip:${address}`, HOUR, at);
      await bump(this.kv, `fail:acct:${id}`, HOUR, at);
      await bump(this.kv, 'fail:*', HOUR / 6, at);
      return { error: 'badLogin' };
    }
    return { familyId: record.familyId };
  }

  async has(familyId: string): Promise<boolean> {
    return (await this.kv.get(`fam:${familyId}`)) !== undefined;
  }

  async remove(familyId: string): Promise<void> {
    const id = await this.kv.get<string>(`fam:${familyId}`);
    if (id) await this.kv.delete(`acct:${id}`);
    await this.kv.delete(`fam:${familyId}`);
  }
}
