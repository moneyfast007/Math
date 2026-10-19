import { useId } from 'react';
import { t, type Gender } from '@/i18n';
import { spokenLabel } from '@/lang/spokenLabel';
import { Plusi } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';

/**
 * How the journey works, in three steps a parent can read aloud: a world is a
 * path of stations, the path ends with "סיום העולם" (a mixed review), and then
 * the next world opens; all the worlds are on the map of worlds.
 *
 * Shown on the journey the first time a child opens it, and again from
 * "איך זה עובד?" on the map of worlds.
 */

const STEPS = ['journey.intro.step1', 'journey.intro.step2', 'journey.intro.step3'] as const;

/** Reads the welcome (if any), then the steps. Words only, no digits; each part is one clip. */
export function IntroSpeaker({ title }: { title?: string }) {
  const parts = [...(title === undefined ? [] : [title]), ...STEPS.map((k) => spokenLabel(t(k)))];
  return <SpeakerButton text={parts.join(' ')} parts={parts} />;
}

/** The three steps, each with a small picture of what it talks about. */
export function JourneySteps() {
  return (
    <ol className="intro__steps">
      <li className="intro__step">
        <span className="intro__icon intro__icon--path" aria-hidden="true">
          <span className="intro__dot intro__dot--done" />
          <span className="intro__dot intro__dot--current" />
          <span className="intro__dot" />
        </span>
        <p>{t('journey.intro.step1')}</p>
      </li>
      <li className="intro__step">
        <span className="intro__icon intro__icon--star" aria-hidden="true">
          <StarIcon />
        </span>
        <p>{t('journey.intro.step2')}</p>
      </li>
      <li className="intro__step">
        <span className="intro__icon intro__icon--worlds" aria-hidden="true">
          <WorldsIcon />
        </span>
        <p>{t('journey.intro.step3')}</p>
      </li>
    </ol>
  );
}

/**
 * The first-time card on the journey. Not a dialog: it never stands between a
 * child and the start button.
 */
export function JourneyIntroCard({ gender, onDone }: { gender: Gender; onDone: () => void }) {
  const titleId = useId();
  const title = t('journey.intro.title', { gender });
  return (
    <section className="card intro" aria-labelledby={titleId} data-intro="">
      <div className="intro__head">
        <Plusi mood="happy" size={56} decorative />
        <h2 id={titleId} className="intro__title">
          {title}
        </h2>
        <IntroSpeaker title={title} />
      </div>
      <JourneySteps />
      <button type="button" className="btn btn--secondary intro__ok" onClick={onDone}>
        {t('journey.intro.ok')}
      </button>
    </section>
  );
}

/** A folded map: the control that opens the map of all worlds. */
export function WorldsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="worlds-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
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
