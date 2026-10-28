import { useEffect } from 'react';
import { navigate } from '@/app/router';
import { clearChosenStation } from '@/app/station';
import { enterTrack, leaveTrack, showsTestPrep, trackOf } from '@/app/track';
import { trackWorlds, type World } from '@/engine/journey';
import { t, type TranslationKey } from '@/i18n';
import { useActiveProfile, useApp } from '@/state/store';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { BrandMark } from '@/ui/BrandMark';
import { applyPlusiColor } from '@/ui/plusiColor';
import './testPrep.css';

/**
 * Grade 4's practice for the school's test ("מיפוי"): its two worlds, each with
 * how far she got, opened from the journey's button. Choosing one opens its map
 * in place of the journey's; "חזרה למסע" goes back to where she was.
 */
export function TestPrepScreen() {
  const profile = useActiveProfile();
  const progress = useApp((s) => (profile ? s.data.progress[profile.id] : undefined));

  useEffect(() => {
    if (!profile || !showsTestPrep(profile)) navigate({ name: 'play' }, { replace: true });
    else {
      applyAgeBand(ageBandForGrade(profile.grade));
      applyPlusiColor(profile.plusiColor);
    }
  }, [profile]);
  if (!profile || !showsTestPrep(profile)) return null;

  const worlds = trackWorlds(profile.grade, progress);
  const current = trackOf(profile.id);
  const open = (w: World) => {
    enterTrack(profile.id, w.topic.id);
    clearChosenStation();
    navigate({ name: 'play' });
  };
  const back = () => {
    leaveTrack(profile.id);
    clearChosenStation();
    navigate({ name: 'play' });
  };

  return (
    <main className="screen prep" data-screen="mapping">
      <BrandMark />
      <header className="screen__header prep__header">
        <div>
          <p className="prep__grade">{t('map4.grade')}</p>
          <h1>{t('map4.title')}</h1>
          <p className="muted">{t('map4.intro')}</p>
        </div>
        <button type="button" className="btn btn--secondary" onClick={back}>
          {t('map4.back')}
        </button>
      </header>

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
                onClick={() => open(w)}
              >
                <span className={`prep__badge prep__badge--${w.index}`} aria-hidden="true">
                  {w.index === 1 ? '½' : '123'}
                </span>
                <span className="prep__text">
                  <span className="prep__name">{t(w.topic.labelKey as TranslationKey)}</span>
                  <span className="prep__state">{line}</span>
                  <span className="meter prep__bar" aria-hidden="true">
                    <span style={{ width: `${Math.round((done / Math.max(1, total)) * 100)}%` }} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
