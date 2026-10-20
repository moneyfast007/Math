import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { navigate } from '@/app/router';
import { dailyPool, worldPool } from '@/engine/daily';
import { currentLevel } from '@/engine/registry';
import { activeWorld, nextStop, worldsFor, type World, type WorldStation } from '@/engine/journey';
import { makeT, t, type TranslationKey } from '@/i18n';
import { gradeLabel } from '@/i18n/labels';
import { spokenLabel } from '@/lang/spokenLabel';
import type { Profile } from '@/state/schema';
import { useActiveProfile, useApp } from '@/state/store';
import { currentStreak, dayKey } from '@/state/streak';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { Dialog } from '@/ui/Dialog';
import { Icon } from '@/ui/Icon';
import { playGiggle } from '@/ui/fanfare';
import { Plusi } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { JourneyIntroCard, WorldsIcon } from './JourneyIntro';
import { fitStations, layoutStations, pathThrough, type Point } from './journeyLayout';

/**
 * The child's home: her journey through the current world. A winding path of
 * stations (the topic's levels), the next one marked with Plusi waiting beside
 * it, the world's final station (a mixed review) at the end, and one big
 * button that starts the next stop. A five-year-old never faces a menu.
 *
 * "כל העולמות" opens the map of all the grade's worlds (WorldsScreen). The
 * first time a child opens the journey, a short card explains how the worlds
 * open; it is remembered per child and never blocks the start button.
 *
 * The whole journey is one screen, on a phone too: the header, the world's
 * row, the map (it takes what is left and lays its stations out to fit), and
 * the next station's card pinned at the bottom. Nothing on the page scrolls.
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
  const markIntroSeen = useApp((s) => s.markJourneyIntroSeen);
  const [picking, setPicking] = useState(false);
  // Decided when the journey opens: the card stays for this visit, once it is remembered.
  const [intro, setIntro] = useState(() => profile.journeyIntroSeenAt === undefined);
  const startRef = useRef<HTMLButtonElement>(null);
  const firstVisit = profile.journeyIntroSeenAt === undefined;
  useEffect(() => {
    if (firstVisit) markIntroSeen(profile.id);
  }, [firstVisit, markIntroSeen, profile.id]);
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
  // The world after this one, if the grade has one: the final challenge opens it.
  const nextWorld =
    worldsFor(profile.grade, progress).length > world.index ? world.index + 1 : null;
  const streak = currentStreak(progress?.streak ?? { count: 0, lastDay: null }, Date.now());

  const start = () => {
    // The station to play may not be the level she is at (one she skipped, after the last).
    if (stop.kind === 'level' && stop.level !== currentLevel(world.topic, profile.grade, progress))
      setTopicLevel(profile.id, world.topic.id, stop.level);
    navigate({ name: stop.kind === 'review' ? 'review' : 'practice' });
  };
  const hasDaily = dailyPool(profile.grade, progress).length > 0;
  const dailyDone = progress?.days[dayKey(Date.now())]?.daily === true;
  // More of this world: once a station of it is passed (nothing to mix before).
  const hasWorldMix = worldPool(world, progress).length > 0;
  const canPick = profile.settings.allowLevelChange && stop.kind === 'level';

  return (
    <main className="screen journey" data-screen="play">
      <header className="journey__header">
        <div className="journey__who">
          <Avatar id={profile.avatar} size="lg" decorative />
          <div>
            <h1 className="journey__hello">{tc('child.hello', { name: profile.name })}</h1>
            {!young ? <p className="muted journey__grade">{gradeLabel(profile.grade)}</p> : null}
          </div>
        </div>
        {/* Small tools with a word under each, so the child's name keeps the room. */}
        <div className="journey__tools">
          {streak > 0 ? <StreakChip count={streak} /> : null}
          <button
            type="button"
            className="journey__tool"
            aria-label={t('journey.album')}
            onClick={() => navigate({ name: 'album' })}
          >
            <span className="journey__tool-icon">
              <AlbumIcon />
            </span>
            <span className="journey__tool-label" aria-hidden="true">
              {t('journeyBar.album')}
            </span>
          </button>
          {/* Back to "who is playing?". */}
          <button
            type="button"
            className="journey__tool"
            aria-label={tc('child.switch')}
            title={tc('child.switch')}
            onClick={() => navigate({ name: 'home' })}
          >
            <span className="journey__tool-icon">
              <Icon name="children" />
            </span>
            <span className="journey__tool-label" aria-hidden="true">
              {t('journeyBar.children')}
            </span>
          </button>
        </div>
      </header>

      <div className="journey__body">
        <div className="journey__mapcol">
          <div className="journey__world">
            {!young ? (
              <div className="journey__world-text">
                <h2 className="journey__world-name">
                  {t('journey.world', {
                    params: { index: world.index, name: t(world.topic.labelKey as TranslationKey) },
                  })}
                </h2>
                <p className="muted journey__progress">{progressLine(world, nextWorld)}</p>
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn--secondary btn--small journey__all"
              onClick={() => navigate({ name: 'worlds' })}
            >
              <WorldsIcon />
              <span>{t('worlds.open')}</span>
            </button>
          </div>

          <WorldMap
            world={world}
            young={young}
            overlay={
              // Over the map, not above it: the world's row and the next station's card stay put.
              intro ? (
                <JourneyIntroCard
                  gender={profile.gender}
                  onDone={() => {
                    setIntro(false);
                    startRef.current?.focus({ preventScroll: true });
                  }}
                />
              ) : null
            }
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
            <div className="journey__next-side">
              {/* "Another station?" right above the speaker, at the end of the row. */}
              {canPick ? (
                <button type="button" className="journey__other" onClick={() => setPicking(true)}>
                  {t('child.otherLevel')}
                </button>
              ) : null}
              <SpeakerButton text={spokenLabel(stopName)} />
            </div>
          </div>
          <button
            ref={startRef}
            type="button"
            className="btn btn--hero journey__start"
            onClick={start}
          >
            {startLabel}
          </button>
          {stop.kind === 'review' ? (
            <p className="journey__reward">
              {nextWorld !== null
                ? t('journeyBar.reward', { params: { next: nextWorld } })
                : t('journeyBar.rewardLast')}
            </p>
          ) : null}
          {hasWorldMix || hasDaily ? (
            // Under the big button, side by side: more of this world, and the review
            // from every world. Equal tiles, two lines of text when the screen is narrow.
            <div className="journey__more">
              {hasWorldMix ? (
                <button
                  type="button"
                  className="btn btn--secondary btn--small daily"
                  onClick={() => navigate({ name: 'worldMix' })}
                >
                  <ShuffleIcon />
                  <span>{t('journey.worldMix')}</span>
                </button>
              ) : null}
              {hasDaily ? (
                <button
                  type="button"
                  className={
                    dailyDone
                      ? 'btn btn--secondary btn--small daily daily--done'
                      : 'btn btn--secondary btn--small daily'
                  }
                  aria-label={dailyDone ? t('journey.dailyDone') : undefined}
                  onClick={() => navigate({ name: 'daily' })}
                >
                  <DailyIcon done={dailyDone} />
                  <span>{t('journey.daily')}</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      {picking ? (
        <Dialog title={t('child.pickLevel')} onClose={() => setPicking(false)}>
          <div className="level-list" role="list">
            {world.stations.map((l) => (
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

/**
 * Where the child stands in the world, counting the level stations only (the
 * world's final review is named on its own once every station is done).
 */
function progressLine(world: World, nextWorld: number | null): string {
  if (world.completed) return t('journey.worldDone');
  if (world.review === 'current')
    return nextWorld !== null
      ? t('journeyBar.stationsDone', { params: { next: nextWorld } })
      : t('journeyBar.stationsDoneLast');
  const total = world.stations.length;
  const at = world.stations.findIndex((s) => s.state === 'current');
  const doneCount = world.stations.filter((s) => s.state === 'done').length;
  const n = at >= 0 ? at + 1 : Math.min(doneCount + 1, total);
  return t('journey.stationOf', { params: { n, total } });
}

/** Days in a row; shown from the first day (no chip at all before it). */
function StreakChip({ count }: { count: number }) {
  return (
    <div
      className="streak streak--on"
      role="img"
      aria-label={t('journey.streak.short', { params: { count } })}
    >
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
      <span className="streak__count">{count}</span>
    </div>
  );
}

/** Two crossing arrows: a mix of this world's stations. */
function ShuffleIcon() {
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
      <path d="M3 17h2.5c1.4 0 2.7-.7 3.5-1.8l5.5-7.4A4.3 4.3 0 0 1 18 6h3" />
      <path d="M17.5 3L21 6l-3.5 3" />
      <path d="M3 7h2.5c1.4 0 2.7.7 3.5 1.8l.6.8" />
      <path d="M21 18h-3a4.3 4.3 0 0 1-3.5-1.8l-.6-.8" />
      <path d="M17.5 15L21 18l-3.5 3" />
    </svg>
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
  overlay,
  onPick,
}: {
  world: World;
  young: boolean;
  /** Shown over the map (the first-time explainer). */
  overlay: ReactNode;
  onPick: ((s: WorldStation) => void) | undefined;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const box = useBoxSize(boxRef);
  const all = world.stations.length + 1; // plus the review
  // Laid out to fit the room the screen leaves (until it is measured: the usual snake).
  const fitted = box ? fitStations(all, box, young) : null;
  const { points, height } = fitted ?? layoutStations(all, young ? 4 : 3);
  const currentIndex = world.stations.findIndex((s) => s.state === 'current');
  // The path is walked up to where Plusi stands (stations skipped on the way keep no check).
  const walked = currentIndex >= 0 ? currentIndex : world.review === 'locked' ? 0 : all - 1;
  const donePath = pathThrough(points.slice(0, walked + 1));
  const restPath = pathThrough(points.slice(walked));
  const plusiAt = currentIndex >= 0 ? points[currentIndex] : points[all - 1];
  const reviewPoint = points[all - 1] as Point;
  const mapStyle: CSSProperties & { '--cell'?: string } = fitted
    ? {
        width: `${fitted.width}px`,
        height: `${(fitted.width * height) / 100}px`,
        '--cell': `${fitted.cell}px`,
      }
    : { aspectRatio: `100 / ${height}` };

  return (
    <div className="journey__mapbox" ref={boxRef}>
      {overlay}
      <section className="map" aria-label={t('journey.map')} style={mapStyle}>
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
          <MapPlusi
            x={plusiAt.x}
            y={(plusiAt.y / height) * 100}
            mood={world.completed ? 'cheering' : 'happy'}
          />
        ) : null}
      </section>
    </div>
  );
}

/**
 * Plusi beside the next station: sways gently while he waits, and a tap
 * tickles him (a wiggle, a cheer and a giggle). The tap does nothing else, so
 * a child can play with him without leaving the map.
 */
function MapPlusi({ x, y, mood }: { x: number; y: number; mood: 'happy' | 'cheering' }) {
  const [tickled, setTickled] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => window.clearTimeout(timer.current ?? undefined), []);
  const tickle = () => {
    playGiggle();
    setTickled(false);
    // Restart the wiggle even mid-wiggle: off for a frame, then on.
    window.requestAnimationFrame(() => setTickled(true));
    window.clearTimeout(timer.current ?? undefined);
    timer.current = window.setTimeout(() => setTickled(false), 1100);
  };
  return (
    <button
      type="button"
      className="map__plusi"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-label={t('journey.plusiTickle')}
      data-tickled={tickled ? '' : undefined}
      onClick={tickle}
    >
      <span className="map__plusi-body">
        <Plusi mood={tickled ? 'cheering' : mood} size="100%" decorative />
      </span>
    </button>
  );
}

/** The size of a box on the screen (px), kept up to date; null until it has one. */
function useBoxSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize((was) => {
        if (width <= 0 || height <= 0) return null;
        if (was && Math.abs(was.width - width) < 0.5 && Math.abs(was.height - height) < 0.5) {
          return was;
        }
        return { width, height };
      });
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
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
