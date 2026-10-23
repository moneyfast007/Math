import { t, type TranslationKey } from '@/i18n';
import { medalsFor, totalStars } from '@/state/progress';
import type { Profile } from '@/state/schema';
import { useApp } from '@/state/store';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { Plusi } from './Plusi';
import { PLUSI_COLORS, plusiCss, type PlusiColorId } from './plusiColor';

/**
 * "הפלוסי שלי": the child picks the colour of her Plusi. Three are open from the
 * start; the others open one by one with the star medals (the closed ones say when).
 */
export function PlusiPicker({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const setPlusiColor = useApp((s) => s.setPlusiColor);
  const medals = medalsFor(totalStars(progress));
  const chosen: PlusiColorId = profile.plusiColor ?? 'usual';
  return (
    <Dialog title={t('plusiColor.title')} onClose={onClose}>
      <p className="plusi-picker__intro">{t('plusiColor.intro')}</p>
      <ul className="plusi-picker" role="list">
        {PLUSI_COLORS.map((c) => {
          const open = medals >= c.medals;
          const name = t(`plusiColor.${c.id}` as TranslationKey);
          const label = open
            ? name
            : `${name}, ${
                c.medals === 1
                  ? t('plusiColor.lockedOne')
                  : t('plusiColor.locked', { params: { n: c.medals } })
              }`;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={c.id === chosen ? 'plusi-swatch plusi-swatch--on' : 'plusi-swatch'}
                aria-pressed={c.id === chosen}
                aria-label={label}
                disabled={!open}
                onClick={() => {
                  setPlusiColor(profile.id, c.id);
                  onClose();
                }}
              >
                <span
                  className="plusi-swatch__plusi"
                  style={{ ['--plusi-color' as string]: plusiCss(c.id) }}
                >
                  <Plusi size="100%" decorative mood={c.id === chosen ? 'cheering' : 'happy'} />
                </span>
                {open ? null : (
                  <span className="plusi-swatch__lock" aria-hidden="true">
                    <Icon name="lock" />
                    {c.medals}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="muted plusi-picker__note">{t('plusiColor.note')}</p>
    </Dialog>
  );
}
