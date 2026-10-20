import { execFile } from 'node:child_process';
import { parseArgs, promisify } from 'node:util';
import { clipIdNode, readJson, writeJson } from './lib';
import { BUCKET, KEY_PREFIX, MANIFEST } from './paths';
import { allPhrases } from './phrases';
import { isCurrent, recordOf, VOICE, type Manifest } from './voice';

/**
 * Records, after the fact, clips that reached the bucket without reaching the
 * manifest: a run that was cut off (the job's time limit) after uploading
 * part of its clips but before committing what it recorded.
 *
 *   npm run tts:reconcile -- --since 2026-10-20T08:30:00Z --until 2026-10-20T09:30:00Z
 *
 * Every object in the bucket last modified inside the window whose key is the
 * id of a phrase of the bank is taken to be that phrase, recorded in the
 * bank's one voice as plain text (so a clip whose pronunciation rule has since
 * changed is still regenerated). Needs the aws CLI with R2 credentials in the
 * environment and R2_ENDPOINT set.
 */

const run = promisify(execFile);

const { values } = parseArgs({
  options: {
    since: { type: 'string' },
    until: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
});

interface S3Object {
  Key: string;
  LastModified: string;
  Size: number;
}

async function listBucket(): Promise<S3Object[]> {
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
      'Contents[].{Key:Key,LastModified:LastModified,Size:Size}',
    ],
    { maxBuffer: 256 * 1024 * 1024 },
  );
  return (JSON.parse(stdout || '[]') as S3Object[] | null) ?? [];
}

async function main(): Promise<void> {
  if (!values.since || !values.until)
    throw new Error('--since and --until (ISO times) are required.');
  const since = Date.parse(values.since);
  const until = Date.parse(values.until);
  if (Number.isNaN(since) || Number.isNaN(until) || since >= until)
    throw new Error('--since must be before --until.');

  const manifest = await readJson<Manifest>(MANIFEST, { version: 2, clips: {} });
  const byId = new Map(allPhrases().map((p) => [clipIdNode(p.text), p.text]));
  console.log(`${byId.size} phrases in the bank, ${Object.keys(manifest.clips).length} recorded.`);

  const objects = await listBucket();
  console.log(`${objects.length} objects in the bucket.`);
  let inWindow = 0;
  let known = 0;
  let recovered = 0;
  let unknown = 0;
  for (const o of objects) {
    const at = Date.parse(o.LastModified);
    if (at < since || at > until) continue;
    inWindow++;
    const id = o.Key.slice(KEY_PREFIX.length).replace(/\.mp3$/, '');
    const text = byId.get(id);
    if (text === undefined) {
      unknown++;
      continue;
    }
    if (isCurrent(manifest.clips[id], VOICE)) {
      known++;
      continue;
    }
    recovered++;
    // Recorded as plain text, untrimmed: what the cut-off run would have written.
    const { sent: _sent, ...record } = recordOf(text, VOICE, o.Size);
    void _sent;
    manifest.clips[id] = record;
  }
  console.log(
    `${inWindow} uploaded in the window: ${recovered} recovered, ${known} already recorded, ${unknown} not phrases of the bank.`,
  );
  if (!values['dry-run']) await writeJson(MANIFEST, manifest);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
