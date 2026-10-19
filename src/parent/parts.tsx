import type { ReactNode } from 'react';
import { t } from '@/i18n';
import { Icon, type IconName } from '@/ui/Icon';

/** Building blocks shared by the parent area's settings. */

/** A long explanation, folded: the short version stays in sight. */
export function More({ children }: { children: ReactNode }) {
  return (
    <details className="more">
      <summary>{t('parentArea.more')}</summary>
      <div className="more__body">{children}</div>
    </details>
  );
}

/** A settings card: an icon, a title, and what belongs to it. */
export function SettingsCard({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card stack settings-card" aria-labelledby={id}>
      <h2 id={id} className="settings-card__title">
        <span className="settings-card__icon">
          <Icon name={icon} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
