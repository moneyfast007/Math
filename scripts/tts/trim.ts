import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import { mapLimit, readJson, writeJson } from './lib';
import { CLIPS_DIR, MANIFEST } from './paths';

/**
 * Trims the silence at both ends of every new clip in audio/clips/, so a
 * sentence assembled from clips ("מה הערך של הספרה" + "שש" + "במספר" + …)
 * has no pause between them. Keeps a few hundredths of a second at each end.
 *
 *   npm run tts:trim                    # trim whatever is not trimmed yet
 *   npm run tts:trim -- --max-minutes 30
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
  },
});

async function main(): Promise<void> {
  const manifest = await readJson<Manifest>(MANIFEST, { version: 2, clips: {} });
  const todo = Object.entries(manifest.clips)
    .filter(([id, c]) => !c.trimmed && existsSync(path.join(OUT_DIR, `${id}.mp3`)))
    .map(([id]) => id);
  console.log(`${todo.length} clips to trim.`);
  const deadline =
    Number(values['max-minutes']) > 0
      ? Date.now() + Number(values['max-minutes']) * 60_000
      : Infinity;
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
