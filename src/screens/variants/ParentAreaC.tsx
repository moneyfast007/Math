import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { navigate } from '@/app/router';
import { activeWorld } from '@/engine/journey';
import { ROUND_LENGTHS } from '@/engine/session';
import { makeT, t } from '@/i18n';
import { formatDate, formatPercent, gradeLabel, mistakeLabel, topicLabel } from '@/i18n/labels';
import { ProfileForm } from '@/parent/ProfileForm';
import { SyncSection } from '@/parent/SyncSection';
import { interestSent, sendInterest } from '@/sync/interest';
import { takeParentTab } from '@/parent/tab';
import { isStandalone } from '@/pwa/standalone';
import { goalDays, summarizeProgress, weekSummary } from '@/state/progress';
import {
  DAILY_GOAL_OPTIONS,
  MAX_PROFILES,
  ROUND_LENGTH_OPTIONS,
  type Profile,
  type ProfileProgress,
  type ProfileSettings,
} from '@/state/schema';
import { useApp } from '@/state/store';
import { currentStreak } from '@/state/streak';
import { useSync } from '@/sync';
import { ageBandForGrade } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { BrandMark } from '@/ui/BrandMark';
import { Icon, type IconName } from '@/ui/Icon';
import { Plusi } from '@/ui/Plusi';
import {
  BackupSection,
  ChildAdded,
  DeviceSection,
  JourneyReport,
  OfflineSection,
  PinBanner,
  SecuritySection,
} from '../ParentScreen';
import { guidance, isYesterday, nowAt, takeNewChild, todayOf, worldName } from './cShared';
import './c.css';

type CTab = 'today' | 'progress' | 'settings';
const TABS: readonly CTab[] = ['today', 'progress', 'settings'];
const TAB_ICON: Record<CTab, IconName> = {
  today: 'children',
  progress: 'progress',
  settings: 'settings',
};
const TAB_LABEL = {
  today: 'c.tab.today',
  progress: 'c.tab.progress',
  settings: 'c.tab.settings',
} as const satisfies Record<CTab, string>;

type DeviceItem = 'sync' | 'backup' | 'pin' | 'offline' | 'install';

const BACKUP_STALE_MS = 14 * 24 * 60 * 60 * 1000;

const todayFormat = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/**
 * Design C of the parents' area (?ui=c): three tabs named as a parent's
 * questions. "What happened today?" per child; "How are they doing?" (the
 * journey and the week); and the settings, split into each child's own
 * (inline, one tap each) and the device's (folded until needed).
 */
export function ParentAreaC() {
  const profiles = useApp((s) => s.data.profiles);
  const lockParent = useApp((s) => s.lockParent);
  const unlockParent = useApp((s) => s.unlockParent);
  const addProfile = useApp((s) => s.addProfile);
  const updateProfile = useApp((s) => s.updateProfile);
  const removeProfile = useApp((s) => s.removeProfile);
  const selectProfile = useApp((s) => s.selectProfile);

  // Asked for by the entry screen, once: a section, and the new-child form.
  const [asked] = useState(() => ({ tab: takeParentTab(), newChild: takeNewChild() }));
  const [tab, setTab] = useState<CTab>(() =>
    asked.tab === 'settings' ? 'settings' : asked.tab === 'progress' ? 'progress' : 'today',
  );
  const [open, setOpen] = useState<Partial<Record<DeviceItem, boolean>>>(() =>
    asked.tab === 'settings' ? { sync: true } : {},
  );
  const [editing, setEditing] = useState<Profile | 'new' | null>(asked.newChild ? 'new' : null);
  const [added, setAdded] = useState<Profile | null>(null);
  const full = profiles.length >= MAX_PROFILES;

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

  const show = (next: CTab) => {
    if (next === tab) return;
    setTab(next);
    window.scrollTo(0, 0);
  };

  const toDevice = (item: DeviceItem) => {
    setOpen((o) => ({ ...o, [item]: true }));
    show('settings');
  };

  return (
    <main className="screen parent c-parent" data-screen="parents">
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
        <CTabs tab={tab} onChange={show} />
      </header>

      <CPanel tab="today" current={tab}>
        <TodayPanel onAdd={() => setEditing('new')} onRestore={() => toDevice('sync')} />
      </CPanel>
      <CPanel tab="progress" current={tab}>
        <ProgressPanel />
      </CPanel>
      <CPanel tab="settings" current={tab}>
        <h2 className="visually-hidden">{t('parentArea.settings.title')}</h2>
        <section className="c-group" aria-labelledby="c-kids-title">
          <h3 id="c-kids-title" className="c-group__title">
            {t('c.settings.children')}
          </h3>
          {profiles.map((p, i) => (
            <ChildSettings key={p.id} profile={p} index={i} onEdit={() => setEditing(p)} />
          ))}
          <button type="button" className="c-add" disabled={full} onClick={() => setEditing('new')}>
            <Icon name="plus" />
            {t('parent.addChild')}
          </button>
          {full ? (
            <p className="muted">{t('parent.limitReached', { params: { max: MAX_PROFILES } })}</p>
          ) : null}
        </section>

        <section className="c-group" aria-labelledby="c-device-title">
          <h3 id="c-device-title" className="c-group__title">
            {t('c.settings.device')}
          </h3>
          <p className="muted c-group__hint">{t('c.settings.deviceHint')}</p>
          <DeviceList
            open={open}
            onToggle={(item, value) => setOpen((o) => ({ ...o, [item]: value }))}
            onBackupFile={() => {
              setOpen((o) => ({ ...o, backup: true }));
              show('settings');
            }}
          />
        </section>

        <MoreCard />
      </CPanel>

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
          canAddAnother={profiles.length < MAX_PROFILES}
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
    </main>
  );
}

/* ---------- "Would you want an extended version?" ---------- */

/** One anonymous tap, counted on the server; nothing is sold or promised. */
function MoreCard() {
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'failed'>(() =>
    interestSent() ? 'sent' : 'idle',
  );
  return (
    <section className="c-group c-more" aria-labelledby="c-more-title">
      <h3 id="c-more-title" className="c-group__title">
        {t('more.title')}
      </h3>
      <p className="muted c-group__hint">{t('more.body')}</p>
      {state === 'sent' ? (
        <p className="notice notice--ok" role="status">
          {t('more.thanks')}
        </p>
      ) : (
        <button
          type="button"
          className="btn btn--secondary"
          disabled={state === 'busy'}
          onClick={() => {
            setState('busy');
            void sendInterest().then((ok) => setState(ok ? 'sent' : 'failed'));
          }}
        >
          {t('more.want')}
        </button>
      )}
      {state === 'failed' ? (
        <p className="notice" role="alert">
          {t('more.failed')}
        </p>
      ) : null}
    </section>
  );
}

/* ---------- Tabs ---------- */

const tabId = (tab: CTab) => `c-tab-${tab}`;
const panelId = (tab: CTab) => `c-panel-${tab}`;

/** WAI-ARIA tabs: arrow keys move between them (right is "previous" in RTL), Home/End jump. */
function CTabs({ tab, onChange }: { tab: CTab; onChange: (tab: CTab) => void }) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.indexOf(tab);
    const n = TABS.length;
    const next =
      e.key === 'ArrowLeft'
        ? TABS[(i + 1) % n]
        : e.key === 'ArrowRight'
          ? TABS[(i - 1 + n) % n]
          : e.key === 'Home'
            ? TABS[0]
            : e.key === 'End'
              ? TABS[n - 1]
              : undefined;
    if (!next) return;
    e.preventDefault();
    onChange(next);
    document.getElementById(tabId(next))?.focus();
  };
  return (
    <div
      className="parent-tabs c-tabs"
      role="tablist"
      aria-label={t('c.tabs')}
      onKeyDown={onKeyDown}
    >
      {TABS.map((name) => (
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

function CPanel({ tab, current, children }: { tab: CTab; current: CTab; children: ReactNode }) {
  return (
    <section
      className="parent__panel c-panel"
      role="tabpanel"
      id={panelId(tab)}
      aria-labelledby={tabId(tab)}
      hidden={tab !== current}
    >
      {children}
    </section>
  );
}

/* ---------- What happened today? ---------- */

function TodayPanel({ onAdd, onRestore }: { onAdd: () => void; onRestore: () => void }) {
  const profiles = useApp((s) => s.data.profiles);
  const now = Date.now();
  return (
    <>
      <h2 className="c-heading">
        {t('c.tab.today')}
        <span className="c-heading__date">{todayFormat.format(now)}</span>
      </h2>
      {profiles.length === 0 ? (
        <div className="c-empty">
          <Plusi size={80} mood="happy" decorative />
          <h3>{t('c.today.empty.title')}</h3>
          <p className="muted">{t('c.today.empty.body')}</p>
          <button type="button" className="btn" onClick={onAdd}>
            <Icon name="plus" />
            {t('parent.addChild')}
          </button>
          <p className="c-empty__more">
            <span className="muted">{t('parentArea.empty.haveData')}</span>
            <button type="button" className="btn btn--ghost btn--small" onClick={onRestore}>
              <Icon name="sync" />
              {t('parentArea.empty.toSettings')}
            </button>
          </p>
        </div>
      ) : (
        <>
          <PinBanner />
          <ul className="c-list" role="list">
            {profiles.map((p, i) => (
              <li key={p.id}>
                <TodayCard profile={p} index={i} now={now} />
              </li>
            ))}
          </ul>
          {/* Another child, right here too (also under "הגדרות"). */}
          {profiles.length < MAX_PROFILES ? (
            <button type="button" className="c-add" onClick={onAdd}>
              <Icon name="plus" />
              {t('parent.addChild')}
            </button>
          ) : null}
        </>
      )}
    </>
  );
}

function TodayCard({ profile, index, now }: { profile: Profile; index: number; now: number }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const tc = makeT(profile.gender);
  const today = todayOf(progress, now);
  const summary = summarizeProgress(progress);
  const goal = profile.settings.dailyGoal;
  const tip = guidance(profile, progress, now);
  const streak = progress ? currentStreak(progress.streak, now) : 0;

  // "1 מתוך 2" on the way; once the goal is met, the rounds alone (never "5 מתוך 1").
  const roundsText =
    goal && today.rounds < goal
      ? t('c.today.rounds', { params: { done: today.rounds, goal } })
      : String(today.rounds);

  return (
    <article className="c-card" aria-label={profile.name}>
      <header className="c-card__head">
        <span className={`c-card__avatar profile-card--c${index % 6}`}>
          <Avatar id={profile.avatar} size="sm" decorative />
        </span>
        <span className="c-card__who">
          <span className="c-card__name">{profile.name}</span>
          <span className="muted">
            {summary.attempts === 0
              ? tc('c.today.never')
              : today.practised
                ? streak > 1
                  ? t('c.today.streak', { params: { count: streak } })
                  : gradeLabel(profile.grade)
                : summary.lastPracticedAt !== null && isYesterday(summary.lastPracticedAt, now)
                  ? tc('c.today.lastYesterday')
                  : summary.lastPracticedAt !== null
                    ? t('c.today.lastOn', { params: { date: formatDate(summary.lastPracticedAt) } })
                    : gradeLabel(profile.grade)}
          </span>
        </span>
        <span className={today.practised ? 'c-status c-status--on' : 'c-status'}>
          {today.practised ? tc('c.today.practised') : t('c.today.notYet')}
        </span>
      </header>

      {today.practised ? (
        <dl className="c-nums">
          <div className={goal && today.rounds >= goal ? 'c-num c-num--met' : 'c-num'}>
            <dt>{t('c.today.roundsLabel')}</dt>
            <dd>
              {roundsText}
              {goal && today.rounds >= goal ? (
                <span className="c-num__met">{t('c.today.goalMet')}</span>
              ) : null}
            </dd>
          </div>
          <div className="c-num">
            <dt>{t('c.today.exercises')}</dt>
            <dd>{today.exercises}</dd>
          </div>
          <div className="c-num">
            <dt>{t('c.today.firstTry')}</dt>
            <dd>
              {today.correct}
              {today.exercises > 0 ? (
                <span className="c-num__of">
                  {' '}
                  ({formatPercent(today.correct / today.exercises)})
                </span>
              ) : null}
            </dd>
          </div>
        </dl>
      ) : null}
      {today.daily ? <p className="muted c-card__note">{t('c.today.daily')}</p> : null}

      {tip ? (
        <p className="c-tip">
          <span className="c-tip__label">{t('c.today.tipLabel')}</span>
          {tip}
        </p>
      ) : null}
    </article>
  );
}

/* ---------- How are they doing? ---------- */

function ProgressPanel() {
  const profiles = useApp((s) => s.data.profiles);
  return (
    <>
      <h2 className="c-heading">{t('c.tab.progress')}</h2>
      {profiles.length === 0 ? (
        <p className="c-empty muted">{t('c.progress.empty')}</p>
      ) : (
        <>
          {/* The family at a glance (with more than one child): who practised, who has not for a while, who has not started. */}
          {profiles.length > 1 ? <FamilyStrip profiles={profiles} /> : null}
          <ul className="c-list" role="list">
            {profiles.map((p, i) => (
              <li key={p.id} id={`progress-${p.id}`}>
                <ProgressCardC profile={p} index={i} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/** Days since she last practised (0 = today), or null when she never has. */
function daysSince(progress: ProfileProgress | undefined, now: number): number | null {
  const last = summarizeProgress(progress).lastPracticedAt;
  if (last === null) return null;
  const day = (x: number) => {
    const d = new Date(x);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
  };
  return Math.max(0, Math.round(day(now) - day(last)));
}

/** One line per child: practised today, how long since, or not started; a tap goes to her card. */
function FamilyStrip({ profiles }: { profiles: readonly Profile[] }) {
  const progress = useApp((s) => s.data.progress);
  const now = Date.now();
  return (
    <ul className="c-family" role="list" aria-label={t('c.family.title')}>
      {profiles.map((p, i) => {
        const tc = makeT(p.gender);
        const since = daysSince(progress[p.id], now);
        const state =
          since === null ? 'new' : since === 0 ? 'today' : since <= 2 ? 'recent' : 'quiet';
        const line =
          since === null
            ? tc('c.family.new')
            : since === 0
              ? tc('c.family.today')
              : since === 1
                ? tc('c.family.yesterday')
                : tc('c.family.days', { n: since });
        return (
          <li key={p.id}>
            <a
              className={`c-family__row c-family__row--${state}`}
              href={`#progress-${p.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(`progress-${p.id}`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <span className={`c-card__avatar profile-card--c${i % 6}`}>
                <Avatar id={p.avatar} size="sm" decorative />
              </span>
              <span className="c-family__name">{p.name}</span>
              <span className="c-family__state">{line}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

const WEEKDAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

/**
 * The week at a glance: three numbers, the exercises of each day, and under each
 * day a dot that fills when the daily goal was met. The review from every world,
 * when there was one, in a small line under it.
 */
function WeekReportC({ profile }: { profile: Profile }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const week = weekSummary(progress, Date.now());
  const tc = makeT(profile.gender);
  const goal = profile.settings.dailyGoal;
  const most = Math.max(1, ...week.days.map((d) => d.exercises));
  const met = goal ? goalDays(week, goal) : 0;
  const lastAt = summarizeProgress(progress).lastPracticedAt;
  return (
    <section className="c-week" aria-label={t('c.week.title')}>
      <h3 className="c-week__title">{t('c.week.title')}</h3>
      {week.exercises === 0 ? (
        <p className="muted">
          {tc('parent.week.none')}
          {lastAt !== null
            ? ` ${t('c.today.lastOn', { params: { date: formatDate(lastAt) } })}`
            : ''}
        </p>
      ) : (
        <dl className="c-nums">
          <div className="c-num">
            <dt>{t('c.week.days')}</dt>
            <dd>
              {week.daysPracticed}
              <span className="c-num__of">/7</span>
            </dd>
          </div>
          <div className="c-num">
            <dt>{t('c.today.exercises')}</dt>
            <dd>{week.exercises}</dd>
          </div>
          <div className="c-num">
            <dt>{t('c.today.firstTry')}</dt>
            <dd>{week.rate !== null ? formatPercent(week.rate) : '–'}</dd>
          </div>
        </dl>
      )}
      {week.exercises === 0 ? null : (
        <div className="week c-week__chart" role="img" aria-label={t('parent.week.chart')}>
          {week.days.map((d) => (
            <div key={d.key} className="week__day">
              <span className="week__count">{d.exercises > 0 ? d.exercises : ''}</span>
              {/* The bars share one track, so their heights are true to the numbers. */}
              <span className="week__track">
                <span
                  className={d.exercises > 0 ? 'week__bar week__bar--on' : 'week__bar'}
                  style={{ height: `${Math.round((d.exercises / most) * 100)}%` }}
                />
              </span>
              <span className="week__label">{WEEKDAY_LETTERS[d.weekday]}</span>
              {goal ? (
                <span
                  className={d.rounds >= goal ? 'c-week__dot c-week__dot--on' : 'c-week__dot'}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
      {goal && week.exercises > 0 ? (
        <p className="c-week__goal">
          <span className="c-week__dot c-week__dot--on" aria-hidden="true" />
          {t(goal === 1 ? 'c.week.goalOne' : 'c.week.goal', { params: { goal, days: met } })}
        </p>
      ) : null}
      {week.dailyReviews > 0 ? (
        <p className="muted c-week__extra">
          {week.dailyReviews === 1
            ? t('parent.week.dailyOne')
            : t('parent.week.daily', { params: { count: week.dailyReviews } })}
        </p>
      ) : null}
    </section>
  );
}

function ProgressCardC({ profile, index }: { profile: Profile; index: number }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const summary = summarizeProgress(progress);
  const world = activeWorld(profile.grade, progress);
  const tc = makeT(profile.gender);
  const share = world ? Math.round((world.done / world.total) * 100) : 0;
  const now = Date.now();
  const since = daysSince(progress, now);
  // What to do, in one sentence: back to the habit after a quiet spell, else the guidance.
  const tip =
    since !== null && since >= 3 ? tc('c.progress.comeBack') : guidance(profile, progress, now);

  return (
    <article className="c-card" aria-label={profile.name}>
      <header className="c-card__head">
        <span className={`c-card__avatar profile-card--c${index % 6}`}>
          <Avatar id={profile.avatar} size="sm" decorative />
        </span>
        <span className="c-card__who">
          <span className="c-card__name">{profile.name}</span>
          <span className="muted">{gradeLabel(profile.grade)}</span>
        </span>
      </header>

      {world ? (
        <div className="c-where">
          <span className="c-where__world">{worldName(world)}</span>
          <span className="muted">
            {world.completed ? tc('parentArea.allWorldsDone') : nowAt(world)}
          </span>
          <span className="meter" aria-hidden="true">
            <span style={{ width: `${share}%` }} />
          </span>
        </div>
      ) : null}

      {summary.attempts === 0 ? (
        <>
          <p className="muted">{tc('parent.noPracticeYet')}</p>
          <p className="c-tip">
            <span className="c-tip__label">{t('c.today.tipLabel')}</span>
            {tc('c.progress.firstStep')}
          </p>
        </>
      ) : (
        <>
          {tip ? (
            <p className="c-tip">
              <span className="c-tip__label">{t('c.today.tipLabel')}</span>
              {tip}
            </p>
          ) : null}
          <WeekReportC profile={profile} />
          {summary.strong.length > 0 || summary.struggling.length > 0 ? (
            <ul className="c-facts" role="list">
              {summary.strong.length > 0 ? (
                <li className="c-fact c-fact--strong">
                  <strong>{t('c.progress.strong')}</strong>{' '}
                  {summary.strong.map(topicLabel).join(', ')}
                </li>
              ) : null}
              {summary.struggling.length > 0 ? (
                <li className="c-fact c-fact--work">
                  <strong>{t('c.progress.work')}</strong>{' '}
                  {summary.struggling.map(topicLabel).join(', ')}
                </li>
              ) : null}
            </ul>
          ) : null}
          <div className="c-folds">
            <JourneyReport profile={profile} />
            {summary.topMistakes.length > 0 ? (
              <details className="report more">
                <summary>{t('c.progress.mistakes')}</summary>
                <ul className="c-mistakes" role="list">
                  {summary.topMistakes.map((m) => (
                    <li key={m.kind}>
                      <span>{mistakeLabel(m.kind)}</span>
                      <span className="muted">
                        {t('c.progress.mistakeCount', { params: { count: m.count } })}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
          {/* Since the start, small, at the foot of the card. */}
          <p className="muted c-total">
            {summary.successRate !== null && summary.attempts >= 20
              ? t('c.progress.totalRate', {
                  params: { count: summary.attempts, percent: formatPercent(summary.successRate) },
                })
              : t('c.progress.total', { params: { count: summary.attempts } })}
          </p>
        </>
      )}
    </article>
  );
}

/* ---------- Settings: each child ---------- */

function Segmented<V extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
  saved = false,
}: {
  label: string;
  value: V;
  options: readonly { value: V; label: string }[];
  onChange: (value: V) => void;
  hint?: string | undefined;
  /** Just changed and saved: a green check and "נשמר" beside the label for a moment. */
  saved?: boolean;
}) {
  const id = useId();
  return (
    <div className="c-setting">
      <span className="c-setting__head">
        <span className="c-setting__label" id={id}>
          {label}
        </span>
        {saved ? (
          <span className="c-setting__saved" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.2 4.2L19 7" />
            </svg>
            {t('c.settings.saved')}
          </span>
        ) : null}
      </span>
      <div className="c-seg" role="group" aria-labelledby={id}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            className="c-seg__item"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint ? <span className="muted c-setting__hint">{hint}</span> : null}
    </div>
  );
}

function ChildSettings({
  profile,
  index,
  onEdit,
}: {
  profile: Profile;
  index: number;
  onEdit: () => void;
}) {
  const updateProfile = useApp((s) => s.updateProfile);
  const [saved, setSaved] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const s = profile.settings;
  const roundLength = s.roundLength ?? 'normal';
  const goal = s.dailyGoal ?? 0;
  const sounds = s.sounds ?? true;

  const change = (field: string, next: Partial<ProfileSettings> & { goal?: number }) => {
    const merged = {
      allowLevelChange: next.allowLevelChange ?? s.allowLevelChange,
      sounds: next.sounds ?? sounds,
      roundLength: next.roundLength ?? roundLength,
      goal: next.goal ?? goal,
    };
    const settings: ProfileSettings = {
      allowLevelChange: merged.allowLevelChange,
      ...(merged.sounds ? {} : { sounds: false }),
      ...(merged.roundLength === 'normal' ? {} : { roundLength: merged.roundLength }),
      ...(merged.goal === 1 || merged.goal === 2 || merged.goal === 3
        ? { dailyGoal: merged.goal }
        : {}),
    };
    updateProfile(profile.id, {
      name: profile.name,
      avatar: profile.avatar,
      grade: profile.grade,
      gender: profile.gender,
      settings,
    });
    setSaved(field);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaved(null), 2500);
  };

  const counts = ROUND_LENGTHS[ageBandForGrade(profile.grade)];

  return (
    <article className="c-card c-kidset" aria-label={profile.name}>
      <header className="c-card__head">
        <span className={`c-card__avatar profile-card--c${index % 6}`}>
          <Avatar id={profile.avatar} size="sm" decorative />
        </span>
        <span className="c-card__who">
          <span className="c-card__name">{profile.name}</span>
          <span className="muted">{gradeLabel(profile.grade)}</span>
        </span>
        <span className="c-card__actions">
          <button type="button" className="btn btn--secondary btn--small" onClick={onEdit}>
            {t('parent.edit')}
            <span className="visually-hidden"> {profile.name}</span>
          </button>
        </span>
      </header>

      <div className="c-settings">
        <Segmented
          label={t('profile.roundLength')}
          value={roundLength}
          options={ROUND_LENGTH_OPTIONS.map((o) => ({
            value: o,
            label: t(`profile.roundLength.${o}`),
          }))}
          onChange={(v) => change('roundLength', { roundLength: v })}
          saved={saved === 'roundLength'}
          hint={t('c.settings.roundCount', { params: { count: counts[roundLength] } })}
        />
        <Segmented
          label={t('profile.dailyGoal')}
          value={goal}
          options={[
            { value: 0, label: t('c.settings.goalOff') },
            ...DAILY_GOAL_OPTIONS.map((g) => ({ value: g, label: String(g) })),
          ]}
          onChange={(v) => change('goal', { goal: v })}
          saved={saved === 'goal'}
          hint={goal ? t('c.settings.goalUnit') : undefined}
        />
        <Segmented
          label={t('c.settings.sounds')}
          value={sounds ? 'on' : 'off'}
          options={[
            { value: 'on', label: t('c.settings.soundsOn') },
            { value: 'off', label: t('c.settings.soundsOff') },
          ]}
          onChange={(v) => change('sounds', { sounds: v === 'on' })}
          saved={saved === 'sounds'}
        />
        <Segmented
          label={t('c.settings.level')}
          value={s.allowLevelChange ? 'yes' : 'no'}
          options={[
            { value: 'yes', label: t('c.settings.levelYes') },
            { value: 'no', label: t('c.settings.levelNo') },
          ]}
          onChange={(v) => change('level', { allowLevelChange: v === 'yes' })}
          saved={saved === 'level'}
        />
      </div>
      {/* For a screen reader: the check beside the setting is only seen. */}
      <p className="visually-hidden" role="status">
        {saved !== null ? t('c.settings.saved') : ''}
      </p>
    </article>
  );
}

/* ---------- Settings: the device ---------- */

function DeviceList({
  open,
  onToggle,
  onBackupFile,
}: {
  open: Partial<Record<DeviceItem, boolean>>;
  onToggle: (item: DeviceItem, open: boolean) => void;
  onBackupFile: () => void;
}) {
  const linked = useSync((s) => s.linked);
  const hasPin = useApp((s) => s.data.parent.pin !== null);
  const lastBackupAt = useApp((s) => s.data.meta.lastBackupAt);
  const hasChildren = useApp((s) => s.data.profiles.length > 0);
  const storageIssue = useApp((s) => s.storageIssue);
  const stale = lastBackupAt !== null && Date.now() - lastBackupAt > BACKUP_STALE_MS;

  const row = (
    item: DeviceItem,
    icon: IconName,
    title: string,
    status: string,
    body: ReactNode,
    warn = false,
  ) => (
    <details
      className="c-row"
      open={open[item] === true}
      onToggle={(e) => {
        const now = e.currentTarget.open;
        if (now !== (open[item] === true)) onToggle(item, now);
      }}
    >
      <summary className="c-row__summary">
        <span className="c-row__icon">
          <Icon name={icon} />
        </span>
        <span className="c-row__title">{title}</span>
        <span className={warn ? 'c-row__status c-row__status--warn' : 'c-row__status'}>
          {status}
        </span>
        <span className="c-row__chev" aria-hidden="true" />
      </summary>
      <div className="c-row__body">{body}</div>
    </details>
  );

  return (
    <div className="c-rows">
      {row(
        'sync',
        'sync',
        t('c.device.sync'),
        linked ? t('c.device.syncOn') : t('c.device.syncOff'),
        <SyncSection />,
      )}
      {row(
        'backup',
        'backup',
        t('c.device.backup'),
        stale
          ? t('c.device.backupStale')
          : lastBackupAt === null
            ? t('c.device.backupNever')
            : t('c.device.backupLast', { params: { date: formatDate(lastBackupAt) } }),
        <BackupSection onShow={onBackupFile} />,
        stale,
      )}
      {row(
        'pin',
        'lock',
        t('c.device.pin'),
        hasPin ? t('c.device.pinOn') : t('c.device.pinOff'),
        <SecuritySection />,
      )}
      {hasChildren
        ? row(
            'offline',
            'headphones',
            t('c.device.offline'),
            t('c.device.offlineHint'),
            <OfflineSection />,
          )
        : null}
      {row(
        'install',
        'device',
        t('c.device.install'),
        storageIssue !== null
          ? t('c.device.storageIssue')
          : isStandalone()
            ? t('c.device.installOn')
            : t('c.device.installOff'),
        <DeviceSection />,
        storageIssue !== null,
      )}
      <a
        className="c-row c-row__summary c-row--link"
        href="/info"
        onClick={(e) => {
          e.preventDefault();
          navigate({ name: 'info' });
        }}
      >
        <span className="c-row__icon">
          <Icon name="info" />
        </span>
        <span className="c-row__title">{t('c.device.info')}</span>
        <span className="c-row__chev c-row__chev--go" aria-hidden="true" />
      </a>
    </div>
  );
}
