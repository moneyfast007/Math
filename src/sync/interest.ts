import { INTEREST_ID } from './protocol';

/**
 * "Would you want an extended version?": one anonymous tap per device, counted
 * on the server (worker/stats.ts). The random id only keeps a device from being
 * counted twice; it is not tied to the family or to anything else.
 */
const ID_KEY = 'plusi:interest-id';
const SENT_KEY = 'plusi:interest-sent';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode: the tap may be counted again next time; nothing else changes.
  }
}

export function interestSent(): boolean {
  return read(SENT_KEY) === '1';
}

export async function sendInterest(
  send: (input: string, init: RequestInit) => Promise<Response> = (i, init) => fetch(i, init),
): Promise<boolean> {
  let id = read(ID_KEY);
  if (!id || !INTEREST_ID.test(id)) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    write(ID_KEY, id);
  }
  try {
    const res = await send('/api/interest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
      cache: 'no-store',
    });
    if (!res.ok) return false;
  } catch {
    return false;
  }
  write(SENT_KEY, '1');
  return true;
}
