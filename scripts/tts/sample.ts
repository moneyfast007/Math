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
import { NIKUD_PAIRS, NIKUD_SENTENCES, SENTENCES } from './sample-sentences';

/**
 * Voice comparison batch. Produces, for each variant, one MP3 per test sentence
 * plus an index.html to listen side by side. Nothing here ships with the app.
 *
 *   npm run tts:sample                          # all variants
 *   npm run tts:sample -- --only gemini-flash   # one variant
 *   npm run tts:sample -- --voice Kore          # try another voice name
 *
 * Variants:
 *   gemini-flash         Gemini 2.5 Flash TTS, plain text
 *   gemini-flash-nikud   same model, fully vocalized text (subset)
 *   chirp3-hd            Chirp 3 HD, plain text
 */

const OUT = path.resolve(import.meta.dirname, 'out-sample');

const { values } = parseArgs({
  options: {
    only: { type: 'string' },
    voice: { type: 'string', default: 'Leda' },
  },
});

interface Variant {
  name: string;
  spec: VoiceSpec;
  sentences: readonly string[];
}

const ALL_VARIANTS: Variant[] = [
  {
    name: 'gemini-flash',
    spec: { engine: 'gemini-flash', voice: values.voice, prompt: DEFAULT_PROMPT },
    sentences: SENTENCES,
  },
  {
    name: 'gemini-flash-nikud',
    spec: { engine: 'gemini-flash', voice: values.voice, prompt: DEFAULT_PROMPT },
    sentences: NIKUD_SENTENCES,
  },
  {
    name: 'chirp3-hd',
    spec: { engine: 'chirp3-hd', voice: values.voice },
    sentences: SENTENCES,
  },
];

const variants = ALL_VARIANTS.filter((v) => !values.only || v.name === values.only);

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c] ?? c);
}

/** Each variant's sentences, aligned to SENTENCES (null where a variant has no version). */
function aligned(v: Variant): (string | null)[] {
  if (v.sentences === SENTENCES) return [...SENTENCES];
  const out: (string | null)[] = SENTENCES.map(() => null);
  for (const { plain, vocalized } of NIKUD_PAIRS) {
    const i = SENTENCES.indexOf(plain);
    if (i < 0) throw new Error(`Vocalized sentence has no plain match: ${vocalized}`);
    out[i] = vocalized;
  }
  return out;
}

async function main(): Promise<void> {
  await ensureDir(OUT);
  const failures = new Map<string, string>();

  for (const v of variants) {
    console.log(
      `\n${v.name}: ${v.sentences.length} sentences, ${estimateCost(v.sentences, v.spec.engine)}`,
    );
    const dir = path.join(OUT, v.name);
    await ensureDir(dir);
    const items = aligned(v)
      .map((text, i) => ({ text, i }))
      .filter((x): x is { text: string; i: number } => x.text !== null);
    try {
      // Gemini TTS starts with a low per-minute quota on new projects: one request at a time.
      const concurrency = v.spec.engine === 'chirp3-hd' ? 3 : 1;
      await mapLimit(items, concurrency, async ({ text, i }) => {
        const n = String(i + 1).padStart(2, '0');
        await writeFile(path.join(dir, `${n}.mp3`), await synthesize(text, v.spec));
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
  const columns = variants.map((v) => ({ name: v.name, texts: aligned(v) }));
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
