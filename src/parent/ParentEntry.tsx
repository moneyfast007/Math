import { useState } from 'react';
import { useApp } from '@/state/store';
import { ForgotPin } from './ForgotPin';
import { ParentGate } from './ParentGate';
import { PinChooser } from './PinChooser';

interface ParentEntryProps {
  hasPin: boolean;
  verifyPin: (pin: string) => Promise<boolean>;
  onUnlock: () => void;
  onCancel: () => void;
}

/**
 * The way into the parents' area: the gate, and under a code "שכחתי את הקוד"
 * (the family's email and password, then a new code, and in).
 */
export function ParentEntry({ hasPin, verifyPin, onUnlock, onCancel }: ParentEntryProps) {
  const setPin = useApp((s) => s.setPin);
  const [step, setStep] = useState<'gate' | 'check' | 'choose'>('gate');
  if (step === 'check')
    return <ForgotPin onVerified={() => setStep('choose')} onBack={() => setStep('gate')} />;
  if (step === 'choose')
    return (
      <PinChooser
        onDone={(pin) => {
          void setPin(pin).then(() => {
            setStep('gate');
            onUnlock();
          });
        }}
        onCancel={() => setStep('gate')}
      />
    );
  return (
    <ParentGate
      hasPin={hasPin}
      verifyPin={verifyPin}
      onUnlock={onUnlock}
      onCancel={onCancel}
      onForgot={() => setStep('check')}
    />
  );
}
