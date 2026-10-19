import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  DEFAULT_PROMPT,
  ensureDir,
  estimateCost,
  mapLimit,
  synthesize,
  type VoiceSpec,
} from './lib';
import { FULL_NIKUD, vocalizeForTts } from './pronunciation';
import {
  BANK_CHECK,
  NIKUD_PAIRS,
  PROBE,
  ROUND6,
  SENTENCES as SAMPLE_SENTENCES,
  WORDS,
} from './sample-sentences';

/**
 * Voice comparison batch. Produces, for each variant, one MP3 per test sentence
 * plus an index.html to listen side by side. Nothing here ships with the app.
 *
 *   npm run tts:sample                          # all variants
 *   npm run tts:sample -- --only chirp3-hd,chirp3-hd-fixed   # some variants
 *   npm run tts:sample -- --voice Kore          # try another voice name
 *
 * Variants:
 *   gemini-flash         Gemini 2.5 Flash TTS, plain text
 *   gemini-flash-nikud   same model, fully vocalized text (subset)
 *   chirp3-hd            Chirp 3 HD, plain text
 *   chirp3-hd-fixed      Chirp 3 HD, nikud only on ambiguous words (pronunciation.ts)
 *   chirp3-hd-nikud      Chirp 3 HD, fully vocalized text (subset)
 */

const OUT = path.resolve(import.meta.dirname, 'out-sample');

const { values } = parseArgs({
  options: {
    only: { type: 'string' },
    voice: { type: 'string', default: 'Leda' },
    /** "bank": the round-4 sentences from today's exercises instead of the original 40. */
    set: { type: 'string', default: 'sample' },
    /** Comma-separated voice names: plain-text Chirp 3 HD in each voice (overrides --only). */
    voices: { type: 'string' },
    /** With --voices: how many times to synthesize each sentence per voice (repeatability check). */
    takes: { type: 'string', default: '1' },
  },
});

const SENTENCES: readonly string[] =
  values.set === 'round6'
    ? ROUND6.map((r) => r.text)
    : values.set === 'bank'
    ? BANK_CHECK
    : values.set === 'probe'
      ? PROBE
      : values.set === 'words'
        ? WORDS
        : SAMPLE_SENTENCES;

interface Variant {
  name: string;
  spec: VoiceSpec;
  /** Text sent to the engine, aligned to SENTENCES; null where the variant has no version. */
  texts: (string | null)[];
  /** Assemble each sentence from these clips, as the app does (null: one request). */
  parts?: (readonly string[] | null)[];
}

/** The fully vocalized subset, aligned to SENTENCES. */
function nikudAligned(): (string | null)[] {
  const out: (string | null)[] = SENTENCES.map(() => null);
  for (const { plain, vocalized } of NIKUD_PAIRS) {
    const i = SENTENCES.indexOf(plain);
    if (i < 0) throw new Error(`Vocalized sentence has no plain match: ${vocalized}`);
    out[i] = vocalized;
  }
  return out;
}

const gemini: VoiceSpec = { engine: 'gemini-flash', voice: values.voice, prompt: DEFAULT_PROMPT };
const chirp: VoiceSpec = { engine: 'chirp3-hd', voice: values.voice };

const ALL_VARIANTS: Variant[] = [
  { name: 'gemini-flash', spec: gemini, texts: [...SENTENCES] },
  ...(values.set !== 'sample'
    ? []
    : [{ name: 'gemini-flash-nikud', spec: gemini, texts: nikudAligned() }]),
  { name: 'chirp3-hd', spec: chirp, texts: [...SENTENCES] },
  { name: 'chirp3-hd-fixed', spec: chirp, texts: SENTENCES.map(vocalizeForTts) },
  ...(values.set !== 'sample'
    ? []
    : [{ name: 'chirp3-hd-nikud', spec: chirp, texts: nikudAligned() }]),
];

/**
 * Round 6: today's voice as the app plays it (assembled from clips) and read
 * whole, against the warmer and newer engines reading the whole sentence.
 */
const WAVENET_A: VoiceSpec = { engine: 'wavenet', voice: 'he-IL-Wavenet-A' };
const ROUND6_VARIANTS: Variant[] = [
  {
    name: 'today-wavenet-a-clips',
    spec: WAVENET_A,
    texts: [...SENTENCES],
    parts: ROUND6.map((r) => r.parts),
  },
  { name: 'wavenet-a-whole', spec: WAVENET_A, texts: [...SENTENCES] },
  {
    name: 'chirp-leda-whole',
    spec: { engine: 'chirp3-hd', voice: 'Leda' },
    texts: SENTENCES.map(vocalizeForTts),
  },
  {
    name: 'gemini-2.5-pro-leda',
    spec: { engine: 'gemini-pro', voice: 'Leda', prompt: DEFAULT_PROMPT },
    texts: [...SENTENCES],
  },
  {
    name: 'gemini-3.1-flash-leda',
    spec: { engine: 'gemini-3.1-flash', voice: 'Leda', prompt: DEFAULT_PROMPT },
    texts: [...SENTENCES],
  },
];

const only = values.only?.split(',').map((x) => x.trim());
const takes = Math.max(1, Number(values.takes) || 1);
const variants: Variant[] = values.voices
  ? values.voices
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .flatMap((entry) => {
        const [voice = entry, mode = 'plain'] = entry.split('+');
        const texts =
          mode === 'fixed'
            ? SENTENCES.map(vocalizeForTts)
            : mode === 'full'
              ? SENTENCES.map((t) => FULL_NIKUD[t] ?? vocalizeForTts(t))
              : [...SENTENCES];
        return Array.from({ length: takes }, (_, k) => ({
          name: (takes > 1 ? `${voice}-t${k + 1}` : voice) + (mode === 'plain' ? '' : `+${mode}`),
          // Full classic names (he-IL-Wavenet-A, he-IL-Standard-B) use the classic engine.
          spec: voice.startsWith('he-IL-')
            ? { engine: 'wavenet' as const, voice }
            : { engine: 'chirp3-hd' as const, voice },
          // "fixed" suffix: the same voice reading the targeted-nikud text.
          texts,
        }));
      })
  : (values.set === 'round6' ? ROUND6_VARIANTS : ALL_VARIANTS).filter(
      (v) => !only || only.includes(v.name),
    );

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c] ?? c);
}

async function main(): Promise<void> {
  await ensureDir(OUT);
  const failures = new Map<string, string>();

  for (const v of variants) {
    console.log(
      `\n${v.name}: ${v.texts.filter(Boolean).length} sentences, ${estimateCost(
        v.texts.filter((x): x is string => x !== null),
        v.spec.engine,
      )}`,
    );
    const dir = path.join(OUT, v.name);
    await ensureDir(dir);
    const items = v.texts
      .map((text, i) => ({ text, i }))
      .filter((x): x is { text: string; i: number } => x.text !== null);
    try {
      // Gemini TTS starts with a low per-minute quota on new projects: one request at a time.
      const concurrency = v.spec.engine === 'chirp3-hd' || v.spec.engine === 'wavenet' ? 3 : 1;
      await mapLimit(items, concurrency, async ({ text, i }) => {
        const n = String(i + 1).padStart(2, '0');
        const clips = v.parts?.[i];
        // As the app plays it: one MP3 per clip, back to back.
        const audio = clips
          ? Buffer.concat(await Promise.all(clips.map((c) => synthesize(c, v.spec))))
          : await synthesize(text, v.spec);
        await writeFile(path.join(dir, `${n}.mp3`), audio);
        console.log(`  ${n} ${text}`);
      });
    } catch (err) {
      // One engine failing (e.g. Hebrew not enabled for it) must not hide the others.
      const message = err instanceof Error ? err.message : String(err);
      failures.set(v.name, message);
      console.error(`  ${v.name} FAILED: ${message}`);
    }
  }

  // Listening page: one row per sentence, one column per variant.
  const columns = variants.map((v) => ({ name: v.name, texts: v.texts }));
  const rows = SENTENCES.map((text, i) => {
    const n = String(i + 1).padStart(2, '0');
    const cells = columns
      .map(({ name, texts }) => {
        if (failures.has(name) || texts[i] === null) return '<td class="na">—</td>';
        return `<td><audio controls preload="none" src="${name}/${n}.mp3"></audio></td>`;
      })
      .join('');
    return `<tr><td class="n">${n}</td><td class="t">${escapeHtml(text)}</td>${cells}</tr>`;
  }).join('\n');

  const failureNotes = [...failures.entries()]
    .map(([name, msg]) => `<p class="err"><b>${escapeHtml(name)}</b> נכשל: ${escapeHtml(msg)}</p>`)
    .join('');

  const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>השוואת קולות</title>
<style>
body{font-family:system-ui;padding:16px;background:#fff8ee;color:#3a2f2a;margin:0}
table{border-collapse:collapse;width:100%}td,th{padding:8px;border-bottom:1px solid #ead9c2;vertical-align:middle}
th{text-align:start;font-weight:700;position:sticky;top:0;background:#fff8ee}.n{color:#7a6a60;width:2em}
.t{min-width:12em}.na{color:#bbb;text-align:center}.err{background:#fbeccf;padding:8px 12px;border-radius:12px}
audio{width:200px}
</style>
<h1>השוואת קולות: ${escapeHtml(values.voice)}</h1>
<p>עמודות: ${columns.map((c) => escapeHtml(c.name)).join(' · ')}. בעמודה המנוקדת יש רק חלק מהמשפטים.</p>
${failureNotes}
<table><thead><tr><th></th><th>משפט</th>${columns.map((c) => `<th>${escapeHtml(c.name)}</th>`).join('')}</tr></thead>
<tbody>${rows}</tbody></table>
</html>`;
  await writeFile(path.join(OUT, 'index.html'), html, 'utf8');
  console.log(`\nOpen ${path.join(OUT, 'index.html')} to listen.`);
  if (failures.size === variants.length) throw new Error('Every variant failed');
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
