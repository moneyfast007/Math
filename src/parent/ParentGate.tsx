import { useState } from 'react';
import { t } from '@/i18n';
import { PIN_LENGTH } from '@/state/pin';
import { PinDots } from './PinDots';
import { Dialog } from '@/ui/Dialog';
import { MathExpr } from '@/ui/MathExpr';
import { NumberPad } from '@/ui/NumberPad';
import { makeGateQuestion } from './gateQuestion';

interface ParentGateProps {
  /** Whether a parent PIN is set; if so, the PIN replaces the arithmetic question. */
  hasPin: boolean;
  verifyPin: (pin: string) => Promise<boolean>;
  onUnlock: () => void;
  onCancel: () => void;
  rng?: () => number;
}

export function ParentGate({
  hasPin,
  verifyPin,
  onUnlock,
  onCancel,
  rng = Math.random,
}: ParentGateProps) {
  const [question, setQuestion] = useState(() => makeGateQuestion(rng));
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);

  const reject = () => {
    setWrong(true);
    setValue('');
    if (!hasPin) setQuestion(makeGateQuestion(rng));
  };

  const check = async (entered: string) => {
    if (hasPin ? await verifyPin(entered) : Number(entered) === question.answer) onUnlock();
    else reject();
  };

  const onChange = (next: string) => {
    setWrong(false);
    setValue(next);
    // A PIN submits itself once complete.
    if (hasPin && next.length === PIN_LENGTH) void check(next);
  };

  return (
    <Dialog title={t('gate.title')} onClose={onCancel}>
      <div className="gate stack">
        <p className="muted">{t('gate.explain')}</p>
        {hasPin ? (
          <p>{t('gate.pinPrompt')}</p>
        ) : (
          <div className="gate__question">
            <span>{t('gate.question')}</span>
            <MathExpr block>{`${question.a} × ${question.b} = ?`}</MathExpr>
          </div>
        )}
        <output className="gate__value" dir="ltr" aria-live="polite">
          {hasPin ? <PinDots count={value.length} /> : value || ' '}
        </output>
        <p className="gate__error" role="alert">
          {wrong ? t('gate.wrong') : ' '}
        </p>
        <NumberPad
          label={hasPin ? t('gate.pinPrompt') : t('gate.question')}
          value={value}
          onChange={onChange}
          maxLength={hasPin ? PIN_LENGTH : 4}
          // A PIN is a code, not a number: a leading 0 counts (0482).
          code={hasPin}
          {...(hasPin ? {} : { onSubmit: () => void check(value) })}
        />
      </div>
    </Dialog>
  );
}
