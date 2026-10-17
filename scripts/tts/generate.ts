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
 * Two voices, chosen after five listening rounds (Oct 2026):
 *   - Any phrase containing a number word is read by WaveNet A, Google's classic
 *     Hebrew voice. It was the only engine that read every number correctly.
 *   - Everything else (encouragement, feedback, hints without numbers) is read
 *     by Chirp 3 HD "Leda", which sounds warmer. A phrase's voice is recorded
 *     in the manifest, so changing the routing regenerates only what moved.
 *
 * Idempotent: a clip is regenerated only if its text or its voice changed,
 * because the file is named by the hash of the text and the manifest records
 * the voice used.
 */

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT_DIR = path.join(ROOT, 'public', 'audio');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

export const NUMBERS_VOICE: VoiceSpec = { engine: 'wavenet', voice: 'he-IL-Wavenet-A' };
export const WARM_VOICE: VoiceSpec = { engine: 'chirp3-hd', voice: 'Leda' };

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
  },
});

/** Hebrew number words that mark a phrase as "numbers": read by the classic engine. */
const NUMBER_WORD =
  /(^|[\s,.:;!?()-])ו?ל?מ?ב?(אפס|אחת|אחד|שתיים|שניים|שתי|שני|שתים|שנים|שלוש|שלושה|שלושת|ארבע|ארבעה|ארבעת|חמש|חמישה|חמשת|שש|שישה|ששת|שבע|שבעה|שבעת|שמונה|שמונת|תשע|תשעה|תשעת|עשר|עשרה|עשרת|עשרים|שלושים|ארבעים|חמישים|שישים|שבעים|שמונים|תשעים|מאה|מאתיים|מאות|אלף|אלפיים|אלפים|מיליון|חצי|שליש|רבע|שלישים|רבעים|חמישיות|נקודה)(?=$|[\s,.:;!?()-])/;

export function voiceFor(text: string): VoiceSpec {
  return NUMBER_WORD.test(text) ? NUMBERS_VOICE : WARM_VOICE;
}

function voiceKey(v: VoiceSpec): string {
  return `${v.engine}/${v.voice}`;
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
    .map((p) => ({ phrase: p, id: clipIdNode(p.text), spec: voiceFor(p.text) }))
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
    const engine = key.startsWith('wavenet') ? 'wavenet' : 'chirp3-hd';
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

  // Chirp has a tighter per-minute quota on new projects: run it one request at a time.
  const wavenetWork = work.filter((w) => w.spec.engine === 'wavenet');
  const chirpWork = work.filter((w) => w.spec.engine !== 'wavenet');
  let done = 0;
  const checkpoint = async () => {
    done++;
    if (done % 50 === 0 || done === work.length) {
      console.log(`  ${done}/${work.length}`);
      await writeJson(MANIFEST, manifest);
    }
  };
  const run = async (w: (typeof work)[number]) => {
    const spec = w.spec.engine === 'chirp3-hd' ? { ...w.spec, prompt: DEFAULT_PROMPT } : w.spec;
    const mp3 = await synthesize(textFor(w.phrase.text, spec), spec);
    await writeFile(path.join(OUT_DIR, `${w.id}.mp3`), mp3);
    manifest.clips[w.id] = { text: w.phrase.text, voice: voiceKey(w.spec) };
    await checkpoint();
  };
  await Promise.all([
    mapLimit(wavenetWork, Number(values.concurrency), run),
    mapLimit(chirpWork, 1, run),
  ]);

  await writeJson(MANIFEST, manifest);
  console.log(
    `Done. ${Object.keys(manifest.clips).length} clips in ${path.relative(ROOT, OUT_DIR)}.`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
