import { useState } from 'react';
import { navigate } from '@/app/router';
import { clearChosenStation } from '@/app/station';
import { enterTrack, trackOf } from '@/app/track';
import { trackWorlds, type World } from '@/engine/journey';
import { t, type TranslationKey } from '@/i18n';
import type { Profile, ProfileProgress } from '@/state/schema';
import './testPrep.css';

/**
 * Grade 4's practice for the school's test ("מיפוי"), on the worlds screen: its
 * two worlds, each with how far she got. Choosing one opens its map in place of
 * the journey's; "חזרה למסע" on that map goes back to where she was.
 */
export function TestPrepSection({
  profile,
  progress,
}: {
  profile: Profile;
  progress: ProfileProgress | undefined;
}) {
  const worlds = trackWorlds(profile.grade, progress);
  const current = trackOf(profile.id);
  // Folded at first: one card that opens to its two parts.
  const [open, setOpen] = useState(current !== null);
  const play = (w: World) => {
    enterTrack(profile.id, w.topic.id);
    clearChosenStation();
    navigate({ name: 'play' });
  };

  return (
    <section className="prep-wrap" aria-labelledby="prep-title">
      <h2 id="prep-title" className="prep__label">
        {t('map4.bonus')}
      </h2>
      <div className={open ? 'prep prep--open' : 'prep'}>
        <button
          type="button"
          className="prep__toggle"
          aria-expanded={open}
          aria-controls="prep-parts"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="prep__star" aria-hidden="true">
            ★
          </span>
          <span className="prep__head">
            <span className="prep__grade">{t('map4.grade')}</span>
            <span className="prep__title">{t('map4.title')}</span>
            <span className="muted prep__parts-line">{t('map4.parts')}</span>
          </span>
          <span className="prep__chev" aria-hidden="true" />
        </button>
        {open ? (
          <div id="prep-parts" className="prep__body">
            <p className="muted prep__intro">{t('map4.intro')}</p>
            <ol className="prep__list">
              {worlds.map((w) => {
                const total = w.stations.length;
                const done = w.stations.filter((s) => s.state === 'done').length;
                const line =
                  done === 0
                    ? t('map4.notYet')
                    : done >= total
                      ? t('map4.done')
                      : t('map4.stations', { params: { done, total } });
                return (
                  <li key={w.topic.id}>
                    <button
                      type="button"
                      className={
                        w.topic.id === current ? 'prep__world prep__world--current' : 'prep__world'
                      }
                      onClick={() => play(w)}
                    >
                      <span className={`prep__badge prep__badge--${w.index}`} aria-hidden="true">
                        {w.index === 1 ? '½' : '123'}
                      </span>
                      <span className="prep__text">
                        <span className="prep__name">{t(w.topic.labelKey as TranslationKey)}</span>
                        <span className="prep__state">{line}</span>
                        {done > 0 ? (
                          <span className="meter prep__bar" aria-hidden="true">
                            <span
                              style={{ width: `${Math.round((done / Math.max(1, total)) * 100)}%` }}
                            />
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
