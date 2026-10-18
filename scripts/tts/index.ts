import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { topicsForGrade } from '../../src/engine/registry';
import { clipIdNode } from './lib';
import { numberPhrases, uiPhrases } from './phrases';

/**
 * Writes the small per-grade clip lists the app reads instead of the whole
 * manifest (2.8 MB): public/audio/index/g<grade>.json holds the ids of every
 * recorded clip a child of that grade can hear (the interface, the number
 * words and her grade's worlds), and shared.json the interface and numbers
 * only (before a child is chosen). Ids are 16 hex characters, concatenated.
 *
 * Runs before every build, so the lists always match the code and the clips.
 */

const ROOT = path.resolve(import.meta.dirname, '../..');
const AUDIO = path.join(ROOT, 'public/audio');
const OUT = path.join(AUDIO, 'index');

async function main(): Promise<void> {
  const manifestPath = path.join(AUDIO, 'manifest.json');
  const recorded = existsSync(manifestPath)
    ? new Set(
        Object.keys(
          (JSON.parse(await readFile(manifestPath, 'utf8')) as { clips?: object }).clips ?? {},
        ),
      )
    : new Set<string>();
  const idsOf = (texts: Iterable<string>) => {
    const out = new Set<string>();
    for (const text of texts) {
      const id = clipIdNode(text);
      if (recorded.has(id)) out.add(id);
    }
    return out;
  };

  const shared = idsOf([...uiPhrases(), ...numberPhrases()].map((p) => p.text));
  await mkdir(OUT, { recursive: true });
  const sizes = new Map<string, number>();
  const sizeOf = async (id: string) => {
    let n = sizes.get(id);
    if (n === undefined) {
      n = (await stat(path.join(AUDIO, `${id}.mp3`)).catch(() => ({ size: 0 }))).size;
      sizes.set(id, n);
    }
    return n;
  };
  const write = async (name: string, ids: Set<string>) => {
    let bytes = 0;
    for (const id of ids) bytes += await sizeOf(id);
    // `bytes`: what downloading the list for offline use costs (shown to parents).
    await writeFile(
      path.join(OUT, name),
      JSON.stringify({ v: 1, bytes, ids: [...ids].sort().join('') }),
    );
    return ids.size;
  };
  const report = [`shared: ${await write('shared.json', shared)}`];
  for (const grade of [0, 1, 2, 3, 4, 5, 6] as const) {
    const grades = idsOf(topicsForGrade(grade).flatMap((t) => t.spokenBank()));
    report.push(`g${grade}: ${await write(`g${grade}.json`, new Set([...shared, ...grades]))}`);
  }
  console.log(`audio index: ${report.join(', ')} clips`);
}

await main();
