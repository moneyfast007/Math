import { useEffect, useRef, useState } from 'react';
import { speaker } from '@/audio/speaker';
import { useSpeaking } from '@/audio/useSpeaker';
import { setReplayTopic } from '@/app/replay';
import { navigate } from '@/app/router';
import { leaveTrack, showsTestPrep } from '@/app/track';
import { dailyPool } from '@/engine/daily';
import { worldsMap, type WorldMapEntry } from '@/engine/journey';
import { t, type TranslationKey } from '@/i18n';
import { gradeLabel } from '@/i18n/labels';
import { compose } from '@/lang/compose';
import { useActiveProfile, useApp } from '@/state/store';
import { dayKey } from '@/state/streak';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { BrandMark } from '@/ui/BrandMark';
import { Dialog } from '@/ui/Dialog';
import { Plusi } from '@/ui/Plusi';
import { applyPlusiColor } from '@/ui/plusiColor';
import { Sticker } from '@/ui/Sticker';
import { stickerForWorld } from '@/ui/stickers';
import { IntroSpeaker, JourneySteps, LockIcon } from './JourneyIntro';
import { TestPrepSection } from './TestPrep';

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
    else {
      applyAgeBand(ageBandForGrade(profile.grade));
      applyPlusiColor(profile.plusiColor);
    }
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
      <BrandMark />
      <header className="screen__header worlds__header">
        <div className="worlds__heading">
          <h1>{t('worlds.title')}</h1>
          <p className="muted">
            {t('worlds.intro', { params: { grade: gradeLabel(profile.grade) } })}
          </p>
          <div className="worlds__how-row">
            <button type="button" className="worlds__how" onClick={() => setHow(true)}>
              <span aria-hidden="true" className="worlds__how-mark">
                ?
              </span>
              {t('worlds.how')}
            </button>
            <PlusiSays line={line} text={spoken.text} parts={spoken.parts} cheering={done > 0} />
          </div>
        </div>
        {/* The current world's card leads back to the journey; once every world is
            finished there is none, and this is the way back. */}
        {entries.some((e) => e.state === 'current') ? null : (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              leaveTrack(profile.id);
              navigate({ name: 'play' });
            }}
          >
            {t('album.back')}
          </button>
        )}
      </header>

      {/* Grade 4's practice for the school's test, open at any time (the parent can hide it). */}
      {showsTestPrep(profile) ? <TestPrepSection profile={profile} progress={progress} /> : null}

      {/* Review from every world she has passed stations in: the place for it is here. */}
      {dailyPool(profile.grade, progress).length > 0 ? (
        <ReviewCard done={progress?.days[dayKey(Date.now())]?.daily === true} />
      ) : null}

      <ol className="worlds__list" aria-label={t('worlds.list')}>
        {entries.map((entry) => (
          <WorldRow
            key={entry.world.topic.id}
            entry={entry}
            young={young}
            // The journey's world: back to the journey (out of the test practice, if in it).
            onJourney={() => {
              leaveTrack(profile.id);
              navigate({ name: 'play' });
            }}
          />
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

function ReviewCard({ done }: { done: boolean }) {
  return (
    <button
      type="button"
      className="card worlds-review"
      aria-label={done ? t('journey.dailyDone') : t('journey.daily')}
      onClick={() => navigate({ name: 'daily' })}
    >
      <span className="worlds-review__icon" aria-hidden="true">
        <AllWorldsIcon />
        {done ? (
          <span className="worlds-review__check">
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
          </span>
        ) : null}
      </span>
      <span className="worlds-review__text" aria-hidden="true">
        <span className="worlds-review__title">{t('journey.daily')}</span>
        <span className="worlds-review__sub">
          {done ? t('worlds.review.done') : t('worlds.review.sub')}
        </span>
      </span>
      <span className="worlds-review__go" aria-hidden="true">
        ←
      </span>
    </button>
  );
}

/** Three little worlds and a sparkle: exercises from all of them. */
function AllWorldsIcon() {
  return (
    <svg viewBox="0 0 48 48">
      <circle cx="16" cy="30" r="10" fill="#7fc8bd" />
      <circle cx="32" cy="30" r="10" fill="#f2a46b" />
      <circle cx="24" cy="16" r="10" fill="#a9b0f0" />
      <path d="M40 4l1.6 4.4L46 10l-4.4 1.6L40 16l-1.6-4.4L34 10l4.4-1.6z" fill="#f0b42c" />
    </svg>
  );
}

function WorldRow({
  entry,
  young,
  onJourney,
}: {
  entry: WorldMapEntry;
  young: boolean;
  onJourney: () => void;
}) {
  const { world, state, after } = entry;
  const name = t(world.topic.labelKey as TranslationKey);
  // The level stations only; the final challenge is named on its own once they are done.
  const levels = Math.max(1, world.stations.length);
  const levelsDone = world.stations.filter((s) => s.state === 'done').length;
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
            {state === 'done' ? <CheckMark /> : null}
            {t(`worlds.state.${state}`)}
          </span>
          {state === 'current' ? (
            <span className={young ? 'visually-hidden' : 'world-row__count'}>
              {levelsDone === levels
                ? t('worlds.stationsChallenge', { params: { total: levels } })
                : t('worlds.stations', { params: { done: levelsDone, total: levels } })}
            </span>
          ) : null}
        </p>
        {state === 'current' ? (
          <span className="world-row__bar" aria-hidden="true">
            <span style={{ width: `${Math.round((levelsDone / levels) * 100)}%` }} />
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
          <ReplayMark />
          {t('album.replay')}
        </button>
      ) : state === 'current' ? (
        <button type="button" className="btn btn--small world-row__action" onClick={onJourney}>
          {t('worlds.continue')}
        </button>
      ) : null}
    </li>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" className="world-row__check" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

/** Round arrows: this world, played again. */
function ReplayMark() {
  return (
    <svg viewBox="0 0 24 24" className="world-row__replay" aria-hidden="true">
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 4v4h4" />
    </svg>
  );
}

/**
 * A small round Plusi: a tap reads how far the child got ("השלמת שלושה מתוך
 * שמונה עולמות"), a second tap stops. The line is its name, so a screen reader
 * says it too; with no audio it shows the line for a moment.
 */
function PlusiSays({
  line,
  text,
  parts,
  cheering,
}: {
  line: string;
  text: string;
  parts: readonly string[];
  cheering: boolean;
}) {
  const speaking = useSpeaking() === text;
  const [shown, setShown] = useState(false);
  const open = shown || speaking;
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!shown) return;
    const id = window.setTimeout(() => setShown(false), 4000);
    return () => window.clearTimeout(id);
  }, [shown]);
  // A tap anywhere else closes the bubble (and stops the reading).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current?.contains(e.target as Node)) return;
      setShown(false);
      if (speaker.speaking === text) speaker.stop();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, text]);

  const onClick = async () => {
    // A second tap closes it.
    if (open) {
      setShown(false);
      if (speaking) speaker.stop();
      return;
    }
    setShown(true);
    await speaker.speak(text, { parts });
  };

  return (
    <span className="worlds__plusi" ref={root}>
      {shown || speaking ? (
        <span className="worlds__plusi-line" role="status">
          {line}
        </span>
      ) : null}
      <button
        type="button"
        className="worlds__plusi-btn"
        aria-label={line}
        aria-pressed={speaking}
        data-speaker=""
        onClick={() => void onClick()}
      >
        <Plusi mood={cheering ? 'cheering' : 'happy'} size={36} decorative />
      </button>
    </span>
  );
}
