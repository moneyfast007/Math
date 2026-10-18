import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MathExpr } from './MathExpr';

describe('<MathExpr>', () => {
  it('forces LTR direction and bidi isolation', () => {
    render(<MathExpr>3 + 5 = ?</MathExpr>);
    const el = screen.getByText('3 + 5 = ?');
    expect(el).toHaveAttribute('dir', 'ltr');
    expect(el).toHaveClass('math');
    expect(el).toHaveAttribute('data-math');
  });

  it('exposes the spoken form as the accessible name when given', () => {
    render(<MathExpr label="כמה זה שלוש ועוד חמש?">3 + 5 = ?</MathExpr>);
    expect(screen.getByLabelText('כמה זה שלוש ועוד חמש?')).toBeInTheDocument();
  });

  it('renders as a block when asked, with one place to break before "="', () => {
    const { container } = render(<MathExpr block>7 − 2 = ?</MathExpr>);
    const el = container.querySelector('[data-math]');
    expect(el).toHaveClass('math--block');
    expect(el).toHaveTextContent(/^7 − 2 = \?$/);
    expect(el?.querySelectorAll('.math__break')).toHaveLength(1);
    // Fits as it is when there is room (jsdom has no layout: no shrinking, no second line).
    expect(el).not.toHaveAttribute('data-wrap');
  });

  it('an inline expression never breaks', () => {
    const { container } = render(<MathExpr>7 − 2 = 5</MathExpr>);
    expect(container.querySelectorAll('.math__break')).toHaveLength(0);
  });
});
