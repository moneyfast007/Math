import { t } from '@/i18n';

/**
 * Plusi, the app's character: the plus sign itself, with a face.
 *
 * Drawn inline so it needs no image file, scales to any size and takes the
 * age band's accent color through `currentColor`. Four moods only, each tied
 * to one moment in the game (design approved in phase 4):
 *   happy     default, and a correct answer
 *   thinking  next to a hint, or an "almost" answer
 *   cheering  end of a round, a station opened
 *   calm      a wrong answer. Never a sad face.
 */
export type PlusiMood = 'happy' | 'thinking' | 'cheering' | 'calm';

interface PlusiProps {
  mood?: PlusiMood;
  /** CSS size of the square, e.g. 96 or '6rem'. */
  size?: number | string;
  /** Decorative when the surrounding text already says what is happening. */
  decorative?: boolean;
  className?: string;
}

const FACE = '#3a2f2a';
const CHEEK = '#ffd5c2';

export function Plusi({ mood = 'happy', size = 96, decorative = false, className }: PlusiProps) {
  const label = t(`plusi.${mood}`);
  const a11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': label } as const);
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className ? `plusi plusi--${mood} ${className}` : `plusi plusi--${mood}`}
      data-mood={mood}
      {...a11y}
    >
      <g transform={mood === 'cheering' ? 'rotate(-10 60 60)' : undefined}>
        <path
          d="M60 22v76M22 60h76"
          stroke="currentColor"
          strokeWidth="34"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M60 30v12"
          stroke="#ffffff"
          opacity="0.35"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <Face mood={mood} />
        <circle cx="42" cy="64" r="3.5" fill={CHEEK} />
        <circle cx="78" cy="64" r="3.5" fill={CHEEK} />
      </g>
      {mood === 'thinking' ? (
        <>
          <circle cx="98" cy="26" r="11" fill="#fbeccf" />
          <text
            x="98"
            y="31"
            textAnchor="middle"
            fontSize="15"
            fontWeight="800"
            fill={FACE}
            fontFamily="system-ui, sans-serif"
          >
            ?
          </text>
        </>
      ) : null}
      {mood === 'cheering' ? (
        <>
          <path d="M14 22l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e2a33b" />
          <path d="M104 92l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#e2a33b" />
          <circle cx="100" cy="20" r="3" fill="#e8793a" />
        </>
      ) : null}
    </svg>
  );
}

function Face({ mood }: { mood: PlusiMood }) {
  switch (mood) {
    case 'happy':
      return (
        <>
          <circle cx="49" cy="55" r="6.5" fill="#ffffff" />
          <circle cx="71" cy="55" r="6.5" fill="#ffffff" />
          <circle cx="50.5" cy="56" r="3.2" fill={FACE} />
          <circle cx="72.5" cy="56" r="3.2" fill={FACE} />
          <path d="M51 68q9 8 18 0" stroke={FACE} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      );
    case 'thinking':
      return (
        <>
          <circle cx="49" cy="55" r="6.5" fill="#ffffff" />
          <circle cx="71" cy="55" r="6.5" fill="#ffffff" />
          <circle cx="47" cy="52.5" r="3.2" fill={FACE} />
          <circle cx="69" cy="52.5" r="3.2" fill={FACE} />
          <circle cx="60" cy="69" r="3.2" fill="none" stroke={FACE} strokeWidth="3" />
        </>
      );
    case 'cheering':
      return (
        <>
          <path
            d="M44 56q5 -6 10 0M66 56q5 -6 10 0"
            stroke={FACE}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M49 66q11 12 22 0z" fill={FACE} />
        </>
      );
    case 'calm':
      return (
        <>
          <path d="M44 56h10M66 56h10" stroke={FACE} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M53 68q7 5 14 0" stroke={FACE} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </>
      );
  }
}
