import { act, fireEvent, render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { makeGateQuestion } from './gateQuestion';
import { ParentGate } from './ParentGate';

describe('makeGateQuestion', () => {
  it('is a two-digit non-round number times 6–9, with the right answer', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 0.999999, noNaN: true }), fc.double({ min: 0, max: 0.999999, noNaN: true }), (r1, r2) => {
        const seq = [r1, r2];
        const q = makeGateQuestion(() => seq.shift() ?? 0);
        expect(q.a).toBeGreaterThanOrEqual(13);
        expect(q.a).toBeLessThanOrEqual(99);
        expect(q.a % 10).not.toBe(0);
        expect(q.b).toBeGreaterThanOrEqual(6);
        expect(q.b).toBeLessThanOrEqual(9);
        expect(q.answer).toBe(q.a * q.b);
      }),
    );
  });
});

function typeDigits(digits: string) {
  for (const d of digits) fireEvent.click(screen.getByRole('button', { name: d }));
}

describe('<ParentGate> with the arithmetic question', () => {
  // rng 0 → a = 13 + 0 = 13, b = 6 → 78
  const rng = () => 0;

  it('unlocks on the right answer', () => {
    const onUnlock = vi.fn();
    render(
      <ParentGate hasPin={false} verifyPin={vi.fn()} onUnlock={onUnlock} onCancel={vi.fn()} rng={rng} />,
    );
    expect(screen.getByText('13 × 6 = ?')).toBeInTheDocument();
    typeDigits('78');
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    return act(async () => {
      await Promise.resolve();
    }).then(() => expect(onUnlock).toHaveBeenCalledOnce());
  });

  it('shows a gentle message and stays locked on a wrong answer', async () => {
    const onUnlock = vi.fn();
    render(
      <ParentGate hasPin={false} verifyPin={vi.fn()} onUnlock={onUnlock} onCancel={vi.fn()} rng={rng} />,
    );
    typeDigits('77');
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('לא נכון');
  });

  it('cancels with the close button', () => {
    const onCancel = vi.fn();
    render(
      <ParentGate hasPin={false} verifyPin={vi.fn()} onUnlock={vi.fn()} onCancel={onCancel} rng={rng} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'סגירה' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe('<ParentGate> with a PIN', () => {
  it('submits automatically after four digits', async () => {
    const verifyPin = vi.fn((pin: string) => Promise.resolve(pin === '2580'));
    const onUnlock = vi.fn();
    render(<ParentGate hasPin verifyPin={verifyPin} onUnlock={onUnlock} onCancel={vi.fn()} />);
    expect(screen.queryByText(/×/)).toBeNull();
    typeDigits('2580');
    await act(async () => {
      await Promise.resolve();
    });
    expect(verifyPin).toHaveBeenCalledWith('2580');
    expect(onUnlock).toHaveBeenCalledOnce();
  });
});
