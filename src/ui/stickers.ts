import { t } from '@/i18n';

/**
 * Album stickers: one fixed drawing per world, so the same world always gives
 * the same sticker (no chance, no "packs"). Drawn inline, like Plusi.
 */
export const STICKER_IDS = ['balloon', 'boat', 'kite', 'star', 'flower', 'rocket'] as const;
export type StickerId = (typeof STICKER_IDS)[number];

/** The sticker of the n-th world (1-based); cycles when there are more worlds than drawings. */
export function stickerForWorld(index: number): StickerId {
  return STICKER_IDS[(Math.max(1, index) - 1) % STICKER_IDS.length] ?? 'balloon';
}

export function stickerLabel(id: StickerId): string {
  return t(`sticker.${id}`);
}
