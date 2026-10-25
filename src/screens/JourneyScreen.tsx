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
import { chooseStation, clearChosenStation } from '@/app/station';
import { worldPool } from '@/engine/daily';
import {
  activeWorld,
  nextStop,
  worldsFor,
  type NextStop,
  type World,
  type WorldStation,
} from '@/engine/journey';
import { makeT, t, type TranslationKey } from '@/i18n';
import { gradeLabel } from '@/i18n/labels';
import { spokenLabel } from '@/lang/spokenLabel';
import { roundsToday } from '@/state/progress';
import type { Profile } from '@/state/schema';
import { useActiveProfile, useApp } from '@/state/store';
import { currentStreak } from '@/state/streak';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { Dialog } from '@/ui/Dialog';
import { Icon } from '@/ui/Icon';
import { playGiggle, playTeleport } from '@/ui/fanfare';
import { Plusi } from '@/ui/Plusi';
import { PlusiPicker } from '@/ui/PlusiPicker';
import { applyPlusiColor } from '@/ui/plusiColor';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { Stars } from '@/ui/Stars';
import { JourneyIntroCard, TrophyIcon, WorldsIcon } from './JourneyIntro';
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
    else {
      applyAgeBand(ageBandForGrade(profile.grade));
      applyPlusiColor(profile.plusiColor);
    }
  }, [profile]);
  if (!profile) return null;
  return <Journey key={profile.id} profile={profile} />;
}

function Journey({ profile }: { profile: Profile }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const markIntroSeen = useApp((s) => s.markJourneyIntroSeen);
  const [picking, setPicking] = useState(false);
  const [painting, setPainting] = useState(false);
  // A station chosen on the map or in "תחנה אחרת" (or the final challenge): Plusi hops
  // there, the card names it, and the big button starts it. Where she is stays.
  const [picked, setPicked] = useState<number | 'review' | null>(null);
  // Back on the journey: no station is chosen any more (the big button names the next one).
  useEffect(() => clearChosenStation(), []);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (note === null) return;
    const id = window.setTimeout(() => setNote(null), 3500);
    return () => window.clearTimeout(id);
  }, [note]);
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
  const stop: NextStop =
    picked === 'review'
      ? { kind: 'review' }
      : picked !== null
        ? { kind: 'level', level: picked }
        : nextStop(world);
  const level =
    (typeof picked === 'number' ? picked : null) ??
    world.stations.find((s) => s.state === 'current')?.level ??
    world.stations.at(-1)?.level ??
    1;
  const stopStation =
    stop.kind === 'level' ? world.stations.find((s) => s.level === stop.level) : undefined;
  const stopName = stopStation
    ? t(stopStation.labelKey as TranslationKey)
    : t('journey.review.name');
  const startLabel = stop.kind === 'review' ? t('journey.start.review') : t('child.start');
  // The world after this one, if the grade has one: the final challenge opens it.
  const nextWorld =
    worldsFor(profile.grade, progress).length > world.index ? world.index + 1 : null;
  const longName = profile.name.length > 10;
  const goal = profile.settings.dailyGoal;
  const today = roundsToday(progress, Date.now());
  const streak = currentStreak(progress?.streak ?? { count: 0, lastDay: null }, Date.now());

  const start = () => {
    // The station the card names is the one played (the level she is at, one she skipped,
    // one chosen in the list); where she is on the journey stays.
    if (stop.kind === 'level') chooseStation(world.topic.id, stop.level);
    else clearChosenStation();
    navigate({ name: stop.kind === 'review' ? 'review' : 'practice' });
  };
  // More of this world: once a station of it is passed (nothing to mix before).
  const hasWorldMix = worldPool(world, progress).length > 0;
  const canPick = profile.settings.allowLevelChange && stop.kind === 'level';
  /** Stations still to pass before the final challenge opens (warm-ups are never needed). */
  const left = world.stations.filter((st) => !st.warmup && st.state !== 'done').length;

  return (
    <main className="screen journey" data-screen="play">
      <header className="journey__header">
        <div className="journey__who">
          <Avatar id={profile.avatar} size="lg" decorative />
          <div>
            {/* A long name (over ten letters) is said alone, so it has the room for itself. */}
            <h1
              className={longName ? 'journey__hello journey__hello--long' : 'journey__hello'}
              aria-label={longName ? tc('child.hello', { name: profile.name }) : undefined}
            >
              {/* A hyphenated name may break after its hyphen, not in the middle of a part. */}
              {longName
                ? profile.name.replace(/-/g, '-\u200b')
                : tc('child.hello', { name: profile.name })}
            </h1>
            {!young ? <p className="muted journey__grade">{gradeLabel(profile.grade)}</p> : null}
          </div>
        </div>
        {/* Small tools with a word under each, so the child's name keeps the room. */}
        <div className="journey__tools">
          {goal ? (
            // With a daily goal: the streak, and today's rounds toward the goal under it.
            <div
              className="journey__tool journey__goal"
              role="img"
              aria-label={`${streakLabel(streak)}. ${t('goal.label', { params: { done: Math.min(today, goal), goal } })}`}
            >
              <StreakChip count={streak} decorative />
              <span
                className={
                  today >= goal
                    ? 'journey__tool-label journey__goal-label journey__goal-label--done'
                    : 'journey__tool-label journey__goal-label'
                }
              >
                {today >= goal
                  ? t('goal.reachedChild')
                  : t('goal.progress', { params: { done: today, goal } })}
              </span>
            </div>
          ) : streak > 0 ? (
            <StreakChip count={streak} />
          ) : null}
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
            aria-label={t('journey.exitLabel')}
            title={t('journey.exitLabel')}
            onClick={() => navigate({ name: 'home' })}
          >
            <span className="journey__tool-icon">
              <Icon name="exit" />
            </span>
            <span className="journey__tool-label" aria-hidden="true">
              {t('journeyBar.exit')}
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
            canPick={profile.settings.allowLevelChange}
            note={note}
            picked={picked}
            onPaint={() => setPainting(true)}
            onPick={(s) => setPicked(s.level)}
            onLocked={(s) =>
              setNote(
                s === 'review'
                  ? left === 1
                    ? t('journey.note.reviewLeftOne')
                    : t('journey.note.reviewLeft', { params: { n: left } })
                  : t('journey.note.stationLocked', { params: { n: s.level } }),
              )
            }
            onReview={() => setPicked('review')}
          />
        </div>

        <section className="station card journey__next" aria-labelledby="station-title">
          <div className="journey__next-row">
            <div className="journey__next-text">
              {/* Where she stands in the world, right over the station it names. */}
              <p className="muted journey__progress">
                {typeof picked === 'number'
                  ? t('journey.stationOf', {
                      params: {
                        n: world.stations.findIndex((st) => st.level === picked) + 1,
                        total: world.stations.length,
                      },
                    })
                  : progressLine(world, nextWorld)}
              </p>
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
          {hasWorldMix ? (
            // Under the big button: more of this world. (The review from every world is on
            // the map of all worlds.)
            <div className="journey__more">
              <button
                type="button"
                className="btn btn--secondary btn--small daily"
                onClick={() => navigate({ name: 'worldMix' })}
              >
                <ShuffleIcon />
                <span>{t('journey.worldMix')}</span>
              </button>
            </div>
          ) : null}
        </section>
      </div>

      {painting ? <PlusiPicker profile={profile} onClose={() => setPainting(false)} /> : null}
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
                  if (l.level !== level) playTeleport();
                  setPicked(l.level);
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

/** "3 ימים ברצף", and for one day "יום אחד ברצף" (not "1 ימים"). */
function streakLabel(count: number): string {
  return count === 1
    ? t('journey.streak.shortOne')
    : t('journey.streak.short', { params: { count } });
}

/** Days in a row; shown from the first day (no chip at all before it). */
function StreakChip({ count, decorative = false }: { count: number; decorative?: boolean }) {
  return (
    <div
      className={count > 0 ? 'streak streak--on' : 'streak'}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': streakLabel(count) })}
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
  onPaint,
  overlay,
  canPick,
  note,
  picked,
  onPick,
  onLocked,
  onReview,
}: {
  world: World;
  young: boolean;
  /** Opens "הפלוסי שלי". */
  onPaint: () => void;
  /** Shown over the map (the first-time explainer). */
  overlay: ReactNode;
  /** The parent lets her choose any station, ahead too (else the open ones only). */
  canPick: boolean;
  /** A short line over the map's foot (why a station is closed), or none. */
  note: string | null;
  /** The station chosen for this visit (Plusi hops there), if any. */
  picked: number | 'review' | null;
  onPick: (s: WorldStation) => void;
  onLocked: (s: WorldStation | 'review') => void;
  onReview: () => void;
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
  const pickedIndex =
    picked === 'review'
      ? all - 1
      : picked !== null
        ? world.stations.findIndex((s) => s.level === picked)
        : -1;
  const target = pickedIndex >= 0 ? pickedIndex : currentIndex >= 0 ? currentIndex : all - 1;
  const { at: plusiIndex, phase: teleport } = useTeleport(target);
  const plusiAt = points[plusiIndex];
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
          const cls =
            i === pickedIndex && s.state !== 'current'
              ? `node node--${s.state} node--picked`
              : `node node--${s.state}`;
          const style = { left: `${p.x}%`, top: `${(p.y / height) * 100}%` };
          const content = (
            <>
              {s.state === 'done' ? (
                <CheckIcon />
              ) : (
                <span className="node__num">{young ? '' : s.level}</span>
              )}
              {/* The best stars of this station, under it. */}
              {s.stars > 0 ? (
                <span className="node__stars">
                  <Stars n={s.stars} label={false} />
                </span>
              ) : null}
            </>
          );
          // Every station is a button: an open one starts that station, a closed one
          // says when it opens (or, where the parent allows choosing, starts it too).
          const open = s.state !== 'locked' || canPick;
          return (
            <button
              key={s.level}
              type="button"
              className={cls}
              style={style}
              aria-label={label}
              onClick={() => {
                if (!open) return onLocked(s);
                // A soft "whoosh and ding" as Plusi hops over (from the tap, so iOS plays it).
                if (i !== target) playTeleport();
                onPick(s);
              }}
            >
              {content}
            </button>
          );
        })}

        <button
          type="button"
          className={
            pickedIndex === all - 1
              ? `node node--review node--review-${world.review} node--picked`
              : `node node--review node--review-${world.review}`
          }
          style={{ left: `${reviewPoint.x}%`, top: `${(reviewPoint.y / height) * 100}%` }}
          aria-label={t(`journey.review.${world.review}`)}
          onClick={() => {
            if (world.review === 'locked') return onLocked('review');
            if (all - 1 !== target) playTeleport();
            onReview();
          }}
        >
          {/* The cup in its own frame: the glint passes over it, and it wobbles once open. */}
          <span className="node__cup">
            <TrophyIcon />
          </span>
          {world.review !== 'done' ? (
            <span className="node__sparks" aria-hidden="true">
              <Spark className="node__spark node__spark--1" />
              <Spark className="node__spark node__spark--2" />
              <Spark className="node__spark node__spark--3" />
            </span>
          ) : null}
          {/* Closed: a small lock in its corner says so (and why, when tapped). */}
          {world.review === 'locked' ? (
            <span className="node__lock" aria-hidden="true">
              <Icon name="lock" />
            </span>
          ) : null}
          {!young ? <span className="node__caption">{t('journey.review')}</span> : null}
          {world.reviewStars > 0 ? (
            <span className="node__stars node__stars--review">
              <Stars n={world.reviewStars} label={false} />
            </span>
          ) : null}
        </button>

        {plusiAt ? (
          <MapPlusi
            x={plusiAt.x}
            y={(plusiAt.y / height) * 100}
            mood={world.completed ? 'cheering' : 'happy'}
            teleport={teleport}
            onPaint={onPaint}
          />
        ) : null}
      </section>
      {/* Always there, so a screen reader hears the line when it comes. */}
      <p className={note ? 'journey__note journey__note--on' : 'journey__note'} role="status">
        {note ?? ''}
      </p>
    </div>
  );
}

/**
 * Plusi beside the next station: sways gently while he waits, and a tap
 * tickles him (a wiggle, a cheer and a giggle). The tap does nothing else, so
 * a child can play with him without leaving the map.
 */
/**
 * Where Plusi stands, and the teleport when a station is chosen: he vanishes in a
 * swirl of sparkles where he was and pops up beside the chosen station (at once,
 * with no swirl, under reduced motion).
 */
type Teleport = 'idle' | 'out' | 'in';
const TELEPORT_OUT_MS = 320;
const TELEPORT_IN_MS = 420;

function useTeleport(target: number): { at: number; phase: Teleport } {
  const [at, setAt] = useState(target);
  const [phase, setPhase] = useState<Teleport>('idle');
  useEffect(() => {
    if (at === target) return;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setAt(target);
      return;
    }
    setPhase('out');
    const out = window.setTimeout(() => {
      setAt(target);
      setPhase('in');
    }, TELEPORT_OUT_MS);
    return () => window.clearTimeout(out);
  }, [at, target]);
  useEffect(() => {
    if (phase !== 'in') return;
    const id = window.setTimeout(() => setPhase('idle'), TELEPORT_IN_MS);
    return () => window.clearTimeout(id);
  }, [phase]);
  return { at, phase };
}

function MapPlusi({
  x,
  y,
  mood,
  teleport = 'idle',
  onPaint,
}: {
  x: number;
  y: number;
  mood: 'happy' | 'cheering';
  /** Vanishing where he was, or popping up at the chosen station. */
  teleport?: Teleport;
  /** Opens "הפלוסי שלי" (offered for a few seconds after a tickle). */
  onPaint: () => void;
}) {
  const [tickled, setTickled] = useState(false);
  const [paint, setPaint] = useState(false);
  const timer = useRef<number | null>(null);
  const paintTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      window.clearTimeout(timer.current ?? undefined);
      window.clearTimeout(paintTimer.current ?? undefined);
    },
    [],
  );
  // Six quick tickles (within two seconds): he falls over and rolls with laughter.
  const taps = useRef<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const rollTimer = useRef<number | null>(null);
  useEffect(() => () => window.clearTimeout(rollTimer.current ?? undefined), []);
  const tickle = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((at) => now - at < 2000), now];
    if (taps.current.length >= 6 && !rolling) {
      taps.current = [];
      setRolling(true);
      setPaint(false);
      playGiggle();
      window.setTimeout(playGiggle, 450);
      window.setTimeout(playGiggle, 900);
      window.clearTimeout(rollTimer.current ?? undefined);
      rollTimer.current = window.setTimeout(() => setRolling(false), 2600);
      return;
    }
    if (rolling) return;
    playGiggle();
    setTickled(false);
    // A tickle still tickles; then a little brush offers to paint him, for a few seconds.
    setPaint(true);
    window.clearTimeout(paintTimer.current ?? undefined);
    paintTimer.current = window.setTimeout(() => setPaint(false), 4500);
    // Restart the wiggle even mid-wiggle: off for a frame, then on.
    window.requestAnimationFrame(() => setTickled(true));
    window.clearTimeout(timer.current ?? undefined);
    timer.current = window.setTimeout(() => setTickled(false), 1100);
  };
  return (
    // Plusi and, for a few seconds after a tickle, a thought cloud over him with
    // "רוצה לצבוע אותי?", three little bubbles rising to it (a tap opens the colours).
    <div
      className={x < 30 ? 'map__plusi map__plusi--right' : 'map__plusi'}
      style={{ left: `${x}%`, top: `${y}%` }}
      data-tickled={tickled ? '' : undefined}
      data-rolling={rolling ? '' : undefined}
      data-teleport={teleport === 'idle' ? undefined : teleport}
    >
      <button
        type="button"
        className="map__plusi-hit"
        aria-label={t('journey.plusiTickle')}
        onClick={tickle}
      >
        <span className="map__plusi-body">
          <Plusi mood={tickled || rolling ? 'cheering' : mood} size="100%" decorative />
        </span>
      </button>
      {rolling ? (
        <span className="map__haha" aria-hidden="true">
          <span>חחח</span>
          <span>חחח</span>
        </span>
      ) : null}
      {teleport !== 'idle' ? (
        <span className="map__sparks" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`map__spark map__spark--${i}`} />
          ))}
        </span>
      ) : null}
      {paint ? (
        <button
          type="button"
          className={`map__say map__say--${x < 35 ? 'left' : x > 65 ? 'right' : 'mid'}`}
          onClick={() => {
            setPaint(false);
            onPaint();
          }}
        >
          <span className="map__say-text">{t('plusiColor.paint')}</span>
          {/* A thought cloud, as in cartoons: three bubbles rising from his head. */}
          <span className="map__say-trail" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      ) : null}
    </div>
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

/** A four-pointed sparkle beside the final challenge: a prize waiting at the end. */
function Spark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="currentColor" />
    </svg>
  );
}
