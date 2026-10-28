import { Children, useLayoutEffect, useRef, type ReactNode } from 'react';
import { groupDigits } from '@/lang/groupDigits';
import { withFractions } from './Fraction';

interface MathExprProps {
  /** The expression, already formatted for display (e.g. "3 + 5 = ?"). */
  children: ReactNode;
  /** Render as a centered, large block (the main exercise) instead of inline. */
  block?: boolean;
  /** Accessible name; defaults to the visible text. Pass the spoken form when available. */
  label?: string;
  className?: string;
}

/**
 * Below this share of the full size, a long expression goes onto two lines
 * ("= answer" on the second) instead of shrinking further: on a phone that
 * keeps digits at about 29px, still easy for a child to read.
 */
export const MIN_FIT = 0.6;

/** Splits a string before its " = ", where a long expression may break onto a second line. */
/** As written in an Israeli classroom: 529,206 and 45 : 6. */
function written(text: string): string {
  return groupDigits(text).replace(/÷/g, ':');
}

function withBreak(text: string): ReactNode {
  const at = text.indexOf(' = ');
  if (at < 0) return withFractions(text);
  return (
    <>
      {withFractions(text.slice(0, at + 1))}
      <span className="math__break" aria-hidden="true" />
      {withFractions(text.slice(at + 1))}
    </>
  );
}

/**
 * Fits a block expression to the width it has: full size when it fits, smaller
 * when it does not (down to MIN_FIT), and then on two lines, as large as fits.
 * Measured before every paint, so the typed answer growing, a phone turning, or
 * the font loading never push it off the screen.
 */
function useFit(block: boolean) {
  const outer = useRef<HTMLSpanElement>(null);
  const line = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = outer.current;
    const inner = line.current;
    if (!block || !el || !inner) return;
    const fit = () => {
      el.style.setProperty('--fit', '1');
      delete el.dataset['wrap'];
      const room = el.clientWidth;
      const width = inner.getBoundingClientRect().width;
      if (room <= 0 || width <= room) return;
      // A little slack: rounding, and the slot's padding growing by a pixel.
      const scale = (room / width) * 0.97;
      if (scale >= MIN_FIT) {
        el.style.setProperty('--fit', scale.toFixed(3));
        return;
      }
      el.dataset['wrap'] = '';
      const wrapped = inner.getBoundingClientRect().width;
      el.style.setProperty('--fit', Math.min(1, (room / wrapped) * 0.97).toFixed(3));
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    let last = el.clientWidth;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      // Only the room changing matters; the expression's own size is set by fit().
      // Resized on the next frame, not inside the observer (which would loop).
      if (el.clientWidth === last) return;
      last = el.clientWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(el);
    void document.fonts?.ready.then(fit);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  return { outer, line };
}

/**
 * The only place arithmetic is ever rendered.
 *
 * It forces left-to-right order and bidi isolation so "3 + 5 = 8" stays in that
 * order inside an RTL Hebrew sentence, regardless of what surrounds it.
 * The e2e suite asserts that no expression appears outside this component.
 * Big numbers get thousands separators here (groupDigits), and division is
 * written ":" as in Israeli schools (45 : 6 = 7 (3)); the engine keeps "÷".
 */
export function MathExpr({ children, block = false, label, className }: MathExprProps) {
  const cls = ['math', block ? 'math--block' : '', className ?? ''].filter(Boolean).join(' ');
  const { outer, line } = useFit(block);
  const content = Children.map(children, (c) =>
    typeof c === 'string' ? (block ? withBreak(written(c)) : withFractions(written(c))) : c,
  );
  return (
    <span ref={outer} className={cls} dir="ltr" lang="und" aria-label={label} data-math="">
      {block ? (
        <span ref={line} className="math__line">
          {content}
        </span>
      ) : (
        content
      )}
    </span>
  );
}
