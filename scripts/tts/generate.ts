import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  clipIdNode,
  DEFAULT_PROMPT,
  QUICK_PROMPT,
  ensureDir,
  estimateCost,
  mapLimit,
  readJson,
  synthesize,
  writeJson,
  type VoiceSpec,
} from './lib';
import { allPhrases, type Phrase } from './phrases';
import { vocalizeForTts } from './pronunciation';

/**
 * Generates the app's audio bank into public/audio/.
 *
 *   npm run tts:build                  # generate whatever is missing
 *   npm run tts:build -- --dry-run     # list what would be generated and the cost
 *
 * One voice for everything: Gemini 3.1 Flash TTS, "Leda", at a quick
 * conversational pace (QUICK_PROMPT). Chosen in listening rounds 6 and 7
 * (Oct 19, 2026) over WaveNet A, Chirp 3 HD and Gemini 2.5 Pro, for whole
 * sentences, lone numbers and the fragments sentences are assembled from.
 * A phrase's voice is recorded in the manifest, so changing the voice or the
 * pace regenerates every clip.
 *
 * Idempotent: a clip is regenerated only if its text or its voice changed,
 * because the file is named by the hash of the text and the manifest records
 * the voice used.
 */

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT_DIR = path.join(ROOT, 'public', 'audio');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

export const VOICE: VoiceSpec = { engine: 'gemini-3.1-flash', voice: 'Leda', prompt: QUICK_PROMPT };
/** Part of the manifest's voice key: a new pace must regenerate the clips too. */
const PACE = 'quick';

interface ClipRecord {
  text: string;
  voice: string;
}

interface Manifest {
  version: 2;
  /** clipId → text and voice, for auditing and for detecting routing changes. */
  clips: Record<string, ClipRecord>;
}

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    concurrency: { type: 'string', default: '4' },
    /** Stop starting new clips after this many minutes (a CI job has 6 hours); rerun to go on. */
    'max-minutes': { type: 'string', default: '0' },
  },
});

export function voiceFor(): VoiceSpec {
  return VOICE;
}

function voiceKey(v: VoiceSpec): string {
  return v.engine.startsWith('gemini') ? `${v.engine}/${v.voice}/${PACE}` : `${v.engine}/${v.voice}`;
}

function textFor(phrase: string, spec: VoiceSpec): string {
  // Nikud hints are only for Chirp; the classic engine reads plain text correctly.
  return spec.engine === 'chirp3-hd' ? vocalizeForTts(phrase) : phrase;
}

async function main(): Promise<void> {
  await ensureDir(OUT_DIR);
  const manifest = await readJson<Manifest>(MANIFEST, { version: 2, clips: {} });
  if ((manifest as { version: number }).version !== 2) {
    throw new Error(
      'public/audio/manifest.json is from an older layout; delete public/audio first.',
    );
  }

  const phrases = allPhrases();
  // The voice must never receive a digit: it guesses the gender and the reading.
  const withDigits = phrases.filter((p) => /\d/.test(p.text));
  if (withDigits.length > 0) {
    for (const p of withDigits.slice(0, 20)) console.error(`  ${p.id}: ${p.text}`);
    throw new Error(`${withDigits.length} phrases contain digits; fix them before generating.`);
  }
  const work = phrases
    .map((p) => ({ phrase: p, id: clipIdNode(p.text), spec: voiceFor() }))
    .filter(
      ({ id, spec }) =>
        !existsSync(path.join(OUT_DIR, `${id}.mp3`)) ||
        manifest.clips[id]?.voice !== voiceKey(spec),
    );

  const byVoice = new Map<string, Phrase[]>();
  for (const w of work) {
    const key = voiceKey(w.spec);
    byVoice.set(key, [...(byVoice.get(key) ?? []), w.phrase]);
  }
  console.log(`${phrases.length} phrases in the bank, ${work.length} to generate.`);
  for (const [key, list] of byVoice) {
    const engine = work.find((w) => voiceKey(w.spec) === key)?.spec.engine ?? 'wavenet';
    console.log(
      `  ${key}: ${list.length} clips, ${estimateCost(
        list.map((p) => p.text),
        engine,
      )}`,
    );
  }
  if (values['dry-run'] || work.length === 0) {
    for (const w of work.slice(0, 20))
      console.log(`  [${voiceKey(w.spec)}] ${w.phrase.id}: ${w.phrase.text}`);
    if (work.length > 20) console.log(`  … and ${work.length - 20} more`);
    return;
  }

  // Short clips first: numbers and fragments are heard in many sentences.
  work.sort((x, y) => x.phrase.text.length - y.phrase.text.length);
  let deadline =
    Number(values['max-minutes']) > 0 ? Date.now() + Number(values['max-minutes']) * 60_000 : Infinity;
  let done = 0;
  let skipped = 0;
  const checkpoint = async () => {
    done++;
    if (done % 50 === 0 || done === work.length) {
      console.log(`  ${done}/${work.length}`);
      await writeJson(MANIFEST, manifest);
    }
  };
  /** Clips whose length is far off their text: an engine that added or dropped words. */
  const sizes: { id: string; text: string; perChar: number }[] = [];
  const failures: string[] = [];
  let inARow = 0;
  const run = async (w: (typeof work)[number]) => {
    if (Date.now() > deadline) {
      skipped++;
      return;
    }
    const spec = w.spec.engine === 'chirp3-hd' ? { ...w.spec, prompt: DEFAULT_PROMPT } : w.spec;
    let mp3: Buffer;
    try {
      mp3 = await synthesize(textFor(w.phrase.text, spec), spec);
    } catch (err) {
      // One phrase the engine refuses must not stop the other thousands: listed at the end.
      failures.push(`${w.phrase.id}: ${err instanceof Error ? err.message : String(err)}`);
      // Twenty in a row: the engine refuses everything (a quota, a setting). Stop and report.
      if (++inARow >= 20) deadline = 0;
      return;
    }
    inARow = 0;
    await writeFile(path.join(OUT_DIR, `${w.id}.mp3`), mp3);
    manifest.clips[w.id] = { text: w.phrase.text, voice: voiceKey(w.spec) };
    sizes.push({ id: w.id, text: w.phrase.text, perChar: mp3.length / w.phrase.text.length });
    await checkpoint();
  };
  // Chirp has a tighter per-minute quota on new projects: one request at a time.
  const chirpWork = work.filter((w) => w.spec.engine === 'chirp3-hd');
  const otherWork = work.filter((w) => w.spec.engine !== 'chirp3-hd');
  await Promise.all([
    mapLimit(otherWork, Number(values.concurrency), run),
    mapLimit(chirpWork, 1, run),
  ]);
  if (skipped > 0) console.log(`Time is up: ${skipped} clips left for the next run.`);
  if (failures.length > 0) {
    console.log(`${failures.length} clips failed:`);
    for (const f of failures.slice(0, 50)) console.log(`    ${f}`);
  }

  // For a listen: the clips longest and shortest for their text.
  sizes.sort((x, y) => y.perChar - x.perChar);
  const show = (list: typeof sizes) =>
    list.forEach((c) => console.log(`    ${c.perChar.toFixed(0)} B/char  ${c.id}  ${c.text}`));
  if (sizes.length > 40) {
    console.log('  Longest for their text (added words or long silences?):');
    show(sizes.slice(0, 20));
    console.log('  Shortest for their text (dropped words?):');
    show(sizes.slice(-20));
  }

  await writeJson(MANIFEST, manifest);
  if (failures.length > 0) process.exitCode = 1;
  console.log(
    `Done. ${Object.keys(manifest.clips).length} clips in ${path.relative(ROOT, OUT_DIR)}.`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
