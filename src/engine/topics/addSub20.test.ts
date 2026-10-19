// @vitest-environment node
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { seededRng } from '../rng';
import { addSub20, allExercises, LEVELS, spokenBank, startLevel } from './addSub20';

const exercises = allExercises();

describe('add-sub-20: every exercise it can produce', () => {
  it('produces exercises at every level', () => {
    for (const { level } of LEVELS) {
      expect(
        exercises.some((e) => e.level === level),
        `level ${level}`,
      ).toBe(true);
    }
  });

  it('has a non-negative integer answer that matches the display', () => {
    for (const e of exercises) {
      expect(Number.isInteger(e.answer) && e.answer >= 0, e.factId).toBe(true);
      if (e.display === '') continue;
      expect(e.display.split('?').length - 1, e.factId).toBe(1);
      // Substitute the answer and evaluate the equation.
      const filled = e.display.replace('?', String(e.answer)).replace('−', '-');
      const [lhs, rhs] = filled.split('=').map((s) => s.trim());
      const evalSide = (s: string) => {
        const m = /^(\d+)\s*([+-])\s*(\d+)$/.exec(s);
        if (m) return m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
        return Number(s);
      };
      expect(evalSide(lhs ?? ''), filled).toBe(evalSide(rhs ?? ''));
    }
  });

  it('never speaks digits', () => {
    for (const e of exercises) {
      expect(e.spokenText, e.factId).not.toMatch(/\d/);
      expect(e.solutionSpoken, e.factId).not.toMatch(/\d/);
      for (const h of e.hints) expect(h.spoken, e.factId).not.toMatch(/\d/);
    }
  });

  it('never reveals the answer in a hint text or worked example', () => {
    for (const e of exercises) {
      for (const h of e.hints) {
        if (h.example)
          expect(h.example.display, e.factId).not.toBe(e.display.replace('?', String(e.answer)));
      }
      // Hint 3's example uses a different fact.
      const ex = e.hints[2].example?.display ?? '';
      if (e.display)
        expect(ex.startsWith(e.display.split('=')[0]?.trim() ?? '§'), e.factId).toBe(false);
    }
  });

  it('keeps results realistic per level: no negatives, ranges grow with the level', () => {
    const maxByLevel = [0, 5, 10, 5, 10, 10, 10, 10, 20, 20, 20];
    for (const e of exercises) {
      const numbers = (e.display.match(/\d+/g) ?? []).map(Number);
      for (const n of [...numbers, e.answer]) {
        expect(n, e.factId).toBeGreaterThanOrEqual(0);
        expect(n, e.factId).toBeLessThanOrEqual(maxByLevel[e.level] ?? 20);
      }
    }
  });

  it('offers three distinct ascending choices that include the answer', () => {
    for (const e of exercises) {
      if (e.input.type !== 'choices') continue;
      const c = e.input.choices;
      expect(c, e.factId).toHaveLength(3);
      expect(new Set(c).size, e.factId).toBe(3);
      expect(c, e.factId).toContain(e.answer);
      expect(
        [...c].sort((a, b) => a - b),
        e.factId,
      ).toEqual(c);
      for (const v of c) expect(v, e.factId).toBeGreaterThanOrEqual(0);
    }
  });

  it('uses picture choices for gan levels and the number pad from level 6', () => {
    for (const e of exercises) {
      expect(e.input.type, e.factId).toBe(e.level <= 5 ? 'choices' : 'numpad');
    }
  });
});

describe('add-sub-20: Hebrew agreement in spoken sentences', () => {
  const bank = spokenBank();

  it('agrees numbers with feminine nouns', () => {
    expect(bank).toContain('כמה עוגיות יש?');
    expect(bank).toContain('שתי עוגיות ועוד עוגייה אחת. כמה עוגיות יש ביחד?');
    expect(bank).toContain('היו שלוש דבורים. לקחו שתי דבורים. כמה דבורים נשארו?');
  });

  it('agrees numbers with masculine nouns', () => {
    expect(bank).toContain('שני תפוחים ועוד תפוח אחד. כמה תפוחים יש ביחד?');
    expect(bank).toContain('היו עשרה בלונים. לקחו שלושה בלונים. כמה בלונים נשארו?');
  });

  it('reads arithmetic in the feminine', () => {
    expect(bank).toContain('כמה זה שמונה ועוד חמש?');
    expect(bank).toContain('שמונה ועוד חמש זה שלוש עשרה.');
    expect(bank).toContain('שבע ועוד כמה זה שתים עשרה?');
  });

  it('is a manageable size for pre-generated audio', () => {
    expect(bank.length).toBeGreaterThan(200);
    expect(bank.length).toBeLessThan(5000);
  });
});

describe('add-sub-20: generation and diagnosis', () => {
  it('generates valid exercises for any seed and level, avoiding an immediate repeat', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 1, max: 10 }), (seed, level) => {
        const rng = seededRng(seed);
        const first = addSub20.generate(level, rng, 'f');
        const second = addSub20.generate(level, rng, 'f', first.factId);
        expect(second.factId).not.toBe(first.factId);
        expect(first.level).toBe(level);
      }),
      { numRuns: 200 },
    );
  });

  it('recognizes a wrong operation, an off-by-one and reversed digits', () => {
    const e = exercises.find((x) => x.factId === 'add:8+5');
    expect(e).toBeDefined();
    if (!e) return;
    expect(e.diagnose(13)).toBeNull();
    expect(e.diagnose(3)).toBe('wrongOperation');
    expect(e.diagnose(12)).toBe('offByOne');
    expect(e.diagnose(31)).toBe('digitReversal');
    expect(e.diagnose(7)).toBeNull();

    const s = exercises.find((x) => x.factId === 'sub:9-4');
    expect(s?.diagnose(13)).toBe('wrongOperation');
  });

  it('starts each grade at a sensible level', () => {
    expect(startLevel(0)).toBe(3);
    expect(startLevel(1)).toBe(6);
    expect(startLevel(2)).toBe(8);
    expect(startLevel(4)).toBe(9);
  });
});
