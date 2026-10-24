import { useEffect, useId, useState, type FormEvent } from 'react';
import { t } from '@/i18n';
import { formatDate } from '@/i18n/labels';
import { PAIR_CODE_LENGTH, PASSWORD_MIN } from '@/sync/protocol';
import type { JoinResult, Snapshot, SyncProblem } from '@/sync/client';
import { syncEngine, useSync } from '@/sync';
import { ConfirmDialog, Dialog } from '@/ui/Dialog';
import { NumberPad } from '@/ui/NumberPad';
import { More, SettingsCard } from './parts';

/**
 * Sync between the family's devices, in the parent area: sign up with an email
 * and a password and sign in with them on the next device, or, without an
 * email, create the family on the first device, show a code on a linked
 * device and type it on the new one.
 */

function problemText(problem: SyncProblem): string {
  switch (problem) {
    case 'offline':
      return t('sync.problem.offline');
    case 'invalidCode':
      return t('sync.problem.invalidCode');
    case 'rateLimited':
      return t('sync.problem.rateLimited');
    case 'tooManyDevices':
      return t('sync.problem.tooManyDevices');
    case 'tooManyChildren':
      return t('sync.problem.tooManyChildren');
    case 'emailTaken':
      return t('sync.problem.emailTaken');
    case 'badLogin':
      return t('sync.problem.badLogin');
    case 'badEmail':
      return t('sync.problem.badEmail');
    case 'shortPassword':
      return t('sync.problem.shortPassword');
    case 'badRequest':
    case 'tooLarge':
    case 'unauthorized':
    case 'notFound':
    case 'unavailable':
      return t('sync.problem.server');
  }
}

function since(at: number, now: number): string {
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return t('sync.time.now');
  if (minutes === 1) return t('sync.time.minute');
  if (minutes < 60) return t('sync.time.minutes', { params: { count: minutes } });
  return formatDate(at);
}

/** Re-renders every so often (relative times, the code's countdown). */
function useNow(every: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [every]);
  return now;
}

export function SyncSection() {
  const linked = useSync((s) => s.linked);
  const removed = useSync((s) => s.removed);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [joined, setJoined] = useState<JoinResult | null>(null);

  useEffect(() => {
    let live = true;
    void syncEngine.snapshots().then((s) => live && setSnapshots(s));
    return () => {
      live = false;
    };
  }, [linked]);

  return (
    <SettingsCard id="sync" icon="sync" title={t('sync.title')}>
      {removed ? (
        <div className="notice row">
          <span>{t('sync.removed')}</span>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => syncEngine.dismissRemoved()}
          >
            {t('action.close')}
          </button>
        </div>
      ) : null}
      {linked ? <Linked /> : <NotLinked onJoined={setJoined} />}
      {joined ? <JoinedDialog result={joined} onClose={() => setJoined(null)} /> : null}
      {snapshots.length > 0 ? <Snapshots snapshots={snapshots} /> : null}
    </SettingsCard>
  );
}

/* ---------- Not linked yet ---------- */

// The "joined" message lives in SyncSection: this part unmounts as soon as the device is linked.
function NotLinked({ onJoined }: { onJoined: (result: JoinResult) => void }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<SyncProblem | null>(null);
  const [joining, setJoining] = useState(false);
  const [email, setEmail] = useState<'signup' | 'login' | null>(null);

  const create = async () => {
    setBusy(true);
    setProblem(null);
    const res = await syncEngine.createFamily();
    setBusy(false);
    if (!res.ok) setProblem(res.error);
  };

  return (
    <>
      <p>{t('sync.intro')}</p>
      <More>
        <p>{t('sync.privacy')}</p>
      </More>
      <div className="row">
        <button type="button" className="btn" disabled={busy} onClick={() => setEmail('signup')}>
          {t('account.signup')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={() => setEmail('login')}
        >
          {t('account.login')}
        </button>
      </div>
      <p className="muted sync-or">{t('account.orCode')}</p>
      <div className="row">
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={() => void create()}
        >
          {busy ? t('sync.creating') : t('sync.create')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={() => {
            setProblem(null);
            setJoining(true);
          }}
        >
          {t('sync.join')}
        </button>
      </div>
      {problem ? (
        <p className="notice" role="alert">
          {problemText(problem)}
        </p>
      ) : null}
      {joining ? (
        <JoinDialog
          onClose={() => setJoining(false)}
          onJoined={(result) => {
            setJoining(false);
            onJoined(result);
          }}
        />
      ) : null}
      {email ? (
        <AccountDialog
          mode={email}
          onClose={() => setEmail(null)}
          onJoined={(result) => {
            setEmail(null);
            onJoined(result);
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Signing up (or setting the family's email on a linked device) and signing in.
 * The password is checked here and stretched on the device; no mail is sent.
 */
function AccountDialog({
  mode,
  onClose,
  onJoined,
}: {
  mode: 'signup' | 'login' | 'set';
  onClose: () => void;
  onJoined?: (result: JoinResult) => void;
}) {
  const id = useId();
  const [email, setEmail] = useState(
    mode === 'set' ? (syncEngine.ui.getState().accountEmail ?? '') : '',
  );
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const creating = mode !== 'login';

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setProblem(null);
    if (creating && password.length >= PASSWORD_MIN && password !== again) {
      setProblem(t('account.mismatch'));
      return;
    }
    setBusy(true);
    if (mode === 'login') {
      const res = await syncEngine.login(email, password);
      setBusy(false);
      if (res.ok) onJoined?.({ matched: res.matched, added: res.added });
      else setProblem(problemText(res.error));
    } else {
      const res = await syncEngine.setAccount(email, password);
      setBusy(false);
      if (res.ok) onClose();
      else setProblem(problemText(res.error));
    }
  };

  return (
    <Dialog
      title={t(`account.${mode}.title`)}
      onClose={onClose}
      actions={
        <button
          type="submit"
          form={`${id}-form`}
          className="btn"
          disabled={busy || !email.trim() || !password}
        >
          {busy ? t('account.busy') : t(`account.submit.${mode}`)}
        </button>
      }
    >
      <form id={`${id}-form`} className="stack account-form" onSubmit={(e) => void submit(e)}>
        {mode === 'login' ? <p>{t('account.loginHow')}</p> : null}
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
            autoComplete={creating ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby={creating ? `${id}-hint` : undefined}
          />
          {creating ? (
            <span id={`${id}-hint`} className="muted">
              {t('account.passwordHint')}
            </span>
          ) : null}
        </div>
        {creating ? (
          <div className="field">
            <label htmlFor={`${id}-again`}>{t('account.password2')}</label>
            <input
              id={`${id}-again`}
              className="text-input"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={again}
              onChange={(e) => setAgain(e.target.value)}
            />
          </div>
        ) : null}
        {creating ? <p className="notice">{t('account.noMail')}</p> : null}
        <p className="gate__error" role="alert">
          {problem ?? ' '}
        </p>
      </form>
    </Dialog>
  );
}

/** On a linked device: whether the family signs in with an email, and changing that. */
function AccountBox() {
  const hasAccount = useSync((s) => s.hasAccount);
  const accountEmail = useSync((s) => s.accountEmail);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [problem, setProblem] = useState<SyncProblem | null>(null);
  if (hasAccount === null) return null;
  return (
    <div className="sync-account">
      <h3 className="sync-devices__title">{t('account.title')}</h3>
      {hasAccount ? (
        <p>
          {accountEmail
            ? t('account.on', { params: { email: accountEmail } })
            : t('account.onOther')}
        </p>
      ) : (
        <p className="muted">{t('account.off')}</p>
      )}
      <div className="row">
        <button
          type="button"
          className={hasAccount ? 'btn btn--secondary' : 'btn'}
          onClick={() => setEditing(true)}
        >
          {hasAccount ? t('account.change') : t('account.set')}
        </button>
        {hasAccount ? (
          <button type="button" className="btn btn--ghost" onClick={() => setRemoving(true)}>
            {t('account.remove')}
          </button>
        ) : null}
      </div>
      {problem ? (
        <p className="notice" role="alert">
          {problemText(problem)}
        </p>
      ) : null}
      {editing ? <AccountDialog mode="set" onClose={() => setEditing(false)} /> : null}
      {removing ? (
        <ConfirmDialog
          title={t('account.remove.title')}
          body={t('account.remove.body')}
          confirmLabel={t('account.remove')}
          onConfirm={() => {
            setRemoving(false);
            setProblem(null);
            void syncEngine.removeAccount().then((res) => {
              if (!res.ok) setProblem(res.error);
            });
          }}
          onCancel={() => setRemoving(false)}
        />
      ) : null}
    </div>
  );
}

function JoinDialog({
  onClose,
  onJoined,
}: {
  onClose: () => void;
  onJoined: (result: JoinResult) => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<SyncProblem | null>(null);

  const submit = async (value: string) => {
    setBusy(true);
    setProblem(null);
    const res = await syncEngine.join(value);
    setBusy(false);
    if (res.ok) {
      onJoined({ matched: res.matched, added: res.added });
    } else {
      setProblem(res.error);
      setCode('');
    }
  };

  return (
    <Dialog
      title={t('sync.join.title')}
      onClose={onClose}
      actions={
        <button
          type="button"
          className="btn"
          disabled={busy || code.length !== PAIR_CODE_LENGTH}
          onClick={() => void submit(code)}
        >
          {busy ? t('sync.join.busy') : t('sync.join.submit')}
        </button>
      }
    >
      <div className="gate stack">
        <p>{t('sync.join.how')}</p>
        <output className="gate__value sync-code" dir="ltr" aria-label={t('sync.join.code')}>
          {code || ' '}
        </output>
        <p className="gate__error" role="alert">
          {problem ? problemText(problem) : ' '}
        </p>
        <NumberPad
          label={t('sync.join.code')}
          value={code}
          onChange={(v) => {
            setProblem(null);
            setCode(v.replace(/\D/g, ''));
          }}
          maxLength={PAIR_CODE_LENGTH}
          code
        />
      </div>
    </Dialog>
  );
}

function JoinedDialog({ result, onClose }: { result: JoinResult; onClose: () => void }) {
  return (
    <Dialog
      title={t('sync.joined.title')}
      onClose={onClose}
      actions={
        <button type="button" className="btn" onClick={onClose}>
          {t('action.continue')}
        </button>
      }
    >
      <div className="stack">
        <p>{t('sync.joined.body')}</p>
        {result.matched.length > 0 ? (
          <p>{t('sync.joined.matched', { params: { names: result.matched.join(', ') } })}</p>
        ) : null}
        {result.added.length > 0 ? (
          <p>{t('sync.joined.added', { params: { names: result.added.join(', ') } })}</p>
        ) : null}
      </div>
    </Dialog>
  );
}

/* ---------- Linked ---------- */

function Linked() {
  const status = useSync((s) => s.status);
  const lastSyncAt = useSync((s) => s.lastSyncAt);
  const devices = useSync((s) => s.devices);
  const deviceId = useSync((s) => s.deviceId);
  const now = useNow(30_000);
  const [pairing, setPairing] = useState(false);
  const [confirm, setConfirm] = useState<
    { kind: 'remove'; id: string } | { kind: 'leave' } | { kind: 'delete' } | null
  >(null);
  const [problem, setProblem] = useState<SyncProblem | null>(null);

  const statusText =
    status === 'syncing'
      ? t('sync.status.syncing')
      : status === 'offline'
        ? t('sync.status.offline')
        : status === 'error'
          ? t('sync.status.error')
          : lastSyncAt !== null
            ? t('sync.status.synced', { params: { when: since(lastSyncAt, now) } })
            : t('sync.status.syncing');

  const run = async (action: () => Promise<{ ok: true } | { ok: false; error: SyncProblem }>) => {
    setConfirm(null);
    setProblem(null);
    const res = await action();
    if (!res.ok) setProblem(res.error);
  };

  return (
    <>
      <p
        className={status === 'offline' || status === 'error' ? 'notice' : 'notice notice--ok'}
        role="status"
      >
        {statusText}
      </p>
      <div className="row">
        <button type="button" className="btn" onClick={() => setPairing(true)}>
          {t('sync.addDevice')}
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => void syncEngine.sync()}>
          {t('sync.now')}
        </button>
      </div>
      {problem ? (
        <p className="notice" role="alert">
          {problemText(problem)}
        </p>
      ) : null}

      <AccountBox />

      <h3 className="sync-devices__title">{t('sync.devices')}</h3>
      <ul className="sync-devices">
        {devices.map((d) => (
          <li key={d.id} className="sync-device">
            <span className="sync-device__main">
              <strong>
                {d.name}
                {d.id === deviceId ? ` ${t('sync.thisDevice')}` : ''}
              </strong>
              <span className="muted">
                {t('sync.deviceSince', { params: { date: formatDate(d.createdAt) } })}
                {d.id !== deviceId
                  ? ` · ${t('sync.deviceSeen', { params: { when: since(d.lastSeenAt, now) } })}`
                  : ''}
              </span>
            </span>
            {d.id !== deviceId ? (
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => setConfirm({ kind: 'remove', id: d.id })}
              >
                {t('sync.removeDevice')}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setConfirm({ kind: 'leave' })}
        >
          {t('sync.leave')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setConfirm({ kind: 'delete' })}
        >
          {t('sync.delete')}
        </button>
      </div>

      {pairing ? <PairingDialog onClose={() => setPairing(false)} /> : null}
      {confirm?.kind === 'remove' ? (
        <ConfirmDialog
          title={t('sync.removeDevice.title')}
          body={t('sync.removeDevice.body')}
          confirmLabel={t('sync.removeDevice')}
          onConfirm={() => void run(() => syncEngine.removeDevice(confirm.id))}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {confirm?.kind === 'leave' ? (
        <ConfirmDialog
          title={t('sync.leave.title')}
          body={t('sync.leave.body')}
          confirmLabel={t('sync.leave')}
          onConfirm={() => void run(() => syncEngine.removeDevice(deviceId ?? ''))}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {confirm?.kind === 'delete' ? (
        <ConfirmDialog
          title={t('sync.delete.title')}
          body={t('sync.delete.body')}
          confirmLabel={t('sync.delete.confirm')}
          danger
          onConfirm={() => void run(() => syncEngine.deleteFamily())}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </>
  );
}

function PairingDialog({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState<{ code: string; expiresAt: number } | null>(null);
  const [problem, setProblem] = useState<SyncProblem | null>(null);
  const now = useNow(1000);

  useEffect(() => {
    let live = true;
    void syncEngine.pairingCode().then((res) => {
      if (!live) return;
      if (res.ok) setCode({ code: res.code, expiresAt: res.expiresAt });
      else setProblem(res.error);
    });
    return () => {
      live = false;
    };
  }, []);

  // The code is shown until it expires; a device that joined appears in the list afterwards.
  const left = code ? Math.max(0, code.expiresAt - now) : 0;
  const expired = code !== null && left === 0;
  const mmss = `${Math.floor(left / 60_000)}:${String(Math.floor((left % 60_000) / 1000)).padStart(2, '0')}`;

  return (
    <Dialog
      title={t('sync.pair.title')}
      onClose={() => {
        void syncEngine.sync();
        onClose();
      }}
    >
      <div className="stack sync-pair">
        {problem ? (
          <p className="notice" role="alert">
            {problemText(problem)}
          </p>
        ) : code === null ? (
          <p className="muted">{t('sync.pair.loading')}</p>
        ) : expired ? (
          <p className="notice">{t('sync.pair.expired')}</p>
        ) : (
          <>
            <p>{t('sync.pair.how')}</p>
            <output className="sync-code sync-code--big" dir="ltr" aria-label={t('sync.join.code')}>
              {code.code}
            </output>
            <p className="muted">{t('sync.pair.valid', { params: { time: mmss } })}</p>
          </>
        )}
      </div>
    </Dialog>
  );
}

/* ---------- Local copies ---------- */

function Snapshots({ snapshots }: { snapshots: Snapshot[] }) {
  const [restoring, setRestoring] = useState<Snapshot | null>(null);
  const [problem, setProblem] = useState<SyncProblem | null>(null);
  const [done, setDone] = useState(false);
  const label = (day: string) => {
    const [y, m, d] = day.split('-').map(Number);
    return formatDate(new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime());
  };
  return (
    <details className="sync-snapshots">
      <summary>{t('sync.snapshots.title')}</summary>
      <p className="muted">{t('sync.snapshots.body')}</p>
      <ul className="sync-devices">
        {snapshots.map((s) => (
          <li key={s.day} className="sync-device">
            <span className="sync-device__main">
              <strong>{label(s.day)}</strong>
              <span className="muted">{s.data.profiles.map((p) => p.name).join(', ') || '—'}</span>
            </span>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setRestoring(s)}
            >
              {t('sync.snapshots.restore')}
            </button>
          </li>
        ))}
      </ul>
      {problem ? (
        <p className="notice" role="alert">
          {problemText(problem)}
        </p>
      ) : null}
      {done ? (
        <p className="notice notice--ok" role="status">
          {t('sync.snapshots.done')}
        </p>
      ) : null}
      {restoring ? (
        <ConfirmDialog
          title={t('sync.snapshots.confirmTitle')}
          body={t('sync.snapshots.confirmBody', { params: { date: label(restoring.day) } })}
          confirmLabel={t('sync.snapshots.restore')}
          danger
          onConfirm={() => {
            const s = restoring;
            setRestoring(null);
            void syncEngine.restore(s).then((res) => {
              if (res.ok) setDone(true);
              else setProblem(res.error);
            });
          }}
          onCancel={() => setRestoring(null)}
        />
      ) : null}
    </details>
  );
}
