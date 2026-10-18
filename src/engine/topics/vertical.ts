import { defineTopic, open } from '../build';
import { pick, randInt } from '../rng';
import type { Exercise, Rng } from '../types';
import {
  borrows,
  carries,
  columnExercise,
  estimate,
  findMistake,
  missingDigit,
  pair,
  storyBank,
  storyColumn,
} from './columns';

/**
 * Column arithmetic, one world per grade (see columns.ts for the exercises).
 * Each world comes last in its grade, so a child already midway is not moved.
 */

type Make = (rng: Rng) => [number, number];

const r = randInt;

/* ---------- Grade 2: up to 100 ---------- */

const G2 = 'vertical-2';
const L2 = (n: number) => `level.vertical2.${n}`;

const add100: Make = (rng) => [r(rng, 10, 89), r(rng, 10, 89)];
const sub100: Make = (rng) => {
  const a = r(rng, 30, 99);
  return [a, r(rng, 10, a - 10)];
};
const addNoCarry2 = (rng: Rng) => pair(rng, add100, (a, b) => a + b <= 99 && carries(a, b).length === 0);
const addCarry2 = (rng: Rng) => pair(rng, add100, (a, b) => a + b <= 99 && carries(a, b).length === 1);
const subNoBorrow2 = (rng: Rng) => pair(rng, sub100, (a, b) => borrows(a, b).length === 0 && a - b >= 10);
const subBorrow2 = (rng: Rng) => pair(rng, sub100, (a, b) => borrows(a, b).length === 1 && a - b >= 10);

const col2 = (level: number, op: '+' | '-', make: (rng: Rng) => [number, number], guided: boolean) =>
  open(L2(level), (rng) => {
    const [a, b] = make(rng);
    const [ea, eb] = make(rng);
    return columnExercise({ topicId: G2, level, op, a, b, guided, example: { a: ea, b: eb } });
  });

const mixed2 = (rng: Rng): [ '+' | '-', number, number ] =>
  rng() < 0.5 ? ['+', ...addCarry2(rng)] : ['-', ...subBorrow2(rng)];

export const vertical2 = defineTopic({
  id: G2,
  labelKey: 'topic.vertical2',
  grades: [2],
  startLevel: () => 1,
  levels: [
    col2(1, '+', addNoCarry2, true),
    col2(2, '+', addCarry2, true),
    col2(3, '+', addCarry2, false),
    col2(4, '-', subNoBorrow2, true),
    col2(5, '-', subBorrow2, true),
    col2(6, '-', subBorrow2, false),
    open(L2(7), (rng) => {
      const [op, a, b] = mixed2(rng);
      const [, ea, eb] = op === '+' ? ['+', ...addCarry2(rng)] : ['-', ...subBorrow2(rng)];
      return columnExercise({ topicId: G2, level: 7, op, a, b, guided: false, example: { a: ea, b: eb } });
    }),
    open(L2(8), (rng) => {
      const [op, a, b] = mixed2(rng);
      return missingDigit(G2, 8, op, a, b, rng);
    }),
    open(L2(9), (rng) => {
      const [op, a, b] = mixed2(rng);
      return findMistake(G2, 9, op, a, b, rng);
    }),
    open(L2(10), (rng) => {
      const [op, a, b] = mixed2(rng);
      return storyColumn(G2, 10, op, a, b, rng);
    }),
  ],
  extraBank: storyBank,
});

/* ---------- Grade 3: up to 10,000 ---------- */

const G3 = 'vertical-3';
const L3 = (n: number) => `level.vertical3.${n}`;

const add3: Make = (rng) => [r(rng, 100, 899), r(rng, 100, 899)];
const add4: Make = (rng) => [r(rng, 1000, 8999), r(rng, 100, 8999)];
const sub3: Make = (rng) => {
  const a = r(rng, 200, 999);
  return [a, r(rng, 100, a - 50)];
};
const sub4: Make = (rng) => {
  const a = r(rng, 2000, 9999);
  return [a, r(rng, 100, a - 100)];
};
/** Zeros in the number on top: 4,003, 600, 5,020. */
const withZeros: Make = (rng) => {
  const shapes = [
    () => r(rng, 2, 9) * 1000 + r(rng, 1, 9),
    () => r(rng, 2, 9) * 100,
    () => r(rng, 2, 9) * 1000 + r(rng, 1, 9) * 10,
    () => r(rng, 2, 9) * 1000,
    () => r(rng, 2, 9) * 1000 + r(rng, 1, 9) * 100 + r(rng, 1, 9),
  ];
  const a = pick(rng, shapes)();
  return [a, r(rng, 100, a - 1)];
};

const addOneCarry3 = (rng: Rng) => pair(rng, add3, (a, b) => a + b <= 999 && carries(a, b).length === 1);
const addCarries4 = (rng: Rng) => pair(rng, add4, (a, b) => a + b <= 9999 && carries(a, b).length >= 2);
const borrowUnits = (rng: Rng) => pair(rng, sub3, (a, b) => borrows(a, b).join() === '0');
const borrowTens = (rng: Rng) =>
  pair(rng, rng() < 0.5 ? sub3 : sub4, (a, b) => borrows(a, b).join() === '1');
const twoBorrows3 = (rng: Rng) => pair(rng, sub3, (a, b) => borrows(a, b).join() === '0,1' && a - b >= 100);
const twoBorrows4 = (rng: Rng) => pair(rng, sub4, (a, b) => borrows(a, b).length >= 2);
const zeros4 = (rng: Rng) => pair(rng, withZeros, (a, b) => borrows(a, b).length >= 2);

const col3 = (level: number, op: '+' | '-', make: (rng: Rng) => [number, number], guided: boolean) =>
  open(L3(level), (rng) => {
    const [a, b] = make(rng);
    const [ea, eb] = make(rng);
    return columnExercise({ topicId: G3, level, op, a, b, guided, example: { a: ea, b: eb } });
  });

const mixed3 = (rng: Rng): ['+' | '-', number, number] =>
  rng() < 0.5 ? ['+', ...addCarries4(rng)] : ['-', ...twoBorrows4(rng)];

export const vertical3 = defineTopic({
  id: G3,
  labelKey: 'topic.vertical3',
  grades: [3],
  startLevel: () => 1,
  levels: [
    col3(1, '+', addOneCarry3, true),
    col3(2, '+', addCarries4, false),
    col3(3, '-', borrowUnits, true),
    col3(4, '-', borrowTens, false),
    col3(5, '-', twoBorrows3, true),
    col3(6, '-', twoBorrows4, false),
    col3(7, '-', zeros4, false),
    open(L3(8), (rng) => {
      const [op, a, b] = mixed3(rng);
      return missingDigit(G3, 8, op, a, b, rng);
    }),
    open(L3(9), (rng) => {
      const [op, a, b] = mixed3(rng);
      return findMistake(G3, 9, op, a, b, rng);
    }),
    open(L3(10), (rng) => {
      const [op, a, b] = mixed3(rng);
      return storyColumn(G3, 10, op, a, b, rng);
    }),
  ],
  extraBank: storyBank,
});

/* ---------- Grade 4: up to a million, and multiplication ---------- */

const G4 = 'vertical-4';
const L4 = (n: number) => `level.vertical4.${n}`;

const addBig: Make = (rng) => [r(rng, 10_000, 899_999), r(rng, 1000, 899_999)];
const subBig: Make = (rng) => {
  const a = rng() < 0.3 ? r(rng, 1, 9) * 100_000 + r(rng, 0, 9) * 1000 : r(rng, 20_000, 999_999);
  return [a, r(rng, 1000, a - 1000)];
};
const addMillion = (rng: Rng) => pair(rng, addBig, (a, b) => a + b < 1_000_000 && carries(a, b).length >= 2);
const subMillion = (rng: Rng) => pair(rng, subBig, (a, b) => borrows(a, b).length >= 2);
/** No zero in the multiplier's units, so neither row is all zeros. */
const mul21: Make = (rng) => [r(rng, 13, 98), r(rng, 3, 9)];
const mul41: Make = (rng) => [r(rng, 112, 4989), r(rng, 3, 9)];
const mul22: Make = (rng) => [r(rng, 13, 98), r(rng, 12, 98)];
const mul32: Make = (rng) => [r(rng, 112, 989), r(rng, 12, 89)];
const twoDigits = (rng: Rng, make: Make) => pair(rng, make, (_a, b) => b % 10 !== 0);

const colMul = (level: number, make: Make, guided: boolean) =>
  open(L4(level), (rng) => {
    const [a, b] = twoDigits(rng, make);
    const [ea, eb] = twoDigits(rng, make);
    return columnExercise({ topicId: G4, level, op: '×', a, b, guided, example: { a: ea, b: eb } });
  });

const colBig = (level: number, op: '+' | '-', make: (rng: Rng) => [number, number]) =>
  open(L4(level), (rng) => {
    const [a, b] = make(rng);
    const [ea, eb] = make(rng);
    return columnExercise({ topicId: G4, level, op, a, b, guided: false, example: { a: ea, b: eb } });
  });

function any4(rng: Rng): ['+' | '-' | '×', number, number] {
  const k = randInt(rng, 0, 2);
  if (k === 0) return ['+', ...addMillion(rng)];
  if (k === 1) return ['-', ...subMillion(rng)];
  return ['×', ...twoDigits(rng, mul41)];
}

export const vertical4 = defineTopic({
  id: G4,
  labelKey: 'topic.vertical4',
  grades: [4],
  startLevel: () => 1,
  levels: [
    colBig(1, '+', addMillion),
    colBig(2, '-', subMillion),
    colMul(3, mul21, true),
    colMul(4, mul41, false),
    colMul(5, mul22, true),
    colMul(6, mul22, false),
    colMul(7, mul32, false),
    open(L4(8), (rng): Exercise => estimate(G4, 8, rng)),
    open(L4(9), (rng) => {
      const [op, a, b] = any4(rng);
      return findMistake(G4, 9, op, a, b, rng);
    }),
    open(L4(10), (rng) => {
      const [op, a, b] =
        rng() < 0.5 ? (['×', ...twoDigits(rng, mul22)] as ['×', number, number]) : any4(rng);
      return storyColumn(G4, 10, op, a, b, rng);
    }),
  ],
  extraBank: storyBank,
});
