import { useEffect, useState } from 'react';
import { navigate } from '@/app/router';
import { currentLevel, nextStation } from '@/engine/registry';
import { makeT, t, type TranslationKey } from '@/i18n';
import { useActiveProfile, useApp } from '@/state/store';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { Dialog } from '@/ui/Dialog';
import { SpeakerButton } from '@/ui/SpeakerButton';

/**
 * The child's own home: a greeting and one big button for "the next station".
 * A five-year-old never faces a menu; an older child (or a parent) can pick
 * another level when the profile allows it. Phase 4 grows this into the
 * journey through worlds.
 */
export function ChildHomeScreen() {
  const profile = useActiveProfile();
  const progress = useApp((s) => (profile ? s.data.progress[profile.id] : undefined));
  const setTopicLevel = useApp((s) => s.setTopicLevel);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
    else applyAgeBand(ageBandForGrade(profile.grade));
  }, [profile]);

  if (!profile) return null;
  const tc = makeT(profile.gender);
  const station = nextStation(profile.grade, progress);
  const level = currentLevel(station.topic, profile.grade, progress);
  const levelInfo = station.topic.levels.find((l) => l.level === level);
  const levelName = levelInfo ? t(levelInfo.labelKey as TranslationKey) : '';
  const hello = tc('child.hello', { name: profile.name });

  return (
    <main className="screen" data-screen="play">
      <header className="screen__header">
        <button type="button" className="btn btn--secondary" onClick={() => navigate({ name: 'home' })}>
          {tc('child.switch')}
        </button>
      </header>

      <section className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Avatar id={profile.avatar} size="lg" decorative />
        <h1>{hello}</h1>
      </section>

      <section className="station card" aria-labelledby="station-title">
        <span className="station__eyebrow">{t('child.nextStation')}</span>
        <h2 id="station-title">{t(station.topic.labelKey as TranslationKey)}</h2>
        <p className="muted">{t('child.levelLabel', { params: { level, name: levelName } })}</p>
        <div className="station__actions">
          <button type="button" className="btn btn--hero" onClick={() => navigate({ name: 'practice' })}>
            {t('child.start')}
          </button>
          <SpeakerButton text={t('child.start')} />
        </div>
        {profile.settings.allowLevelChange ? (
          <button type="button" className="btn btn--ghost" onClick={() => setPicking(true)}>
            {t('child.otherLevel')}
          </button>
        ) : null}
      </section>

      {picking ? (
        <Dialog title={t('child.pickLevel')} onClose={() => setPicking(false)}>
          <div className="level-list" role="list">
            {station.topic.levels.map((l) => (
              <button
                key={l.level}
                type="button"
                role="listitem"
                className={l.level === level ? 'level-item level-item--current' : 'level-item'}
                aria-current={l.level === level ? 'true' : undefined}
                onClick={() => {
                  setTopicLevel(profile.id, station.topic.id, l.level);
                  setPicking(false);
                }}
              >
                <span className="level-item__num">{l.level}</span>
                <span>{t(l.labelKey as TranslationKey)}</span>
              </button>
            ))}
          </div>
        </Dialog>
      ) : null}
    </main>
  );
}
