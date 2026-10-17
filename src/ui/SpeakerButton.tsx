import { useState } from 'react';
import { speaker } from '@/audio/speaker';
import { useSpeaking } from '@/audio/useSpeaker';
import { t } from '@/i18n';

interface SpeakerButtonProps {
  /** The sentence to read. Words only, never digits. */
  text: string;
  /** Clips that make up the sentence when it is not recorded whole (lang/compose.ts). */
  parts?: readonly string[] | undefined;
  slow?: boolean;
  size?: 'md' | 'lg';
}

/**
 * Large speaker icon, no text. Reads only when tapped; a second tap stops.
 * If no audio is available (offline and not cached, no device voice), it
 * shows a short friendly note instead of failing.
 */
export function SpeakerButton({ text, parts, slow = false, size = 'md' }: SpeakerButtonProps) {
  const speaking = useSpeaking() === text;
  const [note, setNote] = useState<string | null>(null);

  const onClick = async () => {
    setNote(null);
    if (speaking) {
      speaker.stop();
      return;
    }
    const result = await speaker.speak(text, parts ? { slow, parts } : { slow });
    if (result === 'unavailable') {
      setNote(navigator.onLine ? t('audio.unavailable') : t('audio.unavailableOffline'));
    }
  };

  return (
    <span className="speaker">
      <button
        type="button"
        className={`speaker__btn speaker__btn--${size}`}
        aria-label={speaking ? t('action.stop') : t('action.listen')}
        aria-pressed={speaking}
        data-speaker=""
        onClick={() => void onClick()}
      >
        {speaking ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" />
            <path
              d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      {note ? (
        <span className="speaker__note" role="status">
          {note}
        </span>
      ) : null}
    </span>
  );
}
