import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '@/app/router';
import { nextStation } from '@/engine/registry';
import {
  completedExercise,
  reduce,
  startSession,
  type SessionAction,
  type SessionState,
} from '@/engine/session';
import type { Exercise, Topic } from '@/engine/types';
import { makeT, t } from '@/i18n';
import type { Profile } from '@/state/schema';
import { appStore, useActiveProfile, useApp } from '@/state/store';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { Dialog } from '@/ui/Dialog';
import { MathExpr } from '@/ui/MathExpr';
import { NumberPad } from '@/ui/NumberPad';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { VisualView } from '@/ui/Visuals';

/** How long a correct answer stays on screen before the next exercise. */
const CORRECT_PAUSE_MS = 1400;

export function PracticeScreen() {
  const profile = useActiveProfile();
  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
  }, [profile]);
  if (!profile) return null;
  return <Practice key={profile.id} profile={profile} />;
}

function Practice({ profile }: { profile: Profile }) {
  const recordAttempt = useApp((s) => s.recordAttempt);
  const setTopicLevel = useApp((s) => s.setTopicLevel);
  const band = ageBandForGrade(profile.grade);
  const tc = makeT(profile.gender);
  const rng = () => Math.random();

  // The station is fixed for the round, even as progress updates.
  const station = useMemo(
    () => nextStation(profile.grade, appProgress(profile.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const topic: Topic = station.topic;
  const generate = (level: number, avoid?: string): Exercise =>
    topic.generate(level, rng, profile.gender, avoid);

  const newRound = (level: number): SessionState =>
    startSession({
      topicId: topic.id,
      level,
      minLevel: topic.levels[0]?.level ?? 1,
      maxLevel: topic.levels.at(-1)?.level ?? 10,
      band,
      exercise: generate(level),
    });

  const [s, setS] = useState<SessionState>(() => newRound(station.level));
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
      recordAttempt(profile.id, {
        topicId: topic.id,
        level: before.level,
        correct: outcome === 'first',
        at: Date.now(),
        ...(outcome !== 'first' && after.firstMistake ? { mistake: after.firstMistake } : {}),
      });
    }
    if (action.type === 'changeLevel') setTopicLevel(profile.id, topic.id, after.level);
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
    if (cur.suggestion && !profile.settings.allowLevelChange) {
      // The parent decided levels change automatically; say so briefly.
      const level = cur.level + (cur.suggestion === 'up' ? 1 : -1);
      setNotice(cur.suggestion === 'up' ? t('practice.levelChanged.up') : t('practice.levelChanged.down'));
      apply({ type: 'changeLevel', level, exercise: generate(level) });
      return;
    }
    if (cur.suggestion) return; // the dialog asks
    setNotice(null);
    apply({ type: 'next', exercise: generate(cur.level, cur.exercise.factId) });
  };

  // A correct answer moves on by itself after a short celebration.
  useEffect(() => {
    if (s.phase !== 'correct' || (s.suggestion && profile.settings.allowLevelChange)) return;
    const id = window.setTimeout(advance, CORRECT_PAUSE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase, s.done, s.suggestion]);

  const answer = (v: number) => {
    if (s.exercise.input.type === 'choices') setTried((x) => [...x, v]);
    else setValue('');
    apply({ type: 'answer', value: v });
  };

  if (s.phase === 'finished') {
    return (
      <main className="screen practice" data-screen="practice-done">
        <section className="stack done" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h1>{t('practice.done.title', { params: { name: profile.name } })}</h1>
          <p className="done__body">{t('practice.done.body', { params: { count: s.done } })}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const level = stateRef.current.level;
                setNotice(null);
                setValue('');
                setTried([]);
                const fresh = newRound(level);
                stateRef.current = fresh;
                setS(fresh);
              }}
            >
              {t('practice.done.again')}
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => navigate({ name: 'play' })}>
              {t('practice.done.home')}
            </button>
          </div>
        </section>
      </main>
    );
  }

  const e = s.exercise;
  const finished = s.phase === 'correct' || s.phase === 'revealed';
  const slotValue = finished ? String(e.answer) : e.input.type === 'numpad' && value ? value : '?';
  const [before, after] = e.display ? splitAtSlot(e.display) : ['', ''];

  return (
    <main className="screen practice" data-screen="practice">
      <header className="practice__bar">
        <button type="button" className="btn btn--ghost btn--small" onClick={() => navigate({ name: 'play' })}>
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

      <section className="exercise card" aria-live="polite">
        <div className="exercise__prompt">
          <SpeakerButton text={e.spokenText} slow={slow} size="lg" />
          <h1 className="exercise__title">{e.prompt}</h1>
        </div>
        {e.visual ? <VisualView visual={e.visual} /> : null}
        {e.display ? (
          <MathExpr block label={e.spokenText}>
            {before}
            <span className={finished ? 'slot slot--done' : 'slot'}>{slotValue}</span>
            {after}
          </MathExpr>
        ) : null}
      </section>

      <Feedback state={s} tc={tc} slow={slow} />

      {!finished ? (
        <section className="answer">
          {e.input.type === 'choices' ? (
            <div className="choices-big" role="group" aria-label={t('practice.choicesLabel')} dir="ltr">
              {e.input.choices.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="choice-big"
                  disabled={tried.includes(c)}
                  onClick={() => answer(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <NumberPad
              label={t('practice.answerLabel')}
              value={value}
              onChange={setValue}
              maxLength={e.input.maxDigits}
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
                <SpeakerButton text={h.spoken} slow={slow} />
                <strong>{t('practice.hintTitle', { params: { n: i + 1 } })}</strong>
              </div>
              <p>{h.text}</p>
              {h.visual ? <VisualView visual={h.visual} /> : null}
              {h.example ? <MathExpr block>{h.example.display}</MathExpr> : null}
            </article>
          ))}
        </section>
      ) : null}

      {s.suggestion && finished && profile.settings.allowLevelChange ? (
        <LevelDialog
          direction={s.suggestion}
          tc={tc}
          slow={slow}
          onAccept={() => {
            const level = s.level + (s.suggestion === 'up' ? 1 : -1);
            apply({ type: 'changeLevel', level, exercise: generate(level) });
          }}
          onDecline={() => {
            apply({ type: 'dismissSuggestion' });
            apply({ type: 'next', exercise: generate(stateRef.current.level, e.factId) });
          }}
        />
      ) : null}
    </main>
  );
}

/** Reads progress once, outside React, for the station choice at round start. */
function appProgress(profileId: string) {
  return appStore.getState().data.progress[profileId];
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
        <span key={i} className={i < done ? 'dot dot--done' : i === done ? 'dot dot--current' : 'dot'} />
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
        <SpeakerButton text={e.solutionSpoken} slow={slow} />
        <span>{t('explain.reveal', { params: { answer: e.answer } })}</span>
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
  return <div className="feedback" aria-hidden="true" />;
}

function explanation(s: SessionState, tc: TC): string {
  switch (s.lastMistake) {
    case 'wrongOperation':
      return tc(s.exercise.operation === 'sub' ? 'explain.wrongOperation.sub' : 'explain.wrongOperation.add');
    case 'offByOne':
      return tc('explain.offByOne');
    case 'digitReversal':
      return tc('explain.digitReversal');
    default:
      return tc('feedback.almost');
  }
}

function LevelDialog({
  direction,
  tc,
  slow,
  onAccept,
  onDecline,
}: {
  direction: 'up' | 'down';
  tc: TC;
  slow: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const up = direction === 'up';
  const body = up ? t('practice.levelUp.body') : t('practice.levelDown.body');
  return (
    <Dialog
      title={up ? tc('practice.levelUp.title') : t('practice.levelDown.title')}
      onClose={onDecline}
      actions={
        <>
          <button type="button" className="btn btn--secondary" onClick={onDecline}>
            {up ? t('practice.levelUp.no') : t('practice.levelDown.no')}
          </button>
          <button type="button" className="btn" onClick={onAccept}>
            {up ? t('practice.levelUp.yes') : t('practice.levelDown.yes')}
          </button>
        </>
      }
    >
      <div className="row">
        <SpeakerButton text={body} slow={slow} />
        <p>{body}</p>
      </div>
    </Dialog>
  );
}
