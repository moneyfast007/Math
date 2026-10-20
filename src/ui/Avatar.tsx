import { avatarLabel } from '@/i18n/labels';
import { avatarEmoji, type AvatarId } from '@/profiles/avatars';
import { AvatarArt, hasAvatarArt } from './avatarArt';

interface AvatarProps {
  id: AvatarId;
  size?: 'sm' | 'md' | 'lg';
  /** Decorative when the name is shown next to it. */
  decorative?: boolean;
}

/** A child's avatar: drawn (avatarArt.tsx), or the system emoji for an id without a drawing. */
export function Avatar({ id, size = 'md', decorative = false }: AvatarProps) {
  const drawn = hasAvatarArt(id);
  const className = drawn ? `avatar avatar--${size} avatar--drawn` : `avatar avatar--${size}`;
  const content = drawn ? <AvatarArt id={id} className="avatar__art" /> : avatarEmoji(id);
  return decorative ? (
    <span className={className} aria-hidden="true">
      {content}
    </span>
  ) : (
    <span className={className} role="img" aria-label={avatarLabel(id)}>
      {content}
    </span>
  );
}
