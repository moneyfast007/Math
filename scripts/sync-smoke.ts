/**
 * Checks the sync server in production, end to end, and leaves nothing behind:
 * creates a family, links a second device with a code, syncs from both, sets an
 * email and signs in with it, taps "interest", then deletes the family. Prints status codes only (never tokens or codes).
 * Run by the "Sync smoke test" workflow; its result is the workflow's result.
 *
 *   npx tsx scripts/sync-smoke.ts https://plusi.app
 */
const base = process.argv[2] ?? 'https://plusi.app';

async function post(path: string, body: unknown, token?: string): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  console.log(`${path} → ${res.status}`);
  if (!res.ok) throw new Error(`${path} failed with ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

const empty = { profiles: {}, pin: { value: null, at: 0 } };
const slice = { progress: {}, levelAt: {}, at: 1 };

const a = await post('/api/family', { deviceName: 'smoke A', shared: empty, slice });
const tokenA = String(a['token']);
const code = await post('/api/pair/start', {}, tokenA);
const b = await post('/api/pair/join', { code: code['code'], deviceName: 'smoke B' });
const tokenB = String(b['token']);
const synced = await post('/api/sync', { shared: empty, slice: { ...slice, at: 2 } }, tokenB);
if (!Array.isArray(synced['devices']) || synced['devices'].length !== 2) {
  throw new Error('expected two devices');
}
// Email and password: set on A, open the family on a third device, then undo it all.
// The key stands in for what the app derives from the password; the email is throwaway.
const email = `smoke-${Date.now()}@example.invalid`;
const key = 'k'.repeat(43);
await post('/api/account/set', { email, key }, tokenA);
const status = await post('/api/account/status', {}, tokenA);
if (status['account'] !== true) throw new Error('the account was not recorded');
const bad = await fetch(`${base}/api/account/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, key: 'x'.repeat(43), deviceName: 'smoke C' }),
});
console.log(`/api/account/login (wrong) → ${bad.status}`);
if (bad.status !== 401) throw new Error('a wrong password was accepted');
const c = await post('/api/account/login', { email, key, deviceName: 'smoke C' });
if (!Array.isArray(c['devices']) || c['devices'].length !== 3)
  throw new Error('expected three devices');
await post('/api/account/remove', {}, tokenA);
// Usage counts: an interest tap, and the page refuses a wrong key.
await post('/api/interest', { id: '0'.repeat(32) });
const stats = await fetch(`${base}/api/stats?key=not-the-key`);
console.log(`/api/stats (wrong key) → ${stats.status}`);
if (stats.status !== 404) throw new Error('the stats page opened without the key');
await post('/api/family/delete', {}, tokenA);
const loginGone = await fetch(`${base}/api/account/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, key, deviceName: 'smoke D' }),
});
console.log(`/api/account/login (after delete) → ${loginGone.status}`);
if (loginGone.status !== 401) throw new Error('the deleted family still opens by email');
const gone = await fetch(`${base}/api/sync`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${tokenB}` },
  body: JSON.stringify({ shared: empty, slice }),
});
console.log(`after delete → ${gone.status}`);
if (gone.status !== 401) throw new Error('the deleted family still answers');
const home = await fetch(`${base}/`);
console.log(`/ → ${home.status}`);
if (!home.ok) throw new Error('the app itself is not served');
console.log('SYNC SMOKE OK');

export {};
