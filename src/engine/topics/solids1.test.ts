// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { seededRng } from '../rng';
import type { Exercise, SolidItem, Visual } from '../types';
import { solids1 } from './solids1';

const all = (level: number): Exercise[] => solids1.enumerate(level);

/** The kinds drawn on the buttons, in order. */
function buttonKinds(e: Exercise): string[] {
  if (e.input.type !== 'choices' || !e.input.visuals) return [];
  return e.input.visuals.map((v: Visual) =>
    v.type === 'solids' ? (v.items[0] as SolidItem).kind : v.type,
  );
}

function rightKind(e: Exercise): string {
  return buttonKinds(e)[e.answer] as string;
}

describe('solids-1', () => {
  it('has no fact twice in a level', () => {
    for (let level = 1; level <= 10; level++) {
      const ids = all(level)
        .filter((_, i) => i % 2 === 0)
        .map((e) => e.factId);
      expect(new Set(ids).size, `level ${level}`).toBe(ids.length);
      expect(ids.length, `level ${level}`).toBeGreaterThanOrEqual(12);
    }
  });

  it('names the solid on the right button (where is the …?)', () => {
    for (const level of [1, 2]) {
      for (const e of all(level)) {
        const target = e.factId.split(':')[1] as string;
        expect(rightKind(e), e.factId).toBe(target);
        // One picture per kind, and never a cube offered for "where is the box?".
        expect(new Set(buttonKinds(e)).size, e.factId).toBe(3);
        if (target === 'box') expect(buttonKinds(e).includes('cube'), e.factId).toBe(false);
      }
    }
  });

  it('a solid or a flat shape: the right button is what was asked', () => {
    const flat = ['circle', 'square', 'triangle', 'rectangle'];
    for (const e of all(3)) {
      const [, solid, ask] = e.factId.split(':');
      const kinds = buttonKinds(e);
      const right = rightKind(e);
      if (ask === 'solid') {
        expect(right, e.factId).toBe(solid);
        expect(
          kinds.filter((k) => !flat.includes(k)),
          e.factId,
        ).toHaveLength(1);
      } else {
        expect(flat.includes(right), e.factId).toBe(true);
        expect(
          kinds.filter((k) => flat.includes(k)),
          e.factId,
        ).toHaveLength(1);
      }
    }
  });

  it('only the ball and the cylinder roll', () => {
    for (const e of all(4)) {
      const rolls = (k: string) => k === 'sphere' || k === 'cylinder';
      const kinds = buttonKinds(e);
      const ask = e.factId.split(':')[1];
      const matching = kinds.filter((k) => (ask === 'roll' ? rolls(k) : !rolls(k)));
      expect(matching, e.factId).toHaveLength(1);
      expect(matching[0], e.factId).toBe(rightKind(e));
    }
  });

  it('counts faces and vertices right, and says the count of the drawn solid', () => {
    const faces: Record<string, number> = { cube: 6, box: 6, pyramid: 5, pyramid3: 4 };
    const vertices: Record<string, number> = {
      cube: 8,
      box: 8,
      pyramid: 5,
      pyramid3: 4,
      cone: 1,
      cylinder: 0,
      sphere: 0,
    };
    for (const [level, table] of [
      [5, faces],
      [8, vertices],
    ] as const) {
      for (const e of all(level)) {
        const kind = ((e.visual as Extract<Visual, { type: 'solids' }>).items[0] as SolidItem).kind;
        expect(e.answer, e.factId).toBe(table[kind]);
        // The worked example is another solid with another count.
        const ex = e.hints[2].visual as Extract<Visual, { type: 'solids' }>;
        expect(table[(ex.items[0] as SolidItem).kind], e.factId).not.toBe(e.answer);
      }
    }
  });

  it('the face asked about has the right shape, never a square beside a rectangle', () => {
    const shapeOf = (s: SolidItem): string =>
      s.kind === 'cube'
        ? 'square'
        : s.kind === 'box'
          ? 'rectangle'
          : s.kind === 'pyramid' || s.kind === 'pyramid3'
            ? s.mark === 'base'
              ? 'square'
              : 'triangle'
            : 'circle';
    for (const e of all(6)) {
      const item = (e.visual as Extract<Visual, { type: 'solids' }>).items[0] as SolidItem;
      expect(item.mark, e.factId).toBeTruthy();
      expect(item.color, e.factId).not.toBe('yellow');
      expect(rightKind(e), e.factId).toBe(shapeOf(item));
      const kinds = buttonKinds(e);
      expect(kinds.includes('square') && kinds.includes('rectangle'), e.factId).toBe(false);
    }
  });

  it('things from home: the solid it looks like is on the right button', () => {
    const looks: Record<string, string> = {
      '🍊': 'sphere',
      '🍈': 'sphere',
      '🥫': 'cylinder',
      '🕯️': 'cylinder',
      '🥁': 'cylinder',
      '🧻': 'cylinder',
      '📦': 'box',
      '🧃': 'box',
      '🍦': 'cone',
      '🥕': 'cone',
    };
    for (const e of all(7)) {
      const v = e.visual as Extract<Visual, { type: 'thing' }>;
      expect(rightKind(e), e.factId).toBe(looks[v.emoji]);
      const kinds = buttonKinds(e);
      expect(kinds.includes('cube') && kinds.includes('box'), e.factId).toBe(false);
      // The example is another thing, of another solid.
      const ex = e.hints[2].visual as Extract<Visual, { type: 'thing' }>;
      expect(looks[ex.emoji], e.factId).not.toBe(looks[v.emoji]);
    }
  });

  it('counts the cubes of a building', () => {
    for (const e of all(9)) {
      const v = e.visual as Extract<Visual, { type: 'cubeStack' }>;
      expect(e.answer, e.factId).toBe(v.columns.reduce((s, x) => s + x, 0));
      const ex = e.hints[2].visual as Extract<Visual, { type: 'cubeStack' }>;
      expect(
        ex.columns.reduce((s, x) => s + x, 0),
        e.factId,
      ).not.toBe(e.answer);
    }
  });

  it('stacks the cube, the box and the cylinder, and nothing else', () => {
    const stacks = (k: string) => k === 'cube' || k === 'box' || k === 'cylinder';
    for (const e of all(10)) {
      const ask = e.factId.split(':')[1];
      const matching = buttonKinds(e).filter((k) => (ask === 'stack' ? stacks(k) : !stacks(k)));
      expect(matching, e.factId).toHaveLength(1);
      expect(matching[0], e.factId).toBe(rightKind(e));
    }
  });

  it('keeps the right picture right whatever the order of the buttons', () => {
    const rng = seededRng(11);
    for (let i = 0; i < 200; i++) {
      const e = solids1.generate(1, rng, i % 2 ? 'f' : 'm');
      expect(rightKind(e), e.factId).toBe(e.factId.split(':')[1]);
    }
  });
});
