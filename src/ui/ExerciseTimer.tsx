import { useEffect, useRef, useState } from 'react';
import { t } from '@/i18n';

/**
 * The time left for one exercise (Topic.timeLimit): a bar that empties and the
 * seconds, red for the last ten. It counts only while the page is in front of
 * her (a call, another app: the clock waits), and calls `onUp` once at zero.
 * A new exercise is a new timer (the screen gives each its own key).
 */
export function ExerciseTimer({
  seconds,
  running,
  onUp,
}: {
  seconds: number;
  running: boolean;
  onUp: () => void;
}) {
  const [left, setLeft] = useState(seconds * 1000);
  const upRef = useRef(onUp);
  upRef.current = onUp;
  const fired = useRef(false);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      // Taken now: the update below may run later, when `last` has moved on.
      const spent = now - last;
      last = now;
      // Hidden: the time away does not count.
      if (!document.hidden) setLeft((l) => Math.max(0, l - spent));
    };
    const id = window.setInterval(tick, 250);
    const back = () => {
      last = performance.now();
    };
    document.addEventListener('visibilitychange', back);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', back);
    };
  }, [running]);

  useEffect(() => {
    if (left > 0 || !running || fired.current) return;
    fired.current = true;
    upRef.current();
  }, [left, running]);

  const secs = Math.ceil(left / 1000);
  const late = secs <= 10;
  return (
    <div
      className={late ? 'ex-timer ex-timer--late' : 'ex-timer'}
      role="timer"
      aria-label={t('timer.left', { params: { n: secs } })}
    >
      <span className="ex-timer__bar" aria-hidden="true">
        <span style={{ width: `${(left / (seconds * 1000)) * 100}%` }} />
      </span>
      <span className="ex-timer__secs" aria-hidden="true">
        {`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`}
      </span>
    </div>
  );
}
