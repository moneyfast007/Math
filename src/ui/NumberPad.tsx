import { useEffect, useRef, useState } from 'react';
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
  /** Typing a code rather than a number: a 0 at the start is kept ("045123"). */
  code?: boolean;
  /**
   * Key by key instead of a value (a column exercise fills one cell per key):
   * when given, digits and the backspace go here and `value` only decides
   * whether the backspace is enabled.
   */
  onDigit?: (digit: string) => void;
  onBackspace?: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/**
 * On-screen number pad, phone layout (1 2 3 on top), always left-to-right
 * regardless of the page direction. Used for answers and for the parent gate.
 * The device keyboard is never opened: it covers half of an iPad screen and
 * offers letters a child does not need. A physical keyboard works, though:
 * digits, Backspace, Enter and the decimal point press the keys (the key on
 * the screen lights up), unless the typing is in a text field.
 */
function inTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

export function NumberPad({
  value,
  onChange,
  maxLength = 6,
  onSubmit,
  submitDisabled,
  label,
  decimal = false,
  code = false,
  onDigit,
  onBackspace,
}: NumberPadProps) {
  const press = (digit: string) => {
    if (onDigit) {
      onDigit(digit);
      return;
    }
    if (value.replace('.', '').length >= maxLength) return;
    // No leading zeros except a lone "0" (or "0." on the way to a decimal).
    onChange(value === '0' && !code ? digit : value + digit);
  };
  const point = () => {
    if (value.includes('.')) return;
    onChange(value === '' ? '0.' : `${value}.`);
  };
  const backspace = () => (onBackspace ? onBackspace() : onChange(value.slice(0, -1)));
  const disabled = submitDisabled ?? value.length === 0;

  // The physical keyboard: the latest handlers, read when a key comes.
  const latest = useRef({ press, point, backspace, submit: onSubmit, disabled, value, decimal });
  latest.current = { press, point, backspace, submit: onSubmit, disabled, value, decimal };
  const [lit, setLit] = useState<string | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || inTextField(e.target)) return;
      const h = latest.current;
      let key: string | null = null;
      if (/^[0-9]$/.test(e.key)) {
        h.press(e.key);
        key = e.key;
      } else if (e.key === 'Backspace') {
        if (h.value.length === 0) return;
        h.backspace();
        key = 'backspace';
      } else if (e.key === 'Enter') {
        if (!h.submit || h.disabled) return;
        h.submit();
        key = 'submit';
      } else if ((e.key === '.' || e.key === ',') && h.decimal) {
        if (h.value.includes('.')) return;
        h.point();
        key = '.';
      } else return;
      // Not also the focused button's own click (Enter on a key would press it twice).
      e.preventDefault();
      setLit(key);
      window.setTimeout(() => setLit((k) => (k === key ? null : k)), 140);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const cls = (base: string, key: string) => (lit === key ? `${base} numpad__key--lit` : base);

  return (
    <div className="numpad" dir="ltr" role="group" aria-label={label}>
      {KEYS.map((d) => (
        <button key={d} type="button" className={cls('numpad__key', d)} onClick={() => press(d)}>
          {d}
        </button>
      ))}
      {decimal ? (
        <button
          type="button"
          className={cls('numpad__key numpad__key--muted', '.')}
          onClick={point}
          aria-label={t('action.decimalPoint')}
          disabled={value.includes('.')}
        >
          .
        </button>
      ) : (
        <button
          type="button"
          className={cls('numpad__key numpad__key--muted', 'backspace')}
          onClick={backspace}
          aria-label={t('action.backspace')}
          disabled={value.length === 0}
        >
          ⌫
        </button>
      )}
      <button type="button" className={cls('numpad__key', '0')} onClick={() => press('0')}>
        0
      </button>
      {decimal ? (
        <button
          type="button"
          className={cls('numpad__key numpad__key--muted', 'backspace')}
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
          className={cls(
            decimal
              ? 'numpad__key numpad__key--submit numpad__key--wide'
              : 'numpad__key numpad__key--submit',
            'submit',
          )}
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
