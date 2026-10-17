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

  it('renders as a block when asked', () => {
    render(<MathExpr block>7 − 2 = ?</MathExpr>);
    expect(screen.getByText('7 − 2 = ?')).toHaveClass('math--block');
  });
});
