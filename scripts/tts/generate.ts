import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  clipIdNode,
  DEFAULT_PROMPT,
  ensureDir,
  estimateCost,
  mapLimit,
  readJson,
  synthesize,
  writeJson,
  type Engine,
  type VoiceSpec,
} from './lib';
import { allPhrases } from './phrases';
import { vocalizeForTts } from './pronunciation';

/**
 * Generates the app's audio bank into public/audio/.
 *
 *   npm run tts:build                  # generate whatever is missing
 *   npm run tts:build -- --dry-run     # list what would be generated and the cost
 *   npm run tts:build -- --engine chirp3-hd --voice Leda
 *
 * Idempotent: a clip whose text has not changed is never regenerated, because
 * its file name is the hash of its text. Changing the voice invalidates the
 * whole bank (the manifest records the voice; mismatch → it refuses to mix).
 */

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT_DIR = path.join(ROOT, 'public', 'audio');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

interface Manifest {
  version: 1;
  engine: Engine;
  voice: string;
  prompt?: string;
  /** clipId → spoken text, for auditing. */
  clips: Record<string, string>;
}

const { values } = parseArgs({
  options: {
    // Chosen after five listening rounds: WaveNet A read every number word correctly, plain text, no nikud.
    engine: { type: 'string', default: 'wavenet' },
    voice: { type: 'string', default: 'he-IL-Wavenet-A' },
    'dry-run': { type: 'boolean', default: false },
    concurrency: { type: 'string', default: '4' },
  },
});

const spec: VoiceSpec = {
  engine: values.engine as Engine,
  voice: values.voice,
  ...(values.engine.startsWith('gemini') ? { prompt: DEFAULT_PROMPT } : {}),
};

async function main(): Promise<void> {
  await ensureDir(OUT_DIR);
  const manifest = await readJson<Manifest>(MANIFEST, {
    version: 1,
    engine: spec.engine,
    voice: spec.voice,
    prompt: spec.prompt,
    clips: {},
  });

  if (manifest.engine !== spec.engine || manifest.voice !== spec.voice) {
    throw new Error(
      `public/audio was generated with ${manifest.engine}/${manifest.voice}; ` +
        `you asked for ${spec.engine}/${spec.voice}. Delete public/audio first to switch voices.`,
    );
  }

  const phrases = allPhrases();
  const missing = phrases.filter(
    (p) => !existsSync(path.join(OUT_DIR, `${clipIdNode(p.text)}.mp3`)),
  );

  console.log(`${phrases.length} phrases in the bank, ${missing.length} to generate.`);
  console.log(
    `Estimated cost: ${estimateCost(
      missing.map((p) => p.text),
      spec.engine,
    )}`,
  );
  if (values['dry-run'] || missing.length === 0) {
    for (const p of missing.slice(0, 20)) console.log(`  ${p.id}: ${p.text}`);
    if (missing.length > 20) console.log(`  … and ${missing.length - 20} more`);
    return;
  }

  let done = 0;
  await mapLimit(missing, Number(values.concurrency), async (p) => {
    const id = clipIdNode(p.text);
    // Ambiguous words get nikud on the way to the engine; the file is still named by the plain text.
    // Nikud hints are only for Chirp; the classic engine reads plain text correctly.
    const text = spec.engine === 'chirp3-hd' ? vocalizeForTts(p.text) : p.text;
    const mp3 = await synthesize(text, spec);
    await writeFile(path.join(OUT_DIR, `${id}.mp3`), mp3);
    manifest.clips[id] = p.text;
    done++;
    if (done % 25 === 0 || done === missing.length) {
      console.log(`  ${done}/${missing.length}`);
      await writeJson(MANIFEST, manifest); // checkpoint so an interrupted run resumes cleanly
    }
  });

  await writeJson(MANIFEST, manifest);
  console.log(
    `Done. ${Object.keys(manifest.clips).length} clips in ${path.relative(ROOT, OUT_DIR)}.`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
