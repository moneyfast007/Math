import type { AvatarId } from '@/profiles/avatars';
import type { Grade } from '@/ui/ageBand';
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

const TOPIC_KEYS: Readonly<Record<string, TranslationKey>> = {
  'add-sub-20': 'topic.addSub20',
};

/** Topic ids come from the curriculum (phase 3); an unknown id is shown as-is. */
export function topicLabel(topicId: string): string {
  const key = TOPIC_KEYS[topicId];
  return key ? t(key) : topicId;
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
