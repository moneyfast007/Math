// @vitest-environment node
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
        if (e.input.visuals) {
          expect(e.input.visuals, e.factId).toHaveLength(e.input.choices.length);
          // A picture button still has a name, for the reveal and for screen readers.
          expect(e.input.labels, e.factId).toHaveLength(e.input.choices.length);
        }
        if (e.input.labels)
          expect(new Set(e.input.labels).size, e.factId).toBe(e.input.labels.length);
      } else if (e.input.type === 'numpad') {
        expect(String(Math.floor(e.answer)).length, e.factId).toBeLessThanOrEqual(
          e.input.maxDigits,
        );
      } else {
        // A column exercise: its last row is the answer, every step's words have no digits.
        const { layout } = e.input;
        expect(layout.rows.at(-1)?.value, e.factId).toBe(e.answer);
        for (const st of layout.steps) {
          expect(st.ask.spoken, e.factId).not.toMatch(/\d/);
          expect(st.explain.spoken, e.factId).not.toMatch(/\d/);
          for (const p of [...st.ask.parts, ...st.explain.parts])
            expect(p, e.factId).not.toMatch(/\d/);
        }
      }
      // A right answer is never diagnosed as a mistake.
      expect(e.diagnose(e.answer), e.factId).toBeNull();
      // No floating-point noise: a typed 26.1 must match, and nothing shows 0.6000000000000001.
      expect(e.answer, e.factId).toBe(Number(e.answer.toFixed(9)));
      const noisy = /\d\.\d{7,}/;
      for (const text of [e.display, e.prompt, e.spokenText, e.solutionSpoken])
        expect(text, e.factId).not.toMatch(noisy);
      for (const h of e.hints) {
        expect(h.text, e.factId).not.toMatch(noisy);
        expect(h.example?.display ?? '', e.factId).not.toMatch(noisy);
      }
      // The answer can be typed on the pad given: all its digits fit, and a point when it has one.
      if (e.input.type === 'numpad') {
        const typed = String(e.answer);
        expect(typed.replace('.', '').length, e.factId).toBeLessThanOrEqual(e.input.maxDigits);
        if (typed.includes('.')) expect(e.input.decimal, e.factId).toBe(true);
      }
      // The worked example is not the exercise itself.
      const example = e.hints[2].example;
      if (example && e.display)
        expect(example.display, e.factId).not.toBe(e.display.replace('?', String(e.answer)));
    }
  });

  it('puts the answer at different places among the buttons', () => {
    for (const l of topic.levels) {
      const rng = seededRng(l.level * 97 + 3);
      const places = new Map<number, number>();
      let n = 0;
      for (let i = 0; i < 300; i++) {
        const e = topic.generate(l.level, rng, 'f');
        if (e.input.type !== 'choices' || e.input.choices.length < 3) continue;
        const k = e.input.choices.indexOf(e.answer);
        places.set(k, (places.get(k) ?? 0) + 1);
        n++;
      }
      if (n < 100) continue;
      // Always pressing the same button must not pass: no place takes more than about half.
      const most = Math.max(...places.values()) / n;
      expect(most, `level ${l.level}: ${JSON.stringify([...places])}`).toBeLessThanOrEqual(0.55);
    }
  });

  it('does not repeat an exercise within a round while the level has others', () => {
    for (const l of topic.levels) {
      const rng = seededRng(l.level * 13 + 1);
      const distinct = new Set<string>();
      for (let i = 0; i < 300; i++) distinct.add(topic.generate(l.level, rng, 'f').factId);
      if (distinct.size < 14) continue;
      for (let round = 0; round < 5; round++) {
        const seen: string[] = [];
        for (let i = 0; i < 10; i++) seen.push(topic.generate(l.level, rng, 'f', seen).factId);
        expect(new Set(seen).size, `level ${l.level}: ${seen.join(' ')}`).toBe(seen.length);
      }
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

describe('differentExample', () => {
  it('keeps a suggested example that already differs', async () => {
    const { differentExample } = await import('../build');
    expect(differentExample(3, '+', 5, { a: 4, b: 2 })).toEqual({ a: 4, b: 2 });
  });

  it('nudges a matching example, keeping it valid', async () => {
    const { differentExample } = await import('../build');
    expect(differentExample(3, '×', 5, { a: 3, b: 5 })).not.toEqual({ a: 3, b: 5 });
    expect(differentExample(5, '×', 3, { a: 3, b: 5 })).not.toEqual({ a: 3, b: 5 }); // 3 × 5 is the same fact
    const d = differentExample(12, '÷', 3, { a: 12, b: 3 });
    expect(d.a % d.b).toBe(0);
    expect(d).not.toEqual({ a: 12, b: 3 });
    const s = differentExample(50, '-', 20, { a: 50, b: 20 });
    expect(s.a - s.b).toBeGreaterThanOrEqual(0);
    expect(s).not.toEqual({ a: 50, b: 20 });
  });
});

describe('diagnoseArith', () => {
  it('tells a forgotten borrow from a forgotten carry', async () => {
    const { diagnoseArith } = await import('../build');
    expect(diagnoseArith(81, { a: 72, op: '-', b: 9, answer: 63 })).not.toBe('carry');
    expect(diagnoseArith(73, { a: 72, op: '-', b: 9, answer: 63 })).toBe('borrow');
    expect(diagnoseArith(71, { a: 47, op: '+', b: 34, answer: 81 })).toBe('carry');
  });

  it('calls 4 for 40 a place-value slip, not swapped digits', async () => {
    const { diagnoseArith } = await import('../build');
    expect(diagnoseArith(4, { a: 60, op: '+', b: 40, answer: 40, missing: 'b' })).toBe(
      'placeValue',
    );
    expect(diagnoseArith(4, { a: 20, op: '+', b: 20, answer: 40 })).toBe('placeValue');
    expect(diagnoseArith(42, { a: 12, op: '+', b: 12, answer: 24 })).toBe('digitReversal');
  });
});

describe('answers without floating-point noise', () => {
  it('rounds results and compares typed answers exactly', async () => {
    const { result, sameNumber } = await import('../build');
    expect(result(26, '+', 0.1)).toBe(26.1);
    expect(result(1.5, '×', 0.4)).toBe(0.6);
    expect(result(0.7, '÷', 0.1)).toBe(7);
    expect(sameNumber(0.1 + 0.2, 0.3)).toBe(true);
  });
});

describe('choices', () => {
  it('keeps the answer and the range, in order, at any place', async () => {
    const { spreadChoices, windowChoices } = await import('../build');
    const rng = seededRng(1);
    const places = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const c = spreadChoices(rng, 5, { deltas: [1, 2], min: 0, max: 10 });
      expect(c).toContain(5);
      expect([...c].sort((x, y) => x - y)).toEqual(c);
      for (const v of c) expect(v >= 0 && v <= 10).toBe(true);
      places.add(c.indexOf(5));
    }
    expect(places.size).toBe(3);
    expect(spreadChoices(rng, 10, { deltas: [1, 2], min: 0, max: 10 })).toEqual([8, 9, 10]);
    expect(windowChoices(rng, [0, 3, 4, 5], 0)).toEqual([0, 3, 4]);
  });
});
