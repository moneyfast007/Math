import { useEffect, useState } from 'react';

/** The user asked the system for less motion (no matchMedia, as in tests: no). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** The pause after a character, ms: longer after punctuation, so the sentence breathes. */
export function typingDelay(ch: string | undefined, charMs: number): number {
  if (ch === '.' || ch === '!' || ch === '?') return charMs * 8;
  if (ch === ',') return charMs * 4;
  return charMs;
}

/**
 * How many characters of `text` to show: from none, one more at a time after
 * `startMs`, like someone typing. With reduced motion, the whole text at once.
 */
export function useTypewriter(
  text: string,
  options: { startMs?: number; charMs?: number } = {},
): number {
  const { startMs = 0, charMs = 34 } = options;
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(text.length);
      return;
    }
    let count = 0;
    let timer = 0;
    const step = () => {
      count += 1;
      setShown(count);
      if (count < text.length)
        timer = window.setTimeout(step, typingDelay(text[count - 1], charMs));
    };
    timer = window.setTimeout(step, startMs);
    return () => window.clearTimeout(timer);
  }, [text, startMs, charMs]);

  return Math.min(shown, text.length);
}
