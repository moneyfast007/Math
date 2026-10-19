// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { seededRng } from './rng';
import {
  completedExercise,
  MAX_TRIES,
  reduce,
  ROUND_LENGTH,
  startSession,
  type SessionState,
} from './session';
import { addSub20 } from './topics/addSub20';

const rng = seededRng(7);
const gen = (level: number) => addSub20.generate(level, rng, 'f');

function start(level = 6, band: 'young' | 'middle' | 'older' = 'middle'): SessionState {
  return startSession({
    topicId: 'add-sub-20',
    level,
    minLevel: 1,
    maxLevel: 10,
    band,
    exercise: gen(level),
  });
}

const right = (s: SessionState) => reduce(s, { type: 'answer', value: s.exercise.answer });
const wrong = (s: SessionState) => reduce(s, { type: 'answer', value: s.exercise.answer + 7 });
const next = (s: SessionState) => reduce(s, { type: 'next', exercise: gen(s.level) });

describe('practice session', () => {
  it('uses the round length of the age band', () => {
    expect(start(1, 'young').length).toBe(ROUND_LENGTH.young);
    expect(start(9, 'older').length).toBe(ROUND_LENGTH.older);
  });

  it('accepts an answer equal give or take floating-point noise', () => {
    const s0 = start();
    const noisy = { ...s0, exercise: { ...s0.exercise, answer: 26.1 } };
    expect(reduce(noisy, { type: 'answer', value: 26.099999999999998 }).phase).toBe('correct');
  });

    it('counts a first-try answer and moves on', () => {
    const s1 = right(start());
    expect(s1.phase).toBe('correct');
    expect(s1.firstTryCount).toBe(1);
    expect(s1.history).toEqual(['first']);
    const s2 = next(s1);
    expect(s2.phase).toBe('answering');
    expect(s2.done).toBe(1);
    expect(s2.tries).toBe(0);
  });

  it('gives three tries, records the first mistake, then reveals', () => {
    let s = start();
    const e = s.exercise;
    s = reduce(s, { type: 'answer', value: e.answer + 1 });
    expect(s.phase).toBe('wrong');
    expect(s.lastMistake).toBe('offByOne');
    expect(s.firstMistake).toBe('offByOne');
    for (let i = 1; i < MAX_TRIES; i++) s = wrong(s);
    expect(s.phase).toBe('revealed');
    expect(s.history).toEqual(['revealed']);
    expect(s.firstMistake).toBe('offByOne');
  });

  it('a correct answer after a wrong one completes but does not count as first try', () => {
    const s = right(wrong(start()));
    expect(s.phase).toBe('correct');
    expect(s.firstTryCount).toBe(0);
    expect(s.history).toEqual(['later']);
  });

  it('opens at most three hints, only while answering', () => {
    let s = start();
    for (let i = 0; i < 5; i++) s = reduce(s, { type: 'hint' });
    expect(s.hintsShown).toBe(3);
    const done = right(s);
    expect(reduce(done, { type: 'hint' }).hintsShown).toBe(3);
  });

  it('never interrupts a child who is doing well: moving up is decided at the end of the round', () => {
    let s = start(6);
    for (let i = 0; i < 8; i++) {
      s = right(s);
      expect(s.suggestion).toBeNull();
      s = next(s);
    }
    expect(s.firstTryCount).toBe(8);
  });

  it('suggests an easier level when the child keeps needing the answer', () => {
    let s = start(6);
    for (let i = 0; i < 2; i++) {
      for (let k = 0; k < MAX_TRIES; k++) s = wrong(s);
      if (i === 0) s = next(s);
    }
    expect(s.suggestion).toBe('down');
  });

  it('never suggests below the lowest level', () => {
    let s = start(1);
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < MAX_TRIES; k++) s = wrong(s);
      s = next(s);
    }
    expect(s.suggestion).toBeNull();
  });

  it('changing level advances with a fresh exercise and resets the counters', () => {
    let s = start(6);
    for (let i = 0; i < 3; i++) {
      s = right(s);
      if (i < 2) s = next(s);
    }
    const changed = reduce(s, { type: 'changeLevel', level: 5, exercise: gen(5) });
    expect(changed.level).toBe(5);
    expect(changed.exercise.level).toBe(5);
    expect(changed.history).toEqual([]);
    expect(changed.suggestion).toBeNull();
    expect(changed.done).toBe(s.done + 1);
  });

  it('finishes after the last exercise of the round', () => {
    let s = start(1, 'young');
    for (let i = 0; i < ROUND_LENGTH.young; i++) s = next(right(s));
    expect(s.phase).toBe('finished');
    expect(s.done).toBe(ROUND_LENGTH.young);
    expect(s.firstTryCount).toBe(ROUND_LENGTH.young);
  });

  it('reports completed transitions', () => {
    const s0 = start();
    expect(completedExercise(s0, right(s0))).toBe(true);
    expect(completedExercise(s0, wrong(s0))).toBe(false);
  });
});
