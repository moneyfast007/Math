// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { seededRng } from '../rng';
import type { Exercise, ShapeItem } from '../types';
import { patterns1 } from './patterns1';

const all = (level: number): Exercise[] =>
  patterns1.enumerate(level).filter((_, i) => i % 2 === 0);

/** Exercises with their buttons in random orders, as a child gets them. */
const played = (level: number): Exercise[] => {
  const rng = seededRng(level * 11 + 5);
  return Array.from({ length: 120 }, () => patterns1.generate(level, rng, 'm'));
};

describe('patterns-1', () => {
  it('never repeats a fact within a level', () => {
    for (let level = 1; level <= 10; level++) {
      const ids = all(level).map((e) => e.factId);
      expect(new Set(ids).size, `level ${level}`).toBe(ids.length);
      expect(ids.length, `level ${level}`).toBeGreaterThanOrEqual(12);
    }
  });

  it('level 1: the right button continues the pattern; each wrong one keeps one of shape or colour', () => {
    for (const e of played(1)) {
      if (e.input.type !== 'choices' || !e.input.visuals) throw new Error('picture choices');
      const visuals = e.input.visuals;
      const pick = (i: number): ShapeItem => {
        const v = visuals[i];
        const item = v?.type === 'shapes' ? v.items[0] : undefined;
        if (!item) throw new Error(`${e.factId}: no shape on button ${i}`);
        return item;
      };
      const right = pick(e.answer);
      const row = e.visual?.type === 'shapes' ? e.visual.items : [];
      expect(row.at(-1), e.factId).toBeNull();
      // The row is a repeat of its first four (or three) things: the right one is what comes next.
      const shownItems = row.slice(0, -1) as ShapeItem[];
      const unit = e.factId.split(':')[1] as string;
      const key = (s: ShapeItem) => `${s.shape}/${s.color}`;
      const letters = [...new Set([...unit])];
      const byLetter = new Map<string, string>();
      [...unit].forEach((c, i) => {
        const s = shownItems[i];
        if (s) byLetter.set(c, key(s));
      });
      expect(byLetter.size, e.factId).toBe(letters.length);
      expect(key(right), e.factId).toBe(byLetter.get(unit[shownItems.length % unit.length] as string));
      const others = e.input.choices.filter((c) => c !== e.answer).map(pick);
      for (const o of others) {
        const same = Number(o.shape === right.shape) + Number(o.color === right.color);
        expect(same, e.factId).toBe(1);
      }
      expect(new Set(e.input.labels).size, e.factId).toBe(3);
    }
  });

  it('level 2: the groups grow by the same amount, and the answer is the next group', () => {
    for (const e of all(2)) {
      const groups = e.visual?.type === 'objects' ? e.visual.groups : [];
      const step = (groups[1] as number) - (groups[0] as number);
      expect(step > 0, e.factId).toBe(true);
      groups.forEach((g, i) => expect(g, e.factId).toBe((groups[0] as number) + i * step));
      expect(e.answer, e.factId).toBe((groups.at(-1) as number) + step);
    }
  });

  it('levels 3–7 and 10: the answer fills the gap of an even-stepped sequence', () => {
    const steps: Record<number, number[]> = {
      3: [1],
      4: [-1],
      5: [2],
      6: [5],
      7: [10, -10],
      10: [1, -1, 2, -2, 5, -5, 10, -10],
    };
    for (const [level, allowed] of Object.entries(steps)) {
      const seen = new Set<number>();
      for (const e of played(Number(level))) {
        const terms = e.display.split(', ').map((x) => (x === '?' ? e.answer : Number(x)));
        expect(terms, e.factId).toHaveLength(5);
        const d = (terms[1] as number) - (terms[0] as number);
        terms.forEach((x, i) => expect(x, e.factId).toBe((terms[0] as number) + i * d));
        expect(allowed.includes(d), `${e.factId}: step ${d}`).toBe(true);
        seen.add(d);
        // Never the first number missing, never outside 0–100.
        expect(e.display.startsWith('?'), e.factId).toBe(false);
        for (const x of terms) expect(x >= 0 && x <= 100, e.factId).toBe(true);
        if (e.input.type === 'choices') expect(new Set(e.input.choices).size).toBe(3);
        // The worked example has none of this sequence's numbers.
        const ex = (e.hints[2].example?.display ?? '').split(', ').map(Number);
        for (const x of ex) expect(terms.includes(x), e.factId).toBe(false);
      }
      expect(seen.size, `level ${level}`).toBe(allowed.length);
    }
  });

  it('level 8: the right answer has the asked parity, and only it', () => {
    for (const e of all(8)) {
      if (e.input.type !== 'choices' || !e.input.labels) throw new Error('labelled choices');
      if (e.factId.startsWith('even:is:')) {
        const n = Number(e.factId.split(':')[2]);
        expect(e.answer, e.factId).toBe(n % 2 === 0 ? 0 : 1);
        continue;
      }
      const even = e.factId.startsWith('even:even');
      const nums = e.input.labels.map(Number);
      nums.forEach((n, i) => expect(n % 2 === (even ? 0 : 1), e.factId).toBe(i === e.answer));
      expect([...nums].sort((a, b) => a - b), e.factId).toEqual(nums);
    }
  });

  it('level 9: the right label is the difference between the numbers', () => {
    const answers = new Set<number>();
    for (const e of all(9)) {
      const terms = e.display.split(', ').map(Number);
      const d = (terms[1] as number) - (terms[0] as number);
      if (e.input.type !== 'choices' || !e.input.labels) throw new Error('labelled choices');
      expect(e.input.labels[e.answer], e.factId).toBe(`+${d}`);
      answers.add(e.answer);
    }
    expect(answers.size).toBe(4);
  });
});
