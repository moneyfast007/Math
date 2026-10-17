import { t } from '@/i18n';

interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  /** Maximum number of digits. */
  maxLength?: number;
  /** Called by the confirm key. Omit to hide it. */
  onSubmit?: () => void;
  /** Disables the confirm key (e.g. while empty). Defaults to disabling when value is empty. */
  submitDisabled?: boolean;
  /** Accessible name of the whole pad. */
  label: string;
  /** Adds a decimal point key (for decimal fractions). */
  decimal?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/**
 * On-screen number pad, phone layout (1 2 3 on top), always left-to-right
 * regardless of the page direction. Used for answers and for the parent gate.
 * The device keyboard is never opened: it covers half of an iPad screen and
 * offers letters a child does not need.
 */
export function NumberPad({
  value,
  onChange,
  maxLength = 6,
  onSubmit,
  submitDisabled,
  label,
  decimal = false,
}: NumberPadProps) {
  const press = (digit: string) => {
    if (value.replace('.', '').length >= maxLength) return;
    // No leading zeros except a lone "0" (or "0." on the way to a decimal).
    onChange(value === '0' ? digit : value + digit);
  };
  const point = () => {
    if (value.includes('.')) return;
    onChange(value === '' ? '0.' : `${value}.`);
  };
  const backspace = () => onChange(value.slice(0, -1));
  const disabled = submitDisabled ?? value.length === 0;

  return (
    <div className="numpad" dir="ltr" role="group" aria-label={label}>
      {KEYS.map((d) => (
        <button key={d} type="button" className="numpad__key" onClick={() => press(d)}>
          {d}
        </button>
      ))}
      {decimal ? (
        <button
          type="button"
          className="numpad__key numpad__key--muted"
          onClick={point}
          aria-label={t('action.decimalPoint')}
          disabled={value.includes('.')}
        >
          .
        </button>
      ) : (
        <button
          type="button"
          className="numpad__key numpad__key--muted"
          onClick={backspace}
          aria-label={t('action.backspace')}
          disabled={value.length === 0}
        >
          ⌫
        </button>
      )}
      <button type="button" className="numpad__key" onClick={() => press('0')}>
        0
      </button>
      {decimal ? (
        <button
          type="button"
          className="numpad__key numpad__key--muted"
          onClick={backspace}
          aria-label={t('action.backspace')}
          disabled={value.length === 0}
        >
          ⌫
        </button>
      ) : null}
      {onSubmit ? (
        <button
          type="button"
          className={
            decimal
              ? 'numpad__key numpad__key--submit numpad__key--wide'
              : 'numpad__key numpad__key--submit'
          }
          onClick={onSubmit}
          disabled={disabled}
          aria-label={t('action.confirm')}
        >
          ✓
        </button>
      ) : decimal ? null : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}
