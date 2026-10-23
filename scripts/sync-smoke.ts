/**
 * Checks the sync server in production, end to end, and leaves nothing behind:
 * creates a family, links a second device with a code, syncs from both, then
 * deletes the family. Prints status codes only (never tokens or codes).
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
await post('/api/family/delete', {}, tokenA);
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
