import { defaultFetchIndex, parseIndex } from './speaker';

/**
 * Downloading a grade's recordings for use without internet (the parents'
 * area). Every clip of the grade goes into the same cache the service worker
 * reads clips from ("audio-v2", see vite.config.ts), so it plays offline.
 * Clips already there are skipped; the download can be stopped and resumed.
 */

const CACHE = 'audio-v2';
const PARALLEL = 6;

export interface GradeAudio {
  ids: string[];
  bytes: number;
}

export async function gradeAudio(grade: number): Promise<GradeAudio> {
  const index = await defaultFetchIndex(`g${grade}`);
  return { ids: [...parseIndex(index)], bytes: index.bytes ?? 0 };
}

export function offlineSupported(): boolean {
  return typeof caches !== 'undefined';
}

/** How many of the clips are already on the device. */
export async function countCached(ids: readonly string[]): Promise<number> {
  const cache = await caches.open(CACHE);
  const keys = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  return ids.filter((id) => keys.has(`/audio/${id}.mp3`)).length;
}

export async function downloadClips(
  ids: readonly string[],
  onProgress: (done: number, total: number) => void,
  signal: AbortSignal,
): Promise<{ done: number; failed: number }> {
  const cache = await caches.open(CACHE);
  const have = new Set((await cache.keys()).map((r) => new URL(r.url).pathname));
  const todo = ids.filter((id) => !have.has(`/audio/${id}.mp3`));
  let done = ids.length - todo.length;
  let failed = 0;
  onProgress(done, ids.length);
  let next = 0;
  const worker = async () => {
    while (next < todo.length && !signal.aborted) {
      const id = todo[next++] as string;
      const url = `/audio/${id}.mp3`;
      try {
        const res = await fetch(url, { signal });
        if (res.ok) await cache.put(url, res);
        else failed++;
      } catch {
        if (signal.aborted) return;
        failed++;
      }
      done++;
      onProgress(done, ids.length);
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  return { done, failed };
}
