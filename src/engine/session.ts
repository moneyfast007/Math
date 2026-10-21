import type { MistakeKind, RoundLength } from '@/state/schema';
import type { AgeBand } from '@/ui/ageBand';
import type { Exercise } from './types';

/**
 * One practice round, as a pure state machine. The screen holds the state and
 * calls `reduce`; nothing here touches storage, audio or randomness (new
 * exercises are passed in), so every rule below is unit-tested.
 *
 * Rules (from the phase 0 research and the brief):
 * - Round length depends on age: short for gan, longer for grades 4–6; a parent
 *   can make a child's rounds shorter or longer (ROUND_LENGTHS).
 * - Three tries per exercise. A wrong answer gets a gentle, specific
 *   explanation; after the third the answer is shown with the solution.
 * - Only a first-try answer counts as correct for progress.
 * - Moving up happens only at the end of a round, from its result (phase 4,
 *   state/progress.ts: a passed station opens the next one), so nothing here
 *   interrupts a child who is doing well.
 * - Two of the last three needing the answer revealed, or three in a row
 *   needing more than one try → the round drops to an easier level right away;
 *   the screen says so in one line. A child who is stuck should not sit
 *   through six more hard exercises.
 */

/**
 * Exercises per round, by age band and the parent's choice. A station passes at
 * 70% first-try answers and the final challenge at 80% (state/progress.ts), so
 * the lengths are chosen where those shares round to a fair count: 7 passes at
 * 5 of 7, 15 at 11 of 15, 18 at 13 of 18. (6 would need 5 of 6, 83%; 9 would
 * need 7 of 9 and 8 of 9 for the challenge.)
 */
export const ROUND_LENGTHS: Record<AgeBand, Record<RoundLength, number>> = {
  young: { short: 5, normal: 6, long: 10 },
  middle: { short: 7, normal: 10, long: 15 },
  older: { short: 10, normal: 12, long: 18 },
};

/** The normal round of each band. */
export const ROUND_LENGTH: Record<AgeBand, number> = {
  young: ROUND_LENGTHS.young.normal,
  middle: ROUND_LENGTHS.middle.normal,
  older: ROUND_LENGTHS.older.normal,
};

export function roundLength(band: AgeBand, choice: RoundLength = 'normal'): number {
  return ROUND_LENGTHS[band][choice];
}

export const MAX_TRIES = 3;

/**
 * Tries before the answer is shown. With buttons, never so many that the last one is
 * the only button left: tapping through three buttons is not finding the answer.
 */
export function maxTriesFor(e: Exercise): number {
  return e.input.type === 'choices'
    ? Math.max(1, Math.min(MAX_TRIES, e.input.choices.length - 1))
    : MAX_TRIES;
}

/** The round dropped below its station to help a stuck child: it cannot pass the station. */
export function droppedLevel(s: SessionState): boolean {
  return s.level < s.startLevel;
}

export type Phase = 'answering' | 'wrong' | 'correct' | 'revealed' | 'finished';
export type Outcome = 'first' | 'later' | 'revealed';

export interface SessionState {
  topicId: string;
  level: number;
  /**
   * The station the round is for. The round may drop to an easier level when the
   * child is stuck (`level` then is lower), but the round still belongs to this one.
   */
  startLevel: number;
  minLevel: number;
  maxLevel: number;
  length: number;
  /** Exercises completed so far in this round. */
  done: number;
  exercise: Exercise;
  phase: Phase;
  /** Wrong tries on the current exercise. */
  tries: number;
  /** How many hints have been opened on the current exercise (0–3). */
  hintsShown: number;
  /** The last wrong value and its diagnosis, for the explanation line. */
  lastValue: number | null;
  lastMistake: MistakeKind | null;
  /** The first mistake on this exercise; what progress records. */
  firstMistake: MistakeKind | null;
  /** Outcomes at the current level, oldest first. */
  history: Outcome[];
  firstTryCount: number;
  /** The round should drop a level before the next exercise. */
  suggestion: 'down' | null;
  /** A digit of a column exercise had to be written for the child (see 'stepMiss'). */
  assisted: boolean;
}

export type SessionAction =
  | { type: 'answer'; value: number }
  /**
   * A wrong digit in a guided column exercise: it counts as a try (the
   * exercise is no longer right the first time) but does not end it; the
   * column is explained and the child goes on. `assisted`: the digit was then
   * written for her, which counts like a revealed answer.
   */
  | { type: 'stepMiss'; mistake: MistakeKind | null; assisted: boolean }
  | { type: 'hint' }
  | { type: 'next'; exercise: Exercise }
  | { type: 'changeLevel'; level: number; exercise: Exercise }
  | { type: 'dismissSuggestion' };

export interface StartOptions {
  topicId: string;
  level: number;
  minLevel: number;
  maxLevel: number;
  band: AgeBand;
  /** The parent's choice for this child; 'normal' when absent. */
  roundLength?: RoundLength;
  exercise: Exercise;
}

export function startSession(o: StartOptions): SessionState {
  return {
    topicId: o.topicId,
    level: o.level,
    startLevel: o.level,
    minLevel: o.minLevel,
    maxLevel: o.maxLevel,
    length: roundLength(o.band, o.roundLength),
    done: 0,
    exercise: o.exercise,
    phase: 'answering',
    tries: 0,
    hintsShown: 0,
    lastValue: null,
    lastMistake: null,
    firstMistake: null,
    history: [],
    firstTryCount: 0,
    suggestion: null,
    assisted: false,
  };
}

function suggestionFor(s: SessionState, history: Outcome[]): 'down' | null {
  if (s.level > s.minLevel) {
    const last3 = history.slice(-3);
    const revealed = last3.filter((o) => o === 'revealed').length;
    if (revealed >= 2) return 'down';
    if (last3.length === 3 && last3.every((o) => o !== 'first')) return 'down';
  }
  return null;
}

function complete(s: SessionState, outcome: Outcome, phase: 'correct' | 'revealed'): SessionState {
  const history = [...s.history, outcome];
  return {
    ...s,
    phase,
    history,
    firstTryCount: s.firstTryCount + (outcome === 'first' ? 1 : 0),
    suggestion: suggestionFor(s, history),
  };
}

function freshExercise(s: SessionState, exercise: Exercise): SessionState {
  return {
    ...s,
    exercise,
    phase: 'answering',
    tries: 0,
    hintsShown: 0,
    lastValue: null,
    lastMistake: null,
    firstMistake: null,
    suggestion: null,
    assisted: false,
  };
}

export function reduce(s: SessionState, a: SessionAction): SessionState {
  switch (a.type) {
    case 'answer': {
      if (s.phase !== 'answering' && s.phase !== 'wrong') return s;
      // Equal give or take floating-point noise (0.1 + 0.2), so a typed 0.3 is right.
      if (Math.abs(a.value - s.exercise.answer) < 1e-9) {
        const outcome = s.tries === 0 ? 'first' : s.assisted ? 'revealed' : 'later';
        return complete(s, outcome, 'correct');
      }
      const mistake = s.exercise.diagnose(a.value);
      const tries = s.tries + 1;
      const next: SessionState = {
        ...s,
        tries,
        lastValue: a.value,
        lastMistake: mistake,
        firstMistake: s.firstMistake ?? mistake ?? 'other',
      };
      return tries >= maxTriesFor(s.exercise)
        ? complete(next, 'revealed', 'revealed')
        : { ...next, phase: 'wrong' };
    }
    case 'stepMiss':
      if (s.phase !== 'answering' && s.phase !== 'wrong') return s;
      return {
        ...s,
        tries: s.tries + 1,
        lastMistake: a.mistake,
        firstMistake: s.firstMistake ?? a.mistake ?? 'other',
        assisted: s.assisted || a.assisted,
      };
    case 'hint':
      if (s.phase !== 'answering' && s.phase !== 'wrong') return s;
      return { ...s, hintsShown: Math.min(3, s.hintsShown + 1) };
    case 'next': {
      if (s.phase !== 'correct' && s.phase !== 'revealed') return s;
      const done = s.done + 1;
      if (done >= s.length) return { ...s, done, phase: 'finished', suggestion: null };
      return { ...freshExercise(s, a.exercise), done };
    }
    case 'changeLevel': {
      const level = Math.min(s.maxLevel, Math.max(s.minLevel, a.level));
      const done = s.phase === 'correct' || s.phase === 'revealed' ? s.done + 1 : s.done;
      const base = { ...s, level, history: [] };
      if (done >= s.length) return { ...base, done, phase: 'finished', suggestion: null };
      return { ...freshExercise(base, a.exercise), done };
    }
    case 'dismissSuggestion':
      // Not used by the screen any more (levels drop without asking); kept for the tests.
      return { ...s, suggestion: null, history: [] };
  }
}

/** True when this transition finished an exercise (so the caller records it). */
export function completedExercise(before: SessionState, after: SessionState): boolean {
  const open = (p: Phase) => p === 'answering' || p === 'wrong';
  return open(before.phase) && (after.phase === 'correct' || after.phase === 'revealed');
}
