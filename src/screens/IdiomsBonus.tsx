import { navigate } from '@/app/router';
import { clearChosenStation } from '@/app/station';
import { enterTrack, trackOf } from '@/app/track';
import { trackWorlds } from '@/engine/journey';
import { t } from '@/i18n';
import type { Profile, ProfileProgress } from '@/state/schema';
import './testPrep.css';

/**
 * One family's bonus world, Hebrew idioms (app/bonus.ts), on the worlds screen:
 * one card with how far she got. Choosing it opens its map in place of the
 * journey's; "חזרה למסע" on that map goes back to where she was.
 */
export function IdiomsSection({
  profile,
  progress,
}: {
  profile: Profile;
  progress: ProfileProgress | undefined;
}) {
  const world = trackWorlds(profile.grade, progress, 'idioms')[0];
  if (!world) return null;
  const total = world.stations.length;
  const done = world.stations.filter((s) => s.state === 'done').length;
  const line =
    done === 0
      ? t('map4.notYet')
      : done >= total
        ? t('map4.done')
        : t('map4.stations', { params: { done, total } });
  const play = () => {
    enterTrack(profile.id, world.topic.id);
    clearChosenStation();
    navigate({ name: 'play' });
  };

  return (
    <section className="prep-wrap" aria-labelledby="idioms-title">
      <h2 id="idioms-title" className="prep__label">
        {t('idioms.bonus')}
      </h2>
      <div className="prep prep--idioms">
        <button
          type="button"
          className={
            trackOf(profile.id) === world.topic.id
              ? 'prep__world prep__world--current'
              : 'prep__world'
          }
          onClick={play}
        >
          <span className="prep__badge prep__badge--idioms" aria-hidden="true">
            אב
          </span>
          <span className="prep__text">
            <span className="prep__name">{t('idioms.title')}</span>
            <span className="prep__parts-line">{t('idioms.parts')}</span>
            <span className="prep__state">{line}</span>
            {done > 0 ? (
              <span className="meter prep__bar" aria-hidden="true">
                <span style={{ width: `${Math.round((done / Math.max(1, total)) * 100)}%` }} />
              </span>
            ) : null}
          </span>
        </button>
      </div>
    </section>
  );
}
