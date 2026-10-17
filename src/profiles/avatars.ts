/**
 * Avatars are system emoji: no image files, no network, and they look right on
 * iPad. Each has a Hebrew name for screen readers (see he.ts, `avatar.*`).
 * Ids are stored in profiles, so never rename one; add new ones at the end.
 */
export const AVATARS = [
  { id: 'fox', emoji: '🦊' },
  { id: 'panda', emoji: '🐼' },
  { id: 'koala', emoji: '🐨' },
  { id: 'lion', emoji: '🦁' },
  { id: 'tiger', emoji: '🐯' },
  { id: 'frog', emoji: '🐸' },
  { id: 'monkey', emoji: '🐵' },
  { id: 'unicorn', emoji: '🦄' },
  { id: 'octopus', emoji: '🐙' },
  { id: 'turtle', emoji: '🐢' },
  { id: 'rabbit', emoji: '🐰' },
  { id: 'cat', emoji: '🐱' },
] as const;

export type AvatarId = (typeof AVATARS)[number]['id'];

export const AVATAR_IDS: readonly AvatarId[] = AVATARS.map((a) => a.id);

export function isAvatarId(value: unknown): value is AvatarId {
  return typeof value === 'string' && (AVATAR_IDS as readonly string[]).includes(value);
}

export function avatarEmoji(id: AvatarId): string {
  return AVATARS.find((a) => a.id === id)?.emoji ?? '🙂';
}
