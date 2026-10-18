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
  | { type: 'fraction'; parts: number; shaded: number; shape?: 'bar' | 'circle' }
  /** Dots in rows × cols, for multiplication; `squares` draws cells (area). */
  | { type: 'array'; rows: number; cols: number; squares?: boolean }
  /** A rectangle with labelled sides, for perimeter and area. */
  | { type: 'rect'; width: number; height: number; unit?: string }
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
  /** Pencils standing on one line, `lengths` in units of 1–5: which is longest? */
  | { type: 'pencils'; lengths: number[] };

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
      }
    | { type: 'numpad'; maxDigits: number; decimal?: boolean };
  /** Exactly three, increasingly concrete: simpler wording, a picture, a solved example. */
  hints: [Hint, Hint, Hint];
  /** The sentence read when the answer is revealed after the last try, e.g. "שלוש ועוד חמש זה שמונה." */
  solutionSpoken: string;
  solutionParts?: string[];
  /** Classifies a wrong answer, or null when there is nothing specific to say. */
  diagnose: (value: number) => MistakeKind | null;
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
  generate: (level: number, rng: Rng, gender: Gender, avoidFactId?: string) => Exercise;
  /**
   * Everything this topic can ever say, for pre-generating audio: whole
   * sentences when the topic is finite, otherwise the literal pieces of its
   * templates (numbers are recorded separately).
   */
  spokenBank: () => string[];
}
