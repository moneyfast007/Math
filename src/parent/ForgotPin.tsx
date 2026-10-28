import { useEffect, useId, useState, type FormEvent } from 'react';
import { t } from '@/i18n';
import { syncEngine, useSync } from '@/sync';
import { Dialog } from '@/ui/Dialog';
import { problemText } from './SyncSection';

/**
 * A parent who forgot the parents' code: the family's email and password prove
 * who they are (checked by the server, counted like a sign-in so it cannot be
 * guessed), and then they choose a new code. Without an email and password on
 * this device there is no way in here: a question a child could answer would
 * open the area to her too.
 */
export function ForgotPin({ onVerified, onBack }: { onVerified: () => void; onBack: () => void }) {
  const id = useId();
  const linked = useSync((s) => s.linked);
  const hasAccount = useSync((s) => s.hasAccount);
  const known = useSync((s) => s.accountEmail);
  const [email, setEmail] = useState(known ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Not known yet on this device (set on another one, maybe): ask the server.
  useEffect(() => {
    if (linked && hasAccount === null) void syncEngine.refreshAccount();
  }, [linked, hasAccount]);

  const can = linked && hasAccount !== false;

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setProblem(null);
    setBusy(true);
    const res = await syncEngine.checkAccount(email, password);
    setBusy(false);
    if (res.ok) onVerified();
    else {
      setPassword('');
      setProblem(problemText(res.error));
    }
  };

  return (
    <Dialog
      title={t('gate.forgot.title')}
      onClose={onBack}
      actions={
        can ? (
          <button
            type="submit"
            form={`${id}-form`}
            className="btn"
            disabled={busy || !email.trim() || !password}
          >
            {busy ? t('gate.forgot.checking') : t('gate.forgot.submit')}
          </button>
        ) : (
          <button type="button" className="btn" onClick={onBack}>
            {t('gate.forgot.back')}
          </button>
        )
      }
    >
      {can ? (
        <form
          id={`${id}-form`}
          className="stack account-form"
          data-forgot="form"
          onSubmit={(e) => void submit(e)}
        >
          <p>{t('gate.forgot.how')}</p>
          <div className="field">
            <label htmlFor={`${id}-email`}>{t('account.email')}</label>
            <input
              id={`${id}-email`}
              className="text-input"
              type="email"
              dir="ltr"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={`${id}-password`}>{t('account.password')}</label>
            <input
              id={`${id}-password`}
              className="text-input"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <p className="gate__error" role="alert">
            {problem ?? ' '}
          </p>
        </form>
      ) : (
        <p data-forgot="none">{t('gate.forgot.noAccount')}</p>
      )}
    </Dialog>
  );
}
