import { t } from '@/i18n';
import type { Gender } from '@/lang/gender';

/**
 * "Who is playing today?", addressed to the children on this device: feminine
 * when they are all girls, masculine when all boys, and a form that is the
 * same for both when they are mixed.
 */
export function whoIsPlayingTitle(genders: readonly Gender[]): string {
  if (genders.every((g) => g === 'f')) return t('home.whoIsPlaying', { gender: 'f' });
  if (genders.every((g) => g === 'm')) return t('home.whoIsPlaying', { gender: 'm' });
  return t('home.whoIsPlaying.mixed');
}
