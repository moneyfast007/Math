/**
 * Which finished world the child chose to play again from the album. Lives
 * only in memory: it is a choice for the next round, never saved with her
 * progress (a reload starts from the home screen anyway).
 */
let chosen: string | null = null;

export function setReplayTopic(topicId: string): void {
  chosen = topicId;
}

export function replayTopic(): string | null {
  return chosen;
}
