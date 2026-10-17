import { describe, expect, it } from 'vitest';
import { TOPICS } from '../registry';
import { seededRng } from '../rng';
import type { Exercise, Topic } from '../types';

/**
 * Rules every topic must keep (see types.ts). Closed levels are checked in
 * full; open ones on a few hundred samples each.
 */

function sample(topic: Topic, level: number, count: number): Exercise[] {
  const enumerate = (topic as Topic & { enumerate?: (level: number) => Exercise[] }).enumerate;
  const rng = seededRng(level * 31 + 7);
  const generated = Array.from({ length: count }, (_, i) =>
    topic.generate(level, rng, i % 2 ? 'f' : 'm'),
  );
  return enumerate ? [...enumerate(level).slice(0, 2000), ...generated] : generated;
}

describe.each(TOPICS.map((t) => [t.id, t] as const))('topic %s', (_id, topic) => {
  it('has ten levels with labels', () => {
    expect(topic.levels).toHaveLength(10);
    for (const l of topic.levels) expect(l.labelKey).toMatch(/^level\./);
  });

  it.each(topic.levels.map((l) => l.level))('level %i produces valid exercises', (level) => {
    for (const e of sample(topic, level, 150)) {
      expect(e.level, e.factId).toBe(level);
      expect(Number.isFinite(e.answer), e.factId).toBe(true);
      expect(e.answer, e.factId).toBeGreaterThanOrEqual(0);
      // One slot at most; a purely visual exercise has none.
      expect((e.display.match(/\?/g) ?? []).length, e.factId).toBeLessThanOrEqual(1);
      // Spoken text never carries digits.
      expect(e.spokenText, e.factId).not.toMatch(/\d/);
      expect(e.solutionSpoken, e.factId).not.toMatch(/\d/);
      expect(e.hints).toHaveLength(3);
      for (const h of e.hints) {
        expect(h.spoken, `${e.factId} hint`).not.toMatch(/\d/);
        expect(h.text.length, `${e.factId} hint`).toBeGreaterThan(0);
        for (const p of h.spokenParts ?? []) expect(p, e.factId).not.toMatch(/\d/);
      }
      for (const p of e.spokenParts ?? []) expect(p, e.factId).not.toMatch(/\d/);
      // The parts join back to the sentence (give or take punctuation).
      if (e.spokenParts && e.spokenParts.length > 0) {
        const strip = (s: string) => s.replace(/[\s.,:;!?()]/g, '');
        expect(strip(e.spokenParts.join(' ')), e.factId).toBe(strip(e.spokenText));
      }
      if (e.input.type === 'choices') {
        expect(e.input.choices, e.factId).toContain(e.answer);
        expect(new Set(e.input.choices).size).toBe(e.input.choices.length);
        if (e.input.labels) expect(e.input.labels).toHaveLength(e.input.choices.length);
      } else {
        expect(String(Math.floor(e.answer)).length, e.factId).toBeLessThanOrEqual(e.input.maxDigits);
      }
      // A right answer is never diagnosed as a mistake.
      expect(e.diagnose(e.answer), e.factId).toBeNull();
      // The worked example is not the exercise itself.
      const example = e.hints[2].example;
      if (example && e.display) expect(example.display, e.factId).not.toBe(e.display.replace('?', String(e.answer)));
    }
  });

  it('avoids an immediate repeat', () => {
    const rng = seededRng(5);
    for (const l of topic.levels) {
      const first = topic.generate(l.level, rng, 'f');
      for (let i = 0; i < 20; i++) {
        const next = topic.generate(l.level, rng, 'f', first.factId);
        expect(next.factId).not.toBe(first.factId);
      }
    }
  });

  it('has a finite spoken bank without digits', () => {
    const bank = topic.spokenBank();
    expect(bank.length).toBeGreaterThan(10);
    for (const s of bank) expect(s).not.toMatch(/\d/);
  });
});
