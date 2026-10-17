import type { AvatarId } from '@/profiles/avatars';
import type { Grade } from '@/ui/ageBand';
import { topicById } from '@/engine/registry';
import { he } from './he';
import { t, type TranslationKey } from './index';

/** Typed label lookups for keys built from data. */

export function gradeLabel(grade: Grade): string {
  return t(`grade.${grade}`);
}

export function avatarLabel(id: AvatarId): string {
  return t(`avatar.${id}`);
}

function isKey(key: string): key is TranslationKey {
  return Object.hasOwn(he, key);
}

/** Mistake kinds are open-ended strings (forward compatibility); unknown ones read as "other". */
export function mistakeLabel(kind: string): string {
  const key = `mistake.${kind}`;
  return t(isKey(key) ? key : 'mistake.other');
}

/** Topic ids come from the curriculum; an unknown id (a newer backup) is shown as-is. */
export function topicLabel(topicId: string): string {
  const key = topicById(topicId)?.labelKey;
  return key && isKey(key) ? t(key) : topicId;
}

const dateFormat = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(ms: number): string {
  return dateFormat.format(new Date(ms));
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
