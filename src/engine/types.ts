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
  /** Objects to count, in one or two groups. `removed` objects are drawn crossed out. */
  | { type: 'objects'; kind: ObjectKind; groups: number[]; removed?: number; numbered?: boolean }
  /** A number line from `from` to `to`, starting at `start`, with `hops` steps of 1 (negative: backwards). */
  | { type: 'numberLine'; from: number; to: number; start: number; hops: number; stopAt?: number };

export interface Hint {
  /** Shown text (may contain digits, never the answer). */
  text: string;
  /** Read aloud. Words only. */
  spoken: string;
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
  visual?: Visual;
  answer: number;
  /** How the child answers. Young children pick from big buttons. */
  input: { type: 'choices'; choices: number[] } | { type: 'numpad'; maxDigits: number };
  /** Exactly three, increasingly concrete: simpler wording, a picture, a solved example. */
  hints: [Hint, Hint, Hint];
  /** The sentence read when the answer is revealed after the last try, e.g. "שלוש ועוד חמש זה שמונה." */
  solutionSpoken: string;
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
  /** Every sentence this topic can ever speak, for pre-generating audio. */
  spokenBank: () => string[];
}
