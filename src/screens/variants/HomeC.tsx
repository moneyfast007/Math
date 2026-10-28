import { useEffect, useState } from 'react';
import { speaker } from '@/audio/speaker';
import { navigate } from '@/app/router';
import { activeWorld, worldsFor, type World } from '@/engine/journey';
import { makeT, t } from '@/i18n';
import { ParentEntry } from '@/parent/ParentEntry';
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
import { SceneStrip } from '@/ui/scenes/SceneStrip';
import {
  CompanionArt,
  companionFor,
  sceneForWorld,
  sceneStyleForGrade,
} from '@/ui/scenes/companions';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { InfoLink } from '../HomeScreen';
import { whoIsPlayingTitle } from '../homeTitle';
import { dayKey } from '@/state/streak';
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
 * Design C of the entry screen, set like a game. One child stands on a stage:
 * her world's scene behind her (lit as far as she got), her name on a ribbon,
 * the friends she collected beside her, her world and station on a sign, and a
 * big button to go on. Several children stand side by side, each on a pedestal,
 * all the same size and in the family's order (no one put first): a tap on one
 * starts her journey. On a first visit, a short welcome with what a
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
          <ul className="c-home__list c-pick" role="list">
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
        <ParentsTip />
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
        <ParentEntry
          hasPin={hasPin}
          verifyPin={verifyPin}
          onUnlock={() => {
            setGateOpen(false);
            endParentsTip();
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

/** The friends she collected: those of the worlds she finished, the latest two. */
function friendsOf(profile: Profile, progress: ProfileProgress | undefined) {
  const style = sceneStyleForGrade(profile.grade);
  return worldsFor(profile.grade, progress)
    .filter((w) => w.completed)
    .map((w) => companionFor(style, w.index - 1))
    .filter((c) => c !== null)
    .slice(-2);
}

/** Her world's stations as dots: done, the one she is at, still to come. */
function Trail({ world }: { world: World }) {
  const stations = world.stations.filter((s) => !s.warmup);
  return (
    <span className="c-trail" aria-hidden="true">
      {stations.map((s) => (
        <span
          key={s.level}
          className={
            s.state === 'done' || s.state === 'skipped'
              ? 'c-trail__dot c-trail__dot--done'
              : s.state === 'current'
                ? 'c-trail__dot c-trail__dot--here'
                : 'c-trail__dot'
          }
        />
      ))}
      <span
        className={
          world.review === 'done'
            ? 'c-trail__cup c-trail__cup--done'
            : world.review === 'current'
              ? 'c-trail__cup c-trail__cup--here'
              : 'c-trail__cup'
        }
      />
    </span>
  );
}

/**
 * One child: her stage. The scene of her world (as far as she got), her face big
 * with her name on a ribbon and her friends beside her, where she is, and one big
 * button to go on (her face starts too, for a small hand).
 */
function HeroCard({
  profile,
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
  const todayLine = todayLineOf(goal, today);
  const stars = totalStars(progress);
  const never = summarizeProgress(progress).lastPracticedAt === null;
  const friends = friendsOf(profile, progress);
  const scene = world ? sceneForWorld(sceneStyleForGrade(profile.grade), world.index - 1) : null;

  return (
    <section className="c-stage" aria-label={profile.name}>
      {stars > 0 || todayLine ? (
        <div className="c-stage__hud">
          {stars > 0 ? <StarCount stars={stars} /> : null}
          {todayLine ? (
            <span
              className={today.practised ? 'c-stage__today c-stage__today--on' : 'c-stage__today'}
            >
              {today.practised ? <Check /> : null}
              {todayLine}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="c-stage__scene">
        {world && scene ? (
          <SceneStrip
            kind={scene}
            total={world.total}
            marks={Array.from({ length: world.done }, () => true)}
            done={world.done}
            quiet
            label={world.completed ? tc('parentArea.allWorldsDone') : nowAt(world)}
          />
        ) : (
          <div className="c-stage__sky" />
        )}
        <div className="c-stage__cast">
          {friends[0] ? (
            <span className="c-stage__friend c-stage__friend--a" aria-hidden="true">
              <CompanionArt id={friends[0].id} size="80%" />
            </span>
          ) : null}
          <span className="c-stage__me" aria-hidden="true" onClick={onPlay}>
            <span className="c-ribbon">{profile.name}</span>
            <span className="c-stage__avatar">
              <Avatar id={profile.avatar} size="lg" decorative />
            </span>
            <span className="c-stage__floor" />
          </span>
          {friends[1] ? (
            <span className="c-stage__friend c-stage__friend--b" aria-hidden="true">
              <CompanionArt id={friends[1].id} size="80%" />
            </span>
          ) : null}
        </div>
      </div>
      {world ? (
        <div className="c-sign">
          <span className="c-sign__world">{worldName(world)}</span>
          {world.completed ? null : <Trail world={world} />}
          <span className="c-sign__station">
            {world.completed ? tc('parentArea.allWorldsDone') : nowAt(world)}
          </span>
        </div>
      ) : null}
      <button type="button" className="c-hero" onClick={onPlay}>
        {never ? t('c.home.start') : t('c.home.continue')}
        <span className="c-hero__arrow" aria-hidden="true">
          ←
        </span>
      </button>
    </section>
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
  return (
    <button type="button" className="c-kidrow" data-index={index} onClick={onPlay}>
      <span className="c-ribbon c-ribbon--small">{profile.name}</span>
      <span className="c-kidrow__avatar">
        <Avatar id={profile.avatar} size="lg" decorative />
      </span>
      <span className="c-kidrow__pedestal">
        {stars > 0 ? <StarCount stars={stars} /> : null}
        {today.practised ? (
          <span className="c-kidrow__today">
            <Check />
            {tc('c.home.playedToday')}
          </span>
        ) : null}
        {world ? (
          <span className="c-kidrow__where">
            {world.completed
              ? tc('parentArea.allWorldsDone')
              : t('c.home.worldN', { params: { n: world.index } })}
          </span>
        ) : null}
        <span className="c-kidrow__go">
          {never ? t('c.home.start') : t('c.home.continue')}
          <span className="c-hero__arrow" aria-hidden="true">
            ←
          </span>
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

/* ---------- A tip for the parents: where their area is ---------- */

const TIP_KEY = 'parents-tip';
const TIP_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

interface TipState {
  /** When it was first shown (ms). */
  first: number;
  /** Closed with × on this day ("YYYY-MM-DD"): back tomorrow. */
  hidden: string | null;
  /** The parent went in through the gate. */
  done: boolean;
}

function readTip(): TipState | null {
  try {
    const raw = localStorage.getItem(TIP_KEY);
    if (raw === 'done') return { first: 0, hidden: null, done: true };
    return raw ? (JSON.parse(raw) as TipState) : null;
  } catch {
    return { first: 0, hidden: null, done: true };
  }
}

function writeTip(state: TipState): void {
  try {
    localStorage.setItem(TIP_KEY, JSON.stringify(state));
  } catch {
    // Without storage the tip may come back; nothing depends on it.
  }
}

/** Shown every day until the parent goes in, for a week at most; × hides it until tomorrow. */
function showParentsTip(state: TipState | null, now: number): boolean {
  if (!state) return true;
  if (state.done || now - state.first >= TIP_DAYS * DAY_MS) return false;
  return state.hidden !== dayKey(now);
}

/** The parent found the way in: the tip is not shown again. */
function endParentsTip(): void {
  writeTip({ first: 0, hidden: null, done: true });
}

/**
 * Above the parents' button: what is behind it and how to get in. Every day
 * until the parent goes in once, for a week at most (showParentsTip). The first profile is made without the gate, so a
 * parent may not know the long press yet.
 */
function ParentsTip() {
  const [shown, setShown] = useState(() => {
    const now = Date.now();
    const state = readTip();
    const show = showParentsTip(state, now);
    if (show && !state) writeTip({ first: now, hidden: null, done: false });
    return show;
  });
  if (!shown) return null;
  return (
    <aside className="parents-tip" aria-label={t('home.parentsTip.title')}>
      <span className="parents-tip__icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
        </svg>
      </span>
      <p className="parents-tip__text">
        <b>{t('home.parentsTip.title')}</b> {t('home.parentsTip.body')}
      </p>
      <button
        type="button"
        className="btn btn--ghost parents-tip__close"
        aria-label={t('home.parentsTip.close')}
        onClick={() => {
          const state = readTip() ?? { first: Date.now(), hidden: null, done: false };
          writeTip({ ...state, hidden: dayKey(Date.now()) });
          setShown(false);
        }}
      >
        ×
      </button>
    </aside>
  );
}
