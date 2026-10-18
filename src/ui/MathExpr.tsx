import { Children, type ReactNode } from 'react';
import { groupDigits } from '@/lang/groupDigits';

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
 * The only place arithmetic is ever rendered.
 *
 * It forces left-to-right order and bidi isolation so "3 + 5 = 8" stays in that
 * order inside an RTL Hebrew sentence, regardless of what surrounds it.
 * The e2e suite asserts that no expression appears outside this component.
 * Big numbers get thousands separators here (groupDigits).
 */
export function MathExpr({ children, block = false, label, className }: MathExprProps) {
  const cls = ['math', block ? 'math--block' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <span className={cls} dir="ltr" lang="und" aria-label={label} data-math="">
      {Children.map(children, (c) => (typeof c === 'string' ? groupDigits(c) : c))}
    </span>
  );
}
