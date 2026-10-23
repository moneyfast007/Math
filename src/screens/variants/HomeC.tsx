import { useEffect, useState } from 'react';
import { speaker } from '@/audio/speaker';
import { navigate } from '@/app/router';
import { activeWorld } from '@/engine/journey';
import { makeT, t } from '@/i18n';
import { ParentGate } from '@/parent/ParentGate';
import { requestParentTab } from '@/parent/tab';
import { isStandalone } from '@/pwa/standalone';
import { summarizeProgress, totalStars } from '@/state/progress';
import type { Profile, ProfileProgress } from '@/state/schema';
import { useApp } from '@/state/store';
import { applyAgeBand } from '@/ui/ageBand';
import { applyPlusiColor } from '@/ui/plusiColor';
import { Avatar } from '@/ui/Avatar';
import { BrandMark } from '@/ui/BrandMark';
import { Icon } from '@/ui/Icon';
import { LongPressButton } from '@/ui/LongPressButton';
import { Plusi } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { InfoLink } from '../HomeScreen';
import { whoIsPlayingTitle } from '../homeTitle';
import {
  markWelcomed,
  nowAt,
  requestNewChild,
  todayOf,
  welcomeBack,
  worldName,
  type Today,
} from './cShared';
import './c.css';

/**
 * Design C of the entry screen: calm and minimal. One child gets one big
 * "continue" card (where she is in her journey, how today is going, her stars);
 * several children get one card each, all the same size and in the family's
 * order, so no one is put first. On a first visit, a short welcome with what a
 * parent wants to know, and one button straight into creating the first child.
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
    applyPlusiColor(undefined);
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
    // Once she is in, the welcome back is done for today.
    markWelcomed(p.id, Date.now());
    selectProfile(p.id);
    navigate({ name: 'play' });
  };
  const only = profiles.length === 1 ? profiles[0] : undefined;
  const now = Date.now();
  // Back after two days or more: Plusi says he missed her (once that day).
  const back = only
    ? welcomeBack(only, progress[only.id], now)
    : profiles.some((p) => welcomeBack(p, progress[p.id], now));
  const title = back
    ? only
      ? makeT(only.gender)('c.welcomeBack.title', { name: only.name })
      : t('c.welcomeBack.titleMany')
    : only
      ? t('child.hello', { params: { name: only.name } })
      : whoIsPlayingTitle(profiles.map((p) => p.gender));
  const spokenBack = only
    ? makeT(only.gender)('journey.welcomeBack.spoken')
    : t('journey.welcomeBack.many');

  return (
    <main className="screen c-home" data-screen="home">
      <BrandMark />
      <div className="c-home__center">
        <header className={back ? 'c-home__ask c-home__ask--back' : 'c-home__ask'}>
          <Plusi
            size={72}
            mood={back ? 'cheering' : 'happy'}
            decorative
            className={back ? 'c-home__plusi c-home__plusi--back' : 'c-home__plusi'}
          />
          <div className="bubble c-home__bubble">
            {back ? <p className="c-home__missed">{t('c.welcomeBack.missed')}</p> : null}
            <h1 className="c-home__title">{title}</h1>
            {back ? <SpeakerButton text={spokenBack} /> : null}
          </div>
        </header>
        {back ? <SayOnce text={spokenBack} /> : null}

        {only ? (
          <HeroCard profile={only} index={0} now={now} onPlay={() => play(only)} />
        ) : (
          <ul className="c-home__list c-home__list--rows" role="list">
            {profiles.map((p, i) => (
              <li key={p.id}>
                <KidRow
                  profile={p}
                  progress={progress[p.id]}
                  index={i}
                  now={now}
                  onPlay={() => play(p)}
                />
              </li>
            ))}
          </ul>
        )}
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

/**
 * Says the welcome back aloud once, when Plusi has popped in. Where the browser
 * allows no sound before a touch (iPhone, iPad), on the first touch of the screen
 * that is not a button (a button does what it says).
 */
function SayOnce({ text }: { text: string }) {
  useEffect(() => {
    let heard = false;
    const play = () => {
      void speaker.speak(text).then((result) => {
        if (result === 'clip') heard = true;
      });
    };
    const timer = window.setTimeout(play, 800);
    const onTouch = (event: PointerEvent) => {
      if ((event.target as Element | null)?.closest('button, a, input, label')) return;
      if (!heard) {
        heard = true;
        play();
      }
      document.removeEventListener('pointerdown', onTouch);
    };
    document.addEventListener('pointerdown', onTouch);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onTouch);
      speaker.stop();
    };
  }, [text]);
  return null;
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

  const todayLine = todayLineOf(goal, today);
  const stars = totalStars(progress);
  const never = summarizeProgress(progress).lastPracticedAt === null;

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
      {stars > 0 ? <StarCount stars={stars} /> : null}
      <span className="c-hero__go">
        {never ? t('c.home.start') : t('c.home.continue')}
        <span className="c-hero__arrow" aria-hidden="true">
          ←
        </span>
      </span>
    </button>
  );
}

/** How today is going, in a few words; null when there is nothing to say. */
function todayLineOf(goal: Profile['settings']['dailyGoal'], today: Today): string | null {
  if (goal && today.rounds >= goal) return t('c.home.todayDone');
  if (goal && today.rounds > 0)
    return goal === 1
      ? t('c.home.todayRoundsOne', { params: { done: today.rounds } })
      : t('c.home.todayRounds', { params: { done: today.rounds, goal } });
  if (goal)
    return goal === 1 ? t('c.home.todayGoalOne') : t('c.home.todayGoal', { params: { goal } });
  if (today.practised) return t('c.home.todayPlayed');
  return null;
}

/** The stars she collected: a gold star and the number (said in full to a screen reader). */
function StarCount({ stars }: { stars: number }) {
  return (
    <span className="c-stars">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="c-stars__icon">
        <path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z" />
      </svg>
      <span className="visually-hidden">
        {stars === 1 ? t('b.home.starsOne') : t('b.home.stars', { params: { count: stars } })}
      </span>
      <span aria-hidden="true">{stars}</span>
    </span>
  );
}

/**
 * One child of several: the same card for each, in the family's order. The whole
 * card is the button: her face and name, where she is, today, her stars.
 */
function KidRow({
  profile,
  progress,
  index,
  now,
  onPlay,
}: {
  profile: Profile;
  progress: ProfileProgress | undefined;
  index: number;
  now: number;
  onPlay: () => void;
}) {
  const world = activeWorld(profile.grade, progress);
  const today = todayOf(progress, now);
  const tc = makeT(profile.gender);
  const stars = totalStars(progress);
  const never = summarizeProgress(progress).lastPracticedAt === null;
  const share = world ? Math.round((world.done / world.total) * 100) : 0;
  const todayLine = todayLineOf(profile.settings.dailyGoal, today);
  return (
    <button type="button" className={`c-kidrow profile-card--c${index % 6}`} onClick={onPlay}>
      <span className="c-kidrow__avatar">
        <Avatar id={profile.avatar} size="md" decorative />
        {today.practised ? (
          <span className="c-kid__done">
            <Check />
            <span className="visually-hidden">{tc('c.home.playedToday')}</span>
          </span>
        ) : null}
      </span>
      <span className="c-kidrow__body">
        <span className="c-kidrow__top">
          <span className="c-kidrow__name">{profile.name}</span>
          {stars > 0 ? <StarCount stars={stars} /> : null}
        </span>
        {world ? (
          <span className="c-kidrow__where">
            {world.completed ? tc('parentArea.allWorldsDone') : worldName(world)}
          </span>
        ) : null}
        {world && !world.completed ? (
          <span className="meter c-kidrow__meter" aria-hidden="true">
            <span style={{ width: `${share}%` }} />
          </span>
        ) : null}
        {todayLine ? (
          <span
            className={today.practised ? 'c-kidrow__today c-kidrow__today--on' : 'c-kidrow__today'}
          >
            {todayLine}
          </span>
        ) : null}
      </span>
      <span className="c-kidrow__go" aria-hidden="true">
        {never ? t('c.home.start') : t('c.home.continue')}
        <span className="c-hero__arrow">←</span>
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
