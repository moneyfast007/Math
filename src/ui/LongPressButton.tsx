import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface LongPressButtonProps {
  onLongPress: () => void;
  /** How long the press must be held. */
  durationMs?: number;
  className?: string;
  children: ReactNode;
  'aria-label'?: string;
}

/**
 * A button that fires only after being held down. A quick tap does nothing,
 * which is what keeps a five-year-old out of the parent area. A fill animation
 * shows the parent that holding works.
 *
 * Keyboard: holding Enter or Space works the same way.
 */
export function LongPressButton({
  onLongPress,
  durationMs = 1500,
  className,
  children,
  'aria-label': ariaLabel,
}: LongPressButtonProps) {
  const [pressing, setPressing] = useState(false);
  const timer = useRef<number | null>(null);
  const callback = useRef(onLongPress);
  callback.current = onLongPress;

  const cancel = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setPressing(false);
  };

  const start = () => {
    if (timer.current !== null) return;
    setPressing(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setPressing(false);
      callback.current();
    }, durationMs);
  };

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const style = { '--press-ms': `${durationMs}ms` } as CSSProperties;

  return (
    <button
      type="button"
      className={['long-press', className ?? ''].filter(Boolean).join(' ')}
      style={style}
      data-pressing={pressing}
      aria-label={ariaLabel}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={cancel}
      onBlur={cancel}
    >
      <span className="long-press__label">{children}</span>
    </button>
  );
}
