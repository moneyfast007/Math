import type { MistakeKind } from '@/state/schema';
import type { AgeBand } from '@/ui/ageBand';
import type { Exercise } from './types';

/**
 * One practice round, as a pure state machine. The screen holds the state and
 * calls `reduce`; nothing here touches storage, audio or randomness (new
 * exercises are passed in), so every rule below is unit-tested.
 *
 * Rules (from the phase 0 research and the brief):
 * - Round length depends on age: short for gan, longer for grades 4–6.
 * - Three tries per exercise. A wrong answer gets a gentle, specific
 *   explanation; after the third the answer is shown with the solution.
 * - Only a first-try answer counts as correct for progress.
 * - Four first-try answers in a row → suggest a harder level.
 *   Two of the last three needing the answer revealed, or three in a row
 *   needing more than one try → suggest an easier level.
 */

export const ROUND_LENGTH: Record<AgeBand, number> = { young: 6, middle: 10, older: 12 };
export const MAX_TRIES = 3;
export const LEVEL_UP_STREAK = 4;

export type Phase = 'answering' | 'wrong' | 'correct' | 'revealed' | 'finished';
export type Outcome = 'first' | 'later' | 'revealed';

export interface SessionState {
  topicId: string;
  level: number;
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
  /** Consecutive first-try answers at the current level. */
  streak: number;
  /** Outcomes at the current level, oldest first. */
  history: Outcome[];
  firstTryCount: number;
  suggestion: 'up' | 'down' | null;
}

export type SessionAction =
  | { type: 'answer'; value: number }
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
  exercise: Exercise;
}

export function startSession(o: StartOptions): SessionState {
  return {
    topicId: o.topicId,
    level: o.level,
    minLevel: o.minLevel,
    maxLevel: o.maxLevel,
    length: ROUND_LENGTH[o.band],
    done: 0,
    exercise: o.exercise,
    phase: 'answering',
    tries: 0,
    hintsShown: 0,
    lastValue: null,
    lastMistake: null,
    firstMistake: null,
    streak: 0,
    history: [],
    firstTryCount: 0,
    suggestion: null,
  };
}

function suggestionFor(s: SessionState, history: Outcome[], streak: number): 'up' | 'down' | null {
  if (streak >= LEVEL_UP_STREAK && s.level < s.maxLevel) return 'up';
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
  const streak = outcome === 'first' ? s.streak + 1 : 0;
  return {
    ...s,
    phase,
    history,
    streak,
    firstTryCount: s.firstTryCount + (outcome === 'first' ? 1 : 0),
    suggestion: suggestionFor(s, history, streak),
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
  };
}

export function reduce(s: SessionState, a: SessionAction): SessionState {
  switch (a.type) {
    case 'answer': {
      if (s.phase !== 'answering' && s.phase !== 'wrong') return s;
      if (a.value === s.exercise.answer) {
        return complete(s, s.tries === 0 ? 'first' : 'later', 'correct');
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
      return tries >= MAX_TRIES
        ? complete(next, 'revealed', 'revealed')
        : { ...next, phase: 'wrong' };
    }
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
      const base = { ...s, level, streak: 0, history: [] };
      if (done >= s.length) return { ...base, done, phase: 'finished', suggestion: null };
      return { ...freshExercise(base, a.exercise), done };
    }
    case 'dismissSuggestion':
      // Asking again right away would nag; the counters start over.
      return { ...s, suggestion: null, streak: 0, history: [] };
  }
}

/** True when this transition finished an exercise (so the caller records it). */
export function completedExercise(before: SessionState, after: SessionState): boolean {
  const open = (p: Phase) => p === 'answering' || p === 'wrong';
  return open(before.phase) && (after.phase === 'correct' || after.phase === 'revealed');
}
