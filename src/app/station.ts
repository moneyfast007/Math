/**
 * The station the child chose to play on the map or in "תחנה אחרת" (a passed
 * one again, one she skipped, or, where the parent allows it, one ahead).
 * Lives only in memory: it is a choice for the next round and never moves where
 * she is on the journey (passing a station at or ahead of it does that). The
 * journey's big button clears it, since that starts the station it names.
 */
let chosen: { topicId: string; level: number } | null = null;

export function chooseStation(topicId: string, level: number): void {
  chosen = { topicId, level };
}

export function clearChosenStation(): void {
  chosen = null;
}

/** The station chosen in this world, if any. */
export function chosenStation(topicId: string): number | null {
  return chosen && chosen.topicId === topicId ? chosen.level : null;
}
