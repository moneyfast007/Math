import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { parseArgs, promisify } from 'node:util';
import { clipIdNode, readJson, writeJson } from './lib';
import { BUCKET, KEY_PREFIX, MANIFEST } from './paths';
import { allPhrases } from './phrases';
import type { Manifest } from './voice';

/**
 * Lists the clips in the bucket that no phrase of the bank needs any more
 * (sentences the code no longer says, number pieces replaced by whole
 * sentences) and drops them from the manifest. Deleting them from the bucket
 * is the workflow's next step, from the list this writes:
 *
 *   npm run tts:prune -- --out prune-keys.txt [--dry-run]
 *
 * Only keys that look like clips (audio/<16 hex>.mp3) are ever listed. It
 * stops without listing anything when the bank looks incomplete (more than 1%
 * of its phrases missing from the bucket) or when more than a fifth of the
 * bucket would go: both mean something is wrong with the bank, not the bucket.
 * Needs the aws CLI with R2 credentials in the environment and R2_ENDPOINT set.
 */

const run = promisify(execFile);

const { values } = parseArgs({
  options: {
    out: { type: 'string', default: 'prune-keys.txt' },
    'dry-run': { type: 'boolean', default: false },
  },
});

const CLIP_KEY = new RegExp(`^${KEY_PREFIX}([0-9a-f]{16})\\.mp3$`);
const MAX_MISSING = 0.01;
const MAX_SHARE = 0.2;

async function listKeys(): Promise<string[]> {
  const endpoint = process.env['R2_ENDPOINT'];
  if (!endpoint) throw new Error('R2_ENDPOINT is not set.');
  const { stdout } = await run(
    'aws',
    [
      's3api',
      'list-objects-v2',
      '--bucket',
      BUCKET,
      '--prefix',
      KEY_PREFIX,
      '--endpoint-url',
      endpoint,
      '--output',
      'json',
      '--query',
      'Contents[].Key',
    ],
    { maxBuffer: 256 * 1024 * 1024 },
  );
  return (JSON.parse(stdout || '[]') as string[] | null) ?? [];
}

async function main(): Promise<void> {
  const wanted = new Set(allPhrases().map((p) => clipIdNode(p.text)));
  const keys = await listKeys();
  const inBucket = new Map<string, string>();
  for (const key of keys) {
    const m = CLIP_KEY.exec(key);
    if (m?.[1]) inBucket.set(m[1], key);
  }
  const missing = [...wanted].filter((id) => !inBucket.has(id)).length;
  const unused = [...inBucket].filter(([id]) => !wanted.has(id)).map(([, key]) => key);
  console.log(
    `${wanted.size} clips in the bank, ${inBucket.size} clips in the bucket (${keys.length} objects), ` +
      `${missing} of the bank missing, ${unused.length} not used.`,
  );

  if (missing > wanted.size * MAX_MISSING)
    throw new Error(`Stopping: ${missing} clips of the bank are missing; record them first.`);
  if (unused.length > inBucket.size * MAX_SHARE)
    throw new Error(
      `Stopping: ${unused.length} of ${inBucket.size} clips would go; check the bank.`,
    );

  const manifest = await readJson<Manifest>(MANIFEST, { version: 2, clips: {} });
  const stale = Object.keys(manifest.clips).filter((id) => !wanted.has(id));
  console.log(`${stale.length} manifest entries not used.`);

  if (values['dry-run']) {
    console.log('Dry run: nothing written.');
    return;
  }
  await writeFile(values.out, unused.map((k) => `${k}\n`).join(''));
  for (const id of stale) delete manifest.clips[id];
  await writeJson(MANIFEST, manifest);
  console.log(`${unused.length} keys written to ${values.out}; manifest updated.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
