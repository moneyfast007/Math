// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n';
import { topicsForGrade } from '../registry';
import type { Exercise, Visual } from '../types';
import {
  anglesTopic,
  CORNERS,
  handsAngle,
  PROP_FACTS,
  SHAPES,
  SYM_LINES,
  vertexAngle,
} from './angles';
import {
  angles4,
  BOTH_FACTS,
  isAlways,
  isNotAlways,
  MEASURE_FACTS,
  PROP4_FACTS,
  QUAD_FACTS,
  quadFromAngles,
  thirdFacts,
  triKinds,
} from './angles4';

type P = [number, number];
const ids = (exs: Exercise[]) => exs.filter((_, i) => i % 2 === 0).map((e) => e.factId);
const label = (e: Exercise) =>
  e.input.type === 'choices' ? e.input.labels?.[e.input.choices.indexOf(e.answer)] : undefined;

describe('angles worlds: who plays which', () => {
  it('grade 3 plays "angles" from level 1, grade 4 plays "angles-4" in its old place', () => {
    expect(anglesTopic.grades).toEqual([3]);
    expect(angles4.grades).toEqual([4]);
    expect(anglesTopic.startLevel(3)).toBe(1);
    expect(angles4.startLevel(4)).toBe(1);
    const g3 = topicsForGrade(3).map((x) => x.id);
    const g4 = topicsForGrade(4).map((x) => x.id);
    expect(g3).toContain('angles');
    expect(g3).not.toContain('angles-4');
    expect(g4).not.toContain('angles');
    expect(g4.indexOf('angles-4')).toBe(g4.indexOf('perimeter-area') + 1);
  });

  it('keeps grade 3 levels 1–6 where they were (progress is stored by level)', () => {
    for (let n = 1; n <= 6; n++)
      expect(anglesTopic.levels[n - 1]?.labelKey).toBe(`level.angles.${n}`);
    expect(ids(anglesTopic.enumerate(1))[0]).toMatch(/^angle:/);
    expect(ids(anglesTopic.enumerate(6))[0]).toMatch(/^quad:/);
  });

  it('has no fact twice in a level, and every exercise in its own world', () => {
    for (const topic of [anglesTopic, angles4])
      for (let level = 1; level <= 10; level++) {
        const all = topic.enumerate(level);
        const f = ids(all);
        expect(new Set(f).size, `${topic.id} ${level}`).toBe(f.length);
        expect(f.length, `${topic.id} ${level}`).toBeGreaterThanOrEqual(6);
        for (const e of all) expect(e.topicId).toBe(topic.id);
      }
  });
});

describe('angles (grade 3), new levels', () => {
  it('level 7: the hands make a plain angle, and the answer names it', () => {
    for (const e of anglesTopic.enumerate(7)) {
      const v = e.visual as Extract<Visual, { type: 'clock' }>;
      const d = handsAngle(v.times[0] as { h: number; m: number });
      expect(d === 90 || Math.abs(d - 90) >= 30, e.factId).toBe(true);
      expect(label(e)).toBe(d < 90 ? 'חדה' : d === 90 ? 'ישרה' : 'קהה');
    }
  });

  it('level 8: the marked corner is the kind the answer says, never an inward one', () => {
    expect(new Set(CORNERS.map((c) => c.kind)).size).toBe(3);
    for (const e of anglesTopic.enumerate(8)) {
      const v = e.visual as Extract<Visual, { type: 'polygon' }>;
      const at = v.arcs?.[0] ?? -1;
      const d = vertexAngle(v.points, at);
      expect(Math.abs(d - 90) < 0.5 || Math.abs(d - 90) >= 20, e.factId).toBe(true);
      expect(label(e)).toBe(Math.abs(d - 90) < 0.5 ? 'ישרה' : d < 90 ? 'חדה' : 'קהה');
      // No right-angle square on the shape: it would give the answer away.
      expect(v.rightAngles ?? []).toEqual([]);
    }
    // The L's inward corner (270°) is never asked about.
    expect(CORNERS.some((c) => c.shape === 'lShape' && c.at === 2)).toBe(false);
  });

  it('level 9: the statements are true of the drawn shape as the answer says', () => {
    const sq = PROP_FACTS.filter((f) => f.shape === 'square' && f.truth).map((f) => f.prop);
    expect(sq).toEqual(['sides', 'rights', 'parallel', 'opposite']);
    const rh = PROP_FACTS.filter((f) => f.shape === 'rhombus' && !f.truth).map((f) => f.prop);
    expect(rh).toEqual(['rights', 'oneRight']);
    for (const e of anglesTopic.enumerate(9))
      expect(e.solutionSpoken.startsWith(e.answer === 1 ? 'נכון' : 'לא נכון')).toBe(true);
  });

  it('level 10: a line is a line of symmetry exactly when the mirror image is the shape', () => {
    const key = (p: P) => `${Math.round(p[0])},${Math.round(p[1])}`;
    for (const { shape, line, yes } of SYM_LINES) {
      const [a, b] = line;
      const d: P = [b[0] - a[0], b[1] - a[1]];
      const len2 = d[0] * d[0] + d[1] * d[1];
      const mirror = (p: P): P => {
        const k = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / len2;
        const f: P = [a[0] + k * d[0], a[1] + k * d[1]];
        return [2 * f[0] - p[0], 2 * f[1] - p[1]];
      };
      const pts = SHAPES[shape] as P[];
      const set = new Set(pts.map(key));
      // Rounded drawings (the hexagon) are off by up to one unit.
      const near = (p: P) =>
        [...set].some((s) => {
          const [x, y] = s.split(',').map(Number) as P;
          return Math.abs(x - p[0]) <= 1 && Math.abs(y - p[1]) <= 1;
        });
      expect(pts.map(mirror).every(near), `${shape} ${line.join(' ')}`).toBe(yes);
    }
  });
});

describe('angles-4 (grade 4)', () => {
  it('takes over the old grade 4 levels word for word', () => {
    expect(t('level.angles4.5')).toBe('סכום הזוויות במשולש');
    expect(t('level.angles4.7')).toBe('אלכסונים');
    expect(t('level.angles4.9')).toBe('קווי סימטריה');
    expect(t('level.angles4.10')).toBe('נכון או לא נכון?');
    // The triangles of the old open level, its whole pool, now listed.
    const pairs = thirdFacts();
    expect(pairs.length).toBe(120);
    for (const [a, b] of pairs) expect(180 - a - b).toBeGreaterThanOrEqual(15);
    expect(ids(angles4.enumerate(5))[0]).toMatch(/^third:/);
  });

  it('level 2: the right button shows the angle drawn', () => {
    expect(MEASURE_FACTS.length).toBeGreaterThanOrEqual(14);
    for (const e of angles4.enumerate(2)) {
      const v = e.visual as Extract<Visual, { type: 'angle' }>;
      expect(label(e)).toBe(`${v.deg}°`);
    }
  });

  it('level 3: the answer is what is left of the right or the straight angle', () => {
    for (const e of angles4.enumerate(3)) {
      const v = e.visual as Extract<Visual, { type: 'angleSplit' }>;
      expect(e.answer).toBe(v.total - v.part);
    }
  });

  it('level 4: the answer names both kinds, and each other button is wrong', () => {
    for (const angles of BOTH_FACTS) expect(angles[0] + angles[1] + angles[2]).toBe(180);
    for (const e of angles4.enumerate(4)) {
      const v = e.visual as Extract<Visual, { type: 'polygon' }>;
      const angles = (v.angleLabels ?? []).map((s) => Number.parseInt(s ?? '', 10));
      const { angle, side } = triKinds(angles);
      const angleWord = { acute: 'חד זווית', right: 'ישר זווית', obtuse: 'קהה זווית' }[angle];
      const sideWord = {
        equilateral: 'שווה צלעות',
        isosceles: 'שווה שוקיים',
        scalene: 'שונה צלעות',
      }[side];
      expect(label(e)).toBe(`${angleWord} ו${sideWord}`);
      // The drawing has the angles on its labels.
      angles.forEach((a, i) => expect(Math.abs(vertexAngle(v.points, i) - a)).toBeLessThan(2.5));
      if (e.input.type !== 'choices') throw new Error('choices');
      const wrong = (e.input.labels ?? []).filter((l) => l !== label(e));
      expect(wrong).toHaveLength(2);
      // An equilateral triangle is isosceles too: "...ושווה שוקיים" is never offered as wrong for it.
      if (side === 'equilateral')
        expect(wrong.some((l) => l === `${angleWord} ושווה שוקיים`)).toBe(false);
    }
  });

  it('level 6: each quadrilateral is drawn with its own angles, the hidden one is the answer', () => {
    for (const { angles } of QUAD_FACTS) {
      expect(angles.reduce((s, x) => s + x, 0)).toBe(360);
      const pts = quadFromAngles(angles);
      expect(pts).toHaveLength(4);
      angles.forEach((a, i) =>
        expect(Math.abs(vertexAngle(pts, i) - a), angles.join(',')).toBeLessThan(2.5),
      );
    }
    for (const e of angles4.enumerate(6)) {
      const v = e.visual as Extract<Visual, { type: 'polygon' }>;
      const hidden = (v.angleLabels ?? []).indexOf('?');
      expect(Math.abs(vertexAngle(v.points, hidden) - e.answer)).toBeLessThan(2.5);
      expect(v.rightAngles ?? []).not.toContain(hidden);
    }
  });

  it('level 8: the right statement is always true, the others not always', () => {
    for (const f of PROP4_FACTS) {
      expect(isAlways(f.shape, f.right), `${f.shape} ${f.right}`).toBe(true);
      for (const w of f.wrong) expect(isNotAlways(f.shape, w), `${f.shape} ${w}`).toBe(true);
    }
  });
});
