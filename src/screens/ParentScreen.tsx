import { useEffect, useRef, useState } from 'react';
import { navigate } from '@/app/router';
import {
  countCached,
  downloadClips,
  gradeAudio,
  offlineSupported,
  type GradeAudio,
} from '@/audio/offline';
import { makeT, t } from '@/i18n';
import { formatDate, formatPercent, gradeLabel, mistakeLabel, topicLabel } from '@/i18n/labels';
import { ParentGate } from '@/parent/ParentGate';
import { ProfileForm } from '@/parent/ProfileForm';
import { isStandalone } from '@/pwa/standalone';
import { backupFileName, deliverFile, readBackupFile, serializeBackup } from '@/state/backup';
import { PIN_LENGTH } from '@/state/pin';
import { summarizeProgress, weekSummary } from '@/state/progress';
import { worldsFor } from '@/engine/journey';
import { MAX_PROFILES, type AppData, type Profile } from '@/state/schema';
import type { Grade } from '@/ui/ageBand';
import { useApp } from '@/state/store';
import { applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { ConfirmDialog, Dialog } from '@/ui/Dialog';
import { NumberPad } from '@/ui/NumberPad';

const BACKUP_STALE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Parent area. Reachable from home through the gate (or directly on first
 * run). A direct visit to /parents without having passed the gate shows it.
 */
export function ParentScreen() {
  const unlocked = useApp((s) => s.isParentUnlocked());
  const noProfiles = useApp((s) => s.data.profiles.length === 0);
  const hasPin = useApp((s) => s.data.parent.pin !== null);
  const verifyPin = useApp((s) => s.verifyPin);
  const unlockParent = useApp((s) => s.unlockParent);

  useEffect(() => applyAgeBand('older'), []);

  if (!unlocked && !noProfiles) {
    return (
      <main className="screen" data-screen="parents-locked">
        <ParentGate
          hasPin={hasPin}
          verifyPin={verifyPin}
          onUnlock={unlockParent}
          onCancel={() => navigate({ name: 'home' })}
        />
      </main>
    );
  }
  return <ParentArea />;
}

function ParentArea() {
  const lockParent = useApp((s) => s.lockParent);
  const exit = () => {
    lockParent();
    navigate({ name: 'home' });
  };
  return (
    <main className="screen screen--with-footer" data-screen="parents">
      <header className="screen__header">
        <h1>{t('parent.title')}</h1>
        <button type="button" className="btn" onClick={exit}>
          {t('parent.exit')}
        </button>
      </header>
      <ChildrenSection />
      <BackupSection />
      <SecuritySection />
      <DeviceSection />
      <OfflineSection />
      {/* Always in reach at the bottom, however long the page gets. */}
      <footer className="screen__footer">
        <button type="button" className="btn btn--wide" onClick={exit}>
          {t('parent.exit')}
        </button>
      </footer>
    </main>
  );
}

/* ---------- Children and their progress ---------- */

function ChildrenSection() {
  const profiles = useApp((s) => s.data.profiles);
  const addProfile = useApp((s) => s.addProfile);
  const updateProfile = useApp((s) => s.updateProfile);
  const removeProfile = useApp((s) => s.removeProfile);
  const selectProfile = useApp((s) => s.selectProfile);
  const lockParent = useApp((s) => s.lockParent);
  const [editing, setEditing] = useState<Profile | 'new' | null>(null);
  const [added, setAdded] = useState<Profile | null>(null);
  const full = profiles.length >= MAX_PROFILES;

  return (
    <section className="card stack" aria-labelledby="children">
      <h2 id="children">{t('parent.children')}</h2>
      {profiles.map((p) => (
        <ChildRow key={p.id} profile={p} onEdit={() => setEditing(p)} />
      ))}
      <div className="row">
        <button type="button" className="btn" disabled={full} onClick={() => setEditing('new')}>
          {t('parent.addChild')}
        </button>
        {full ? (
          <span className="muted">
            {t('parent.limitReached', { params: { max: MAX_PROFILES } })}
          </span>
        ) : null}
      </div>

      {editing === 'new' ? (
        <ProfileForm
          onSave={(input) => {
            setAdded(addProfile(input));
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      ) : editing ? (
        <ProfileForm
          profile={editing}
          onSave={(input) => {
            updateProfile(editing.id, input);
            setEditing(null);
          }}
          onDelete={() => {
            removeProfile(editing.id);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {added ? (
        <ChildAdded
          profile={added}
          canAddAnother={!full}
          onPlay={() => {
            lockParent();
            selectProfile(added.id);
            navigate({ name: 'play' });
          }}
          onAddAnother={() => {
            setAdded(null);
            setEditing('new');
          }}
          onClose={() => setAdded(null)}
        />
      ) : null}
    </section>
  );
}

/** Right after a child is added: the next step is always one tap away. */
function ChildAdded({
  profile,
  canAddAnother,
  onPlay,
  onAddAnother,
  onClose,
}: {
  profile: Profile;
  canAddAnother: boolean;
  onPlay: () => void;
  onAddAnother: () => void;
  onClose: () => void;
}) {
  const tc = makeT(profile.gender);
  return (
    <Dialog
      title={tc('parent.added.title', { name: profile.name })}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn" onClick={onPlay}>
            {t('parent.added.play')}
          </button>
          {canAddAnother ? (
            <button type="button" className="btn btn--secondary" onClick={onAddAnother}>
              {t('parent.added.another')}
            </button>
          ) : null}
        </>
      }
    >
      <div className="child-added">
        <Avatar id={profile.avatar} size="lg" decorative />
        <p>{tc('parent.added.body')}</p>
      </div>
    </Dialog>
  );
}

function ChildRow({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const summary = summarizeProgress(progress);
  const tc = makeT(profile.gender);

  return (
    <article className="child-row" aria-label={profile.name}>
      <Avatar id={profile.avatar} size="md" decorative />
      <div className="child-row__main">
        <span className="child-row__name">
          {profile.name} <span className="muted">· {gradeLabel(profile.grade)}</span>
        </span>
        {summary.attempts === 0 ? (
          <span className="muted">{tc('parent.noPracticeYet')}</span>
        ) : (
          <>
            <span>
              {summary.topicsPracticed === 1
                ? tc('parent.topicsPracticedOne')
                : tc('parent.topicsPracticed', { count: summary.topicsPracticed })}
              {' · '}
              {t('parent.attempts', { params: { count: summary.attempts } })}
              {summary.successRate !== null ? (
                <>
                  {' · '}
                  {t('parent.successRate', {
                    params: { percent: formatPercent(summary.successRate) },
                  })}
                </>
              ) : null}
            </span>
            {summary.lastPracticedAt !== null ? (
              <span className="muted">
                {t('parent.lastPracticed', {
                  params: { date: formatDate(summary.lastPracticedAt) },
                })}
              </span>
            ) : null}
            {summary.struggling.length > 0 ? (
              <span>
                {t('parent.struggling')} {summary.struggling.map(topicLabel).join(', ')}
              </span>
            ) : null}
            {summary.strong.length > 0 ? (
              <span>
                {t('parent.strong')} {summary.strong.map(topicLabel).join(', ')}
              </span>
            ) : null}
            {summary.topMistakes.length > 0 ? (
              <span>
                {t('parent.commonMistakes')}{' '}
                {summary.topMistakes.map((m) => mistakeLabel(m.kind)).join(', ')}
              </span>
            ) : null}
            <WeekReport profile={profile} />
            <JourneyReport profile={profile} />
          </>
        )}
      </div>
      <button type="button" className="btn btn--secondary btn--small" onClick={onEdit}>
        {t('parent.edit')}
      </button>
    </article>
  );
}

/* ---------- Backup and restore ---------- */

function BackupSection() {
  const data = useApp((s) => s.data);
  const markBackedUp = useApp((s) => s.markBackedUp);
  const replaceData = useApp((s) => s.replaceData);
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<AppData | null>(null);

  const lastBackupAt = data.meta.lastBackupAt;
  const stale = lastBackupAt !== null && Date.now() - lastBackupAt > BACKUP_STALE_MS;

  const exportBackup = async () => {
    const now = new Date();
    const result = await deliverFile(serializeBackup(data, now), backupFileName(now));
    if (result !== 'cancelled') {
      markBackedUp();
      setMessage(t('parent.backup.exported'));
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const parsed = await readBackupFile(file);
    if (fileInput.current) fileInput.current.value = '';
    if (parsed.ok) {
      setMessage(null);
      setPending(parsed.data);
    } else {
      setMessage(t('parent.backup.importError', { params: { reason: parsed.error } }));
    }
  };

  return (
    <section className="card stack" aria-labelledby="backup">
      <h2 id="backup">{t('parent.backup.title')}</h2>
      <p>{t('parent.backup.body')}</p>
      <p className="muted">
        {lastBackupAt === null
          ? t('parent.backup.never')
          : t('parent.backup.last', { params: { date: formatDate(lastBackupAt) } })}
      </p>
      {stale ? <p className="notice">{t('parent.backup.stale')}</p> : null}
      <div className="row">
        <button type="button" className="btn" onClick={() => void exportBackup()}>
          {t('parent.backup.export')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => fileInput.current?.click()}
        >
          {t('parent.backup.import')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          data-testid="backup-file"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      {message ? (
        <p className="notice notice--ok" role="status">
          {message}
        </p>
      ) : null}

      {pending ? (
        <ConfirmDialog
          title={t('parent.backup.confirmTitle')}
          body={t('parent.backup.confirmBody', { params: { count: pending.profiles.length } })}
          confirmLabel={t('parent.backup.confirm')}
          danger
          onConfirm={() => {
            replaceData(pending);
            setPending(null);
            setMessage(t('parent.backup.imported'));
          }}
          onCancel={() => setPending(null)}
        />
      ) : null}
    </section>
  );
}

/* ---------- PIN ---------- */

function SecuritySection() {
  const hasPin = useApp((s) => s.data.parent.pin !== null);
  const setPin = useApp((s) => s.setPin);
  const [choosing, setChoosing] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <section className="card stack" aria-labelledby="security">
      <h2 id="security">{t('parent.security.title')}</h2>
      <p>{hasPin ? t('parent.security.hasPin') : t('parent.security.noPin')}</p>
      <div className="row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            setSaved(false);
            setChoosing(true);
          }}
        >
          {hasPin ? t('parent.security.changePin') : t('parent.security.setPin')}
        </button>
        {hasPin ? (
          <button type="button" className="btn btn--ghost" onClick={() => void setPin(null)}>
            {t('parent.security.removePin')}
          </button>
        ) : null}
      </div>
      {saved ? (
        <p className="notice notice--ok" role="status">
          {t('parent.security.saved')}
        </p>
      ) : null}
      {choosing ? (
        <PinChooser
          onDone={(pin) => {
            setChoosing(false);
            void setPin(pin).then(() => setSaved(true));
          }}
          onCancel={() => setChoosing(false)}
        />
      ) : null}
    </section>
  );
}

function PinChooser({ onDone, onCancel }: { onDone: (pin: string) => void; onCancel: () => void }) {
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [mismatch, setMismatch] = useState(false);

  const onChange = (next: string) => {
    setMismatch(false);
    setValue(next);
    if (next.length < PIN_LENGTH) return;
    if (first === null) {
      setFirst(next);
      setValue('');
    } else if (next === first) {
      onDone(next);
    } else {
      setFirst(null);
      setValue('');
      setMismatch(true);
    }
  };

  const prompt = first === null ? t('parent.security.newPin') : t('parent.security.repeatPin');
  return (
    <Dialog title={t('parent.security.title')} onClose={onCancel}>
      <div className="gate stack">
        <p>{prompt}</p>
        <output className="gate__value" dir="ltr">
          {'•'.repeat(value.length) || ' '}
        </output>
        <p className="gate__error" role="alert">
          {mismatch ? t('parent.security.mismatch') : ' '}
        </p>
        <NumberPad label={prompt} value={value} onChange={onChange} maxLength={PIN_LENGTH} />
      </div>
    </Dialog>
  );
}

/* ---------- Device and storage status ---------- */

function DeviceSection() {
  const storageIssue = useApp((s) => s.storageIssue);
  const persisted = useApp((s) => s.persisted);
  const standalone = isStandalone();

  return (
    <section className="card stack" aria-labelledby="device">
      <h2 id="device">{t('parent.device.title')}</h2>
      {storageIssue === 'unavailable' ? (
        <p className="notice">{t('parent.device.unavailable')}</p>
      ) : null}
      {storageIssue === 'writeFailed' ? (
        <p className="notice">{t('parent.device.writeFailed')}</p>
      ) : null}
      {storageIssue === 'recovered' ? (
        <p className="notice">{t('parent.device.recovered')}</p>
      ) : null}
      <p>{standalone ? t('parent.device.installed') : t('parent.device.notInstalled')}</p>
      {storageIssue !== 'unavailable' ? (
        <p className="muted">
          {persisted ? t('parent.device.persisted') : t('parent.device.notPersisted')}
        </p>
      ) : null}
      <div className="row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate({ name: 'install' })}
        >
          {t('parent.device.installGuide')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => navigate({ name: 'playground' })}
        >
          {t('parent.device.playground')}
        </button>
      </div>
    </section>
  );
}

/* ---------- Recordings for use without internet ---------- */

function OfflineSection() {
  const profiles = useApp((s) => s.data.profiles);
  const grades = [...new Set(profiles.map((p) => p.grade))].sort((a, b) => a - b);
  if (grades.length === 0) return null;
  return (
    <section className="card stack" aria-labelledby="offline">
      <h2 id="offline">{t('parent.offline.title')}</h2>
      <p className="muted">{t('parent.offline.intro')}</p>
      {offlineSupported() ? (
        grades.map((g) => <OfflineGrade key={g} grade={g} />)
      ) : (
        <p className="notice">{t('parent.offline.unsupported')}</p>
      )}
    </section>
  );
}

type OfflineState =
  | { phase: 'loading' }
  | { phase: 'ready'; audio: GradeAudio; have: number }
  | { phase: 'downloading'; audio: GradeAudio; done: number }
  | { phase: 'error' };

function OfflineGrade({ grade }: { grade: Grade }) {
  const [state, setState] = useState<OfflineState>({ phase: 'loading' });
  const [failed, setFailed] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    let live = true;
    gradeAudio(grade)
      .then(async (audio) => {
        const have = await countCached(audio.ids);
        if (live) setState({ phase: 'ready', audio, have });
      })
      .catch(() => live && setState({ phase: 'error' }));
    return () => {
      live = false;
      abort.current?.abort();
    };
  }, [grade]);

  const start = (audio: GradeAudio) => {
    const controller = new AbortController();
    abort.current = controller;
    setFailed(false);
    setState({ phase: 'downloading', audio, done: 0 });
    void downloadClips(
      audio.ids,
      (done) => setState({ phase: 'downloading', audio, done }),
      controller.signal,
    ).then(async ({ failed: f }) => {
      setFailed(f > 0);
      setState({ phase: 'ready', audio, have: await countCached(audio.ids) });
    });
  };

  const mb = (bytes: number) => Math.max(1, Math.round(bytes / 1_000_000));
  const title = (audio: GradeAudio) =>
    t('parent.offline.grade', { params: { grade: gradeLabel(grade), mb: mb(audio.bytes) } });

  if (state.phase === 'loading') return <p className="muted">{t('parent.offline.loading')}</p>;
  if (state.phase === 'error') return <p className="muted">{t('parent.offline.unavailable')}</p>;
  const total = state.audio.ids.length;
  const count = state.phase === 'ready' ? state.have : state.done;
  const complete = state.phase === 'ready' && count >= total;
  return (
    <div className="offline-grade" aria-label={gradeLabel(grade)}>
      <strong>{title(state.audio)}</strong>
      <progress className="offline-grade__bar" max={total} value={count} />
      <span className="muted">
        {complete
          ? t('parent.offline.done')
          : state.phase === 'downloading'
            ? t('parent.offline.progress', { params: { done: count, total } })
            : t('parent.offline.status', { params: { have: count, total } })}
      </span>
      {failed ? <span className="notice">{t('parent.offline.failed')}</span> : null}
      {state.phase === 'downloading' ? (
        <button type="button" className="btn btn--secondary" onClick={() => abort.current?.abort()}>
          {t('parent.offline.stop')}
        </button>
      ) : complete ? null : (
        <button type="button" className="btn" onClick={() => start(state.audio)}>
          {count > 0 ? t('parent.offline.resume') : t('parent.offline.download')}
        </button>
      )}
    </div>
  );
}

/* ---------- The week and the journey, per child ---------- */

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function WeekReport({ profile }: { profile: Profile }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const week = weekSummary(progress, Date.now());
  const tc = makeT(profile.gender);
  const most = Math.max(1, ...week.days.map((d) => d.exercises));
  return (
    <div className="report" aria-label={t('parent.week.title')}>
      <strong className="report__title">{t('parent.week.title')}</strong>
      {week.exercises === 0 ? (
        <span className="muted">{tc('parent.week.none')}</span>
      ) : (
        <span>
          {t('parent.week.days', { params: { days: week.daysPracticed } })}
          {' · '}
          {t('parent.week.exercises', { params: { count: week.exercises } })}
          {week.rate !== null ? (
            <>
              {' · '}
              {t('parent.week.rate', { params: { percent: formatPercent(week.rate) } })}
            </>
          ) : null}
          {week.dailyReviews > 0 ? (
            <>
              {' · '}
              {t('parent.week.daily', { params: { count: week.dailyReviews } })}
            </>
          ) : null}
        </span>
      )}
      <div className="week" role="img" aria-label={t('parent.week.chart')}>
        {week.days.map((d) => (
          <div key={d.key} className="week__day">
            <span className="week__count">{d.exercises > 0 ? d.exercises : ''}</span>
            <span
              className={d.exercises > 0 ? 'week__bar week__bar--on' : 'week__bar'}
              style={{ height: `${Math.round((d.exercises / most) * 100)}%` }}
            />
            <span className="week__label">{WEEKDAYS[d.weekday]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneyReport({ profile }: { profile: Profile }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const worlds = worldsFor(profile.grade, progress);
  return (
    <div className="report" aria-label={t('parent.journey.title')}>
      <strong className="report__title">{t('parent.journey.title')}</strong>
      <ul className="report__worlds">
        {worlds.map((w) => (
          <li key={w.topic.id} className="report__world">
            <span>
              {w.completed
                ? t('parent.journey.worldDone', { params: { name: topicLabel(w.topic.id) } })
                : t('parent.journey.world', {
                    params: { name: topicLabel(w.topic.id), done: w.done, total: w.total },
                  })}
            </span>
            <progress max={w.total} value={w.done} className="report__bar" />
          </li>
        ))}
      </ul>
    </div>
  );
}
