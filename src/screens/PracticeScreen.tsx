import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { replayTopic } from '@/app/replay';
import { navigate } from '@/app/router';
import { chosenStation } from '@/app/station';
import { clearRound, savedRound, saveRound } from '@/app/roundSave';
import { dailyPool, pickDaily, worldPool, type DailyItem } from '@/engine/daily';
import { activeWorld, nextStop, worldsFor } from '@/engine/journey';
import { pick } from '@/engine/rng';
import { currentLevel, levelsFor, topicById } from '@/engine/registry';
import {
  completedExercise,
  reduce,
  droppedLevel,
  startSession,
  type SessionAction,
  type SessionState,
} from '@/engine/session';
import type { Exercise, Topic } from '@/engine/types';
import { makeT, t, type TranslationKey } from '@/i18n';
import {
  REVIEW_PASS_RATE,
  roundsToday,
  STATION_PASS_RATE,
  starsFor,
  medalsFor,
  totalStars,
  type RoundOutcome,
} from '@/state/progress';
import { Stars } from '@/ui/Stars';
import type { Profile } from '@/state/schema';
import { appStore, useActiveProfile, useApp } from '@/state/store';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { MathExpr } from '@/ui/MathExpr';
import { groupDigits } from '@/lang/groupDigits';
import { NumberPad } from '@/ui/NumberPad';
import { Plusi, type PlusiMood } from '@/ui/Plusi';
import { applyPlusiColor } from '@/ui/plusiColor';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { ColumnWork } from '@/ui/Vertical';
import { sceneForWorld, sceneStyleForGrade } from '@/ui/scenes/companions';
import { SceneStrip } from '@/ui/scenes/SceneStrip';
import { playAlmost, playCorrect, setSoundsEnabled } from '@/ui/sounds';
import { ReportMistake } from '@/ui/ReportMistake';
import { prefersReducedMotion } from '@/ui/useTypewriter';
import { VisualView } from '@/ui/Visuals';
import { WorldComplete } from './WorldComplete';

/** A prompt longer than this (characters) is a word problem rather than "how much is it?". */
const LONG_PROMPT = 40;

/** How long a correct answer stays on screen before the next exercise. */
const CORRECT_PAUSE_MS = 1400;

/**
 * The exercise card shrinks its question text and pictures to fit the height
 * it has, down to this share of their full size (the text never below 18px,
 * see global.css); past that, the card scrolls inside itself, never the page.
 */
const MIN_CARD_FIT = 0.4;
const CARD_FIT_STEP = 0.06;
/** A picture on an answer button shrinks down to this share of its size. */
const MIN_PICTURE_FIT = 0.3;

/**
 * 'level': the next station. 'review': the world's final station, exercises
 * from every level. 'replay': a finished world played again from the album,
 * mixed like the review; it changes nothing on the journey. 'daily': the
 * day's review, exercises from stations passed in any of her worlds.
 * 'worldMix': more exercises from the stations passed in the world she is in;
 * like the daily review, it passes and opens nothing.
 */
export type PracticeMode = 'level' | 'review' | 'replay' | 'daily' | 'worldMix';

/** The pool a mixed round draws from, or none when nothing is passed yet. */
function mixedPool(profile: Profile, mode: PracticeMode): DailyItem[] {
  const progress = appProgress(profile.id);
  if (mode === 'daily') return dailyPool(profile.grade, progress);
  if (mode === 'worldMix') {
    const world = activeWorld(profile.grade, progress);
    return world ? worldPool(world, progress) : [];
  }
  return [];
}

/** The finished world chosen in the album, if it is really hers and finished. */
function replayableTopic(profile: Profile): Topic | undefined {
  const id = replayTopic();
  return worldsFor(profile.grade, appProgress(profile.id)).find(
    (w) => w.completed && w.topic.id === id,
  )?.topic;
}

export function PracticeScreen({ mode }: { mode: PracticeMode }) {
  const profile = useActiveProfile();
  const missingReplay = mode === 'replay' && profile !== undefined && !replayableTopic(profile);
  const noPool =
    (mode === 'daily' || mode === 'worldMix') &&
    profile !== undefined &&
    mixedPool(profile, mode).length === 0;
  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
    else if (missingReplay) navigate({ name: 'album' }, { replace: true });
    else if (noPool) navigate({ name: 'play' }, { replace: true });
  }, [profile, missingReplay, noPool]);
  if (!profile || missingReplay || noPool) return null;
  return <Practice key={`${profile.id}:${mode}`} profile={profile} mode={mode} />;
}

function Practice({ profile, mode }: { profile: Profile; mode: PracticeMode }) {
  const recordAttempt = useApp((s) => s.recordAttempt);
  const completeRound = useApp((s) => s.completeRound);
  const completeDaily = useApp((s) => s.completeDaily);
  const completeMixed = useApp((s) => s.completeMixed);
  const band = ageBandForGrade(profile.grade);
  const tc = makeT(profile.gender);
  const rng = () => Math.random();

  // The station is fixed for the round, even as progress updates.
  const station = useMemo(
    () => {
      const progress = appProgress(profile.id);
      if (mode === 'daily' || mode === 'worldMix') {
        const pool = mixedPool(profile, mode);
        const first = pool[0] as DailyItem;
        return { topic: first.topic, level: first.level, stored: first.level, pool };
      }
      const replay = mode === 'replay' ? replayableTopic(profile) : undefined;
      if (replay) {
        const last = levelsFor(replay, profile.grade).at(-1)?.level ?? 1;
        return { topic: replay, level: last, stored: last };
      }
      const world = activeWorld(profile.grade, progress);
      const topic = world?.topic;
      if (!topic) throw new Error('No topic for this grade');
      const stop = nextStop(world);
      const stored = currentLevel(topic, profile.grade, progress);
      // A station chosen on the map (one passed, skipped, or ahead): that one, as chosen.
      const chosen = chosenStation(topic.id);
      const picked =
        chosen !== null && levelsFor(topic, profile.grade).some((l) => l.level === chosen)
          ? chosen
          : null;
      return {
        topic,
        level:
          mode === 'level' && picked !== null
            ? picked
            : mode === 'level' && stop.kind === 'level'
              ? stop.level
              : stored,
        stored,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const topic: Topic = station.topic;
  const review = mode !== 'level';
  const replaying = mode === 'replay';
  const daily = mode === 'daily';
  /** Drawn from a pool of passed stations (the daily review, more of this world). */
  const mixed = daily || mode === 'worldMix';
  const pool = 'pool' in station ? station.pool : [];
  /** This child's levels of the world (a younger grade may end earlier). */
  const gradeLevels = levelsFor(topic, profile.grade);
  const levels = gradeLevels.map((l) => l.level);
  /** Exercises already given in this round: none comes again while the level has others. */
  const seen = useRef<string[]>([]);
  const generate = (level: number): Exercise => {
    const e = mixed
      ? (() => {
          const item = pickDaily(pool, rng);
          return item.topic.generate(item.level, rng, profile.gender, seen.current);
        })()
      : topic.generate(review ? pick(rng, levels) : level, rng, profile.gender, seen.current);
    seen.current = [...seen.current, e.factId];
    return e;
  };

  const newRound = (level: number): SessionState => {
    seen.current = [];
    return startSession({
      topicId: topic.id,
      level,
      // The review never suggests a level change: every exercise is from a different one.
      minLevel: review ? level : (topic.levels[0]?.level ?? 1),
      maxLevel: review ? level : (gradeLevels.at(-1)?.level ?? 10),
      band,
      ...(profile.settings.roundLength ? { roundLength: profile.settings.roundLength } : {}),
      exercise: generate(level),
    });
  };

  // A round of this station left in the middle goes on from where it stood (roundSave.ts).
  const saveMode = mode === 'level' ? 'level' : mode === 'review' ? 'review' : null;
  const [resumed] = useState(() =>
    saveMode
      ? savedRound(profile.id, { mode: saveMode, topicId: topic.id, startLevel: station.level })
      : null,
  );
  const [s, setS] = useState<SessionState>(() => {
    if (resumed) {
      seen.current = resumed.seen;
      return resumed.state;
    }
    return newRound(station.level);
  });
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);
  const [value, setValue] = useState('');
  const [tried, setTried] = useState<number[]>([]);
  const [notice, setNotice] = useState<string | null>(() =>
    resumed
      ? t('round.resumed', { params: { n: resumed.state.done + 1, total: resumed.state.length } })
      : null,
  );
  // The round's scene: one mark per finished exercise (lit unless its answer was shown),
  // and a count of wrong tries for its small reaction.
  const [marks, setMarks] = useState<boolean[]>(() => resumed?.marks ?? []);
  // Where the round stands, kept as it goes (from its first finished exercise); a finished
  // round leaves nothing behind.
  useEffect(() => {
    if (!saveMode) return;
    if (s.phase === 'finished') clearRound(profile.id);
    else if (s.done > 0)
      saveRound(profile.id, { mode: saveMode, state: s, marks, seen: seen.current });
  }, [s, marks, saveMode, profile.id]);
  const [nudge, setNudge] = useState(0);
  // Each world has its scene, by its place in her grade (the first world's when not drawn yet).
  const sceneKind = useMemo(() => {
    const index =
      worldsFor(profile.grade, appProgress(profile.id)).find((w) => w.topic.id === topic.id)
        ?.index ?? 1;
    return sceneForWorld(sceneStyleForGrade(profile.grade), index - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const quietScene = useMemo(
    () => profile.settings.effects === 'quiet' || prefersReducedMotion(),
    [profile.settings.effects],
  );
  const stateRef = useRef(s);
  stateRef.current = s;
  const cardRef = useRef<HTMLElement>(null);
  const answersRef = useRef<HTMLElement>(null);
  // A computer screen, wide and tall enough: the scene goes beside the keys.
  const deck = useMedia('(min-width: 900px) and (min-height: 600px)');
  // How tall the keys are, so what comes in their place after an answer takes the same room.
  const answerHeight = useRef<number | null>(null);
  useLayoutEffect(() => {
    const open = s.phase === 'answering' || s.phase === 'wrong';
    if (open && answersRef.current) answerHeight.current = answersRef.current.offsetHeight;
  });
  const hintsRef = useRef<HTMLElement>(null);
  const playing = s.phase !== 'finished';
  useFitToScreen(cardRef, answersRef, {
    active: playing,
    content: `${s.done}:${s.exercise.factId}:${s.phase}:${s.hintsShown}`,
    // While the answer is shown, nothing grows back (it would only jump before the next one).
    shrinkOnly: s.phase === 'correct' || s.phase === 'revealed',
  });

  // The hint shown: the newest, unless the child taps back to an earlier one.
  const [hintView, setHintView] = useState<number | null>(null);
  const [countToken, setCountToken] = useState(0);
  useEffect(() => setHintView(null), [s.hintsShown, s.done, s.exercise.factId]);
  // The child can put the hints away; "רמז" brings them back (and a new one only when they are shown).
  const [hintsHidden, setHintsHidden] = useState(false);
  useEffect(() => setHintsHidden(false), [s.done, s.exercise.factId]);
  const shownHint = Math.min(hintView ?? s.hintsShown - 1, Math.max(0, s.hintsShown - 1));
  // A hint opens at its top in its panel (which scrolls by itself, never the page).
  useLayoutEffect(() => {
    if (hintsRef.current) hintsRef.current.scrollTop = 0;
  }, [shownHint, s.hintsShown]);

  useEffect(() => applyAgeBand(band), [band]);
  useEffect(() => applyPlusiColor(profile.plusiColor), [profile.plusiColor]);
  useEffect(() => setSoundsEnabled(profile.settings.sounds !== false), [profile.settings.sounds]);

  const apply = (action: SessionAction) => {
    const before = stateRef.current;
    const after = reduce(before, action);
    // The sounds of an answer: on the way in (before the state settles, so they feel instant).
    // A right answer sounds in the scene's voice (SceneStrip); the plain ding only
    // when the scene is quiet.
    if (after.phase === 'correct' && before.phase !== 'correct') {
      if (quietScene) playCorrect();
    } else if (after.phase === 'wrong' && after.tries > before.tries) {
      playAlmost();
      setNudge((n) => n + 1);
    }
    if (completedExercise(before, after)) {
      const outcome = after.history.at(-1);
      setMarks((m) => [...m, outcome !== 'revealed']);
      const exTopic = mixed ? (topicById(before.exercise.topicId) ?? topic) : topic;
      recordAttempt(profile.id, {
        topicId: exTopic.id,
        // A review round is scored, but never moves the level the child is at.
        // A review round is scored, but never moves the level the child is at; nor does
        // a round that eased to a lower level for a while (it is still that station's).
        level: mixed
          ? currentLevel(exTopic, profile.grade, appProgress(profile.id))
          : review
            ? station.stored
            : before.startLevel,
        correct: outcome === 'first',
        at: Date.now(),
        ...(outcome !== 'first' && after.firstMistake ? { mistake: after.firstMistake } : {}),
      });
    }
    if (after.phase === 'finished' && before.phase !== 'finished' && daily) {
      completeDaily(profile.id);
    } else if (after.phase === 'finished' && before.phase !== 'finished' && mixed) {
      completeMixed(profile.id);
    } else if (after.phase === 'finished' && before.phase !== 'finished') {
      setOutcome(
        completeRound(profile.id, {
          topicId: topic.id,
          station: review ? 'review' : after.startLevel,
          firstTry: after.firstTryCount,
          length: after.length,
          at: Date.now(),
          lastLevel: gradeLevels.at(-1)?.level ?? 10,
          ...(droppedLevel(after) ? { eased: true } : {}),
        }),
      );
    }
    if (action.type === 'next' || action.type === 'changeLevel') {
      setValue('');
      setTried([]);
    }
    stateRef.current = after;
    setS(after);
  };

  const advance = () => {
    const cur = stateRef.current;
    if (cur.phase !== 'correct' && cur.phase !== 'revealed') return;
    if (cur.suggestion === 'down') {
      // A child who is stuck drops a level right away; one line says so, no question.
      const level = cur.level - 1;
      setNotice(t('practice.levelChanged.down'));
      apply({ type: 'changeLevel', level, exercise: generate(level) });
      return;
    }
    setNotice(null);
    apply({ type: 'next', exercise: generate(cur.level) });
  };

  // A correct answer moves on by itself after a short celebration.
  useEffect(() => {
    if (s.phase !== 'correct') return;
    const id = window.setTimeout(advance, CORRECT_PAUSE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase, s.done]);

  const answer = (v: number) => {
    if (s.exercise.input.type === 'choices') setTried((x) => [...x, v]);
    else setValue('');
    apply({ type: 'answer', value: v });
  };

  if (s.phase === 'finished') {
    // Playing a finished world again, or a mixed round, is always just praise: nothing to pass.
    const praise = daily
      ? t('practice.done.daily')
      : mixed
        ? t('practice.done.worldMix')
        : replaying
          ? t('practice.done.replay')
          : null;
    const result =
      praise ??
      (outcome ? resultLine(outcome, tc, profile.id, profile.grade, droppedLevel(s)) : null);
    const passed = praise !== null || outcome?.passed === true;
    const spoken =
      praise ?? (passed ? tc('practice.done.passedSpoken') : t('practice.done.notPassed'));
    // The daily goal, when the parent set one: reached just now, or how many rounds are left.
    const goal = profile.settings.dailyGoal;
    const today = roundsToday(appProgress(profile.id), Date.now());
    const goalLine = !goal
      ? null
      : today > goal
        ? t('goal.doneAlready')
        : today === goal
          ? t('goal.doneNow')
          : today === goal - 1
            ? t('goal.oneLeft')
            : today === goal - 2
              ? t('goal.twoLeft')
              : null;
    // Ten more stars make a medal in the album: said when this round crossed the line.
    const gained = outcome ? Math.max(0, outcome.stars - outcome.bestBefore) : 0;
    const starsNow = totalStars(appProgress(profile.id));
    const newMedal = gained > 0 && medalsFor(starsNow) > medalsFor(starsNow - gained);
    // The final challenge passed: the world is finished, a celebration of its own.
    if (outcome?.worldCompleted && !mixed && !replaying) {
      const worlds = worldsFor(profile.grade, appProgress(profile.id));
      const done = worlds.find((w) => w.topic.id === topic.id);
      if (done) {
        return (
          <WorldComplete
            profile={profile}
            world={done}
            next={worlds[done.index] ?? null}
            spoken={t('practice.done.worldDone')}
          />
        );
      }
    }
    // A plain station round (not the daily review, not a world played again, not the
    // end of a world): passed leads straight to the next station, otherwise the same again.
    const stationRound = !mixed && !replaying && outcome !== null && !outcome.worldCompleted;
    const startAt = (level: number) => {
      setNotice(null);
      setValue('');
      setTried([]);
      setOutcome(null);
      setMarks([]);
      const fresh = newRound(level);
      stateRef.current = fresh;
      setS(fresh);
    };
    // The same station again (never the easier level a stuck round dropped to).
    const playAgain = () => startAt(stateRef.current.startLevel);
    // Where the journey goes on from here: the first station of this world still to pass
    // (never one already passed), or its final challenge once they all are.
    const after =
      !mixed && !replaying ? activeWorld(profile.grade, appProgress(profile.id)) : undefined;
    const ahead =
      after && after.topic.id === topic.id
        ? after.stations.some((st) => st.state === 'current')
          ? nextStop(after)
          : after.review === 'current'
            ? ({ kind: 'review' } as const)
            : null
        : null;
    const goNext = () => {
      if (ahead?.kind === 'level') startAt(ahead.level);
      else if (ahead?.kind === 'review') navigate({ name: 'review' });
      else navigate({ name: 'play' });
    };
    // The round's stars, from its first-try answers; a station's best is kept on the map.
    const stars = outcome?.stars ?? starsFor(s.firstTryCount, s.length);
    const record = outcome !== null && outcome.bestBefore > 0 && outcome.stars > outcome.bestBefore;
    const passRate = mode === 'review' ? REVIEW_PASS_RATE : STATION_PASS_RATE;
    const need = Math.ceil(passRate * s.length - 1e-9);
    return (
      <main className="screen practice" data-screen="practice-done">
        <section
          className={passed ? 'stack done done--passed' : 'stack done done--again'}
          style={{ alignItems: 'center', textAlign: 'center' }}
        >
          <SceneStrip
            kind={sceneKind}
            total={s.length}
            marks={marks}
            quiet={quietScene}
            finale
            done={s.length}
            label={t('practice.progress', { params: { n: s.length, total: s.length } })}
          />
          <Plusi
            mood={passed ? 'cheering' : 'happy'}
            size={band === 'young' ? 88 : 72}
            decorative
          />
          <h1>
            {passed
              ? t('practice.done.title', { params: { name: profile.name } })
              : t('practice.done.titleAgain', { params: { name: profile.name } })}
          </h1>
          <Stars n={stars} size="lg" />
          {record ? <p className="done__record">{t('practice.done.record')}</p> : null}
          <p className="done__body">
            {t('practice.done.score', { params: { n: s.firstTryCount, total: s.length } })}
          </p>
          {/* Not passed: what it takes, in the round's own numbers. */}
          {!passed && stationRound ? (
            <p className="done__need">
              {t('practice.done.need', { params: { n: need, total: s.length } })}
            </p>
          ) : null}
          {result ? (
            <div
              className={passed ? 'feedback feedback--correct' : 'feedback feedback--almost'}
              role="status"
            >
              <SpeakerButton text={spoken} />
              <span>{result}</span>
            </div>
          ) : null}
          {newMedal ? <p className="done__record">{t('practice.done.medal')}</p> : null}
          {goalLine ? <p className="done__goal">{goalLine}</p> : null}
          {stationRound ? (
            // A station round: one big way on (the next station, or the same one again),
            // and a small way out to the map.
            <div className="stack done__actions" style={{ alignItems: 'center' }}>
              <button type="button" className="btn btn--hero" onClick={passed ? goNext : playAgain}>
                {!passed
                  ? t('practice.done.again')
                  : ahead?.kind === 'review'
                    ? t('journey.start.review')
                    : ahead?.kind === 'level' && ahead.level !== s.startLevel + 1
                      ? t('practice.done.toStation', { params: { n: ahead.level } })
                      : t('practice.done.next')}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => navigate({ name: 'play' })}
              >
                {t('practice.done.toJourney')}
              </button>
            </div>
          ) : (
            <div className="row" style={{ justifyContent: 'center' }}>
              {outcome?.worldCompleted || replaying ? (
                <button type="button" className="btn" onClick={() => navigate({ name: 'album' })}>
                  {t('practice.done.toAlbum')}
                </button>
              ) : null}
              <button
                type="button"
                className={outcome?.worldCompleted || replaying ? 'btn btn--secondary' : 'btn'}
                onClick={() => navigate({ name: 'play' })}
              >
                {t('practice.done.toJourney')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={playAgain}>
                {t('practice.done.again')}
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  const e = s.exercise;
  const finished = s.phase === 'correct' || s.phase === 'revealed';
  // Things to count (not a frame): each can be tapped, and counted together after a miss.
  const countable = e.visual?.type === 'objects' && !e.visual.frame;
  // A long typed number is easier to check with separators (1,462,743), as everywhere else.
  const slotValue = finished
    ? answerLabel(e)
    : e.input.type === 'numpad' && value
      ? groupDigits(value)
      : '?';
  const hasSlot = e.display.includes('?');
  const [before, after] = e.display ? splitAtSlot(e.display) : ['', ''];

  const scene = (
    <SceneStrip
      kind={sceneKind}
      total={s.length}
      marks={marks}
      nudge={nudge}
      quiet={quietScene}
      done={s.done}
      label={t('practice.progress', {
        params: { n: Math.min(s.done + 1, s.length), total: s.length },
      })}
    />
  );
  const answers = finished ? (
    // Where the keys were, and as tall: what happened and the way on. The exercise stays put.
    <section
      ref={answersRef}
      className="answer answer--done"
      style={answerHeight.current ? { minHeight: answerHeight.current } : undefined}
    >
      <Feedback state={s} tc={tc} />
      <button type="button" className="btn btn--hero practice__next" onClick={advance}>
        {t('practice.next')}
      </button>
    </section>
  ) : e.input.type === 'vertical' ? null : (
    <section ref={answersRef} className="answer">
      {e.input.type === 'choices' ? (
        <div
          className="choices-big"
          role="group"
          aria-label={t('practice.choicesLabel')}
          dir={e.input.rtl ? 'rtl' : 'ltr'}
        >
          {e.input.choices.map((c, i) => {
            const label = e.input.type === 'choices' ? e.input.labels?.[i] : undefined;
            const picture = e.input.type === 'choices' ? e.input.visuals?.[i] : undefined;
            if (picture) {
              return (
                <button
                  key={c}
                  type="button"
                  className="choice-big choice-big--picture"
                  aria-label={label}
                  disabled={tried.includes(c)}
                  onClick={() => answer(c)}
                >
                  <VisualView visual={picture} />
                </button>
              );
            }
            const text = groupDigits(label ?? String(c));
            return (
              <button
                key={c}
                type="button"
                className={label ? 'choice-big choice-big--label' : 'choice-big'}
                // The longest word sets the label's size, so a long number never overflows.
                style={label ? ({ '--chars': longestWord(text) } as CSSProperties) : undefined}
                disabled={tried.includes(c)}
                onClick={() => answer(c)}
              >
                {label ? <span className="choice-big__text">{text}</span> : text}
              </button>
            );
          })}
        </div>
      ) : (
        <NumberPad
          label={t('practice.answerLabel')}
          value={value}
          onChange={setValue}
          maxLength={e.input.maxDigits}
          decimal={e.input.decimal ?? false}
          onSubmit={() => answer(Number(value))}
        />
      )}
      {e.input.type !== 'choices' ? (
        <p className="answer__keyboard-hint">{t('desktop.keyboardHint')}</p>
      ) : null}
    </section>
  );

  // The hints the child opened: under the answer line; beside the keys (at their right) on a computer.
  // Beside the keys only: next to the short row of big choices there is no room to read one.
  const hintsBeside = deck && e.input.type !== 'choices';
  const hints =
    s.hintsShown > 0 && !hintsHidden ? (
      <section ref={hintsRef} className="hints stack" aria-label={t('action.hint')}>
        {/* One hint at a time, the newest; the earlier ones a tap away, never half hidden. */}
        {s.hintsShown > 1 ? (
          <div className="hints__tabs" role="tablist" aria-label={t('action.hint')}>
            {e.hints.slice(0, s.hintsShown).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === shownHint}
                className={i === shownHint ? 'hints__tab hints__tab--on' : 'hints__tab'}
                onClick={() => setHintView(i)}
              >
                {t('practice.hintTitle', { params: { n: i + 1 } })}
              </button>
            ))}
          </div>
        ) : null}
        {(() => {
          const h = e.hints[shownHint];
          if (!h) return null;
          return (
            <article key={shownHint} className="hint card">
              <div className="hint__head">
                <SpeakerButton text={h.spoken} parts={h.spokenParts} />
                <strong>{t('practice.hintTitle', { params: { n: shownHint + 1 } })}</strong>
                <button
                  type="button"
                  className="btn btn--ghost hint__close"
                  aria-label={t('hints.close')}
                  onClick={() => setHintsHidden(true)}
                >
                  ✕
                </button>
              </div>
              <p>{h.text}</p>
              {h.visual ? <VisualView visual={h.visual} /> : null}
              {h.example ? <MathExpr block>{h.example.display}</MathExpr> : null}
            </article>
          );
        })()}
      </section>
    ) : null;

  return (
    <main
      className={[
        'screen practice',
        mode === 'review' ? 'practice--challenge' : '',
        // Hints open: the scene folds into the bar, so the exercise and the hint both fit.
        s.hintsShown > 0 && !hintsHidden && !finished ? 'practice--hints' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-screen="practice"
      data-station={review ? undefined : s.startLevel}
    >
      <header className="practice__bar">
        <div className="practice__side">
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => navigate({ name: 'play' })}
          >
            {t('practice.exit')}
          </button>
        </div>
        {/* The round's picture: every right answer moves it on (and it is the progress bar).
            Under the bar on most screens; in its middle on short phones (scenes.css); beside
            the keys on a computer. */}
        {deck ? null : scene}
        {/* A station round names its station at the top, so it is never mistaken for the final challenge. */}
        {mode === 'level' ? (
          <p className="station-line">
            {t('practice.station', {
              params: {
                n: s.startLevel,
                name: (() => {
                  const key = gradeLevels.find((l) => l.level === s.startLevel)?.labelKey;
                  return key ? t(key as TranslationKey) : '';
                })(),
              },
            })}
          </p>
        ) : null}
        <div className="practice__side practice__side--end">
          {/* Plusi, small, reacts to every answer from the corner of the bar. */}
          <span className="practice__mascot">
            <Plusi
              key={`${s.done}:${s.phase}`}
              mood={plusiMood(s)}
              size={band === 'young' ? 44 : 42}
              decorative
              className="practice__plusi"
            />
            {/* Confetti for right the first time only: fixing it is praised, not celebrated. */}
            {s.phase === 'correct' && s.history.at(-1) === 'first' ? <Confetti /> : null}
          </span>
        </div>
      </header>

      {notice ? (
        <p className="notice notice--ok" role="status">
          {notice}
        </p>
      ) : null}
      {/* The final challenge looks like one: a gold banner with what it takes, all round. */}
      {mode === 'review' ? (
        <p className="challenge-banner" role="note">
          <StarBadge />
          {t('practice.challenge.banner', {
            params: { n: Math.ceil(REVIEW_PASS_RATE * s.length - 1e-9), total: s.length },
          })}
        </p>
      ) : null}
      {review && mode !== 'review' && s.done === 0 && s.phase === 'answering' ? (
        <p className="notice" role="status">
          {t(mode === 'worldMix' ? 'practice.worldMix.body' : 'practice.review.body')}
        </p>
      ) : null}

      <section
        ref={cardRef}
        className={e.input.type === 'vertical' ? 'exercise exercise--column card' : 'exercise card'}
        aria-live="polite"
      >
        <div
          className={
            // A word problem: its text starts at the speaker's side and gets the rest of the row.
            e.prompt.length > LONG_PROMPT
              ? 'exercise__prompt exercise__prompt--long'
              : 'exercise__prompt'
          }
        >
          <SpeakerButton text={e.spokenText} parts={e.spokenParts} size="lg" />
          <h1 className="exercise__title">{groupDigits(e.prompt)}</h1>
        </div>
        {e.visual ? (
          <VisualView
            key={`${s.done}:${e.factId}`}
            visual={e.visual}
            interactive={countable}
            countToken={countToken}
          />
        ) : null}
        {/* After a miss on a picture to count: count it together, aloud, one by one. */}
        {countable && s.phase === 'wrong' ? (
          <button
            type="button"
            className="btn btn--secondary btn--small practice__count"
            onClick={() => setCountToken((k) => k + 1)}
          >
            {t('practice.countTogether')}
          </button>
        ) : null}
        {e.input.type === 'vertical' ? (
          // Written in columns: the grid, what to do, and its own number pad.
          <ColumnWork
            key={`${s.done}:${e.factId}`}
            layout={e.input.layout}
            guided={e.input.guided}
            phase={s.phase}
            onMiss={(mistake, assisted) => apply({ type: 'stepMiss', mistake, assisted })}
            onSubmit={(v) => apply({ type: 'answer', value: v })}
          />
        ) : e.display ? (
          <MathExpr block label={e.spokenText}>
            {before}
            {hasSlot ? (
              <span
                className={
                  // Shown after the tries: the answer, in the colour of "here it is", not of "right!".
                  s.phase === 'correct' ? 'slot slot--done' : finished ? 'slot slot--shown' : 'slot'
                }
              >
                {slotValue}
              </span>
            ) : null}
            {after}
          </MathExpr>
        ) : null}
        {e.input.type === 'numpad' && !hasSlot ? (
          // No equation to hold the slot (stories, dictation): the typed answer shows here.
          <div
            className={finished ? 'answer-box answer-box--done' : 'answer-box'}
            dir="ltr"
            aria-live="polite"
          >
            {finished ? answerLabel(e) : groupDigits(value) || '?'}
          </div>
        ) : null}
        <ReportMistake exercise={e} given={s.lastValue} />
        {/* The hint, right under the answer line: where the child is looking when stuck.
            After the answer its place stays (unseen), so the exercise does not move. */}
        <button
          type="button"
          className="btn btn--secondary btn--small practice__hint"
          style={finished ? { visibility: 'hidden' } : undefined}
          aria-hidden={finished || undefined}
          tabIndex={finished ? -1 : undefined}
          disabled={finished || (s.hintsShown >= 3 && !hintsHidden)}
          onClick={() => {
            if (hintsHidden) setHintsHidden(false);
            else apply({ type: 'hint' });
          }}
        >
          {t('action.hint')}
        </button>
      </section>

      {hintsBeside ? null : hints}

      {finished ? null : <Feedback state={s} tc={tc} />}

      {deck ? (
        // A computer: the hints at the keys' right, the scene square at their left (not a band).
        <div className="practice__deck">
          {hintsBeside && hints ? <div className="practice__deck-hints">{hints}</div> : null}
          {answers}
          <div className="practice__deck-scene">{scene}</div>
        </div>
      ) : (
        answers
      )}
    </main>
  );
}

/** Characters in the longest word of a label (a long number is one word). */
function longestWord(text: string): number {
  return Math.max(1, ...text.split(/\s+/).map((w) => w.length));
}

/**
 * Keeps the whole exercise on one screen (phone first): the card shrinks its
 * question text, pictures and column grid until its content fits the height
 * it has (--card-fit, read by global.css; pictures by zoom, which works on any
 * picture), and a picture on an answer button shrinks until it fits its
 * button. Measured before paint on every new exercise, step and hint, and
 * again whenever the card or the answers change size (a phone turning, the
 * feedback line appearing) or the card's content changes (a typed digit, the
 * column exercise saying what to do next).
 */
function useFitToScreen(
  cardRef: RefObject<HTMLElement | null>,
  answersRef: RefObject<HTMLElement | null>,
  { active, content, shrinkOnly }: { active: boolean; content: string; shrinkOnly: boolean },
) {
  const fitRef = useRef<() => void>(() => undefined);
  const shrinkRef = useRef(shrinkOnly);
  shrinkRef.current = shrinkOnly;
  const current = useRef(1);

  fitRef.current = () => {
    const card = cardRef.current;
    if (card) {
      const sheets = () => card.querySelectorAll<HTMLElement>('.column-work__sheet');
      const overflowing = () => {
        if (card.scrollHeight > card.clientHeight + 1) return true;
        for (const el of sheets()) if (el.scrollHeight > el.clientHeight + 1) return true;
        return false;
      };
      const pictures = card.querySelectorAll<HTMLElement>(':scope > [data-visual]');
      const set = (f: number) => {
        card.style.setProperty('--card-fit', f.toFixed(2));
        for (const el of pictures) {
          if (f < 1) el.style.setProperty('zoom', f.toFixed(2));
          else el.style.removeProperty('zoom');
        }
      };
      let f = shrinkRef.current ? current.current : 1;
      set(f);
      while (f > MIN_CARD_FIT && overflowing()) {
        f = Math.max(MIN_CARD_FIT, f - CARD_FIT_STEP);
        set(f);
      }
      current.current = f;
    }
    const answers = answersRef.current;
    if (answers) {
      for (const button of answers.querySelectorAll<HTMLElement>('.choice-big--picture')) {
        const picture = button.firstElementChild;
        if (!(picture instanceof HTMLElement)) continue;
        let z = 1;
        picture.style.removeProperty('zoom');
        const over = () =>
          button.scrollHeight > button.clientHeight + 1 ||
          button.scrollWidth > button.clientWidth + 1;
        while (z > MIN_PICTURE_FIT && over()) {
          z = Math.max(MIN_PICTURE_FIT, z - 0.1);
          picture.style.setProperty('zoom', z.toFixed(2));
        }
      }
    }
  };

  // A new exercise, step or hint: fitted before it is ever painted.
  useLayoutEffect(() => {
    if (active) fitRef.current();
  }, [active, content]);

  // Sizes and content changing later: fitted on the next frame.
  useEffect(() => {
    const card = cardRef.current;
    if (!active || !card) return;
    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => fitRef.current());
    };
    const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(later);
    sizes?.observe(card);
    if (answersRef.current) sizes?.observe(answersRef.current);
    const changes = typeof MutationObserver === 'undefined' ? null : new MutationObserver(later);
    changes?.observe(card, { childList: true, subtree: true, characterData: true });
    void document.fonts?.ready.then(later);
    return () => {
      cancelAnimationFrame(frame);
      sizes?.disconnect();
      changes?.disconnect();
    };
  }, [active, content, cardRef, answersRef]);
}

/** Reads progress once, outside React, for the station choice at round start. */
function appProgress(profileId: string) {
  return appStore.getState().data.progress[profileId];
}

/** What the round meant for the journey, in one sentence. */
function resultLine(
  o: RoundOutcome,
  tc: TC,
  profileId: string,
  grade: Profile['grade'],
  eased: boolean,
): string {
  if (o.worldCompleted) return t('practice.done.worldDone');
  // The round went easier for a while: practice, not a pass; the station comes again.
  if (!o.passed && eased) return t('practice.done.eased');
  if (!o.passed) return t('practice.done.notPassed');
  const world = activeWorld(grade, appProgress(profileId));
  // A station opened only if it is now the one to play (not one passed before).
  const opened =
    o.advancedTo !== null &&
    world?.stations.find((st) => st.level === o.advancedTo)?.state === 'current';
  if (opened) return `${tc('practice.done.passed')} ${t('practice.done.nextOpened')}`;
  // Passed the last station needed: is the review open now?
  if (world?.review === 'current' && o.newlyCompleted)
    return `${tc('practice.done.passed')} ${t('practice.done.reviewOpened')}`;
  // Nothing opened (the last station, with stations skipped on the way): what is left.
  const left =
    world?.review === 'locked'
      ? world.stations.filter((st) => !st.warmup && st.state !== 'done').length
      : 0;
  if (left > 0)
    return `${tc('practice.done.passed')} ${
      left === 1 ? t('practice.done.leftOne') : t('practice.done.left', { params: { n: left } })
    }`;
  return tc('practice.done.passed');
}

/** Plusi reacts to the moment: never a sad face (see ui/Plusi.tsx). */
function plusiMood(s: SessionState): PlusiMood {
  if (s.phase === 'correct') return 'cheering';
  if (s.phase === 'wrong' || s.phase === 'revealed') return 'calm';
  if (s.hintsShown > 0) return 'thinking';
  return 'happy';
}

function StarBadge() {
  return (
    <svg viewBox="0 0 24 24" className="challenge-banner__star" aria-hidden="true">
      <path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z" />
    </svg>
  );
}

/** A few coloured dots that burst and fade on a right answer. Decorative only. */
function Confetti() {
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`confetti__bit confetti__bit--${i}`} />
      ))}
    </span>
  );
}

/** The answer as shown: the choice's label when the buttons carry labels. */
function answerLabel(e: Exercise): string {
  if (e.input.type === 'choices' && e.input.labels) {
    const i = e.input.choices.indexOf(e.answer);
    return groupDigits(e.input.labels[i] ?? String(e.answer));
  }
  return groupDigits(String(e.answer));
}

function splitAtSlot(display: string): [string, string] {
  const i = display.indexOf('?');
  return i < 0 ? [display, ''] : [display.slice(0, i), display.slice(i + 1)];
}

type TC = ReturnType<typeof makeT>;

function Feedback({ state: s, tc }: { state: SessionState; tc: TC }) {
  const e = s.exercise;
  if (s.phase === 'correct') {
    const first = s.history.at(-1) === 'first';
    const text = tc(first ? 'feedback.correct' : 'feedback.correctLater');
    return (
      <div
        className={
          first ? 'feedback feedback--correct' : 'feedback feedback--correct feedback--later'
        }
        role="status"
      >
        <SpeakerButton text={text} />
        <span>{text}</span>
      </div>
    );
  }
  if (s.phase === 'revealed') {
    return (
      <div className="feedback feedback--reveal" role="status">
        <SpeakerButton text={e.solutionSpoken} parts={e.solutionParts} />
        <span>{t('explain.reveal', { params: { answer: answerLabel(e) } })}</span>
      </div>
    );
  }
  if (s.phase === 'wrong') {
    // Advice for this very mistake, said for the exercise's own numbers, when there is some.
    const v = s.lastValue;
    const advice = v === null ? undefined : e.advice?.find((a) => Math.abs(a.value - v) < 1e-9);
    if (advice) {
      return (
        <div className="feedback feedback--almost" role="status">
          <SpeakerButton text={advice.spoken} parts={advice.parts} />
          <span>{advice.text}</span>
        </div>
      );
    }
    const text = explanation(s, tc);
    return (
      <div className="feedback feedback--almost" role="status">
        <SpeakerButton text={text} />
        <span>{text}</span>
      </div>
    );
  }
  // Nothing to say: no room is taken, the card keeps it.
  return null;
}

/** An operation sign the child can see in the exercise. */
const SIGN = /[+−×÷:]|\s-\s/;

function explanation(s: SessionState, tc: TC): string {
  const m = s.lastMistake;
  if (m === 'wrongOperation') {
    const op = s.exercise.operation;
    // No operation known (order of operations, volume): never guess "add" — a general nudge.
    if (!op) return nudge(s, tc);
    // "Look at the sign" only when there is a sign to look at; a story says what to do instead.
    return SIGN.test(s.exercise.display)
      ? tc(`explain.wrongOperation.${op}`)
      : tc(`explain.wrongOperation.story.${op}`);
  }
  const e = s.exercise;
  // The same slip, said for the numbers at hand: "count again slowly" means nothing for 352,418.
  if (m === 'offByOne' && (e.answer >= 100 || !Number.isInteger(e.answer)))
    return tc('explain.offByOne.big');
  // By the operation: a times-table fact, or the units of a sum or difference (not counting).
  if (m === 'offByOne' && (e.operation === 'mul' || e.operation === 'div'))
    return tc('explain.offByOne.mul');
  if (m === 'offByOne' && (e.operation === 'add' || e.operation === 'sub') && e.answer >= 10)
    return tc('explain.offByOne.add');
  // "Check the tens" only where there are tens to check.
  if (m === 'offByTen' && e.answer < 10) return nudge(s, tc);
  // A hundred off (2905 for 3005): the hundreds, not the tens.
  if (m === 'offByTen' && s.lastValue !== null && Math.abs(s.lastValue - e.answer) === 100)
    return tc('explain.offByHundred');
  if (m === 'placeValue') {
    if (/ס״מ|מ׳|מ״מ|ק״מ|ק״ג|גרם|ליטר/.test(`${e.prompt} ${e.display}`))
      return tc('explain.placeValue.units');
    if (!Number.isInteger(e.answer)) return tc('explain.placeValue.decimal');
    if (e.answer < 100) return tc('explain.placeValue.small');
  }
  if (m === 'shapeFormula') return tc('explain.shapeFormula');
  if (
    m === 'offByOne' ||
    m === 'digitReversal' ||
    m === 'placeValue' ||
    m === 'carry' ||
    m === 'borrow' ||
    m === 'offByTen' ||
    m === 'remainder' ||
    m === 'countedCoins' ||
    m === 'clockHands' ||
    m === 'order' ||
    m === 'decimalPoint'
  ) {
    return tc(`explain.${m}`);
  }
  // Other kinds have no specific advice yet: a gentle, general nudge.
  return nudge(s, tc);
}

/** "Almost" only for an answer that really is close; otherwise "not quite". */
function nudge(s: SessionState, tc: TC): string {
  const e = s.exercise;
  const v = s.lastValue;
  // Labelled buttons (words, fractions, yes/no) answer with an index: nothing is "close".
  const numeric = !(e.input.type === 'choices' && e.input.labels);
  const close =
    numeric && v !== null && Math.abs(v - e.answer) <= Math.max(1, Math.abs(e.answer) * 0.1);
  return tc(close ? 'feedback.almost' : 'feedback.notQuite');
}

/** Whether a media query matches, kept up to date. */
function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}
