import { useEffect, useMemo, useRef, useState } from 'react';
import { replayTopic } from '@/app/replay';
import { navigate } from '@/app/router';
import { dailyPool, pickDaily, type DailyItem } from '@/engine/daily';
import { activeWorld, nextStop, worldsFor } from '@/engine/journey';
import { pick } from '@/engine/rng';
import { currentLevel, levelsFor, topicById } from '@/engine/registry';
import {
  completedExercise,
  reduce,
  startSession,
  type SessionAction,
  type SessionState,
} from '@/engine/session';
import type { Exercise, Topic } from '@/engine/types';
import { makeT, t } from '@/i18n';
import type { RoundOutcome } from '@/state/progress';
import type { Profile } from '@/state/schema';
import { appStore, useActiveProfile, useApp } from '@/state/store';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { MathExpr } from '@/ui/MathExpr';
import { groupDigits } from '@/lang/groupDigits';
import { NumberPad } from '@/ui/NumberPad';
import { Plusi, type PlusiMood } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { ColumnWork } from '@/ui/Vertical';
import { VisualView } from '@/ui/Visuals';

/** A prompt longer than this (characters) is a word problem rather than "how much is it?". */
const LONG_PROMPT = 40;

/** How long a correct answer stays on screen before the next exercise. */
const CORRECT_PAUSE_MS = 1400;

/**
 * 'level': the next station. 'review': the world's final station, exercises
 * from every level. 'replay': a finished world played again from the album,
 * mixed like the review; it changes nothing on the journey. 'daily': the
 * day's review, exercises from stations passed in any of her worlds.
 */
export type PracticeMode = 'level' | 'review' | 'replay' | 'daily';

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
  const noDaily =
    mode === 'daily' &&
    profile !== undefined &&
    dailyPool(profile.grade, appProgress(profile.id)).length === 0;
  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
    else if (missingReplay) navigate({ name: 'album' }, { replace: true });
    else if (noDaily) navigate({ name: 'play' }, { replace: true });
  }, [profile, missingReplay, noDaily]);
  if (!profile || missingReplay || noDaily) return null;
  return <Practice key={`${profile.id}:${mode}`} profile={profile} mode={mode} />;
}

function Practice({ profile, mode }: { profile: Profile; mode: PracticeMode }) {
  const recordAttempt = useApp((s) => s.recordAttempt);
  const completeRound = useApp((s) => s.completeRound);
  const completeDaily = useApp((s) => s.completeDaily);
  const setTopicLevel = useApp((s) => s.setTopicLevel);
  const band = ageBandForGrade(profile.grade);
  const tc = makeT(profile.gender);
  const rng = () => Math.random();

  // The station is fixed for the round, even as progress updates.
  const station = useMemo(
    () => {
      const progress = appProgress(profile.id);
      if (mode === 'daily') {
        const pool = dailyPool(profile.grade, progress);
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
      return {
        topic,
        level: mode === 'level' && stop.kind === 'level' ? stop.level : stored,
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
  const pool = 'pool' in station ? station.pool : [];
  /** This child's levels of the world (a younger grade may end earlier). */
  const gradeLevels = levelsFor(topic, profile.grade);
  const levels = gradeLevels.map((l) => l.level);
  /** Exercises already given in this round: none comes again while the level has others. */
  const seen = useRef<string[]>([]);
  const generate = (level: number): Exercise => {
    const e = daily
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
      exercise: generate(level),
    });
  };

  const [s, setS] = useState<SessionState>(() => newRound(station.level));
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);
  const [value, setValue] = useState('');
  const [tried, setTried] = useState<number[]>([]);
  const [slow, setSlow] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const stateRef = useRef(s);
  stateRef.current = s;

  useEffect(() => applyAgeBand(band), [band]);

  const apply = (action: SessionAction) => {
    const before = stateRef.current;
    const after = reduce(before, action);
    if (completedExercise(before, after)) {
      const outcome = after.history.at(-1);
      const exTopic = daily ? (topicById(before.exercise.topicId) ?? topic) : topic;
      recordAttempt(profile.id, {
        topicId: exTopic.id,
        // A review round is scored, but never moves the level the child is at.
        level: daily
          ? currentLevel(exTopic, profile.grade, appProgress(profile.id))
          : review
            ? station.stored
            : before.level,
        correct: outcome === 'first',
        at: Date.now(),
        ...(outcome !== 'first' && after.firstMistake ? { mistake: after.firstMistake } : {}),
      });
    }
    if (action.type === 'changeLevel') setTopicLevel(profile.id, topic.id, after.level);
    if (after.phase === 'finished' && before.phase !== 'finished' && daily) {
      completeDaily(profile.id);
    } else if (after.phase === 'finished' && before.phase !== 'finished') {
      setOutcome(
        completeRound(profile.id, {
          topicId: topic.id,
          station: review ? 'review' : after.level,
          firstTry: after.firstTryCount,
          length: after.length,
          at: Date.now(),
          lastLevel: gradeLevels.at(-1)?.level ?? 10,
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
    // Playing a finished world again is always just praise: there is nothing to pass.
    const result = daily
      ? t('practice.done.daily')
      : replaying
        ? t('practice.done.replay')
        : outcome
          ? resultLine(outcome, tc, profile.id, profile.grade)
          : null;
    const passed = daily || replaying || outcome?.passed === true;
    const spoken = daily
      ? t('practice.done.daily')
      : replaying
        ? t('practice.done.replay')
        : passed
          ? tc('practice.done.passedSpoken')
          : t('practice.done.notPassed');
    return (
      <main className="screen practice" data-screen="practice-done">
        <section className="stack done" style={{ alignItems: 'center', textAlign: 'center' }}>
          <Plusi
            mood={passed ? 'cheering' : 'happy'}
            size={band === 'young' ? 160 : 128}
            decorative
          />
          <h1>{t('practice.done.title', { params: { name: profile.name } })}</h1>
          <p className="done__body">{t('practice.done.body', { params: { count: s.done } })}</p>
          {result ? (
            <div
              className={passed ? 'feedback feedback--correct' : 'feedback feedback--almost'}
              role="status"
            >
              <SpeakerButton text={spoken} slow={slow} />
              <span>{result}</span>
            </div>
          ) : null}
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
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                const level = outcome?.advancedTo ?? stateRef.current.level;
                setNotice(null);
                setValue('');
                setTried([]);
                setOutcome(null);
                const fresh = newRound(level);
                stateRef.current = fresh;
                setS(fresh);
              }}
            >
              {t('practice.done.again')}
            </button>
          </div>
        </section>
      </main>
    );
  }

  const e = s.exercise;
  const finished = s.phase === 'correct' || s.phase === 'revealed';
  // A long typed number is easier to check with separators (1,462,743), as everywhere else.
  const slotValue = finished
    ? answerLabel(e)
    : e.input.type === 'numpad' && value
      ? groupDigits(value)
      : '?';
  const hasSlot = e.display.includes('?');
  const [before, after] = e.display ? splitAtSlot(e.display) : ['', ''];

  return (
    <main className="screen practice" data-screen="practice">
      <header className="practice__bar">
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => navigate({ name: 'play' })}
        >
          {t('practice.exit')}
        </button>
        <Progress done={s.done} total={s.length} />
        <button
          type="button"
          className="btn btn--ghost btn--small slow-toggle"
          aria-pressed={slow}
          onClick={() => setSlow((x) => !x)}
        >
          {t('action.listenSlow')}
        </button>
      </header>

      {notice ? (
        <p className="notice notice--ok" role="status">
          {notice}
        </p>
      ) : null}
      {review && s.done === 0 && s.phase === 'answering' ? (
        <p className="notice" role="status">
          {t('practice.review.body')}
        </p>
      ) : null}

      <section className="exercise card" aria-live="polite">
        <div
          className={
            // A word problem: on a phone the speaker goes above it, so the text gets the full width.
            e.prompt.length > LONG_PROMPT
              ? 'exercise__prompt exercise__prompt--long'
              : 'exercise__prompt'
          }
        >
          <SpeakerButton text={e.spokenText} parts={e.spokenParts} slow={slow} size="lg" />
          <h1 className="exercise__title">{groupDigits(e.prompt)}</h1>
        </div>
        {e.visual ? <VisualView visual={e.visual} /> : null}
        {e.input.type === 'vertical' ? (
          // Written in columns: the grid, what to do, and its own number pad.
          <ColumnWork
            key={`${s.done}:${e.factId}`}
            layout={e.input.layout}
            guided={e.input.guided}
            phase={s.phase}
            slow={slow}
            onMiss={(mistake, assisted) => apply({ type: 'stepMiss', mistake, assisted })}
            onSubmit={(v) => apply({ type: 'answer', value: v })}
          />
        ) : e.display ? (
          <MathExpr block label={e.spokenText}>
            {before}
            {hasSlot ? (
              <span className={finished ? 'slot slot--done' : 'slot'}>{slotValue}</span>
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
      </section>

      <div className="coach">
        <Plusi
          key={`${s.done}:${s.phase}`}
          mood={plusiMood(s)}
          size={band === 'young' ? 112 : 88}
          decorative
          className="coach__plusi"
        />
        {s.phase === 'correct' ? <Confetti /> : null}
        <Feedback state={s} tc={tc} slow={slow} />
      </div>

      {!finished ? (
        <section className="answer">
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
                return (
                  <button
                    key={c}
                    type="button"
                    className={label ? 'choice-big choice-big--label' : 'choice-big'}
                    disabled={tried.includes(c)}
                    onClick={() => answer(c)}
                  >
                    {groupDigits(label ?? String(c))}
                  </button>
                );
              })}
            </div>
          ) : e.input.type === 'vertical' ? null : (
            <NumberPad
              label={t('practice.answerLabel')}
              value={value}
              onChange={setValue}
              maxLength={e.input.maxDigits}
              decimal={e.input.decimal ?? false}
              onSubmit={() => answer(Number(value))}
            />
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={s.hintsShown >= 3}
              onClick={() => apply({ type: 'hint' })}
            >
              {t('action.hint')}
            </button>
          </div>
        </section>
      ) : (
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn" onClick={advance}>
            {t('practice.next')}
          </button>
        </div>
      )}

      {s.hintsShown > 0 ? (
        <section className="hints stack" aria-label={t('action.hint')}>
          {e.hints.slice(0, s.hintsShown).map((h, i) => (
            <article key={i} className="hint card">
              <div className="hint__head">
                <SpeakerButton text={h.spoken} parts={h.spokenParts} slow={slow} />
                <strong>{t('practice.hintTitle', { params: { n: i + 1 } })}</strong>
              </div>
              <p>{h.text}</p>
              {h.visual ? <VisualView visual={h.visual} /> : null}
              {h.example ? <MathExpr block>{h.example.display}</MathExpr> : null}
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}

/** Reads progress once, outside React, for the station choice at round start. */
function appProgress(profileId: string) {
  return appStore.getState().data.progress[profileId];
}

/** What the round meant for the journey, in one sentence. */
function resultLine(o: RoundOutcome, tc: TC, profileId: string, grade: Profile['grade']): string {
  if (o.worldCompleted) return t('practice.done.worldDone');
  if (!o.passed) return t('practice.done.notPassed');
  if (o.advancedTo !== null)
    return `${tc('practice.done.passed')} ${t('practice.done.nextOpened')}`;
  // Passed the last level: is the review open now?
  const world = activeWorld(grade, appProgress(profileId));
  if (world?.review === 'current' && o.newlyCompleted)
    return `${tc('practice.done.passed')} ${t('practice.done.reviewOpened')}`;
  return tc('practice.done.passed');
}

/** Plusi reacts to the moment: never a sad face (see ui/Plusi.tsx). */
function plusiMood(s: SessionState): PlusiMood {
  if (s.phase === 'correct') return 'cheering';
  if (s.phase === 'wrong' || s.phase === 'revealed') return 'calm';
  if (s.hintsShown > 0) return 'thinking';
  return 'happy';
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

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <div
      className="progress-dots"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={t('practice.progress', { params: { n: Math.min(done + 1, total), total } })}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={i < done ? 'dot dot--done' : i === done ? 'dot dot--current' : 'dot'}
        />
      ))}
    </div>
  );
}

type TC = ReturnType<typeof makeT>;

function Feedback({ state: s, tc, slow }: { state: SessionState; tc: TC; slow: boolean }) {
  const e = s.exercise;
  if (s.phase === 'correct') {
    const text = tc('feedback.correct');
    return (
      <div className="feedback feedback--correct" role="status">
        <SpeakerButton text={text} slow={slow} />
        <span>{text}</span>
      </div>
    );
  }
  if (s.phase === 'revealed') {
    return (
      <div className="feedback feedback--reveal" role="status">
        <SpeakerButton text={e.solutionSpoken} parts={e.solutionParts} slow={slow} />
        <span>{t('explain.reveal', { params: { answer: answerLabel(e) } })}</span>
      </div>
    );
  }
  if (s.phase === 'wrong') {
    const text = explanation(s, tc);
    return (
      <div className="feedback feedback--almost" role="status">
        <SpeakerButton text={text} slow={slow} />
        <span>{text}</span>
      </div>
    );
  }
  return <div className="feedback feedback--empty" aria-hidden="true" />;
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
    m === 'order'
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
