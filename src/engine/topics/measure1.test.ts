// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { seededRng } from '../rng';
import type { Exercise, Visual } from '../types';
import { measure1, measure1Facts } from './measure1';

/** Checks of this world's own logic; the general rules are in all.test.ts. */

const all = (level: number): Exercise[] => measure1.enumerate(level);
const labelOf = (e: Exercise) =>
  e.input.type === 'choices' ? e.input.labels?.[e.answer] : undefined;
const lengths = (v: Visual | undefined) => (v?.type === 'lengths' ? v.items : []);
const ids = (es: Exercise[]) => es.filter((_, i) => i % 2 === 0).map((e) => e.factId);

describe('measure-1', () => {
  it('never repeats a fact within a level', () => {
    for (let level = 1; level <= 10; level++) {
      const list = ids(all(level));
      expect(new Set(list).size, `level ${level}`).toBe(list.length);
    }
  });

  it('keeps every level a modest size', () => {
    for (let level = 1; level <= 10; level++) {
      const n = all(level).length / 2;
      expect(n, `level ${level}`).toBeGreaterThanOrEqual(12);
      expect(n, `level ${level}`).toBeLessThanOrEqual(80);
    }
  });

  it('levels 1–2: the right button is the longer (taller) or shorter (lower) thing in the picture', () => {
    for (const level of [1, 2]) {
      for (const e of all(level)) {
        const items = lengths(e.visual);
        expect(items).toHaveLength(2);
        const [p, q] = items as [{ thing: string; len: number }, { thing: string; len: number }];
        expect(p.len === q.len).toBe(false);
        const more = /ארוך|גבוה/.test(e.prompt);
        const want = (more ? p.len > q.len : p.len < q.len) ? p : q;
        const pictured = e.input.type === 'choices' ? e.input.visuals?.[e.answer] : undefined;
        expect(lengths(pictured)[0]?.thing, e.factId).toBe(want.thing);
        expect(e.solutionSpoken.startsWith(`ה${labelOf(e)}`), e.factId).toBe(true);
        if (level === 2) expect(e.visual?.type === 'lengths' && e.visual.stand).toBe(true);
      }
    }
  });

  it('level 3: the answer is the number of clips under the thing', () => {
    for (const e of all(3)) {
      const [item] = lengths(e.visual);
      expect(e.visual?.type === 'lengths' && e.visual.clips).toBe(true);
      expect(e.answer, e.factId).toBe(item?.len);
    }
  });

  it('level 4: the answer is the difference; the worked example has another one', () => {
    for (const e of all(4)) {
      const [p, q] = lengths(e.visual);
      expect(e.answer, e.factId).toBe(Math.abs((p?.len ?? 0) - (q?.len ?? 0)));
      expect(e.answer).toBeGreaterThan(0);
      const end = e.hints[2].example?.display.split('=').at(-1)?.trim();
      expect(end, e.factId).not.toBe(String(e.answer));
    }
  });

  it('level 5: the right button is the middle one, and the lengths differ', () => {
    for (const e of all(5)) {
      const items = lengths(e.visual);
      expect(new Set(items.map((i) => i.len)).size).toBe(3);
      const middle = [...items].sort((a, b) => a.len - b.len)[1];
      const pictured = e.input.type === 'choices' ? e.input.visuals?.[e.answer] : undefined;
      expect(lengths(pictured)[0]?.thing, e.factId).toBe(middle?.thing);
    }
  });

  it('level 6: the right button is on the pan that went down (heavy) or up (light)', () => {
    for (const e of all(6)) {
      const v = e.visual;
      if (v?.type !== 'balance' || !v.down) throw new Error(`${e.factId}: not a tipped balance`);
      const heavy = v.down === 'left' ? v.left.emoji : v.right.emoji;
      const light = v.down === 'left' ? v.right.emoji : v.left.emoji;
      const pictured = e.input.type === 'choices' ? e.input.visuals?.[e.answer] : undefined;
      const emoji = pictured?.type === 'objects' ? pictured.kind.emoji : undefined;
      expect(emoji, e.factId).toBe(e.prompt.includes('כבד') ? heavy : light);
    }
  });

  it('level 7: the balance is level and the answer is the number of cubes', () => {
    for (const e of all(7)) {
      const v = e.visual;
      if (v?.type !== 'balance') throw new Error('no balance');
      expect(v.down).toBeUndefined();
      expect(e.answer, e.factId).toBe(v.left.cubes ?? v.right.cubes);
    }
  });

  it('levels 8–9: the right day, with the confusing neighbours among the buttons', () => {
    const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    for (const f of measure1Facts.orderFacts()) {
      const want = (f.day + (f.dir === 'after' ? 1 : -1) + 7) % 7;
      const built = all(8).find((x) => x.factId === `days:${f.dir}:${f.day}`);
      expect(built && labelOf(built), built?.factId).toBe(DAYS[want]);
      const labels = built?.input.type === 'choices' ? built.input.labels : [];
      expect(labels).toContain(DAYS[(f.day + (f.dir === 'after' ? -1 : 1) + 7) % 7]);
    }
    for (const f of measure1Facts.relFacts()) {
      const step = f.kind === 'tomorrow' || f.kind === 'fromYesterday' ? 1 : -1;
      const built = all(9).find((x) => x.factId === `rel:${f.kind}:${f.day}`);
      expect(built && labelOf(built), built?.factId).toBe(DAYS[(f.day + step + 7) % 7]);
      // The day said in the question is a button too (the commonest slip).
      const labels = built?.input.type === 'choices' ? built.input.labels : [];
      expect(labels).toContain(DAYS[f.day]);
    }
  });

  it('agrees with Shabbat: "באה שבת", "אתמול הייתה שבת"', () => {
    const texts = [...all(8), ...all(9)].flatMap((e) => [e.spokenText, e.solutionSpoken]);
    expect(texts.some((s) => s.includes('באה שבת'))).toBe(true);
    expect(texts.some((s) => s.includes('הייתה שבת'))).toBe(true);
    expect(texts.some((s) => /בא שבת|היה שבת/.test(s))).toBe(false);
    expect(texts.some((s) => /באה יום|הייתה יום/.test(s))).toBe(false);
  });

  it('level 10: the answers follow the stories', () => {
    for (const f of measure1Facts.storyFacts()) {
      const id =
        f.kind === 'later'
          ? `story:later:${f.day}:${f.k}`
          : f.kind === 'shabbat'
            ? `story:shabbat:${f.day}`
            : `story:${f.kind}:${f.a}:${f.b}`;
      const e = all(10).find((x) => x.factId === id);
      if (!e) throw new Error(`no ${id}`);
      if (f.kind === 'longer' || f.kind === 'weights') expect(e.answer).toBe(f.a + f.b);
      else if (f.kind === 'shorter') expect(e.answer).toBe(f.a - f.b);
      else if (f.kind === 'shabbat') expect(e.answer).toBe(6 - f.day);
      else
        expect(labelOf(e)).toBe(
          ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][(f.day + f.k) % 7],
        );
    }
  });

  it('addresses the child by gender in the hints', () => {
    const rng = seededRng(1);
    const f = measure1.generate(3, rng, 'f');
    const m = measure1.generate(3, seededRng(1), 'm');
    expect(f.hints[0].spoken).toContain('ספרי');
    expect(m.hints[0].spoken).toContain('ספור');
  });
});
