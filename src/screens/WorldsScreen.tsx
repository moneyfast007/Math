import { useEffect, useState } from 'react';
import { setReplayTopic } from '@/app/replay';
import { navigate } from '@/app/router';
import { worldsMap, type WorldMapEntry } from '@/engine/journey';
import { t, type TranslationKey } from '@/i18n';
import { gradeLabel } from '@/i18n/labels';
import { compose } from '@/lang/compose';
import { useActiveProfile, useApp } from '@/state/store';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { Dialog } from '@/ui/Dialog';
import { Plusi } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { Sticker } from '@/ui/Sticker';
import { stickerForWorld } from '@/ui/stickers';
import { IntroSpeaker, JourneySteps, LockIcon } from './JourneyIntro';

/**
 * The map of all worlds: every world of the child's grade in order, with where
 * she stands in each. Finished worlds can be played again (as from the album),
 * the current one leads back to the journey, and a locked one says which world
 * opens it. Worlds open in order only: a locked world has nothing to press.
 */
export function WorldsScreen() {
  const profile = useActiveProfile();
  const progress = useApp((s) => (profile ? s.data.progress[profile.id] : undefined));
  const [how, setHow] = useState(false);

  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
    else applyAgeBand(ageBandForGrade(profile.grade));
  }, [profile]);
  if (!profile) return null;

  const young = ageBandForGrade(profile.grade) === 'young';
  const entries = worldsMap(profile.grade, progress);
  const done = entries.filter((e) => e.state === 'done').length;
  const total = entries.length;
  const line =
    done === 0
      ? t('journey.worlds.count.none')
      : done === total
        ? t('journey.worlds.count.all', { gender: profile.gender })
        : t('journey.worlds.count', { params: { done, total } });
  // Read aloud with the numbers as words ("עולם" is masculine: "שלושה מתוך שמונה").
  const spoken =
    done > 0 && done < total
      ? compose(t('journey.worlds.count'), {
          done: { n: done, gender: 'm' },
          total: { n: total, gender: 'm' },
        })
      : { text: line, parts: [line] };

  return (
    <main className="screen worlds" data-screen="worlds">
      <header className="screen__header worlds__header">
        <div className="worlds__heading">
          <h1>{t('worlds.title')}</h1>
          <p className="muted">
            {t('worlds.intro', { params: { grade: gradeLabel(profile.grade) } })}
          </p>
          <button type="button" className="worlds__how" onClick={() => setHow(true)}>
            <span aria-hidden="true" className="worlds__how-mark">?</span>
            {t('worlds.how')}
          </button>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate({ name: 'play' })}
        >
          {t('album.back')}
        </button>
      </header>

      <section className="card album__status">
        <Plusi mood={done > 0 ? 'cheering' : 'happy'} size={56} decorative />
        <p className="album__line">{line}</p>
        <SpeakerButton text={spoken.text} parts={spoken.parts} />
      </section>

      <ol className="worlds__list" aria-label={t('worlds.list')}>
        {entries.map((entry) => (
          <WorldRow key={entry.world.topic.id} entry={entry} young={young} />
        ))}
      </ol>

      {how ? (
        <Dialog
          title={t('worlds.how')}
          onClose={() => setHow(false)}
          actions={
            <button type="button" className="btn" onClick={() => setHow(false)}>
              {t('journey.intro.ok')}
            </button>
          }
        >
          <div className="intro intro--dialog">
            <div className="intro__head">
              <Plusi mood="happy" size={48} decorative />
              <IntroSpeaker />
            </div>
            <JourneySteps />
          </div>
        </Dialog>
      ) : null}
    </main>
  );
}

function WorldRow({ entry, young }: { entry: WorldMapEntry; young: boolean }) {
  const { world, state, after } = entry;
  const name = t(world.topic.labelKey as TranslationKey);
  return (
    <li
      className={`world-row world-row--${state}`}
      aria-current={state === 'current' ? 'step' : undefined}
    >
      <span className="world-row__badge" aria-hidden="true">
        {state === 'done' ? (
          <Sticker id={stickerForWorld(world.index)} size="100%" />
        ) : state === 'current' ? (
          <Plusi size="100%" decorative />
        ) : (
          <LockIcon />
        )}
      </span>

      <div className="world-row__text">
        <h2 className="world-row__name">
          {t('journey.world', { params: { index: world.index, name } })}
        </h2>
        <p className="world-row__state">
          <span className={`world-row__chip world-row__chip--${state}`}>
            {t(`worlds.state.${state}`)}
          </span>
          {state === 'current' ? (
            <span className={young ? 'visually-hidden' : 'world-row__count'}>
              {t('worlds.stations', { params: { done: world.done, total: world.total } })}
            </span>
          ) : null}
        </p>
        {state === 'current' ? (
          <span className="world-row__bar" aria-hidden="true">
            <span style={{ width: `${Math.round((world.done / world.total) * 100)}%` }} />
          </span>
        ) : null}
        {after ? (
          <p className="world-row__why">
            {t('worlds.locked', { params: { name: t(after.topic.labelKey as TranslationKey) } })}
          </p>
        ) : null}
      </div>

      {state === 'done' ? (
        <button
          type="button"
          className="btn btn--secondary btn--small world-row__action"
          aria-label={t('album.replay.label', { params: { name } })}
          onClick={() => {
            setReplayTopic(world.topic.id);
            navigate({ name: 'replay' });
          }}
        >
          {t('album.replay')}
        </button>
      ) : state === 'current' ? (
        <button
          type="button"
          className="btn btn--small world-row__action"
          onClick={() => navigate({ name: 'play' })}
        >
          {t('worlds.continue')}
        </button>
      ) : null}
    </li>
  );
}
