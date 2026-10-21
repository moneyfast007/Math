// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { levelsFor, topicsForGrade } from '../registry';
import type { Exercise, Visual } from '../types';
import { data } from './data';
import { dataStats } from './dataStats';

/** Every exercise of a level's pool (both genders). */
const all = (topic: typeof data, level: number): Exercise[] => topic.enumerate(level);

const ofType = <T extends Visual['type']>(e: Exercise, type: T) => {
  const v = e.visual;
  if (!v || v.type !== type) throw new Error(`${e.factId}: no ${type}`);
  return v as Extract<Visual, { type: T }>;
};

describe('the two data worlds', () => {
  it('give every grade from 1 to 6 at least six stations of data, as its last world', () => {
    for (const grade of [1, 2, 3, 4, 5, 6] as const) {
      const worlds = topicsForGrade(grade);
      const last = worlds.at(-1);
      expect(last?.id, `grade ${grade}`).toBe(grade <= 3 ? 'data' : 'data-stats');
      const stations = levelsFor(last!, grade).filter((l) => l.level >= last!.startLevel(grade));
      expect(stations.length, `grade ${grade}`).toBeGreaterThanOrEqual(6);
    }
  });

  it('start and end each grade at its own stations', () => {
    expect([1, 2, 3].map((g) => [data.startLevel(g), data.lastLevel?.(g) ?? 10])).toEqual([
      [1, 6],
      [3, 9],
      [5, 10],
    ]);
    expect([4, 5, 6].map((g) => [dataStats.startLevel(g), dataStats.lastLevel?.(g) ?? 10])).toEqual(
      [
        [1, 6],
        [3, 8],
        [5, 10],
      ],
    );
  });
});

describe('data, grade 1 stations', () => {
  it('stay small and are answered with buttons', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) {
      for (const e of all(data, level)) {
        expect(e.input.type, e.factId).toBe('choices');
        const v = e.visual;
        const shown =
          v?.type === 'bars'
            ? v.bars.map((b) => b.value)
            : v?.type === 'tally'
              ? v.rows.map((r) => r.count)
              : v?.type === 'table'
                ? v.rows.map((r) => Number(r[1]))
                : [];
        for (const n of shown) expect(n, e.factId).toBeLessThanOrEqual(12);
        if (!(e.input.type === 'choices' && e.input.labels))
          expect(e.answer, e.factId).toBeLessThanOrEqual(12);
      }
    }
  });

  it('draw the first four as a picture graph, one picture per child', () => {
    for (const level of [1, 2, 3, 4])
      for (const e of all(data, level))
        expect(
          ofType(e, 'bars').bars.every((b) => b.icon),
          e.factId,
        ).toBe(true);
  });

  it('tallies: the right button shows the number asked, the others another number', () => {
    let which = 0;
    for (const e of all(data, 5)) {
      if (e.input.type !== 'choices' || !e.input.visuals) {
        const v = ofType(e, 'tally');
        expect(
          v.rows.map((r) => r.count),
          e.factId,
        ).toContain(e.answer);
        continue;
      }
      which++;
      const counts = e.input.visuals.map((p) => (p.type === 'tally' ? p.rows[0]?.count : -1));
      expect(new Set(counts).size, e.factId).toBe(3);
      const asked = Number(/\d+/.exec(e.prompt)?.[0]);
      expect(counts[e.answer], e.factId).toBe(asked);
    }
    expect(which).toBeGreaterThan(5);
  });
});

describe('data, the survey (grade 3)', () => {
  it('names exactly one pair that makes the number asked', () => {
    for (const e of all(data, 10)) {
      const rows = ofType(e, 'table').rows.map((r) => [String(r[0]), Number(r[1])] as const);
      const value = new Map(rows);
      if (e.input.type === 'choices' && e.input.labels) {
        const n = Number(/\d+/.exec(e.prompt)?.[0]);
        const sums = e.input.labels.map((l) => {
          const [a, b] = l.split(' ו') as [string, string];
          return (value.get(a) ?? NaN) + (value.get(b) ?? NaN);
        });
        expect(
          sums.filter((s) => s === n),
          e.factId,
        ).toHaveLength(1);
        expect(sums[e.answer], e.factId).toBe(n);
      } else {
        const total = rows.reduce((s, [, v]) => s + v, 0);
        expect(e.answer === total || rows.some(([, v]) => e.answer === total - v), e.factId).toBe(
          true,
        );
      }
    }
  });
});

describe('data and the average (grades 4–6)', () => {
  it('double bars: exactly one answer has more of the group asked', () => {
    for (const e of all(dataStats, 2)) {
      if (!(e.input.type === 'choices' && e.input.labels)) continue;
      const v = ofType(e, 'bars2');
      const boys = e.prompt.includes('יותר בנים');
      const fits = v.groups.map((g) => (boys ? g.a > g.b : g.b > g.a));
      expect(fits.filter(Boolean), e.factId).toHaveLength(1);
      expect(fits[e.answer], e.factId).toBe(true);
    }
  });

  it('line graph: the biggest rise is one, and it is the answer', () => {
    for (const e of all(dataStats, 4)) {
      const v = ofType(e, 'lineGraph');
      const vals = v.points.map((p) => p.value);
      if (!(e.input.type === 'choices' && e.input.labels)) continue;
      const rises = vals.slice(1).map((x, i) => x - (vals[i] as number));
      const best = Math.max(...rises);
      expect(
        rises.filter((r) => r === best),
        e.factId,
      ).toHaveLength(1);
      const right = rises.indexOf(best);
      expect(e.input.labels[e.answer], e.factId).toBe(
        `מ${v.points[right]?.label} ל${v.points[right + 1]?.label}`,
      );
    }
  });

  it('range: the biggest minus the smallest', () => {
    for (const e of all(dataStats, 7)) {
      const vals = ofType(e, 'table').rows.map((r) => Number(r[1]));
      expect(e.answer, e.factId).toBe(Math.max(...vals) - Math.min(...vals));
    }
  });

  it('missing score: with it, the average is the one asked, and it is a real score', () => {
    for (const e of all(dataStats, 8)) {
      const scores = ofType(e, 'table')
        .rows.map((r) => r[1])
        .filter((x): x is number => typeof x === 'number');
      const avg = Number(/\d+/.exec(e.prompt)?.[0]);
      expect((scores.reduce((s, x) => s + x, 0) + e.answer) / (scores.length + 1), e.factId).toBe(
        avg,
      );
      expect(e.answer, e.factId).toBeGreaterThanOrEqual(50);
      expect(e.answer, e.factId).toBeLessThanOrEqual(100);
    }
  });

  it('pie chart: the slice is that part of the children, a whole number', () => {
    for (const e of all(dataStats, 10)) {
      const v = ofType(e, 'pie');
      expect(
        v.slices.reduce((s, x) => s + x.parts, 0),
        e.factId,
      ).toBe(v.of);
      const n = Number(/\d+/.exec(e.prompt)?.[0]);
      const item = v.slices.find((s) => e.prompt.includes(`בחרו ${s.label}?`));
      expect(e.answer, e.factId).toBe((n * (item?.parts ?? NaN)) / v.of);
      expect(Number.isInteger(e.answer), e.factId).toBe(true);
    }
  });
});
