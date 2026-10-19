// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { numberToWords, vavForms } from '@/lang/hebrewNumbers';
import { sayingsOf } from '../build';
import { TOPICS } from '../registry';
import { seededRng } from '../rng';

/** Whatever a child can hear, sampled in every level of every world, is in the audio bank. */

describe.each(TOPICS.map((t) => [t.id, t] as const))(
  'the audio bank covers what a child can hear: %s',
  (_id, topic) => {
    // One test per level, so no single test keeps the worker busy for long.
    it.each(topic.levels.map((l) => l.level))('level %i', (level) => {
      const bank = new Set(topic.spokenBank());
      const missing = new Set<string>();
      const rng = seededRng(2026 + level);
      for (let i = 0; i < 120; i++) {
        const e = topic.generate(level, rng, i % 2 ? 'f' : 'm');
        for (const [text, parts] of sayingsOf(e)) {
          // Recorded whole, or every clip of it is (numbers come from the shared number bank).
          if (bank.has(text)) continue;
          for (const p of parts ?? [text]) if (!bank.has(p) && !isNumberClip(p)) missing.add(p);
        }
      }
      expect([...missing].slice(0, 10)).toEqual([]);
    });
  },
);

/** Number words are recorded by the shared number bank (scripts/tts/phrases.ts): the same list here. */
const NUMBER_CLIPS = new Set<string>([
  ...Array.from({ length: 1000 }, (_, n) => [numberToWords(n, 'f'), numberToWords(n, 'm')]).flat(),
  ...[1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000].map((k) => numberToWords(k)),
  ...vavForms('f'),
  ...vavForms('m'),
  'אלף',
  'מיליון',
  'שני מיליון',
  'נקודה',
]);

function isNumberClip(p: string): boolean {
  return NUMBER_CLIPS.has(p);
}
