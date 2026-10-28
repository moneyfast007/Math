import { useEffect, useState } from 'react';
import { navigate } from '@/app/router';
import { makeT, t } from '@/i18n';
import { ParentEntry } from '@/parent/ParentEntry';
import { ProfileForm } from '@/parent/ProfileForm';
import { requestParentTab } from '@/parent/tab';
import { MAX_PROFILES, type Profile, type ProfileProgress } from '@/state/schema';
import { dayKey } from '@/state/streak';
import { useApp } from '@/state/store';
import { applyAgeBand } from '@/ui/ageBand';
import { applyPlusiColor } from '@/ui/plusiColor';
import { Avatar } from '@/ui/Avatar';
import { BrandMark } from '@/ui/BrandMark';
import { Icon } from '@/ui/Icon';
import { LongPressButton } from '@/ui/LongPressButton';
import { Plusi } from '@/ui/Plusi';
import { ChildAdded } from '../ParentScreen';
import { InfoLink, Welcome } from '../HomeScreen';
import { whoIsPlayingTitle } from '../homeTitle';
import './b.css';

/** Today's practice of one child, from what the app already keeps per day. */
export function todayOf(progress: ProfileProgress | undefined, now: number) {
  const d = progress?.days[dayKey(now)];
  return {
    exercises: d?.exercises ?? 0,
    correct: d?.correct ?? 0,
    rounds: d?.rounds ?? 0,
    daily: d?.daily ?? false,
  };
}

/** Every station's best stars, added up: what the child has collected so far. */
export function starsOf(progress: ProfileProgress | undefined): number {
  let n = 0;
  for (const s of Object.values(progress?.topics ?? {})) {
    for (const v of Object.values(s.stars ?? {})) n += v;
  }
  return n;
}

/**
 * Design B of the entry screen, "today first": the children as big warm cards,
 * each saying at a glance whether she has played today (and how far toward the
 * daily goal), for her and for the parent. Under them, a slim line of what a
 * parent wants to know, and the way in. On a first visit, the welcome's one
 * button opens the new child's form right here.
 */
export function HomeB() {
  const profiles = useApp((s) => s.data.profiles);
  const hasPin = useApp((s) => s.data.parent.pin !== null);
  const verifyPin = useApp((s) => s.verifyPin);
  const selectProfile = useApp((s) => s.selectProfile);
  const unlockParent = useApp((s) => s.unlockParent);
  const lockParent = useApp((s) => s.lockParent);
  const addProfile = useApp((s) => s.addProfile);
  const [gateOpen, setGateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [added, setAdded] = useState<Profile | null>(null);

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

  const play = (p: Profile) => {
    selectProfile(p.id);
    navigate({ name: 'play' });
  };

  // The dialogs of the first child: kept above whichever screen is showing.
  const firstRun = (
    <>
      {creating ? (
        <ProfileForm
          onSave={(input) => {
            setAdded(addProfile(input));
            setCreating(false);
          }}
          onClose={() => setCreating(false)}
        />
      ) : null}
      {added ? (
        <ChildAdded
          profile={added}
          canAddAnother={profiles.length < MAX_PROFILES}
          onPlay={() => play(added)}
          onAddAnother={() => {
            setAdded(null);
            setCreating(true);
          }}
          onClose={() => setAdded(null)}
        />
      ) : null}
    </>
  );

  if (profiles.length === 0) {
    return (
      <>
        <Welcome
          onStart={() => setCreating(true)}
          onConnect={() => {
            requestParentTab('settings');
            openParents();
          }}
        />
        {firstRun}
      </>
    );
  }

  const now = Date.now();
  return (
    <main className="screen home home-b" data-screen="home">
      <BrandMark />
      <div className="home__center">
        <header className="home__header">
          <div className="home__ask">
            <Plusi size={84} decorative className="home__plusi" />
            <div className="bubble home__bubble">
              <h1 className="home__title">{whoIsPlayingTitle(profiles.map((p) => p.gender))}</h1>
            </div>
          </div>
        </header>

        <ul className="home-b__cards" role="list" data-count={Math.min(profiles.length, 4)}>
          {profiles.map((p, i) => (
            <li key={p.id}>
              <KidCard profile={p} index={i} now={now} onPlay={() => play(p)} />
            </li>
          ))}
        </ul>
      </div>

      <footer className="home-b__footer">
        <ul className="home-b__trust" role="list" aria-label={t('b.home.trust.label')}>
          {(['ads', 'tracking', 'signup'] as const).map((k) => (
            <li key={k}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="home-b__tick">
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
              {t(`b.home.trust.${k}`)}
            </li>
          ))}
        </ul>
        <div className="home-b__ways">
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
        </div>
      </footer>

      {gateOpen ? (
        <ParentEntry
          hasPin={hasPin}
          verifyPin={verifyPin}
          onUnlock={() => {
            setGateOpen(false);
            openParents();
          }}
          onCancel={() => setGateOpen(false)}
        />
      ) : null}
      {firstRun}
    </main>
  );
}

/** One child's card: her avatar and name, and a ribbon that says how today went. */
function KidCard({
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
  const today = todayOf(progress, now);
  const stars = starsOf(progress);
  const goal = profile.settings.dailyGoal;
  const tc = makeT(profile.gender);
  const played = today.exercises > 0 || today.rounds > 0;
  const reached = goal !== undefined && today.rounds >= goal;
  const state = reached ? 'goal' : played ? 'done' : 'not';
  const status = goal
    ? reached
      ? t('goal.reached')
      : played
        ? t('goal.progress', { params: { done: today.rounds, goal } })
        : t('b.home.today.notYet')
    : played
      ? tc('b.home.today.done')
      : t('b.home.today.notYet');
  const nameId = `kid-${profile.id}-name`;
  const infoId = `kid-${profile.id}-today`;

  return (
    <button
      type="button"
      className={`kid-card kid-card--c${index % 6}`}
      data-today={state}
      aria-labelledby={nameId}
      aria-describedby={infoId}
      onClick={onPlay}
    >
      {played ? (
        <span className="kid-card__seal" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5l4.2 4.2L19 7" />
          </svg>
        </span>
      ) : null}
      <span className="kid-card__avatar">
        <Avatar id={profile.avatar} size="lg" decorative />
      </span>
      <span className="kid-card__name" id={nameId}>
        {profile.name}
      </span>
      <span className="kid-card__today" id={infoId}>
        <span className="kid-card__status">
          {goal ? (
            <span className="kid-card__dots" aria-hidden="true">
              {Array.from({ length: goal }, (_, i) => (
                <span
                  key={i}
                  className={i < today.rounds ? 'kid-card__dot kid-card__dot--on' : 'kid-card__dot'}
                />
              ))}
            </span>
          ) : null}
          {status}
        </span>
        {stars > 0 ? (
          <span className="kid-card__stars">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z" />
            </svg>
            <span className="visually-hidden">
              {', '}
              {stars === 1 ? t('b.home.starsOne') : t('b.home.stars', { params: { count: stars } })}
            </span>
            <span aria-hidden="true">{stars}</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}
