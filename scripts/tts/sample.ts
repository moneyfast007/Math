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
import { NIKUD_SENTENCES, SENTENCES } from './sample-sentences';

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

const variants: Variant[] = [
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
].filter((v) => !values.only || v.name === values.only);

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
  for (const v of variants) {
    console.log(
      `\n${v.name}: ${v.sentences.length} sentences, ${estimateCost(v.sentences, v.spec.engine)}`,
    );
    const dir = path.join(OUT, v.name);
    await ensureDir(dir);
    await mapLimit(v.sentences, 3, async (text, i) => {
      const file = path.join(dir, `${String(i + 1).padStart(2, '0')}.mp3`);
      const mp3 = await synthesize(text, v.spec);
      await writeFile(file, mp3);
      console.log(`  ${String(i + 1).padStart(2, '0')} ${text}`);
    });
  }

  // Listening page: one row per sentence, one column per variant.
  const names = variants.map((v) => v.name);
  const rows = SENTENCES.map((text, i) => {
    const n = String(i + 1).padStart(2, '0');
    const cells = names
      .map((name) => {
        const v = variants.find((x) => x.name === name) as Variant;
        if (i >= v.sentences.length) return '<td class="na">—</td>';
        return `<td><audio controls preload="none" src="${name}/${n}.mp3"></audio></td>`;
      })
      .join('');
    return `<tr><td class="n">${n}</td><td class="t">${escapeHtml(text)}</td>${cells}</tr>`;
  }).join('\n');

  const html = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8">
<title>השוואת קולות</title>
<style>
body{font-family:system-ui;padding:24px;background:#fff8ee;color:#3a2f2a}
table{border-collapse:collapse;width:100%}td,th{padding:8px 10px;border-bottom:1px solid #ead9c2;vertical-align:middle}
th{text-align:start;font-weight:700}.n{color:#7a6a60;width:3em}.t{max-width:40em}.na{color:#bbb;text-align:center}
audio{width:260px}
</style>
<h1>השוואת קולות: ${escapeHtml(values.voice)}</h1>
<p>${names.map(escapeHtml).join(' · ')}</p>
<table><thead><tr><th></th><th>משפט</th>${names.map((n) => `<th>${escapeHtml(n)}</th>`).join('')}</tr></thead>
<tbody>${rows}</tbody></table>
<h2>הגרסה המנוקדת</h2>
<ol>${NIKUD_SENTENCES.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
</html>`;
  await writeFile(path.join(OUT, 'index.html'), html, 'utf8');
  console.log(`\nOpen ${path.join(OUT, 'index.html')} to listen.`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
