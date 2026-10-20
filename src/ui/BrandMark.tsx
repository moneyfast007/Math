import { t } from '@/i18n';
import { Plusi } from './Plusi';

/**
 * The app's name with a small Plusi, at the top of the screens around the
 * exercises (choosing a child, the album, all the worlds, the parents' area):
 * a returning family should see the name somewhere. Not a link: the child's
 * way around is the buttons, and this must not be one more.
 */
export function BrandMark() {
  return (
    <div className="brandmark">
      <Plusi size={26} decorative />
      <span className="brandmark__name">{t('app.name')}</span>
    </div>
  );
}
