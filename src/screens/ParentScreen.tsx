import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { navigate } from '@/app/router';
import {
  countCached,
  downloadClips,
  gradeAudio,
  offlineSupported,
  type GradeAudio,
} from '@/audio/offline';
import { makeT, t, type TranslationKey } from '@/i18n';
import { formatDate, formatPercent, gradeLabel, mistakeLabel, topicLabel } from '@/i18n/labels';
import { ParentGate } from '@/parent/ParentGate';
import { ProfileForm } from '@/parent/ProfileForm';
import { SyncSection } from '@/parent/SyncSection';
import { More, SettingsCard } from '@/parent/parts';
import { PARENT_TABS, takeParentTab, type ParentTab } from '@/parent/tab';
import { useSync } from '@/sync';
import { isStandalone } from '@/pwa/standalone';
import { backupFileName, deliverFile, readBackupFile, serializeBackup } from '@/state/backup';
import { PIN_LENGTH } from '@/state/pin';
import { goalDays, summarizeProgress, weekSummary } from '@/state/progress';
import { activeWorld, nextStop, worldsFor, type World } from '@/engine/journey';
import { MAX_PROFILES, type AppData, type Profile } from '@/state/schema';
import type { Grade } from '@/ui/ageBand';
import { BrandMark } from '@/ui/BrandMark';
import { useApp } from '@/state/store';
import { applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { ConfirmDialog, Dialog } from '@/ui/Dialog';
import { Icon, type IconName } from '@/ui/Icon';
import { NumberPad } from '@/ui/NumberPad';
import { Plusi } from '@/ui/Plusi';

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
      <main className="screen parent-locked" data-screen="parents-locked">
        <BrandMark />
        <div className="parent-locked__art" aria-hidden="true">
          <Icon name="lock" />
        </div>
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

const TAB_ICON: Record<ParentTab, IconName> = {
  children: 'children',
  progress: 'progress',
  settings: 'settings',
};

const TAB_LABEL = {
  children: 'parentArea.tab.children',
  progress: 'parentArea.tab.progress',
  settings: 'parentArea.tab.settings',
} as const satisfies Record<ParentTab, string>;

/**
 * Three sections: the children, their progress, and the settings. Every
 * section stays mounted (hidden when not shown), so a download, a dialog or a
 * half-done form survives a switch. On a phone the sections are a tab bar at
 * the bottom, in thumb reach; on a tablet, a segmented control under the title.
 */
function ParentArea() {
  const lockParent = useApp((s) => s.lockParent);
  const unlockParent = useApp((s) => s.unlockParent);
  const [tab, setTab] = useState<ParentTab>(() => takeParentTab() ?? 'children');

  // The area locks itself after a while, but not under a parent who is using it (WCAG 2.2.1).
  useEffect(() => {
    let last = 0;
    const keepOpen = () => {
      const now = Date.now();
      if (now - last < 30_000) return;
      last = now;
      unlockParent();
    };
    window.addEventListener('pointerdown', keepOpen);
    window.addEventListener('keydown', keepOpen);
    return () => {
      window.removeEventListener('pointerdown', keepOpen);
      window.removeEventListener('keydown', keepOpen);
    };
  }, [unlockParent]);

  const exit = () => {
    lockParent();
    navigate({ name: 'home' });
  };

  const show = (next: ParentTab) => {
    if (next === tab) return;
    setTab(next);
    window.scrollTo(0, 0);
  };

  return (
    <main className="screen parent" data-screen="parents">
      <BrandMark />
      <header className="parent__top">
        <div className="parent__titlebar">
          <h1 className="parent__title">
            <Icon name="lock" className="parent__title-icon" />
            {t('parent.title')}
          </h1>
          <button type="button" className="btn btn--small parent__exit" onClick={exit}>
            {t('parent.exit')}
          </button>
        </div>
        <ParentTabs tab={tab} onChange={show} />
      </header>

      <TabPanel tab="children" current={tab}>
        <ChildrenSection onSettings={() => show('settings')} />
      </TabPanel>
      <TabPanel tab="progress" current={tab}>
        <ProgressSection />
      </TabPanel>
      <TabPanel tab="settings" current={tab}>
        <h2 className="visually-hidden">{t('parentArea.settings.title')}</h2>
        <div className="settings-grid">
          <SyncSection />
          {/* A chosen backup file opens its confirmation here, wherever the parent was. */}
          <BackupSection onShow={() => show('settings')} />
          <SecuritySection />
          <OfflineSection />
          <DeviceSection />
        </div>
        <p className="info-link-row">
          <a
            className="info-link"
            href="/info"
            onClick={(e) => {
              e.preventDefault();
              navigate({ name: 'info' });
            }}
          >
            {t('info.link')}
          </a>
        </p>
      </TabPanel>
    </main>
  );
}

const tabId = (tab: ParentTab) => `parent-tab-${tab}`;
const panelId = (tab: ParentTab) => `parent-panel-${tab}`;

/** WAI-ARIA tabs: arrow keys move between them (right is "previous" in RTL), Home/End jump. */
function ParentTabs({ tab, onChange }: { tab: ParentTab; onChange: (tab: ParentTab) => void }) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = PARENT_TABS.indexOf(tab);
    const n = PARENT_TABS.length;
    const next =
      e.key === 'ArrowLeft'
        ? PARENT_TABS[(i + 1) % n]
        : e.key === 'ArrowRight'
          ? PARENT_TABS[(i - 1 + n) % n]
          : e.key === 'Home'
            ? PARENT_TABS[0]
            : e.key === 'End'
              ? PARENT_TABS[n - 1]
              : undefined;
    if (!next) return;
    e.preventDefault();
    onChange(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <div
      className="parent-tabs"
      role="tablist"
      aria-label={t('parentArea.tabs')}
      onKeyDown={onKeyDown}
    >
      {PARENT_TABS.map((name) => (
        <button
          key={name}
          type="button"
          role="tab"
          id={tabId(name)}
          className="parent-tabs__tab"
          aria-selected={tab === name}
          aria-controls={panelId(name)}
          tabIndex={tab === name ? 0 : -1}
          onClick={() => onChange(name)}
        >
          <Icon name={TAB_ICON[name]} className="parent-tabs__icon" />
          <span>{t(TAB_LABEL[name])}</span>
        </button>
      ))}
    </div>
  );
}

function TabPanel({
  tab,
  current,
  children,
}: {
  tab: ParentTab;
  current: ParentTab;
  children: ReactNode;
}) {
  return (
    <section
      className="parent__panel"
      role="tabpanel"
      id={panelId(tab)}
      aria-labelledby={tabId(tab)}
      hidden={tab !== current}
    >
      {children}
    </section>
  );
}

/* ---------- Children ---------- */

function ChildrenSection({ onSettings }: { onSettings: () => void }) {
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
    <div className="stack">
      <h2 id="children" className="parent__heading">
        {t('parent.children')}
      </h2>

      {profiles.length === 0 ? (
        <div className="card parent-empty">
          <Plusi size={72} mood="happy" decorative />
          <div className="stack parent-empty__text">
            <h3>{t('parentArea.empty.title')}</h3>
            <p>{t('parentArea.empty.body')}</p>
          </div>
        </div>
      ) : null}

      <ul className="child-cards" role="list">
        {profiles.map((p, i) => (
          <li key={p.id}>
            <ChildCard profile={p} index={i} onEdit={() => setEditing(p)} />
          </li>
        ))}
        <li>
          <button
            type="button"
            className="child-add"
            disabled={full}
            onClick={() => setEditing('new')}
          >
            <span className="child-add__icon">
              <Icon name="plus" />
            </span>
            {t('parent.addChild')}
          </button>
        </li>
      </ul>
      {full ? (
        <p className="muted">{t('parent.limitReached', { params: { max: MAX_PROFILES } })}</p>
      ) : null}

      {profiles.length === 0 ? (
        <p className="parent-empty__more">
          <span className="muted">{t('parentArea.empty.haveData')}</span>
          <button type="button" className="btn btn--ghost btn--small" onClick={onSettings}>
            <Icon name="sync" />
            {t('parentArea.empty.toSettings')}
          </button>
        </p>
      ) : null}

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
    </div>
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

/** One child at a glance: who, where in the journey, and what to strengthen. */
function ChildCard({
  profile,
  index,
  onEdit,
}: {
  profile: Profile;
  index: number;
  onEdit: () => void;
}) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const summary = summarizeProgress(progress);
  const world = activeWorld(profile.grade, progress);
  const tc = makeT(profile.gender);
  const share = world ? Math.round((world.done / world.total) * 100) : 0;

  return (
    <article className={`child-card child-card--c${index % 6}`} aria-label={profile.name}>
      <div className="child-card__head">
        <span className="child-card__avatar">
          <Avatar id={profile.avatar} size="md" decorative />
        </span>
        <span className="child-card__who">
          <span className="child-row__name">{profile.name}</span>
          <span className="muted">{gradeLabel(profile.grade)}</span>
        </span>
        <button type="button" className="btn btn--secondary btn--small" onClick={onEdit}>
          {t('parent.edit')}
          <span className="visually-hidden"> {profile.name}</span>
        </button>
      </div>

      {world ? (
        <div className="child-card__world">
          <span className="child-card__world-name">
            {t('journey.world', {
              params: { index: world.index, name: topicLabel(world.topic.id) },
            })}
          </span>
          <span className="muted">
            {world.completed ? tc('parentArea.allWorldsDone') : nowAt(world)}
          </span>
          <span className="meter" aria-hidden="true">
            <span style={{ width: `${share}%` }} />
          </span>
        </div>
      ) : null}

      {summary.attempts === 0 ? (
        <p className="muted">{tc('parent.noPracticeYet')}</p>
      ) : summary.struggling.length > 0 ? (
        <p className="child-card__tip">
          <strong>{t('parent.struggling')}</strong> {summary.struggling.map(topicLabel).join(', ')}
        </p>
      ) : null}
    </article>
  );
}

/* ---------- Progress, per child ---------- */

function ProgressSection() {
  const profiles = useApp((s) => s.data.profiles);
  return (
    <div className="stack">
      <h2 id="progress" className="parent__heading">
        {t('parentArea.progress.title')}
      </h2>
      {profiles.length === 0 ? (
        <p className="card muted">{t('parentArea.progress.empty')}</p>
      ) : (
        <div className="progress-cards">
          {profiles.map((p) => (
            <ProgressCard key={p.id} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressCard({ profile }: { profile: Profile }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const summary = summarizeProgress(progress);
  const tc = makeT(profile.gender);

  return (
    <article className="card progress-card" aria-label={profile.name}>
      <header className="progress-card__head">
        <Avatar id={profile.avatar} size="sm" decorative />
        <h3>{profile.name}</h3>
        <span className="muted">{gradeLabel(profile.grade)}</span>
      </header>
      {summary.attempts === 0 ? (
        <p className="muted">{tc('parent.noPracticeYet')}</p>
      ) : (
        <>
          <ul className="stat-chips" role="list">
            <li>
              {summary.topicsPracticed === 1
                ? tc('parent.topicsPracticedOne')
                : tc('parent.topicsPracticed', { count: summary.topicsPracticed })}
            </li>
            <li>{t('parent.attempts', { params: { count: summary.attempts } })}</li>
            <li>{t('parent.firstTry', { params: { count: summary.correct } })}</li>
            {summary.attempts - summary.correct > 0 ? (
              <li>
                {summary.attempts - summary.correct === 1
                  ? t('parent.wrongOne')
                  : t('parent.wrong', { params: { count: summary.attempts - summary.correct } })}
              </li>
            ) : null}
            {/* A percentage means something only once there are enough exercises behind it. */}
            {summary.successRate !== null && summary.attempts >= 20 ? (
              <li>
                {t('parent.successRate', {
                  params: { percent: formatPercent(summary.successRate) },
                })}
              </li>
            ) : null}
          </ul>
          {summary.lastPracticedAt !== null ? (
            <p className="muted">
              {t('parent.lastPracticed', {
                params: { date: formatDate(summary.lastPracticedAt) },
              })}
            </p>
          ) : null}
          {summary.struggling.length > 0 ? (
            <p className="fact fact--work">
              <strong>{t('parent.struggling')}</strong>{' '}
              {summary.struggling.map(topicLabel).join(', ')}
            </p>
          ) : null}
          {summary.strong.length > 0 ? (
            <p className="fact fact--strong">
              <strong>{t('parent.strong')}</strong> {summary.strong.map(topicLabel).join(', ')}
            </p>
          ) : null}
          {summary.topMistakes.length > 0 ? (
            <p className="fact">
              <strong>{t('parent.commonMistakes')}</strong>{' '}
              {summary.topMistakes.map((m) => mistakeLabel(m.kind)).join(', ')}
            </p>
          ) : null}
          <WeekReport profile={profile} />
          <JourneyReport profile={profile} />
        </>
      )}
    </article>
  );
}

/* ---------- Backup and restore ---------- */

function BackupSection({ onShow }: { onShow: () => void }) {
  const data = useApp((s) => s.data);
  const markBackedUp = useApp((s) => s.markBackedUp);
  const replaceData = useApp((s) => s.replaceData);
  const synced = useSync((s) => s.linked);
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
    onShow();
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
    <SettingsCard id="backup" icon="backup" title={t('parent.backup.title')}>
      <p>{synced ? t('parent.backup.bodySynced') : t('parent.backup.body')}</p>
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
          // Linked to the family: the restore reaches the other devices too.
          body={t(synced ? 'parent.backup.confirmBodySynced' : 'parent.backup.confirmBody', {
            params: { count: pending.profiles.length },
          })}
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
    </SettingsCard>
  );
}

/* ---------- PIN ---------- */

function SecuritySection() {
  const hasPin = useApp((s) => s.data.parent.pin !== null);
  const setPin = useApp((s) => s.setPin);
  const [choosing, setChoosing] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <SettingsCard id="security" icon="lock" title={t('parent.security.title')}>
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
    </SettingsCard>
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
          {'•'.repeat(value.length) || ' '}
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

/* ---------- Device and storage status ---------- */

function DeviceSection() {
  const storageIssue = useApp((s) => s.storageIssue);
  const persisted = useApp((s) => s.persisted);
  const standalone = isStandalone();

  return (
    <SettingsCard id="device" icon="device" title={t('parent.device.title')}>
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
        <More>
          <p>{persisted ? t('parent.device.persisted') : t('parent.device.notPersisted')}</p>
        </More>
      ) : null}
      <div className="row">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate({ name: 'install' })}
        >
          {t('parent.device.installGuide')}
        </button>
      </div>
    </SettingsCard>
  );
}

/* ---------- Recordings for use without internet ---------- */

function OfflineSection() {
  const profiles = useApp((s) => s.data.profiles);
  const grades = [...new Set(profiles.map((p) => p.grade))].sort((a, b) => a - b);
  if (grades.length === 0) return null;
  return (
    <SettingsCard id="offline" icon="headphones" title={t('parent.offline.title')}>
      <p>{t('parentArea.offline.short')}</p>
      <More>
        <p>{t('parent.offline.intro')}</p>
      </More>
      {offlineSupported() ? (
        grades.map((g) => <OfflineGrade key={g} grade={g} />)
      ) : (
        <p className="notice">{t('parent.offline.unsupported')}</p>
      )}
    </SettingsCard>
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

  if (state.phase === 'loading')
    return (
      <p className="muted">
        <strong>{gradeLabel(grade)}:</strong> {t('parent.offline.loading')}
      </p>
    );
  if (state.phase === 'error')
    return (
      <p className="muted">
        <strong>{gradeLabel(grade)}:</strong> {t('parent.offline.unavailable')}
      </p>
    );
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
      {profile.settings.dailyGoal ? (
        <span>
          {t(profile.settings.dailyGoal === 1 ? 'parent.goalOne' : 'parent.goal', {
            params: {
              goal: profile.settings.dailyGoal,
              days: goalDays(week, profile.settings.dailyGoal),
            },
          })}
        </span>
      ) : null}
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

/**
 * A name kept whole inside a sentence: "חיבור וחיסור עד 100" before a colon would
 * otherwise have its number carried across the colon by the bidi algorithm.
 */
function isolate(name: string): string {
  return `\u2068${name}\u2069`;
}

/** Where the child is in a world: the station the big button starts, by number and name. */
function nowAt(world: World): string {
  const stop = nextStop(world);
  if (stop.kind === 'review') return t('parent.nowAtReview');
  const station = world.stations.find((s) => s.level === stop.level);
  const name = station ? t(station.labelKey as TranslationKey) : '';
  return t('parent.nowAt', { params: { n: stop.level, name } });
}

/** Every world and its stations, folded: the child card already shows the current one. */
function JourneyReport({ profile }: { profile: Profile }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const worlds = worldsFor(profile.grade, progress);
  const active = activeWorld(profile.grade, progress);
  return (
    <details className="report more">
      <summary>{t('parent.journey.title')}</summary>
      <ul className="report__worlds">
        {worlds.map((w) => (
          <li key={w.topic.id} className="report__world">
            <span>
              {w.completed
                ? t('parent.journey.worldDone', { params: { name: isolate(topicLabel(w.topic.id)) } })
                : t('parent.journey.world', {
                    params: {
                      name: isolate(topicLabel(w.topic.id)),
                      // Counted as on the child's map: every station of her grade, the passed ones.
                      done: w.stations.filter((s) => s.state === 'done').length,
                      total: w.stations.length,
                    },
                  })}
              {w.topic.id === active?.topic.id && !w.completed ? (
                <span className="muted report__now">{nowAt(w)}</span>
              ) : null}
            </span>
            <progress max={w.total} value={w.done} className="report__bar" />
          </li>
        ))}
      </ul>
    </details>
  );
}
