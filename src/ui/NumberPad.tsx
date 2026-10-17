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
}: NumberPadProps) {
  const press = (digit: string) => {
    if (value.length >= maxLength) return;
    // No leading zeros except a lone "0".
    onChange(value === '0' ? digit : value + digit);
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
      <button
        type="button"
        className="numpad__key numpad__key--muted"
        onClick={backspace}
        aria-label={t('action.backspace')}
        disabled={value.length === 0}
      >
        ⌫
      </button>
      <button type="button" className="numpad__key" onClick={() => press('0')}>
        0
      </button>
      {onSubmit ? (
        <button
          type="button"
          className="numpad__key numpad__key--submit"
          onClick={onSubmit}
          disabled={disabled}
          aria-label={t('action.confirm')}
        >
          ✓
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}
