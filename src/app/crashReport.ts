import type { CrashReport } from '@/sync/protocol';

/**
 * The app's own errors, reported without anything else: the message and the
 * place in the app's code (file, line), so a bug that hits children can be
 * found and fixed. No data, no device, no address beyond what any request
 * carries; counted on the server (worker/stats.ts) and shown on the usage page.
 *
 * Only errors from the app's own files are sent (not from browser extensions),
 * each at most once per page load, and three at most.
 */

const MAX_PER_LOAD = 3;
const sent = new Set<string>();

/** "https://plusi.app/assets/index-abc.js:12:345" → "assets/index-abc.js:12:345", from our origin only. */
export function ownPlace(stack: string | undefined, origin: string): string | null {
  if (!stack) return null;
  for (const line of stack.split('\n')) {
    const at = line.indexOf(origin);
    if (at < 0) continue;
    const m = /^\/?([^\s)]+?:\d+:\d+)/.exec(line.slice(at + origin.length));
    if (m?.[1]) return m[1].replace(/^\//, '').slice(0, 300);
  }
  return null;
}

export function crashReport(error: unknown, origin: string): CrashReport | null {
  const e = error instanceof Error ? error : null;
  const message = (e ? `${e.name}: ${e.message}` : String(error)).slice(0, 300);
  if (!message) return null;
  const where = ownPlace(e?.stack, origin);
  // Not ours (an extension, a script injected by the browser): not reported.
  if (where === null) return null;
  return { message, where };
}

export function reportCrash(
  error: unknown,
  send: (input: string, init: RequestInit) => Promise<Response> = (i, init) => fetch(i, init),
): void {
  try {
    const report = crashReport(error, location.origin);
    if (!report) return;
    const key = `${report.message}\n${report.where}`;
    if (sent.has(key) || sent.size >= MAX_PER_LOAD) return;
    sent.add(key);
    void send('/api/crash', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ report }),
      cache: 'no-store',
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Reporting must never be a second error.
  }
}

export function startCrashReports(): void {
  window.addEventListener('error', (event) => reportCrash(event.error));
  window.addEventListener('unhandledrejection', (event) => reportCrash(event.reason));
}
