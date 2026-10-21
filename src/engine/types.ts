import type { Gender } from '@/lang/gender';
import type { MistakeKind } from '@/state/schema';

/**
 * The exercise model. Every topic produces exercises of this one shape, so the
 * practice screen, hints, audio and progress tracking never special-case a topic.
 *
 * Rules every generator must keep (enforced by property tests):
 * - `answer` is a non-negative integer and is the only correct value.
 * - `display` contains exactly one "?" (the slot the child fills), unless the
 *   exercise is purely visual (counting), where it is empty.
 * - `spokenText` and every hint's `spoken` contain no digits: numbers are words.
 * - No hint reveals the answer; the worked example uses different numbers.
 */

/** An item from the noun dictionary, drawn as an emoji. */
export interface ObjectKind {
  id: string;
  emoji: string;
}

export type Visual =
  /** A fraction: `shaded` of `parts` cells of a bar (or a circle). */
  /**
   * A whole in `parts`, `shaded` of them coloured. `added`: more parts after them in
   * a second colour (adding fractions); `crossed`: the last shaded ones crossed out
   * (taking away).
   */
  | {
      type: 'fraction';
      parts: number;
      shaded: number;
      shape?: 'bar' | 'circle';
      added?: number;
      crossed?: number;
      /** Bars only: this many wholes side by side, each in `parts` (3 = ?/4: three bars of quarters). */
      wholes?: number;
      /** Bars only: a second fraction drawn under the first, the same length (comparing). */
      below?: { parts: number; shaded: number };
    }
  /** Dots in rows × cols, for multiplication; `squares` draws cells (area). */
  /** Rows of `cols`; `extra`: single cells in a row of their own below (the units of 47). */
  | { type: 'array'; rows: number; cols: number; squares?: boolean; extra?: number }
  /** A rectangle with labelled sides, for perimeter and area. */
  /** `hide`: that side is the question, drawn as "?". */
  | { type: 'rect'; width: number; height: number; unit?: string; hide?: 'height' }
  /** A number broken into thousands, hundreds, tens and units. */
  | { type: 'placeValue'; n: number }
  /**
   * Objects to count, in one or two groups. `removed` objects (from the end of
   * the first group) are drawn crossed out. `arranged` lays them out in rows of
   * five, like a ten-frame, which makes counting easier (a hint).
   */
  | {
      type: 'objects';
      kind: ObjectKind;
      /** A different kind per group (which has more?). */
      kinds?: ObjectKind[];
      groups: number[];
      removed?: number;
      arranged?: boolean;
      /**
       * A five- or ten-frame: the objects of the first group fill its cells in rows
       * of five, and the rest of the cells stay empty (how many are missing to ten?).
       */
      frame?: 5 | 10;
    }
  /**
   * A number line from `from` to `to`, marked at `start`, with `hops` steps of 1
   * (negative: backwards). `stopAt` marks a waypoint (10 when crossing ten);
   * `target` marks a second point when the number of hops is the question.
   */
  | {
      type: 'numberLine';
      from: number;
      to: number;
      start: number;
      hops: number;
      stopAt?: number;
      target?: number;
      /** Tick spacing (default 1); a hop is one tick. */
      step?: number;
      /** A tick whose number is the question: drawn as "?" (a hint that shows the way, not the answer). */
      hide?: number;
      /**
       * Numbers only under the multiples of this (10: only the tens), so a marked
       * point has to be read from the ticks rather than from the number under it.
       */
      labelEvery?: number;
    }
  /**
   * Clocks: one, or two side by side (from, to: how much time passed). Analog
   * by default; `digital` shows the time as on a digital clock ("3:30").
   * Hours 1–12, minutes 0–59.
   */
  | { type: 'clock'; times: ClockTime[]; digital?: boolean }
  /**
   * Shekel coins (1, 2, 5, 10) and notes (20, 50, 100, 200), drawn left to
   * right, largest first. `price` adds a price tag before them (shopping).
   */
  | { type: 'money'; items: number[]; price?: number }
  /**
   * Shapes in a row: a pattern (`null` is the place to fill, drawn as a dashed
   * box) or a picture to count in. Each shape has its own size and turn.
   */
  | { type: 'shapes'; items: (ShapeItem | null)[] }
  /**
   * Solids (גופים) in a row, drawn in 3D with light and shade; a flat shape among
   * them is drawn flat, as on paper. `stacked`: the items one on top of the other.
   */
  | { type: 'solids'; items: SolidItem[]; stacked?: boolean }
  /** Unit cubes in columns standing side by side, one deep, so every cube shows. */
  | { type: 'cubeStack'; columns: number[] }
  /** One everyday thing, drawn big (an emoji): which solid does it look like? */
  | { type: 'thing'; emoji: string }
  /** Pencils standing on one line, `lengths` in units of 1–5: which is longest? */
  | { type: 'pencils'; lengths: number[] }
  /** An angle of `deg` degrees between a ray along the base and a second ray, the whole turned by `turn`. */
  | { type: 'angle'; deg: number; turn?: number }
  /** Two straight lines: parallel, perpendicular, or crossing at a slant. */
  | { type: 'lines'; kind: 'parallel' | 'perpendicular' | 'crossing'; turn?: number }
  /** A polygon in a 100 × 100 box (y down), with optional marks (see Polygon). */
  | ({ type: 'polygon' } & Polygon)
  /** A ruler from 0 to `length` cm with something lying on it from `from` to `to`. */
  | { type: 'ruler'; from: number; to: number; length: number }
  /** A box drawn in perspective; `cubes` draws the unit cubes, `labels` its edges. */
  | { type: 'box'; l: number; w: number; h: number; cubes?: boolean; unit?: string }
  /** A bar chart: one bar per answer of a survey, the scale on the left in steps of `step`. */
  | { type: 'bars'; bars: { label: string; value: number }[]; step?: number; title?: string }
  /**
   * A grid of rows × cols squares. `shaded`: the first so many squares, row by
   * row (a hundred grid: 37 of 100). `band`: an area model, the first `cols`
   * columns in one colour and the first `rows` rows in another; where they meet
   * is the product (2/3 × 3/4).
   */
  | {
      type: 'grid';
      rows: number;
      cols: number;
      shaded?: number;
      band?: { cols: number; rows: number };
    }
  /** Things for sale, each with a price tag (a shopping story). */
  | { type: 'items'; items: { label: string; price: number }[] }
  /** A circle with its radius or diameter drawn and labelled. */
  | { type: 'circle'; mark: 'radius' | 'diameter'; label: string }
  /**
   * A column (vertical) exercise, drawn as in the notebook: solved up to step
   * `upto` (all of it by default), with the carry and borrow marks. `wrong`
   * writes a wrong digit in one cell (find the mistake); `missing` hides one
   * digit of a number on top (which digit is missing?).
   */
  | {
      type: 'vertical';
      layout: VerticalLayout;
      upto?: number;
      wrong?: { row: number; col: number; digit: number };
      missing?: { operand: 'top' | 'bottom'; col: number };
    };

/** A sentence shown (with digits) and read (words, and the clips that assemble it). */
export interface Line {
  text: string;
  spoken: string;
  parts: string[];
}

/**
 * A column exercise: the two numbers, the rows written under the line, and
 * every written digit as a step, in the order a child writes them (units
 * first). Columns count from the right: 0 is the units.
 */
export interface VerticalLayout {
  op: 'add' | 'sub' | 'mul';
  top: number;
  bottom: number;
  /** Digit columns of the grid. */
  width: number;
  rows: VerticalRow[];
  steps: VerticalStep[];
  /** Said before the first step of a row (multiplying by the tens: a zero first). */
  rowIntro: (Line | null)[];
}

export interface VerticalRow {
  value: number;
  /** The first column written; the columns before it hold a grey zero (the second partial product). */
  from: number;
  /** "35 × 7": what this row is, beside it (partial products). */
  label?: string;
  /** A line and a plus sign above it: the sum of the partial products. */
  sum?: boolean;
}

export interface VerticalStep {
  row: number;
  col: number;
  digit: number;
  /** Marks written above the top number once this step is done (a carry, a borrow). */
  marks: VerticalMark[];
  /** What to do here, before writing ("ביחידות: 6 ועוד 5"). */
  ask: Line;
  /** The column worked out, with the digit ("6 ועוד 5 זה 11: כותבים 1 ומעבירים 1 לעשרות."). */
  explain: Line;
  /** What a typical slip writes here, for a specific word (a forgotten carry, no borrow). */
  slips: { digit: number; kind: 'carry' | 'borrow' }[];
}

export interface VerticalMark {
  col: number;
  text: string;
  /** Marks of an earlier row of a multiplication are drawn faded, crossed out. */
  group: number;
  /** The top digit in this column is crossed out (it was borrowed from). */
  strike?: boolean;
}

export interface Polygon {
  points: [number, number][];
  /** Vertices (indices) marked with a right-angle square. */
  rightAngles?: number[];
  /** Equal-side ticks per side (side i joins point i to point i+1). */
  ticks?: number[];
  /** A label per side, or null. */
  sideLabels?: (string | null)[];
  /** A label inside each vertex (an angle), or null. */
  angleLabels?: (string | null)[];
  /** A dashed height from a vertex to the base, with an optional label. */
  height?: { from: [number, number]; to: [number, number]; label?: string };
  /** A dashed extension of a side (the base of an obtuse triangle, out to the height's foot). */
  extend?: { from: [number, number]; to: [number, number] };
  /** Draw every diagonal. */
  diagonals?: boolean;
}

export type ShapeKind = 'circle' | 'square' | 'triangle' | 'rectangle';
export type ShapeColor = 'red' | 'blue' | 'yellow' | 'green';

export interface ShapeItem {
  shape: ShapeKind;
  color: ShapeColor;
  /** 0.4–1 of the full size (default 1). */
  size?: number;
  /** Degrees clockwise (default 0). */
  turn?: number;
}

/** `pyramid` stands on a square, `pyramid3` on a triangle. */
export type SolidKind = 'cube' | 'box' | 'sphere' | 'cylinder' | 'cone' | 'pyramid' | 'pyramid3';

export interface SolidItem {
  /** A solid, or a flat shape (drawn flat, for "a solid or a flat shape?"). */
  kind: SolidKind | ShapeKind;
  color: ShapeColor;
  /** One face (or the base) painted in another colour, to ask about it. */
  mark?: 'front' | 'top' | 'side' | 'base';
  /** The hidden edges drawn dashed, to count faces and vertices at the back. */
  seeThrough?: boolean;
  /** A cylinder lying on its side (it rolls). */
  lying?: boolean;
}

export interface ClockTime {
  h: number;
  m: number;
}

export interface Hint {
  /** Shown text (may contain digits, never the answer). */
  text: string;
  /** Read aloud. Words only. */
  spoken: string;
  /** The clips to play when the sentence itself is not recorded (see lang/compose.ts). */
  spokenParts?: string[];
  visual?: Visual;
  /** A similar, solved exercise (hint 3). */
  example?: { display: string; spoken: string };
}

export interface Exercise {
  /** Stable id of the underlying fact, e.g. "add:3+5". Used to avoid immediate repeats. */
  factId: string;
  topicId: string;
  level: number;
  /** Short instruction shown above the exercise, e.g. "כמה זה?". */
  prompt: string;
  /** Arithmetic for <MathExpr>, LTR, with "?" for the answer slot. Empty for counting. */
  display: string;
  /** Full sentence read aloud. */
  spokenText: string;
  /** The clips to play when the sentence itself is not recorded (see lang/compose.ts). */
  spokenParts?: string[];
  visual?: Visual;
  answer: number;
  /** The operation, when there is one; selects the explanation for a wrong-operation mistake. */
  operation?: 'add' | 'sub' | 'mul' | 'div';
  /**
   * How the child answers. Young children pick from big buttons. `labels`
   * shows something other than the number on each button (a fraction, a sign);
   * `decimal` adds a decimal point to the pad.
   */
  input:
    | {
        type: 'choices';
        choices: number[];
        labels?: string[];
        /** A picture on each button (clocks, coins); the label is then its spoken name. */
        visuals?: Visual[];
        /** Words read right to left (column names): laid out from the right, like the columns. */
        rtl?: boolean;
      }
    | { type: 'numpad'; maxDigits: number; decimal?: boolean }
    /**
     * Written in columns, digit by digit (see VerticalLayout). Guided: every
     * digit is checked as it is written and the carry appears by itself. Not
     * guided: the child writes everything, then checks.
     */
    | { type: 'vertical'; layout: VerticalLayout; guided: boolean };
  /** Exactly three, increasingly concrete: simpler wording, a picture, a solved example. */
  hints: [Hint, Hint, Hint];
  /** The sentence read when the answer is revealed after the last try, e.g. "שלוש ועוד חמש זה שמונה." */
  solutionSpoken: string;
  solutionParts?: string[];
  /** Classifies a wrong answer, or null when there is nothing specific to say. */
  diagnose: (value: number) => MistakeKind | null;
  /**
   * Advice for the typical wrong answers of this exercise, said for its own
   * numbers ("חישבת כמה משלמים. השאלה כמה אחוזי הנחה"); shown instead of the
   * general explanation of the mistake's kind.
   */
  advice?: readonly Advice[];
}

/** What to say for one expected wrong answer (a number, or a button's index). */
export interface Advice {
  value: number;
  /** As shown: numbers in digits. */
  text: string;
  /** As heard, and its clips. */
  spoken: string;
  parts?: string[];
}

export type Rng = () => number;

export interface LevelInfo {
  level: number;
  /** i18n key of the level's short description, e.g. "סופרים עד 5". */
  labelKey: string;
}

export interface Topic {
  id: string;
  /** i18n key of the topic name. */
  labelKey: string;
  /** Grades for which this topic is part of the curriculum. */
  grades: readonly number[];
  levels: readonly LevelInfo[];
  /** Where a child of this grade starts. */
  startLevel: (grade: number) => number;
  /**
   * The last level for a child of this grade (10 when absent): a world shared
   * with an older grade ends earlier for the younger one, so she is not
   * stopped by the older grade's content.
   */
  lastLevel?: (grade: number) => number;
  /**
   * A new exercise. `avoid`: facts already seen in this round (the last one
   * last); none of them comes again while the level has others to give.
   */
  generate: (
    level: number,
    rng: Rng,
    gender: Gender,
    avoid?: string | readonly string[],
  ) => Exercise;
  /**
   * Everything this topic can ever say, for pre-generating audio: whole
   * sentences when the topic is finite, otherwise the literal pieces of its
   * templates (numbers are recorded separately).
   */
  spokenBank: () => string[];
}
