import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import { ensureDir, mapLimit, readJson, writeJson } from './lib';
import { CLIPS_DIR, MANIFEST, SITE_AUDIO } from './paths';

/**
 * Trims the silence at both ends of every new clip in audio/clips/, so a
 * sentence assembled from clips ("מה הערך של הספרה" + "שש" + "במספר" + …)
 * has no pause between them. Keeps a few hundredths of a second at each end.
 *
 *   npm run tts:trim                    # trim whatever is not trimmed yet (of the clips here)
 *   npm run tts:trim -- --max-minutes 30
 *   npm run tts:trim -- --fetch --copy-to audio/trimmed
 *       Also clips not here: fetched from the site first (the bank's earlier runs
 *       were never trimmed), and every trimmed clip is copied to the folder given,
 *       for the upload (audio-trim.yml).
 *
 * Idempotent: the manifest marks a trimmed clip, and a clip recorded again
 * (new text or voice) loses the mark, so it is trimmed again. Needs ffmpeg.
 */

const run = promisify(execFile);
const OUT_DIR = CLIPS_DIR;

/** Silence below this level counts as silence; a short pad stays so words are not clipped. */
const FILTER = [
  'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.04',
  'areverse',
  'silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.06',
  'areverse',
].join(',');

interface Manifest {
  version: 2;
  clips: Record<string, { text: string; voice: string; trimmed?: boolean; bytes?: number }>;
}

const { values } = parseArgs({
  options: {
    'max-minutes': { type: 'string', default: '0' },
    concurrency: { type: 'string', default: '8' },
    /** Fetch from the site the untrimmed clips that are not in audio/clips. */
    fetch: { type: 'boolean', default: false },
    /** Copy each trimmed clip here as well (what to upload). */
    'copy-to': { type: 'string' },
  },
});

/** Downloads a clip the site serves; false when it has none. */
async function fetchClip(id: string, to: string): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${SITE_AUDIO}${id}.mp3`);
    if (res.ok) {
      await writeFile(to, Buffer.from(await res.arrayBuffer()));
      return true;
    }
    if (res.status === 404) return false;
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return false;
}

async function main(): Promise<void> {
  const manifest = await readJson<Manifest>(MANIFEST, { version: 2, clips: {} });
  await ensureDir(OUT_DIR);
  const copyTo = values['copy-to'];
  if (copyTo) await ensureDir(copyTo);
  const deadline =
    Number(values['max-minutes']) > 0
      ? Date.now() + Number(values['max-minutes']) * 60_000
      : Infinity;
  const untrimmed = Object.entries(manifest.clips)
    .filter(([, c]) => !c.trimmed)
    .map(([id]) => id);
  if (values.fetch) {
    const missing = untrimmed.filter((id) => !existsSync(path.join(OUT_DIR, `${id}.mp3`)));
    console.log(`${missing.length} untrimmed clips to fetch from the site.`);
    let fetched = 0;
    let absent = 0;
    await mapLimit(missing, 24, async (id) => {
      // Leave half the time for the trimming and the upload.
      if (Date.now() > deadline - (deadline - Date.now()) / 2 && deadline !== Infinity) return;
      if (await fetchClip(id, path.join(OUT_DIR, `${id}.mp3`))) fetched++;
      else absent++;
      if ((fetched + absent) % 1000 === 0) console.log(`  fetched ${fetched} (${absent} absent)`);
    });
    console.log(`Fetched ${fetched} clips; ${absent} are not on the site.`);
  }
  const todo = untrimmed.filter((id) => existsSync(path.join(OUT_DIR, `${id}.mp3`)));
  console.log(`${todo.length} clips to trim.`);
  let done = 0;
  let failed = 0;
  await mapLimit(todo, Number(values.concurrency), async (id) => {
    if (Date.now() > deadline) return;
    const file = path.join(OUT_DIR, `${id}.mp3`);
    const tmp = path.join(OUT_DIR, `${id}.trim.mp3`);
    try {
      // The source's own bitrate (32k for Gemini, 64k for WaveNet), mono, like the source.
      const { stdout } = await run('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=bit_rate',
        '-of',
        'csv=p=0',
        file,
      ]);
      const kbps = Math.max(24, Math.round(Number(stdout.trim()) / 8000) * 8 || 32);
      await run('ffmpeg', [
        '-v',
        'error',
        '-y',
        '-i',
        file,
        '-af',
        FILTER,
        '-ac',
        '1',
        '-codec:a',
        'libmp3lame',
        '-b:a',
        `${kbps}k`,
        tmp,
      ]);
      await rename(tmp, file);
      if (copyTo) await copyFile(file, path.join(copyTo, `${id}.mp3`));
      const clip = manifest.clips[id];
      if (clip) {
        clip.trimmed = true;
        clip.bytes = (await stat(file)).size;
      }
    } catch (err) {
      await rm(tmp, { force: true });
      failed++;
      if (failed <= 20)
        console.error(`  ${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (++done % 500 === 0) {
      console.log(`  ${done}/${todo.length}`);
      await writeJson(MANIFEST, manifest);
    }
  });
  await writeJson(MANIFEST, manifest);
  console.log(`Trimmed ${done - failed} clips; ${failed} failed.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
