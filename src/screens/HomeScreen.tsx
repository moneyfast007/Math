import { useEffect, useState } from 'react';
import { navigate } from '@/app/router';
import { speaker } from '@/audio/speaker';
import { t } from '@/i18n';
import { ParentGate } from '@/parent/ParentGate';
import { requestParentTab } from '@/parent/tab';
import { isStandalone } from '@/pwa/standalone';
import { useApp } from '@/state/store';
import { applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { Icon } from '@/ui/Icon';
import { LongPressButton } from '@/ui/LongPressButton';
import { Plusi } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { useTypewriter } from '@/ui/useTypewriter';
import { whoIsPlayingTitle } from './homeTitle';

/** When the greeting starts typing: once Plusi has popped in and waved (global.css). */
const GREETING_DELAY_MS = 900;

/**
 * Home: "who is playing today?". Each child taps her own card. The parent
 * entry needs a long press followed by the gate. On first run there is nothing
 * to protect, so setup starts directly from the welcome.
 */
export function HomeScreen() {
  const profiles = useApp((s) => s.data.profiles);
  const hasPin = useApp((s) => s.data.parent.pin !== null);
  const verifyPin = useApp((s) => s.verifyPin);
  const selectProfile = useApp((s) => s.selectProfile);
  const unlockParent = useApp((s) => s.unlockParent);
  const lockParent = useApp((s) => s.lockParent);
  const [gateOpen, setGateOpen] = useState(false);

  // Coming back home always closes the parent area and resets the density.
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
      <Welcome
        onStart={openParents}
        onConnect={() => {
          requestParentTab('settings');
          openParents();
        }}
      />
    );
  }

  return (
    <main className="screen home" data-screen="home">
      <div className="home__center">
        <header className="home__header">
          <div className="home__ask">
            <Plusi size={84} decorative className="home__plusi" />
            <div className="bubble home__bubble">
              <h1 className="home__title">{whoIsPlayingTitle(profiles.map((p) => p.gender))}</h1>
            </div>
          </div>
          <p className="muted home__hint">{t('home.pickHint')}</p>
        </header>

        <ul className="profiles home__profiles" role="list">
          {profiles.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={`profile-card profile-card--c${i % 6}`}
                onClick={() => {
                  selectProfile(p.id);
                  navigate({ name: 'play' });
                }}
              >
                <Avatar id={p.avatar} size="lg" decorative />
                <span className="profile-card__name">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <footer className="home__footer">
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
 * First launch: Plusi pops in, waves, and says hello in a speech bubble that
 * types itself out (all at once with reduced motion). The greeting is also
 * read aloud as the typing starts, where the browser allows sound before a
 * touch; where it does not (iPhone, iPad), on the first touch of the screen
 * that is not a button.
 */
function Welcome({ onStart, onConnect }: { onStart: () => void; onConnect: () => void }) {
  const greeting = t('welcome.greeting');
  const shown = useTypewriter(greeting, { startMs: GREETING_DELAY_MS });
  const done = shown >= greeting.length;

  useEffect(() => {
    let heard = false;
    const play = () => {
      void speaker.speak(greeting).then((result) => {
        if (result === 'clip') heard = true;
      });
    };
    const timer = window.setTimeout(play, GREETING_DELAY_MS);
    const onTouch = (event: PointerEvent) => {
      // A tap on a button does what the button says (the speaker button reads it itself).
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
  }, [greeting]);

  return (
    <main className="screen welcome" data-screen="home">
      <section className="welcome__hero" aria-labelledby="welcome-title">
        <Plusi
          size={132}
          mood={done ? 'cheering' : 'happy'}
          decorative
          className="welcome__plusi"
        />
        <h1 id="welcome-title" className="welcome__name">
          {t('app.name')}
        </h1>
        <p className="welcome__tagline">{t('app.tagline')}</p>
        <div className="bubble bubble--up welcome__bubble" data-typing={done ? undefined : ''}>
          {/* A screen reader gets the whole greeting at once. On screen, the untyped rest
              is in place but hidden, so the bubble never changes size as it fills. */}
          <p className="welcome__greeting">
            <span className="visually-hidden">{greeting}</span>
            <span className="welcome__typed" aria-hidden="true">
              {greeting.slice(0, shown)}
              <span className="welcome__rest">{greeting.slice(shown)}</span>
            </span>
          </p>
          <SpeakerButton text={greeting} />
        </div>
      </section>

      <div className="welcome__actions">
        <button type="button" className="btn btn--hero welcome__cta" onClick={onStart}>
          {t('home.firstRun.cta')}
        </button>
        <p className="welcome__note">{t('welcome.forParents')}</p>
        {isStandalone() ? null : (
          <button
            type="button"
            className="btn btn--ghost btn--small welcome__link"
            onClick={() => navigate({ name: 'install' })}
          >
            <Icon name="home" />
            {t('install.title')}
          </button>
        )}
        <p className="welcome__restore">
          <span>{t('welcome.haveData')}</span>
          <button
            type="button"
            className="btn btn--ghost btn--small welcome__link"
            onClick={onConnect}
          >
            <Icon name="sync" />
            {t('welcome.connect')}
          </button>
        </p>
      </div>

      <footer className="welcome__footer">
        <InfoLink />
      </footer>
    </main>
  );
}

/** Accessibility statement, privacy and terms: in a prominent place, on every home screen. */
function InfoLink() {
  return (
    <a
      className="info-link"
      href="/info"
      onClick={(e) => {
        e.preventDefault();
        navigate({ name: 'info' });
      }}
    >
      {t('info.link')}
    </a>
  );
}
