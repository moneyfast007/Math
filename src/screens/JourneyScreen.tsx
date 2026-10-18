import { useEffect, useState } from 'react';
import { navigate } from '@/app/router';
import { dailyPool } from '@/engine/daily';
import { activeWorld, nextStop, type World, type WorldStation } from '@/engine/journey';
import { makeT, t, type TranslationKey } from '@/i18n';
import { gradeLabel } from '@/i18n/labels';
import { spokenLabel } from '@/lang/spokenLabel';
import type { Profile } from '@/state/schema';
import { useActiveProfile, useApp } from '@/state/store';
import { currentStreak, dayKey } from '@/state/streak';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { Dialog } from '@/ui/Dialog';
import { Plusi } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { layoutStations, pathThrough, type Point } from './journeyLayout';

/**
 * The child's home: her journey through the current world. A winding path of
 * stations (the topic's levels), the next one marked with Plusi waiting beside
 * it, the world's final station (a mixed review) at the end, and one big
 * button that starts the next stop. A five-year-old never faces a menu.
 */
export function JourneyScreen() {
  const profile = useActiveProfile();
  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
    else applyAgeBand(ageBandForGrade(profile.grade));
  }, [profile]);
  if (!profile) return null;
  return <Journey key={profile.id} profile={profile} />;
}

function Journey({ profile }: { profile: Profile }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const setTopicLevel = useApp((s) => s.setTopicLevel);
  const [picking, setPicking] = useState(false);
  const tc = makeT(profile.gender);
  const young = ageBandForGrade(profile.grade) === 'young';

  const world = activeWorld(profile.grade, progress);
  if (!world) {
    // Every grade has worlds today; this only guards against a future gap.
    return (
      <main className="screen journey" data-screen="play">
        <section className="card journey__empty">
          <Plusi mood="calm" size={72} decorative />
          <p>{t('journey.noWorlds')}</p>
          <button type="button" className="btn" onClick={() => navigate({ name: 'home' })}>
            {tc('child.switch')}
          </button>
        </section>
      </main>
    );
  }
  const stop = nextStop(world);
  const level =
    world.stations.find((s) => s.state === 'current')?.level ?? world.stations.at(-1)?.level ?? 1;
  const stopStation =
    stop.kind === 'level' ? world.stations.find((s) => s.level === stop.level) : undefined;
  const stopName = stopStation
    ? t(stopStation.labelKey as TranslationKey)
    : t('journey.review.name');
  const startLabel = stop.kind === 'review' ? t('journey.start.review') : t('child.start');
  const streak = currentStreak(progress?.streak ?? { count: 0, lastDay: null }, Date.now());

  const start = () => navigate({ name: stop.kind === 'review' ? 'review' : 'practice' });
  const hasDaily = dailyPool(profile.grade, progress).length > 0;
  const dailyDone = progress?.days[dayKey(Date.now())]?.daily === true;

  return (
    <main className="screen journey" data-screen="play">
      <header className="journey__header">
        <div className="journey__who">
          <Avatar id={profile.avatar} size="lg" decorative />
          <div>
            <h1 className="journey__hello">{tc('child.hello', { name: profile.name })}</h1>
            {!young ? <p className="muted">{gradeLabel(profile.grade)}</p> : null}
          </div>
        </div>
        <div className="journey__tools">
          <StreakChip count={streak} young={young} />
          <button
            type="button"
            className="icon-btn"
            aria-label={t('journey.album')}
            onClick={() => navigate({ name: 'album' })}
          >
            <AlbumIcon />
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => navigate({ name: 'home' })}
          >
            {tc('child.switch')}
          </button>
        </div>
      </header>

      <div className="journey__body">
        <div className="journey__mapcol">
          {!young ? (
            <div className="journey__world">
              <h2 className="journey__world-name">
                {t('journey.world', {
                  params: { index: world.index, name: t(world.topic.labelKey as TranslationKey) },
                })}
              </h2>
              <span className="muted">
                {world.completed
                  ? t('journey.worldDone')
                  : t('journey.stationOf', {
                      params: { n: Math.min(world.done + 1, world.total), total: world.total },
                    })}
              </span>
            </div>
          ) : null}

          <WorldMap
            world={world}
            young={young}
            onPick={
              profile.settings.allowLevelChange
                ? (s) => {
                    setTopicLevel(profile.id, world.topic.id, s.level);
                    navigate({ name: 'practice' });
                  }
                : undefined
            }
          />
        </div>

        <section className="station card journey__next" aria-labelledby="station-title">
          <div className="journey__next-row">
            <div className="journey__next-text">
              <span className="station__eyebrow">{t('child.nextStation')}</span>
              <h2 id="station-title">{stopName}</h2>
            </div>
            <SpeakerButton text={spokenLabel(stopName)} />
          </div>
          <button type="button" className="btn btn--hero journey__start" onClick={start}>
            {startLabel}
          </button>
          {hasDaily ? (
            <button
              type="button"
              className={dailyDone ? 'btn btn--secondary daily daily--done' : 'btn btn--secondary daily'}
              onClick={() => navigate({ name: 'daily' })}
            >
              <DailyIcon done={dailyDone} />
              <span>{dailyDone ? t('journey.dailyDone') : t('journey.daily')}</span>
            </button>
          ) : null}
          {profile.settings.allowLevelChange && stop.kind === 'level' ? (
            <button type="button" className="btn btn--ghost" onClick={() => setPicking(true)}>
              {t('child.otherLevel')}
            </button>
          ) : null}
        </section>
      </div>

      {picking ? (
        <Dialog title={t('child.pickLevel')} onClose={() => setPicking(false)}>
          <div className="level-list" role="list">
            {world.topic.levels.map((l) => (
              <button
                key={l.level}
                type="button"
                role="listitem"
                className={l.level === level ? 'level-item level-item--current' : 'level-item'}
                aria-current={l.level === level ? 'true' : undefined}
                onClick={() => {
                  setTopicLevel(profile.id, world.topic.id, l.level);
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

function StreakChip({ count, young }: { count: number; young: boolean }) {
  const label =
    count === 0 ? t('journey.streak.none') : t('journey.streak.short', { params: { count } });
  return (
    <div className={count > 0 ? 'streak streak--on' : 'streak'} role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className="streak__icon">
        <path
          d="M12 2.5c.6 3.6 3.5 5 3.5 8.3a3.5 3.5 0 0 1-7 0c0-1 .4-1.8 1-2.5.1 1.2.8 2 1.7 2 .2-2.9-2.2-3.8-2.2-7 0 0 2.5 1 3-0.8z"
          fill="currentColor"
        />
        <path
          d="M6 14.5a6 6 0 1 0 12 0c0-2.3-1.2-3.7-2.5-5.3a4.5 4.5 0 0 1-7 0C7.2 10.8 6 12.2 6 14.5z"
          fill="currentColor"
          opacity="0.35"
        />
      </svg>
      {!young || count > 0 ? <span className="streak__count">{count}</span> : null}
    </div>
  );
}

function DailyIcon({ done }: { done: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="daily__icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {done ? (
        <path d="M5 12l5 5 9-10" />
      ) : (
        <>
          <path d="M4 12a8 8 0 1 0 2.3-5.7" />
          <path d="M4 4v4h4" />
        </>
      )}
    </svg>
  );
}

function AlbumIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M3 10h18M9 4v16" />
    </svg>
  );
}

function WorldMap({
  world,
  young,
  onPick,
}: {
  world: World;
  young: boolean;
  onPick: ((s: WorldStation) => void) | undefined;
}) {
  const perRow = young ? 4 : 3;
  const all = world.stations.length + 1; // plus the review
  const { points, height } = layoutStations(all, perRow);
  const doneCount = world.stations.filter((s) => s.state === 'done').length;
  const donePath = pathThrough(points.slice(0, Math.min(all, doneCount + 1)));
  const restPath = pathThrough(points.slice(Math.max(0, doneCount)));
  const currentIndex = world.stations.findIndex((s) => s.state === 'current');
  const plusiAt =
    world.review === 'current'
      ? points[all - 1]
      : currentIndex >= 0
        ? points[currentIndex]
        : points[all - 1];
  const reviewPoint = points[all - 1] as Point;

  return (
    <section
      className="map"
      aria-label={t('journey.map')}
      style={{ aspectRatio: `100 / ${height}` }}
    >
      <svg
        className="map__path"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={donePath} className="map__path-done" />
        <path d={restPath} className="map__path-rest" />
      </svg>

      {world.stations.map((s, i) => {
        const p = points[i] as Point;
        const label = t(`journey.station.${s.state}`, { params: { n: s.level } });
        const cls = `node node--${s.state}`;
        const style = { left: `${p.x}%`, top: `${(p.y / height) * 100}%` };
        const content =
          s.state === 'done' ? (
            <CheckIcon />
          ) : (
            <span className="node__num">{young ? '' : s.level}</span>
          );
        return onPick && s.state !== 'locked' ? (
          <button
            key={s.level}
            type="button"
            className={cls}
            style={style}
            aria-label={label}
            onClick={() => onPick(s)}
          >
            {content}
          </button>
        ) : (
          <div key={s.level} className={cls} style={style} role="img" aria-label={label}>
            {content}
          </div>
        );
      })}

      <div
        className={`node node--review node--review-${world.review}`}
        style={{ left: `${reviewPoint.x}%`, top: `${(reviewPoint.y / height) * 100}%` }}
        role="img"
        aria-label={t(`journey.review.${world.review}`)}
      >
        <StarIcon />
        {!young ? <span className="node__caption">{t('journey.review')}</span> : null}
      </div>

      {plusiAt ? (
        <div
          className="map__plusi"
          style={{ left: `${plusiAt.x}%`, top: `${(plusiAt.y / height) * 100}%` }}
        >
          <Plusi mood={world.completed ? 'cheering' : 'happy'} size="100%" decorative />
          <span className="visually-hidden">{t('journey.plusiWaiting')}</span>
        </div>
      ) : null}
    </section>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
    </svg>
  );
}
