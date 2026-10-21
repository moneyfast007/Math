// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { topicsForGrade } from '../registry';
import type { Exercise, Visual } from '../types';
import { polygons, SHAPES } from './polygons';
import { polygons2 } from './polygons2';

const all = (level: number): Exercise[] => polygons.enumerate(level);
const figure = (v: Visual | undefined) => {
  if (v?.type !== 'figure') throw new Error('not a figure');
  return v;
};
const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe('polygons: two worlds of ten stations', () => {
  it('grade 1 keeps "polygons" from station 1; grade 2 has its own world in its place', () => {
    expect(polygons.grades).toEqual([1]);
    expect(polygons.levels).toHaveLength(10);
    expect(polygons.startLevel(1)).toBe(1);
    expect(polygons.lastLevel).toBeUndefined();
    expect(polygons2.grades).toEqual([2]);
    expect(polygons2.startLevel(2)).toBe(1);
    expect(topicsForGrade(1).map((t) => t.id)[3]).toBe('polygons');
    const g2 = topicsForGrade(2).map((t) => t.id);
    expect(g2[5]).toBe('polygons-2');
    expect(g2).not.toContain('polygons');
  });

  it('grade 2 starts with the right angle, once station 6 of grade 1', () => {
    const e = polygons2.enumerate(1)[0] as Exercise;
    expect(e.topicId).toBe('polygons-2');
    expect(e.visual?.type).toBe('angle');
    expect(polygons2.enumerate(5)[0]?.input.type).toBe('numpad');
  });

  it('the new levels list each exercise once', () => {
    for (const level of [6, 7, 8, 9, 10]) {
      const ids = all(level)
        .filter((_, i) => i % 2 === 0)
        .map((e) => e.factId);
      expect(new Set(ids).size, `level ${level}`).toBe(ids.length);
      expect(ids.length, `level ${level}`).toBeGreaterThanOrEqual(12);
    }
  });
});

describe('polygons, grade 1 levels 6–10', () => {
  it('level 6: the right button is the square or the rectangle asked for', () => {
    for (const e of all(6)) {
      if (e.input.type !== 'choices') throw new Error('choices');
      const v = e.input.visuals?.[e.answer];
      expect(v?.type).toBe('polygon');
      const pts = v?.type === 'polygon' ? v.points : [];
      if (e.factId.includes(':square:')) expect(pts).toEqual(SHAPES.square);
      else expect(pts).not.toEqual(SHAPES.square);
      expect(e.input.labels?.[e.answer]).toBe(e.factId.includes(':square:') ? 'ריבוע' : 'מלבן');
    }
  });

  it('level 7: three different lines, the asked one right', () => {
    for (const e of all(7)) {
      if (e.input.type !== 'choices') throw new Error('choices');
      const ds = (e.input.visuals ?? []).map((v) => figure(v).parts[0]?.d);
      expect(new Set(ds).size).toBe(3);
      const kind = e.factId.split(':')[1] as string;
      const d = ds[e.answer] as string;
      if (kind === 'straight') expect(d.match(/L/g)?.length).toBe(1);
      if (kind === 'broken') expect(d.match(/L/g)?.length).toBeGreaterThan(1);
      if (kind === 'curved') expect(d).toMatch(/[CQ]/);
    }
  });

  it('level 8: the answer is the number of such shapes, the example has another', () => {
    for (const e of all(8)) {
      expect(e.answer).toBeGreaterThan(0);
      const coloured = figure(e.hints[1].visual).parts.filter(
        (p) => !p.line && p.color !== 'plain',
      );
      expect(coloured.length, e.factId).toBe(e.answer);
      const example = e.hints[2].spoken.replace('למשל, ', '').replace(' הזה', '');
      expect(example, e.factId).not.toBe(e.solutionSpoken);
    }
  });

  it('level 9: the right half is the mirror of the half shown, the "same" half is not', () => {
    for (const e of all(9)) {
      if (e.input.type !== 'choices') throw new Error('choices');
      const shown = numbers(figure(e.visual).parts[0]?.d ?? '');
      const mirror = shown.map((v, i) => (i % 2 === 0 ? 50 - v : v));
      const buttons = (e.input.visuals ?? []).map((v) => numbers(figure(v).parts[0]?.d ?? ''));
      expect(buttons[e.answer], e.factId).toEqual(mirror);
      expect(buttons.filter((b) => JSON.stringify(b) === JSON.stringify(shown))).toHaveLength(1);
      expect(figure(e.visual).axis).toBe(50);
    }
  });

  it('level 10: the right pair builds the shape, and no two triangle pairs side by side', () => {
    const builds: Record<string, string> = {
      square: 'twoTri|twoRect',
      wideRect: 'twoSq',
      house: 'sqTri',
      tallTri: 'twoThin',
      trapezoid: 'rectTri',
    };
    for (const e of all(10)) {
      const [, target, right, others] = e.factId.split(':') as [string, string, string, string];
      expect(builds[target]?.split('|')).toContain(right);
      for (const o of others.split(',')) expect(builds[target]?.split('|')).not.toContain(o);
      const set = [right, ...others.split(',')];
      expect(set.includes('twoTri') && set.includes('twoThin')).toBe(false);
    }
  });
});

describe('polygons-2, grade 2 levels 6–10', () => {
  const all2 = (level: number) => polygons2.enumerate(level);

  it('level 6: the length is the end mark less the start mark', () => {
    for (const e of all2(6)) {
      const v = e.visual;
      if (v?.type !== 'ruler') throw new Error('ruler');
      expect(e.answer).toBe(v.to - v.from);
      if (v.from > 0) expect(e.advice?.map((a) => a.value)).toEqual([v.to]);
    }
  });

  it('level 7: the area is the number of squares drawn', () => {
    for (const e of all2(7)) expect(figure(e.visual).parts).toHaveLength(e.answer);
    const ids = all2(7).map((e) => e.factId);
    expect(ids).toContain('p2area:#../#../###');
  });

  it('level 8: the perimeter is the number of unit sides on the outline', () => {
    for (const e of all2(8)) {
      const outline = figure(e.hints[1].visual).parts.find((p) => p.line);
      expect(outline?.d.match(/M/g)?.length, e.factId).toBe(e.answer);
    }
    const byId = new Map(all2(8).map((e) => [e.factId, e.answer]));
    expect(byId.get('p2pgrid:##/##')).toBe(8);
    expect(byId.get('p2pgrid:#../###')).toBe(10);
    expect(byId.get('p2pgrid:.#./###')).toBe(10);
  });

  it('level 9: the right button has the larger (smaller) area', () => {
    for (const e of all2(9)) {
      if (e.input.type !== 'choices') throw new Error('choices');
      const [a, b] = (e.input.visuals ?? []).map((v) => figure(v).parts.length) as [number, number];
      expect(a).not.toBe(b);
      const right = e.answer === 0 ? a : b;
      const other = e.answer === 0 ? b : a;
      if (e.factId.endsWith(':more')) expect(right).toBeGreaterThan(other);
      else expect(right).toBeLessThan(other);
    }
  });

  it('level 10: fences and frames go all around, tiles fill the floor', () => {
    for (const e of all2(10)) {
      const [, kind, nums] = e.factId.split(':') as [string, string, string];
      if (kind === 'tiles') {
        const [r, c] = nums.split('x').map(Number) as [number, number];
        expect(e.answer).toBe(r * c);
      } else {
        expect(e.answer).toBe(
          nums
            .split(',')
            .map(Number)
            .reduce((s, x) => s + x, 0),
        );
      }
    }
  });
});
