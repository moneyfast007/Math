// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { seededRng } from '../rng';
import { idiom, idioms, stationIdioms } from './idioms';

describe('the bonus world of idioms', () => {
  it('has the sixty idioms of the list, six in each station, each with its meaning', () => {
    const all = Array.from({ length: 10 }, (_, i) => stationIdioms(i + 1)).flat();
    expect(all.map((x) => x.n)).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
    for (const x of all) {
      expect(x.phrase, `${x.n}`).not.toMatch(/^idiom\./);
      expect(x.meaning, `${x.n}`).not.toMatch(/^idiom\./);
    }
    expect(new Set(all.map((x) => x.phrase)).size).toBe(60);
    expect(new Set(all.map((x) => x.meaning)).size).toBe(60);
  });

  it('asks every idiom of a station both ways, with four answers from the same station', () => {
    for (let level = 1; level <= 10; level++) {
      const group = stationIdioms(level);
      // Enumerated once for each gender: the same twelve facts twice.
      const facts = idioms.enumerate(level);
      expect(new Set(facts.map((e) => e.factId)).size).toBe(12);
      for (const e of facts) {
        if (e.input.type !== 'choices') throw new Error(`${e.factId}: not a choice`);
        const labels = e.input.labels ?? [];
        expect(labels, e.factId).toHaveLength(4);
        expect(e.input.stack, e.factId).toBe(true);
        const n = Number(e.factId.split(':')[2]);
        const right = idiom(n);
        const asksMeaning = e.factId.startsWith('idiom:meaning:');
        expect(labels[e.answer], e.factId).toBe(asksMeaning ? right.meaning : right.phrase);
        const pool = group.map((x) => (asksMeaning ? x.meaning : x.phrase));
        for (const l of labels) expect(pool, e.factId).toContain(l);
        expect(e.visual, e.factId).toEqual({
          type: 'phrase',
          text: asksMeaning ? right.phrase : right.meaning,
          kind: asksMeaning ? 'idiom' : 'meaning',
        });
      }
    }
  });

  it('never takes the right answer away in a hint', () => {
    const rng = seededRng(11);
    for (let level = 1; level <= 10; level++) {
      for (let i = 0; i < 40; i++) {
        const e = idioms.generate(level, rng, 'f');
        if (e.input.type !== 'choices') continue;
        const right = e.input.labels?.[e.answer] ?? '';
        expect(e.hints[1]?.text, e.factId).not.toContain(`"${right}" לא`);
        expect(e.hints[2]?.text, e.factId).not.toContain(`"${right}" לא`);
      }
    }
  });
});
