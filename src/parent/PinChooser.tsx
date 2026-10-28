import { useState } from 'react';
import { t } from '@/i18n';
import { PIN_LENGTH } from '@/state/pin';
import { useSync } from '@/sync';
import { Dialog } from '@/ui/Dialog';
import { NumberPad } from '@/ui/NumberPad';
import { PinDots } from './PinDots';
import { AccountDialog } from './SyncSection';

/** Choosing the parents' code: typed twice. */
export function PinChooser({
  onDone,
  onCancel,
}: {
  onDone: (pin: string) => void;
  onCancel: () => void;
}) {
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [mismatch, setMismatch] = useState(false);
  // No email and password for the family: a forgotten code could never be reset, so
  // they are offered once the code is chosen (it is kept whatever the parent answers).
  const linked = useSync((s) => s.linked);
  const hasAccount = useSync((s) => s.hasAccount);
  const [chosen, setChosen] = useState<string | null>(null);
  const [account, setAccount] = useState(false);

  const onChange = (next: string) => {
    setMismatch(false);
    setValue(next);
    if (next.length < PIN_LENGTH) return;
    if (first === null) {
      setFirst(next);
      setValue('');
    } else if (next === first) {
      if (!linked || hasAccount === false) setChosen(next);
      else onDone(next);
    } else {
      setFirst(null);
      setValue('');
      setMismatch(true);
    }
  };

  if (chosen !== null) {
    const done = () => onDone(chosen);
    if (account) return <AccountDialog mode="set" onClose={done} />;
    return (
      <Dialog
        title={t('pinAccount.title')}
        onClose={done}
        actions={
          <>
            <button type="button" className="btn" onClick={() => setAccount(true)}>
              {t('pinAccount.go')}
            </button>
            <button type="button" className="btn btn--ghost" onClick={done}>
              {t('pinAccount.later')}
            </button>
          </>
        }
      >
        <p data-pin-account>{t('pinAccount.body')}</p>
      </Dialog>
    );
  }

  const prompt = first === null ? t('parent.security.newPin') : t('parent.security.repeatPin');
  return (
    <Dialog title={t('parent.security.title')} onClose={onCancel}>
      <div className="gate stack">
        <p>{prompt}</p>
        <output className="gate__value" dir="ltr">
          <PinDots count={value.length} />
        </output>
        <p className="gate__error" role="alert">
          {mismatch ? t('parent.security.mismatch') : ' '}
        </p>
        {/* A code, not a number: a leading 0 counts. */}
        <NumberPad label={prompt} value={value} onChange={onChange} maxLength={PIN_LENGTH} code />
      </div>
    </Dialog>
  );
}
