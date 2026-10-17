import { avatarLabel } from '@/i18n/labels';
import { avatarEmoji, type AvatarId } from '@/profiles/avatars';

interface AvatarProps {
  id: AvatarId;
  size?: 'sm' | 'md' | 'lg';
  /** Decorative when the name is shown next to it. */
  decorative?: boolean;
}

export function Avatar({ id, size = 'md', decorative = false }: AvatarProps) {
  return decorative ? (
    <span className={`avatar avatar--${size}`} aria-hidden="true">
      {avatarEmoji(id)}
    </span>
  ) : (
    <span className={`avatar avatar--${size}`} role="img" aria-label={avatarLabel(id)}>
      {avatarEmoji(id)}
    </span>
  );
}
