import { useEffect, useState } from 'react';
import { navigate } from '@/app/router';
import { activeWorld } from '@/engine/journey';
import { makeT, t } from '@/i18n';
import { ParentGate } from '@/parent/ParentGate';
import { requestParentTab } from '@/parent/tab';
import { isStandalone } from '@/pwa/standalone';
import type { Profile } from '@/state/schema';
import { useApp } from '@/state/store';
import { applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { BrandMark } from '@/ui/BrandMark';
import { Icon } from '@/ui/Icon';
import { LongPressButton } from '@/ui/LongPressButton';
import { Plusi } from '@/ui/Plusi';
import { InfoLink } from '../HomeScreen';
import { whoIsPlayingTitle } from '../homeTitle';
import { lastPlayed, nowAt, requestNewChild, todayOf, worldName } from './cShared';
import './c.css';

/**
 * Design C of the entry screen: calm and minimal. The child who played last
 * gets one big "continue" card (where she is in her journey, how today is
 * going); the others are small cards under it. On a first visit, a short
 * welcome with what a parent wants to know, and one button straight into
 * creating the first child.
 */
export function HomeC() {
  const profiles = useApp((s) => s.data.profiles);
  const progress = useApp((s) => s.data.progress);
  const hasPin = useApp((s) => s.data.parent.pin !== null);
  const verifyPin = useApp((s) => s.verifyPin);
  const selectProfile = useApp((s) => s.selectProfile);
  const unlockParent = useApp((s) => s.unlockParent);
  const lockParent = useApp((s) => s.lockParent);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    lockParent();
    selectProfile(null);
    applyAgeBand('middle');
  }, [lockParent, selectProfile]);

  const openParents = () => {
    unlockParent();
    navigate({ name: 'parents' });
  };

  if (profiles.length === 0) {
    return (
      <WelcomeC
        onStart={() => {
          requestNewChild();
          openParents();
        }}
        onConnect={() => {
          requestParentTab('settings');
          openParents();
        }}
      />
    );
  }

  const play = (p: Profile) => {
    selectProfile(p.id);
    navigate({ name: 'play' });
  };
  const hero = lastPlayed(profiles, progress) ?? profiles[0];
  const others = profiles.filter((p) => p.id !== hero?.id);
  const now = Date.now();
  const title =
    profiles.length === 1 && hero
      ? t('child.hello', { params: { name: hero.name } })
      : whoIsPlayingTitle(profiles.map((p) => p.gender));

  return (
    <main className="screen c-home" data-screen="home">
      <BrandMark />
      <div className="c-home__center">
        <header className="c-home__ask">
          <Plusi size={72} decorative className="c-home__plusi" />
          <div className="bubble c-home__bubble">
            <h1 className="c-home__title">{title}</h1>
          </div>
        </header>

        {hero ? (
          <HeroCard
            profile={hero}
            index={profiles.indexOf(hero)}
            now={now}
            onPlay={() => play(hero)}
          />
        ) : null}

        {others.length > 0 ? (
          <section className="c-home__others" aria-labelledby="c-others">
            <h2 id="c-others" className="c-home__others-title">
              {t('c.home.others')}
            </h2>
            <ul className="c-home__list" role="list">
              {others.map((p) => {
                const today = todayOf(progress[p.id], now);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`c-kid profile-card--c${profiles.indexOf(p) % 6}`}
                      onClick={() => play(p)}
                    >
                      <Avatar id={p.avatar} size="md" decorative />
                      <span className="c-kid__name">{p.name}</span>
                      {today.practised ? (
                        <span className="c-kid__done">
                          <Check />
                          <span className="visually-hidden">{t('c.home.playedToday')}</span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>

      <footer className="home__footer c-home__footer">
        <LongPressButton
          className="parent-entry"
          onLongPress={() => setGateOpen(true)}
          aria-label={t('parent.title')}
          aria-describedby="parents-hold"
        >
          <span className="parent-entry__icon">
            <Icon name="lock" />
          </span>
          <span className="parent-entry__text">
            <span className="parent-entry__label">{t('parent.title')}</span>
            <span className="parent-entry__hint" id="parents-hold">
              {t('home.parentsHold')}
            </span>
          </span>
        </LongPressButton>
        <InfoLink />
      </footer>

      {gateOpen ? (
        <ParentGate
          hasPin={hasPin}
          verifyPin={verifyPin}
          onUnlock={() => {
            setGateOpen(false);
            openParents();
          }}
          onCancel={() => setGateOpen(false)}
        />
      ) : null}
    </main>
  );
}

/** The big "continue" card: one tap anywhere on it starts where she stopped. */
function HeroCard({
  profile,
  index,
  now,
  onPlay,
}: {
  profile: Profile;
  index: number;
  now: number;
  onPlay: () => void;
}) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const world = activeWorld(profile.grade, progress);
  const today = todayOf(progress, now);
  const goal = profile.settings.dailyGoal;
  const tc = makeT(profile.gender);
  const share = world ? Math.round((world.done / world.total) * 100) : 0;

  let todayLine: string | null = null;
  if (goal && today.rounds >= goal) todayLine = t('c.home.todayDone');
  else if (goal && today.rounds > 0)
    todayLine =
      goal === 1
        ? t('c.home.todayRoundsOne', { params: { done: today.rounds } })
        : t('c.home.todayRounds', { params: { done: today.rounds, goal } });
  else if (goal)
    todayLine = goal === 1 ? t('c.home.todayGoalOne') : t('c.home.todayGoal', { params: { goal } });
  else if (today.practised) todayLine = t('c.home.todayPlayed');

  return (
    <button type="button" className={`c-hero profile-card--c${index % 6}`} onClick={onPlay}>
      <span className="c-hero__avatar">
        <Avatar id={profile.avatar} size="lg" decorative />
      </span>
      <span className="c-hero__body">
        <span className="c-hero__name">{profile.name}</span>
        {world ? (
          <span className="c-hero__where">
            <span className="c-hero__world">{worldName(world)}</span>
            <span className="c-hero__station">
              {world.completed ? tc('parentArea.allWorldsDone') : nowAt(world)}
            </span>
            <span className="meter c-hero__meter" aria-hidden="true">
              <span style={{ width: `${share}%` }} />
            </span>
          </span>
        ) : null}
        {todayLine ? (
          <span className={today.practised ? 'c-hero__today c-hero__today--on' : 'c-hero__today'}>
            {today.practised ? <Check /> : null}
            {todayLine}
          </span>
        ) : null}
      </span>
      <span className="c-hero__go">
        {t('c.home.continue')}
        <span className="c-hero__arrow" aria-hidden="true">
          ←
        </span>
      </span>
    </button>
  );
}

function Check() {
  return (
    <svg className="c-check" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

/** First visit: a short hello, the three things a parent wants to know, and one way in. */
function WelcomeC({ onStart, onConnect }: { onStart: () => void; onConnect: () => void }) {
  return (
    <main className="screen c-welcome" data-screen="home">
      <section className="c-welcome__hero" aria-labelledby="c-welcome-title">
        <Plusi size={112} mood="happy" decorative className="c-welcome__plusi" />
        <h1 id="c-welcome-title" className="c-welcome__name">
          {t('app.name')}
        </h1>
        <p className="c-welcome__tagline">{t('app.tagline')}</p>
        <p className="bubble bubble--up c-welcome__bubble">{t('c.welcome.hello')}</p>
      </section>

      <ul className="c-promises" aria-label={t('c.welcome.promises')}>
        {(['ads', 'signup', 'device'] as const).map((k) => (
          <li key={k} className="c-promises__item">
            <Check />
            {t(`c.welcome.promise.${k}`)}
          </li>
        ))}
      </ul>

      <div className="c-welcome__actions">
        <button type="button" className="btn btn--hero c-welcome__cta" onClick={onStart}>
          {t('c.welcome.cta')}
        </button>
        <p className="muted c-welcome__note">{t('c.welcome.ctaNote')}</p>
      </div>

      <footer className="c-welcome__footer">
        <p className="c-welcome__restore">
          <span className="muted">{t('welcome.haveData')}</span>
          <button type="button" className="btn btn--ghost btn--small" onClick={onConnect}>
            <Icon name="sync" />
            {t('welcome.connect')}
          </button>
        </p>
        {isStandalone() ? null : (
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => navigate({ name: 'install' })}
          >
            <Icon name="home" />
            {t('install.title')}
          </button>
        )}
        <InfoLink />
      </footer>
    </main>
  );
}
