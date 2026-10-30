// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { topicsForGrade } from '../registry';
import { seededRng } from '../rng';
import type { Exercise, SceneItem, Visual } from '../types';
import { count20 } from './count20';
import { measure0 } from './measure0';
import { THINGS, type ThingId } from './ganKit';
import { sort0 } from './sort0';
import { space0 } from './space0';

/** The gan worlds "מרחב ומיקום" and "מיון והשוואה": their own logic, beyond all.test.ts. */

type Topic = typeof space0;
const all = (t: Topic, level: number): Exercise[] =>
  t.enumerate(level).filter((_, i) => i % 2 === 0);

/** Exercises with their buttons in orders of chance, as a child gets them. */
const played = (t: Topic, level: number): Exercise[] => {
  const rng = seededRng(level * 17 + 3);
  return Array.from({ length: 80 }, (_, i) => t.generate(level, rng, i % 2 ? 'm' : 'f'));
};

const scene = (v: Visual | undefined): Extract<Visual, { type: 'scene' }> => {
  if (v?.type !== 'scene') throw new Error('not a scene');
  return v;
};
const labels = (e: Exercise): string[] =>
  e.input.type === 'choices' ? (e.input.labels ?? e.input.choices.map(String)) : [];
const answerLabel = (e: Exercise): string => labels(e)[e.answer] as string;
/** The emoji on a picture button. */
const emojiOn = (e: Exercise, i: number): string | undefined =>
  e.input.type === 'choices' ? scene(e.input.visuals?.[i]).items[0]?.emoji : undefined;
const emojiItems = (e: Exercise): SceneItem[] => scene(e.visual).items.filter((it) => it.emoji);

/** The words of a sentence without a leading ה, ו or ל ("הכלב" → "כלב"). */
const words = (s: string): Set<string> =>
  new Set(
    s
      .split(/[^א-ת]+/)
      .filter(Boolean)
      .flatMap((w) => [w, w.replace(/^[הול]/, '')]),
  );

describe.each([
  ['space-0', space0],
  ['sort-0', sort0],
] as const)('%s', (_id, topic) => {
  it('is a gan world of ten closed levels, each with enough facts and none twice', () => {
    expect(topic.grades).toEqual([0]);
    expect(topic.levels).toHaveLength(10);
    for (let level = 1; level <= 10; level++) {
      const ids = all(topic, level).map((e) => e.factId);
      expect(new Set(ids).size, `level ${level}`).toBe(ids.length);
      expect(ids.length, `level ${level}`).toBeGreaterThanOrEqual(12);
      expect(ids.length, `level ${level}`).toBeLessThanOrEqual(40);
    }
  });

  it('answers with pictures (or a small number): a picture and a distinct name on every button', () => {
    for (let level = 1; level <= 10; level++)
      for (const e of all(topic, level)) {
        if (e.input.type !== 'choices') throw new Error(`${e.factId}: not choices`);
        if (e.input.visuals) {
          expect(e.input.visuals.length, e.factId).toBe(e.input.choices.length);
          expect(new Set(labels(e)).size, e.factId).toBe(labels(e).length);
        } else {
          for (const c of e.input.choices) expect(c >= 1 && c <= 8, e.factId).toBe(true);
        }
        expect(e.input.choices.length >= 3 && e.input.choices.length <= 4, e.factId).toBe(true);
      }
  });

  it('the worked example never names a wrong button', () => {
    for (let level = 1; level <= 10; level++) {
      // Where does the path lead: the places are the same in every maze.
      // From small to big: its buttons are sizes ("גדול"), said in every row ("מהקטן לגדול").
      if ((topic === space0 && level === 9) || (topic === sort0 && level === 5)) continue;
      for (const e of played(topic, level)) {
        const said = words(e.hints[2].spoken);
        labels(e).forEach((l, i) => {
          if (i === e.answer || l.includes(' ') || /\d/.test(l)) return;
          expect(said.has(l), `${e.factId}: example names ${l}`).toBe(false);
        });
      }
    }
  });
});

describe('space-0', () => {
  it('up and down: the answer is the highest (or lowest) thing on the shelves', () => {
    for (const e of played(space0, 1)) {
      const items = emojiItems(e);
      const ys = items.map((it) => it.y);
      const want = e.factId.endsWith(':up') ? Math.min(...ys) : Math.max(...ys);
      expect(emojiOn(e, e.answer), e.factId).toBe(items.find((it) => it.y === want)?.emoji);
    }
  });

  it('right and left are the screen’s: the answer is the rightmost (or leftmost) thing', () => {
    for (const e of played(space0, 7)) {
      const items = emojiItems(e);
      const xs = items.map((it) => it.x);
      const want = e.factId.endsWith(':right') ? Math.max(...xs) : Math.min(...xs);
      expect(emojiOn(e, e.answer), e.factId).toBe(items.find((it) => it.x === want)?.emoji);
      // The first hint says it in the child's own terms: her hands, facing the screen.
      expect(e.hints[0].spoken, e.factId).toMatch(/המסך/);
    }
  });

  it('a queue goes right: the first is the one nearest the ice cream or the carousel', () => {
    for (const e of played(space0, 4).filter((x) => x.factId.endsWith(':first'))) {
      const animals = emojiItems(e).slice(1);
      const first = animals.reduce((a, b) => (b.x > a.x ? b : a));
      expect(emojiOn(e, e.answer), e.factId).toBe(first.emoji);
    }
  });

  it('the train: cars counted from the engine on the right', () => {
    for (const e of played(space0, 8)) {
      const v = scene(e.visual);
      const cars = [...v.items].sort((a, b) => b.x - a.x).map((it) => it.emoji);
      const [, kind, car] = /:(who)(\d)$/.exec(e.factId) ?? [];
      if (kind === 'who') {
        expect(emojiOn(e, e.answer), e.factId).toBe(cars[Number(car) - 1]);
      } else {
        // "Which car is the dog in?": its place from the engine.
        const who = THINGS[e.factId.split(':which:')[1] as ThingId];
        expect(e.answer, e.factId).toBe(cars.indexOf(who.emoji) + 1);
      }
    }
  });

  it('what moved: exactly one thing is somewhere else in the second picture, and it is the answer', () => {
    for (const e of played(space0, 10)) {
      const v = scene(e.visual);
      const after = v.then ?? [];
      const movedOnes = v.items.filter((it, i) => it.x !== after[i]?.x || it.y !== after[i]?.y);
      expect(movedOnes.length, e.factId).toBe(1);
      expect(emojiOn(e, e.answer), e.factId).toBe(movedOnes[0]?.emoji);
    }
  });
});

describe('sort-0', () => {
  it('more, fewer or the same: the answer follows the two rows', () => {
    for (const e of played(sort0, 8)) {
      const items = emojiItems(e);
      const top = items.filter((it) => it.y < 25);
      const bottom = items.filter((it) => it.y > 25);
      const label = answerLabel(e);
      if (top.length === bottom.length) expect(label, e.factId).toBe('אותו מספר');
      else {
        const more = e.factId.endsWith(':more');
        const topWins = top.length > bottom.length === more;
        expect(emojiOn(e, e.answer), e.factId).toBe(topWins ? top[0]?.emoji : bottom[0]?.emoji);
      }
    }
  });

  it('how many once sorted: the answer is the number of things the hint rings', () => {
    for (const e of played(sort0, 9)) {
      const ringed = scene(e.hints[1].visual).items.filter((it) => it.ring);
      expect(ringed.length, e.factId).toBe(e.answer);
      expect(scene(e.visual).items.length, e.factId).toBe(8);
    }
  });

  it('from small to big: the missing size fits between its neighbours in the row', () => {
    for (const e of played(sort0, 5)) {
      const items = scene(e.visual).items;
      const gap = items.findIndex((it) => it.blank);
      const sizes = items.map((it) => it.size ?? 0);
      const right =
        e.input.type === 'choices' ? (scene(e.input.visuals?.[e.answer]).items[0]?.size ?? 0) : 0;
      const before = sizes[gap - 1] ?? 0;
      const after = sizes[gap + 1] ?? 0;
      expect(right > Math.min(before, after) && right < Math.max(before, after), e.factId).toBe(
        true,
      );
    }
  });

  it('two properties: one button has both, and every other lacks at least one', () => {
    for (const e of all(sort0, 10)) {
      expect(labels(e), e.factId).toHaveLength(4);
      const ask = e.spokenText;
      const right = answerLabel(e).split(' ');
      for (const word of right) expect(ask, e.factId).toMatch(new RegExp(word));
      labels(e).forEach((l, i) => {
        if (i !== e.answer)
          expect(
            l.split(' ').every((w) => ask.includes(w)),
            e.factId,
          ).toBe(false);
      });
    }
  });
});

describe('count-20', () => {
  it('dice: the answer is the pips shown, one die or two', () => {
    for (const level of [1, 2])
      for (const e of all(count20, level)) {
        if (e.visual?.type !== 'dice') throw new Error(`${e.factId}: no dice`);
        expect(
          e.visual.dice.reduce((a, b) => a + b, 0),
          e.factId,
        ).toBe(e.answer);
        for (const d of e.visual.dice) expect(d >= 1 && d <= 6, e.factId).toBe(true);
      }
  });

  it('ten and more: a group of ten and the rest, adding up to the answer', () => {
    for (const level of [3, 4])
      for (const e of all(count20, level)) {
        if (e.visual?.type !== 'objects') throw new Error(`${e.factId}: no objects`);
        expect(e.visual.groups[0], e.factId).toBe(10);
        expect(
          e.visual.groups.reduce((a, b) => a + b, 0),
          e.factId,
        ).toBe(e.answer);
      }
  });

  it('the missing number fits the gap in a row that counts up by one', () => {
    for (const e of all(count20, 6)) {
      if (e.visual?.type !== 'sequence') throw new Error(`${e.factId}: no row`);
      const items = e.visual.items;
      const gap = items.indexOf(null);
      expect(gap === 1 || gap === 2, e.factId).toBe(true);
      const filled = items.map((x) => x ?? e.answer);
      filled.forEach((x, i) => i > 0 && expect(x - (filled[i - 1] as number), e.factId).toBe(1));
    }
  });

  it('hops stay on the line from 0 to 20, one to three at a time', () => {
    for (const level of [9, 10])
      for (const e of all(count20, level)) {
        expect(e.answer >= 0 && e.answer <= 20, e.factId).toBe(true);
        const [s, k] = (e.factId.split(':')[1] ?? '').split(',').map(Number);
        expect(k !== undefined && k >= 1 && k <= 3, e.factId).toBe(true);
        expect(e.answer, e.factId).toBe(level === 9 ? (s ?? 0) + (k ?? 0) : (s ?? 0) - (k ?? 0));
      }
  });

  it('every number is up to twenty, and every level has enough facts for a round', () => {
    for (let level = 1; level <= 10; level++) {
      const facts = all(count20, level);
      expect(facts.length, `level ${level}`).toBeGreaterThanOrEqual(10);
      for (const e of facts)
        if (e.input.type === 'choices' && !e.input.labels)
          for (const c of e.input.choices) expect(c >= 0 && c <= 20, e.factId).toBe(true);
    }
  });
});

describe('measure-0', () => {
  it('on a balance, the heavy thing is on the side that went down', () => {
    for (const level of [3, 4])
      for (const e of played(measure0, level)) {
        const v = e.visual;
        if (v?.type !== 'balance') throw new Error(`${e.factId}: no balance`);
        const down = v.down === 'left' ? v.left.emoji : v.right.emoji;
        const up = v.down === 'left' ? v.right.emoji : v.left.emoji;
        expect(emojiOn(e, e.answer), e.factId).toBe(level === 3 ? down : up);
      }
  });

  it('glasses: the answer has more (or less) water than every other button', () => {
    const fillOf = (e: Exercise, i: number): number => {
      const v = e.input.type === 'choices' ? e.input.visuals?.[i] : undefined;
      if (v?.type !== 'cups') throw new Error(`${e.factId}: not a glass`);
      return v.levels[0] ?? -1;
    };
    for (const level of [5, 6])
      for (const e of played(measure0, level)) {
        const right = fillOf(e, e.answer);
        labels(e).forEach((_, i) => {
          if (i === e.answer) return;
          expect(level === 5 ? right > fillOf(e, i) : right < fillOf(e, i), e.factId).toBe(true);
        });
      }
    for (const e of played(measure0, 7)) {
      const want = e.factId.includes(':full') ? 1 : e.factId.includes(':empty') ? 0 : 0.5;
      expect(fillOf(e, e.answer), e.factId).toBe(want);
    }
  });

  it('steps and towers: the answer is the steps drawn, the cubes stacked', () => {
    for (const e of all(measure0, 9)) {
      const steps = scene(e.visual).items.filter((it) => it.emoji === '👣');
      expect(steps.length, e.factId).toBe(e.answer);
    }
    for (const e of all(measure0, 10)) {
      if (e.visual?.type !== 'cubeStack') throw new Error(`${e.factId}: no tower`);
      expect(e.visual.columns, e.factId).toEqual([e.answer]);
    }
  });
});

describe('the gan journey', () => {
  it('counting and shapes first, then sorting and space, adding and taking away; then to twenty', () => {
    expect(topicsForGrade(0).map((t) => t.id)).toEqual([
      'count-10',
      'shapes',
      'sort-0',
      'space-0',
      'add-sub-20',
      'count-20',
      'measure-0',
    ]);
  });
});
