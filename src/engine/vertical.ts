import { t, type TranslationKey } from '@/i18n';
import { compose, type Slot } from '@/lang/compose';
import type { Line, VerticalLayout, VerticalMark, VerticalRow, VerticalStep } from './types';

/**
 * Column arithmetic as taught in Israeli schools (grades 2–4): the algorithm,
 * step by step, with the notation a child writes in the notebook.
 *
 * - Addition: units first; a sum of 10 or more writes its units digit and
 *   carries the rest, written small above the next column.
 * - Subtraction: when the top digit is smaller, borrow from the next column:
 *   cross it out and write the smaller value above it; the digit here gets ten
 *   more (written above too). Across zeros, each zero on the way becomes 9.
 * - Multiplication by a one-digit number: digit by digit, carrying. By a
 *   two-digit number: a row for the units, a row for the tens (shifted, with a
 *   zero in the units), and their sum.
 *
 * Every written digit is a step with what to say before it (the column's
 * question) and after a slip (the column worked out). Columns count from the
 * right: 0 is the units.
 */

const digitsOf = (n: number): number[] => String(n).split('').reverse().map(Number);
const len = (n: number): number => String(n).length;

const AT = [
  'vert.at.0',
  'vert.at.1',
  'vert.at.2',
  'vert.at.3',
  'vert.at.4',
  'vert.at.5',
  'vert.at.6',
] as const;
const TO = ['vert.to.1', 'vert.to.1', 'vert.to.2', 'vert.to.3', 'vert.to.4', 'vert.to.5', 'vert.to.6'] as const;
const FROM = [
  'vert.from.1',
  'vert.from.1',
  'vert.from.2',
  'vert.from.3',
  'vert.from.4',
  'vert.from.5',
  'vert.from.6',
] as const;

/** "ביחידות", "בעשרות"…: where the column is. */
export const atPlace = (col: number): string => t(AT[Math.min(col, AT.length - 1)] ?? 'vert.at.0');
/** "לעשרות": where a carry from this column goes. */
const toPlace = (col: number): string => t(TO[Math.min(col + 1, TO.length - 1)] ?? 'vert.to.1');
/** "מהעשרות": where a borrow for this column comes from. */
const fromPlace = (col: number): string =>
  t(FROM[Math.min(col, FROM.length - 1)] ?? 'vert.from.1');

/** A sentence from a template: digits on screen, words (and clips) when read. */
export function line(key: TranslationKey, slots: Record<string, number | string>): Line {
  const params: Record<string, string> = {};
  const spokenSlots: Record<string, Slot> = {};
  for (const [k, v] of Object.entries(slots)) {
    params[k] = String(v);
    spokenSlots[k] = v;
  }
  const text = t(key, { params });
  const said = compose(t(key), spokenSlots);
  return { text, spoken: said.text, parts: said.parts };
}

/* ---------- Addition ---------- */

interface AddColumn {
  x: number | null;
  y: number | null;
  carryIn: number;
}

/** One column of an addition (also the sum of partial products). */
function addStep(row: number, col: number, c: AddColumn, group: number): VerticalStep {
  const { x, y, carryIn } = c;
  const s = (x ?? 0) + (y ?? 0) + carryIn;
  const d = s % 10;
  const out = Math.floor(s / 10);
  const place = atPlace(col);
  const marks: VerticalMark[] = out > 0 ? [{ col: col + 1, text: String(out), group }] : [];
  const to = toPlace(col);
  let ask: Line;
  let explain: Line;
  if (x === null && y === null) {
    ask = line('vert.ask.down', { place });
    explain = line('vert.add.down', { d });
  } else if (x === null || y === null) {
    const only = (x ?? y) as number;
    if (carryIn === 0) {
      ask = line('vert.ask.alone', { place, x: only });
      explain = line('vert.add.alone', { x: only, d });
    } else {
      ask = line('vert.ask.aloneCarry', { place, x: only, c: carryIn });
      explain =
        out > 0
          ? line('vert.add.aloneCarryOut', { x: only, c: carryIn, s, d, o: out, to })
          : line('vert.add.aloneCarry', { x: only, c: carryIn, s, d });
    }
  } else {
    ask =
      carryIn > 0
        ? line('vert.ask.addCarry', { place, x, y, c: carryIn })
        : line('vert.ask.add', { place, x, y });
    explain =
      carryIn > 0
        ? out > 0
          ? line('vert.add.both', { x, y, c: carryIn, s, d, o: out, to })
          : line('vert.add.carryIn', { x, y, c: carryIn, s, d })
        : out > 0
          ? line('vert.add.carryOut', { x, y, s, d, o: out, to })
          : line('vert.add.plain', { x, y, s, d });
  }
  const forgot = (s - carryIn) % 10;
  const slips = carryIn > 0 && forgot !== d ? [{ digit: forgot, kind: 'carry' as const }] : [];
  return { row, col, digit: d, marks, ask, explain, slips };
}

/** The steps adding two rows of digits (by column), writing into `row`. */
function addColumns(
  row: number,
  a: (number | null)[],
  b: (number | null)[],
  total: number,
  group: number,
): VerticalStep[] {
  const steps: VerticalStep[] = [];
  let carry = 0;
  for (let col = 0; col < len(total); col++) {
    const step = addStep(row, col, { x: a[col] ?? null, y: b[col] ?? null, carryIn: carry }, group);
    carry = Math.floor(((a[col] ?? 0) + (b[col] ?? 0) + carry) / 10);
    steps.push(step);
  }
  return steps;
}

export function addLayout(a: number, b: number): VerticalLayout {
  const total = a + b;
  const steps = addColumns(0, digitsOf(a), digitsOf(b), total, 0);
  return {
    op: 'add',
    top: a,
    bottom: b,
    width: Math.max(len(a), len(b), len(total)),
    rows: [{ value: total, from: 0 }],
    steps,
    rowIntro: [null],
  };
}

/* ---------- Subtraction ---------- */

export function subLayout(a: number, b: number): VerticalLayout {
  if (b > a) throw new RangeError('subLayout: the bottom number is bigger');
  const total = a - b;
  const top = digitsOf(a);
  const bottom = digitsOf(b);
  const steps: VerticalStep[] = [];
  for (let col = 0; col < len(total); col++) {
    const x = top[col] ?? 0;
    const y = bottom[col] ?? 0;
    const place = atPlace(col);
    const marks: VerticalMark[] = [];
    let explain: Line;
    let value = x;
    const hasBottom = col < bottom.length;
    if (x < y) {
      // Borrow from the first non-zero column to the left; zeros on the way become 9.
      let j = col + 1;
      while ((top[j] ?? 0) === 0) j++;
      top[j] = (top[j] ?? 0) - 1;
      marks.push({ col: j, text: String(top[j]), group: 0, strike: true });
      for (let k = col + 1; k < j; k++) {
        top[k] = 9;
        marks.push({ col: k, text: '9', group: 0, strike: true });
      }
      value = x + 10;
      top[col] = value;
      marks.push({ col, text: String(value), group: 0, strike: true });
      const zeros = j - col - 1;
      explain = line(
        zeros === 0 ? 'vert.sub.borrow' : zeros === 1 ? 'vert.sub.borrowZero' : 'vert.sub.borrowZeros',
        { x, y, from: fromPlace(j), x2: value, d: value - y },
      );
    } else if (hasBottom) {
      explain = line('vert.sub.plain', { x, y, d: x - y });
    } else {
      explain = line('vert.sub.alone', { d: x });
    }
    const ask = hasBottom
      ? line('vert.ask.sub', { place, x, y })
      : line('vert.ask.subAlone', { place, x });
    const d = value - y;
    // The classic slip: subtracting the smaller digit from the bigger one, no borrow.
    const slips = x < y && y - x !== d ? [{ digit: y - x, kind: 'borrow' as const }] : [];
    steps.push({ row: 0, col, digit: d, marks, ask, explain, slips });
  }
  return {
    op: 'sub',
    top: a,
    bottom: b,
    width: Math.max(len(a), len(b)),
    rows: [{ value: total, from: 0 }],
    steps,
    rowIntro: [null],
  };
}

/* ---------- Multiplication ---------- */

/** One row of a multiplication: `a` times the digit `m`, written from column `shift`. */
function mulRow(row: number, a: number, m: number, shift: number): VerticalStep[] {
  const top = digitsOf(a);
  const value = a * m;
  const steps: VerticalStep[] = [];
  let carry = 0;
  const written = len(value);
  for (let i = 0; i < written; i++) {
    const col = i + shift;
    const place = atPlace(col);
    if (i >= top.length) {
      // What is left of the carry is written as it is.
      steps.push({
        row,
        col,
        digit: carry % 10,
        marks: carry >= 10 ? [{ col: col + 1, text: String(Math.floor(carry / 10)), group: row }] : [],
        ask: line('vert.ask.down', { place }),
        explain: line('vert.add.down', { d: carry % 10 }),
        slips: [],
      });
      carry = Math.floor(carry / 10);
      continue;
    }
    const x = top[i] ?? 0;
    const p = x * m;
    const s = p + carry;
    const d = s % 10;
    const out = Math.floor(s / 10);
    const marks: VerticalMark[] = out > 0 ? [{ col: col + 1, text: String(out), group: row }] : [];
    const to = toPlace(col);
    const ask =
      carry > 0
        ? line('vert.ask.mulCarry', { place, x, m, c: carry })
        : line('vert.ask.mul', { place, x, m });
    const explain =
      carry > 0
        ? out > 0
          ? line('vert.mul.both', { x, m, p, c: carry, s, d, o: out, to })
          : line('vert.mul.carryIn', { x, m, p, c: carry, s, d })
        : out > 0
          ? line('vert.mul.carryOut', { x, m, p, d, o: out, to })
          : line('vert.mul.plain', { x, m, p, d });
    const forgot = p % 10;
    const slips = carry > 0 && forgot !== d ? [{ digit: forgot, kind: 'carry' as const }] : [];
    steps.push({ row, col, digit: d, marks, ask, explain, slips });
    carry = out;
  }
  return steps;
}

export function mulLayout(a: number, b: number): VerticalLayout {
  if (b < 1 || b > 99) throw new RangeError('mulLayout: the multiplier has one or two digits');
  const total = a * b;
  if (b < 10) {
    return {
      op: 'mul',
      top: a,
      bottom: b,
      width: Math.max(len(a), len(b), len(total)),
      rows: [{ value: total, from: 0 }],
      steps: mulRow(0, a, b, 0),
      rowIntro: [null],
    };
  }
  const units = b % 10;
  const tens = Math.floor(b / 10);
  const p1 = a * units;
  const p2 = a * tens * 10;
  const rows: VerticalRow[] = [
    { value: p1, from: 0, label: `${a} × ${units}` },
    { value: p2, from: 1, label: `${a} × ${tens * 10}` },
    { value: total, from: 0, sum: true },
  ];
  // The sum adds the two rows (the second one's grey zero included).
  const steps = [
    ...mulRow(0, a, units, 0),
    ...mulRow(1, a, tens, 1),
    ...addColumns(2, digitsOf(p1), digitsOf(p2), total, 2),
  ];
  return {
    op: 'mul',
    top: a,
    bottom: b,
    width: Math.max(len(a), len(b) + 1, len(total)),
    rows,
    steps,
    rowIntro: [
      null,
      line('vert.mul.zero', { m: tens }),
      line('vert.mul.sum', {}),
    ],
  };
}

export function layoutFor(op: 'add' | 'sub' | 'mul', a: number, b: number): VerticalLayout {
  return op === 'add' ? addLayout(a, b) : op === 'sub' ? subLayout(a, b) : mulLayout(a, b);
}

/* ---------- Reading a layout ---------- */

/** The digit written in each cell: row → column → digit (grey zeros not included). */
export function cellDigits(layout: VerticalLayout): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of layout.steps) out.set(`${s.row}:${s.col}`, s.digit);
  return out;
}

/** The marks shown once the first `upto` steps are done. */
export function marksUpTo(layout: VerticalLayout, upto: number): VerticalMark[] {
  const latest = new Map<string, VerticalMark>();
  for (const s of layout.steps.slice(0, upto)) {
    for (const m of s.marks) latest.set(`${m.group}:${m.col}`, m);
  }
  return [...latest.values()];
}

/**
 * The value of the answer row a child typed column by column; null while a
 * cell is empty. `typed` maps "row:col" to a digit.
 */
export function typedAnswer(layout: VerticalLayout, typed: ReadonlyMap<string, number>): number | null {
  const last = layout.rows.length - 1;
  const cells = layout.steps.filter((s) => s.row === last);
  let n = 0;
  for (const s of [...cells].sort((p, q) => q.col - p.col)) {
    const d = typed.get(`${s.row}:${s.col}`);
    if (d === undefined) return null;
    n = n * 10 + d;
  }
  return n;
}

/* ---------- Slips over a whole answer ---------- */

/** Adding column by column but never carrying: 547 + 286 → 723. */
export function withoutCarrying(a: number, b: number): number {
  const x = digitsOf(a);
  const y = digitsOf(b);
  let n = 0;
  for (let i = Math.max(x.length, y.length) - 1; i >= 0; i--) n = n * 10 + (((x[i] ?? 0) + (y[i] ?? 0)) % 10);
  return n;
}

/** Subtracting the smaller digit from the bigger in each column: 523 − 187 → 464. */
export function withoutBorrowing(a: number, b: number): number {
  const x = digitsOf(a);
  const y = digitsOf(b);
  let n = 0;
  for (let i = Math.max(x.length, y.length) - 1; i >= 0; i--) n = n * 10 + Math.abs((x[i] ?? 0) - (y[i] ?? 0));
  return n;
}
