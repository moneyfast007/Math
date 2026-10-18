import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LongPressButton } from './LongPressButton';
import { NumberPad } from './NumberPad';

function Pad({
  onSubmit,
  maxLength,
  code = false,
}: {
  onSubmit?: () => void;
  maxLength?: number;
  code?: boolean;
}) {
  const [value, setValue] = useState('');
  return (
    <>
      <output data-testid="value">{value}</output>
      <NumberPad
        label="pad"
        value={value}
        onChange={setValue}
        {...(maxLength === undefined ? {} : { maxLength })}
        {...(onSubmit ? { onSubmit } : {})}
        code={code}
      />
    </>
  );
}

describe('<NumberPad>', () => {
  it('types digits, deletes, and respects the max length', () => {
    render(<Pad maxLength={3} />);
    for (const d of ['4', '2', '7', '9']) fireEvent.click(screen.getByRole('button', { name: d }));
    expect(screen.getByTestId('value')).toHaveTextContent('427');
    fireEvent.click(screen.getByRole('button', { name: 'מחיקת ספרה' }));
    expect(screen.getByTestId('value')).toHaveTextContent('42');
  });

  it('does not produce leading zeros', () => {
    render(<Pad />);
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('value')).toHaveTextContent(/^5$/);
  });

  it('keeps a leading zero when typing a code', () => {
    render(<Pad code />);
    for (const d of ['0', '4', '5']) fireEvent.click(screen.getByRole('button', { name: d }));
    expect(screen.getByTestId('value')).toHaveTextContent(/^045$/);
  });

  it('enables confirm only when there is a value', () => {
    const onSubmit = vi.fn();
    render(<Pad onSubmit={onSubmit} />);
    const confirm = screen.getByRole('button', { name: 'אישור' });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('lays out keys left-to-right', () => {
    render(<Pad />);
    expect(screen.getByRole('group', { name: 'pad' })).toHaveAttribute('dir', 'ltr');
  });
});

describe('<LongPressButton>', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires only after the full hold', () => {
    const onLongPress = vi.fn();
    render(<LongPressButton onLongPress={onLongPress}>הורים</LongPressButton>);
    const btn = screen.getByRole('button', { name: 'הורים' });

    fireEvent.pointerDown(btn);
    vi.advanceTimersByTime(1000);
    fireEvent.pointerUp(btn);
    vi.advanceTimersByTime(1000);
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.pointerDown(btn);
    vi.advanceTimersByTime(1500);
    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it('ignores a plain click', () => {
    const onLongPress = vi.fn();
    render(<LongPressButton onLongPress={onLongPress}>הורים</LongPressButton>);
    fireEvent.click(screen.getByRole('button', { name: 'הורים' }));
    vi.advanceTimersByTime(3000);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('cancels when the finger slides off', () => {
    const onLongPress = vi.fn();
    render(<LongPressButton onLongPress={onLongPress}>הורים</LongPressButton>);
    const btn = screen.getByRole('button', { name: 'הורים' });
    fireEvent.pointerDown(btn);
    fireEvent.pointerLeave(btn);
    vi.advanceTimersByTime(3000);
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
