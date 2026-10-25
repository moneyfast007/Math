import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { navigate } from '@/app/router';
import { ROUND_LENGTHS } from '@/engine/session';
import { activeWorld, nextStop, type World } from '@/engine/journey';
import { makeT, t, type TranslationKey } from '@/i18n';
import { he } from '@/i18n/he';
import { formatDate, formatPercent, gradeLabel, mistakeLabel, topicLabel } from '@/i18n/labels';
import { ProfileForm } from '@/parent/ProfileForm';
import { SyncSection } from '@/parent/SyncSection';
import { takeParentTab } from '@/parent/tab';
import { summarizeProgress } from '@/state/progress';
import {
  DAILY_GOAL_OPTIONS,
  MAX_PROFILES,
  ROUND_LENGTH_OPTIONS,
  type DailyGoal,
  type Profile,
  type ProfileSettings,
  type RoundLength,
} from '@/state/schema';
import { useApp } from '@/state/store';
import { ageBandForGrade } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { BrandMark } from '@/ui/BrandMark';
import { Icon } from '@/ui/Icon';
import { Plusi } from '@/ui/Plusi';
import {
  BackupSection,
  ChildAdded,
  DeviceSection,
  JourneyReport,
  OfflineSection,
  SecuritySection,
  WeekReport,
} from '../ParentScreen';
import { starsOf, todayOf } from './HomeB';
import './b.css';

const BACKUP_STALE_MS = 14 * 24 * 60 * 60 * 1000;
/** A mistake becomes advice once it has come back a few times. */
const TIP_MIN_MISTAKES = 3;

const todayFormat = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/**
 * Design B of the parents' area, "today first": one scrolling page instead of
 * tabs. At the top, today in one sentence; then a card per child that answers
 * "did she practise today, and how did it go?", with what to do about her most
 * common mistake and her settings right there (saved as they change). The week
 * and the journey are one tap deeper; everything about the device sits folded
 * at the bottom.
 */
export function ParentAreaB() {
  const profiles = useApp((s) => s.data.profiles);
  const progressAll = useApp((s) => s.data.progress);
  const lockParent = useApp((s) => s.lockParent);
  const unlockParent = useApp((s) => s.unlockParent);
  const addProfile = useApp((s) => s.addProfile);
  const selectProfile = useApp((s) => s.selectProfile);
  const [deviceOpen, setDeviceOpen] = useState(() => takeParentTab() === 'settings');
  const [creating, setCreating] = useState(false);
  const [added, setAdded] = useState<Profile | null>(null);
  const deviceRef = useRef<HTMLElement>(null);
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

  // Sent here to connect or restore (the welcome's second way in): the device part, in sight.
  useEffect(() => {
    if (deviceOpen) deviceRef.current?.scrollIntoView({ block: 'start' });
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exit = () => {
    lockParent();
    navigate({ name: 'home' });
  };

  const now = Date.now();
  const playedToday = profiles.filter((p) => todayOf(progressAll[p.id], now).exercises > 0);
  const only = profiles.length === 1 ? profiles[0] : undefined;
  const overview = only
    ? makeT(only.gender)(
        playedToday.length > 0 ? 'b.parent.overview.oneDone' : 'b.parent.overview.oneNot',
        { name: only.name },
      )
    : playedToday.length === 0
      ? t('b.parent.overview.none')
      : playedToday.length === profiles.length
        ? t('b.parent.overview.all')
        : t('b.parent.overview.some', {
            params: { done: playedToday.length, total: profiles.length },
          });

  return (
    <main className="screen parent parent-b" data-screen="parents">
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
      </header>

      {profiles.length === 0 ? (
        <section className="card pb-first" aria-labelledby="pb-first-title">
          <Plusi size={96} mood="happy" decorative />
          <h2 id="pb-first-title">{t('b.parent.empty.title')}</h2>
          <p>{t('b.parent.empty.body')}</p>
          <button type="button" className="btn btn--hero" onClick={() => setCreating(true)}>
            <Icon name="plus" />
            {t('b.parent.empty.cta')}
          </button>
          <p className="pb-first__more">
            <span className="muted">{t('parentArea.empty.haveData')}</span>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                setDeviceOpen(true);
                window.setTimeout(() => deviceRef.current?.scrollIntoView({ block: 'start' }), 0);
              }}
            >
              <Icon name="sync" />
              {t('parentArea.empty.toSettings')}
            </button>
          </p>
        </section>
      ) : (
        <section className="pb-hero" aria-labelledby="pb-overview">
          <p className="pb-hero__date">
            {t('b.parent.today')} · {todayFormat.format(new Date(now))}
          </p>
          <h2 id="pb-overview" className="pb-hero__title">
            {overview}
          </h2>
          {profiles.length > 1 ? (
            <nav aria-label={t('b.parent.jump')}>
              <ul className="pb-jump" role="list">
                {profiles.map((p, i) => {
                  const done = todayOf(progressAll[p.id], now).exercises > 0;
                  return (
                    <li key={p.id}>
                      <a
                        href={`#pb-child-${p.id}`}
                        className={`pb-jump__chip pb-c${i % 6}`}
                        data-done={done ? '' : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          document
                            .getElementById(`pb-child-${p.id}`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                        <span className="pb-jump__avatar">
                          <Avatar id={p.avatar} size="sm" decorative />
                        </span>
                        <span className="pb-jump__name">{p.name}</span>
                        <span className="pb-jump__mark" aria-hidden="true">
                          {done ? <Tick /> : null}
                        </span>
                        <span className="visually-hidden">
                          {done
                            ? makeT(p.gender)('b.parent.status.done')
                            : t('b.parent.status.notYet')}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}
        </section>
      )}

      {profiles.length > 0 ? (
        <div className="pb-children">
          {profiles.map((p, i) => (
            <ChildToday key={p.id} profile={p} index={i} now={now} />
          ))}
        </div>
      ) : null}

      {profiles.length > 0 ? (
        <div className="pb-add">
          <button
            type="button"
            className="child-add"
            disabled={full}
            onClick={() => setCreating(true)}
          >
            <span className="child-add__icon">
              <Icon name="plus" />
            </span>
            {t('parent.addChild')}
          </button>
          {full ? (
            <p className="muted">{t('parent.limitReached', { params: { max: MAX_PROFILES } })}</p>
          ) : null}
        </div>
      ) : null}

      <DeviceGroup
        open={deviceOpen}
        onToggle={() => setDeviceOpen((o) => !o)}
        onShow={() => setDeviceOpen(true)}
        sectionRef={deviceRef}
      />

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

      {creating ? (
        <ProfileForm
          onSave={(input) => {
            setAdded(addProfile(input));
            setCreating(false);
          }}
          onClose={() => setCreating(false)}
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
            setCreating(true);
          }}
          onClose={() => setAdded(null)}
        />
      ) : null}
    </main>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 24 24" className="pb-tick" aria-hidden="true">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

/* ---------- One child: today, what to do, her settings ---------- */

function isKey(key: string): key is TranslationKey {
  return Object.hasOwn(he, key);
}

/** Where the child is in a world: the station the big button starts, by number and name. */
function nowAt(world: World): string {
  const stop = nextStop(world);
  if (stop.kind === 'review') return t('parent.nowAtReview');
  const station = world.stations.find((s) => s.level === stop.level);
  const name = station ? t(station.labelKey as TranslationKey) : '';
  return t('parent.nowAt', { params: { n: stop.level, name } });
}

function ChildToday({ profile, index, now }: { profile: Profile; index: number; now: number }) {
  const progress = useApp((s) => s.data.progress[profile.id]);
  const [editing, setEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const updateProfile = useApp((s) => s.updateProfile);
  const removeProfile = useApp((s) => s.removeProfile);
  const reportId = useId();
  const tc = makeT(profile.gender);
  const today = todayOf(progress, now);
  const summary = summarizeProgress(progress);
  const world = activeWorld(profile.grade, progress);
  const goal = profile.settings.dailyGoal;
  const played = today.exercises > 0;
  const reached = goal !== undefined && today.rounds >= goal;
  const share = world ? Math.round((world.done / world.total) * 100) : 0;
  const stars = starsOf(progress);
  const titleId = `pb-child-${profile.id}-title`;

  const tip = adviceFor(profile, summary);

  return (
    <article
      id={`pb-child-${profile.id}`}
      className={`card pb-child pb-c${index % 6}`}
      aria-labelledby={titleId}
      data-today={reached ? 'goal' : played ? 'done' : 'not'}
    >
      <header className="pb-child__head">
        <span className="pb-child__avatar">
          <Avatar id={profile.avatar} size="md" decorative />
        </span>
        <span className="pb-child__who">
          <h2 id={titleId} className="pb-child__name">
            {profile.name}
          </h2>
          <span className="muted">{gradeLabel(profile.grade)}</span>
          {stars > 0 ? (
            <span className="muted pb-child__stars">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z" />
              </svg>
              {stars === 1 ? t('b.home.starsOne') : t('b.home.stars', { params: { count: stars } })}
            </span>
          ) : null}
        </span>
        <span className="pb-badge" data-state={reached ? 'goal' : played ? 'done' : 'not'}>
          {played ? <Tick /> : null}
          {reached
            ? t('b.parent.status.goalDone')
            : played
              ? tc('b.parent.status.done')
              : t('b.parent.status.notYet')}
        </span>
      </header>

      {played ? (
        <div className="pb-today">
          <dl className="pb-stats">
            <div className="pb-stat">
              <dt>{t('b.parent.stat.rounds')}</dt>
              <dd>
                {today.rounds}
                {goal ? <span className="pb-stat__of">/{goal}</span> : null}
              </dd>
            </div>
            <div className="pb-stat">
              <dt>{t('b.parent.stat.exercises')}</dt>
              <dd>{today.exercises}</dd>
            </div>
            <div className="pb-stat">
              <dt>{t('b.parent.stat.firstTry')}</dt>
              <dd>
                {today.correct}
                <span className="pb-stat__of">/{today.exercises}</span>
              </dd>
            </div>
          </dl>
          {goal && !reached ? (
            <p className="pb-today__note">
              {goal - today.rounds === 1
                ? t('b.parent.goalLeftOne')
                : t('b.parent.goalLeft', { params: { count: goal - today.rounds } })}
            </p>
          ) : null}
          {today.daily ? <p className="pb-today__note">{t('b.parent.stat.daily')}</p> : null}
        </div>
      ) : (
        <p className="pb-today pb-today--empty">
          {summary.lastPracticedAt === null
            ? tc('b.parent.notToday.never')
            : t('b.parent.notToday.last', {
                params: { date: formatDate(summary.lastPracticedAt) },
              })}
        </p>
      )}

      {world ? (
        <div className="pb-where">
          <span className="pb-where__label">{t('b.parent.where')}</span>
          <span className="pb-where__world">
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

      {tip ? (
        <div className="pb-tip" data-kind={tip.kind}>
          <Plusi size={44} mood="happy" decorative className="pb-tip__plusi" />
          <div className="pb-tip__text">
            <strong className="pb-tip__title">{t('b.parent.tip.title')}</strong>
            <p>{tip.text}</p>
            {tip.label ? <p className="muted pb-tip__label">{tip.label}</p> : null}
          </div>
        </div>
      ) : null}

      <ChildSettings
        profile={profile}
        onSave={(settings) =>
          updateProfile(profile.id, {
            name: profile.name,
            avatar: profile.avatar,
            grade: profile.grade,
            gender: profile.gender,
            settings,
          })
        }
        onEdit={() => setEditing(true)}
      />

      {summary.attempts > 0 ? (
        <div className="pb-report">
          <button
            type="button"
            className="pb-report__toggle"
            aria-expanded={reportOpen}
            aria-controls={reportId}
            onClick={() => setReportOpen((o) => !o)}
          >
            <Icon name="progress" />
            <span>{t('b.parent.report.open')}</span>
            <span className="pb-chevron" aria-hidden="true" />
          </button>
          <div id={reportId} className="pb-report__body" hidden={!reportOpen}>
            <p className="pb-report__all">
              <strong>{t('b.parent.report.all')}:</strong>{' '}
              {t('parent.attempts', { params: { count: summary.attempts } })}
              {' · '}
              {t('parent.firstTry', { params: { count: summary.correct } })}
              {summary.successRate !== null && summary.attempts >= 20 ? (
                <>
                  {' · '}
                  {t('parent.successRate', {
                    params: { percent: formatPercent(summary.successRate) },
                  })}
                </>
              ) : null}
            </p>
            {summary.strong.length > 0 ? (
              <p className="fact fact--strong">
                <strong>{t('parent.strong')}</strong> {summary.strong.map(topicLabel).join(', ')}
              </p>
            ) : null}
            {summary.struggling.length > 0 ? (
              <p className="fact fact--work">
                <strong>{t('parent.struggling')}</strong>{' '}
                {summary.struggling.map(topicLabel).join(', ')}
              </p>
            ) : null}
            <WeekReport profile={profile} />
            <JourneyReport profile={profile} />
          </div>
        </div>
      ) : null}

      {editing ? (
        <ProfileForm
          profile={profile}
          onSave={(input) => {
            updateProfile(profile.id, input);
            setEditing(false);
          }}
          onDelete={() => {
            removeProfile(profile.id);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </article>
  );
}

/**
 * One sentence of what a parent can do: the mistake that keeps coming back,
 * otherwise the topic that needs work, otherwise a word of encouragement.
 */
function adviceFor(
  profile: Profile,
  summary: ReturnType<typeof summarizeProgress>,
): { kind: string; text: string; label?: string } | null {
  const tc = makeT(profile.gender);
  const top = summary.topMistakes[0];
  if (top && top.count >= TIP_MIN_MISTAKES) {
    const key = `b.tip.${top.kind}`;
    if (isKey(key))
      return {
        kind: 'mistake',
        text: tc(key),
        label: `${t('parent.commonMistakes')} ${mistakeLabel(top.kind)}`,
      };
  }
  const weak = summary.struggling[0];
  if (weak)
    return {
      kind: 'topic',
      text: t('b.parent.tip.topic', { params: { topic: topicLabel(weak) } }),
    };
  if (summary.attempts >= 10) return { kind: 'good', text: tc('b.parent.tip.good') };
  return null;
}

/** The settings a parent changes most, on the child's card; each change is saved at once. */
function ChildSettings({
  profile,
  onSave,
  onEdit,
}: {
  profile: Profile;
  onSave: (settings: ProfileSettings) => void;
  onEdit: () => void;
}) {
  const s = profile.settings;
  const roundLength: RoundLength = s.roundLength ?? 'normal';
  const goal: DailyGoal | 0 = s.dailyGoal ?? 0;
  const sounds = s.sounds ?? true;
  const [saved, setSaved] = useState(0);
  const name = `pb-${profile.id}`;
  const counts = ROUND_LENGTHS[ageBandForGrade(profile.grade)];

  useEffect(() => {
    if (saved === 0) return;
    const timer = window.setTimeout(() => setSaved(0), 2400);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const save = (next: {
    allowLevelChange?: boolean;
    sounds?: boolean;
    roundLength?: RoundLength;
    dailyGoal?: DailyGoal | 0;
  }) => {
    const allow = next.allowLevelChange ?? s.allowLevelChange;
    const snd = next.sounds ?? sounds;
    const len = next.roundLength ?? roundLength;
    const g = next.dailyGoal ?? goal;
    onSave({
      allowLevelChange: allow,
      ...(snd ? {} : { sounds: false }),
      ...(len === 'normal' ? {} : { roundLength: len }),
      ...(g === 0 ? {} : { dailyGoal: g }),
      // Kept as it is (design B has no control for it).
      ...(s.effects ? { effects: s.effects } : {}),
    });
    setSaved((n) => n + 1);
  };

  return (
    <section className="pb-settings" aria-labelledby={`${name}-settings`}>
      <div className="pb-settings__head">
        <h3 id={`${name}-settings`}>
          <Icon name="settings" />
          {t('b.parent.settings.title', { params: { name: profile.name } })}
        </h3>
        <span className="pb-saved" role="status">
          {saved > 0 ? (
            <>
              <Tick />
              {t('b.parent.settings.saved')}
            </>
          ) : null}
        </span>
        <button
          type="button"
          className="btn btn--secondary btn--small pb-settings__edit"
          onClick={onEdit}
        >
          {t('b.parent.settings.edit')}
          <span className="visually-hidden"> {profile.name}</span>
        </button>
      </div>

      <div className="pb-settings__grid">
        <Segmented legend={t('profile.roundLength')}>
          {ROUND_LENGTH_OPTIONS.map((o) => (
            <label key={o} className="pb-seg__opt">
              <input
                type="radio"
                name={`${name}-len`}
                checked={roundLength === o}
                onChange={() => save({ roundLength: o })}
              />
              <span>{t(`profile.roundLength.${o}`)}</span>
              <span className="pb-seg__detail">
                {t('profile.roundLength.count', { params: { count: counts[o] } })}
              </span>
            </label>
          ))}
        </Segmented>

        <Segmented legend={t('profile.dailyGoal')}>
          {([0, ...DAILY_GOAL_OPTIONS] as const).map((g) => (
            <label key={g} className="pb-seg__opt">
              <input
                type="radio"
                name={`${name}-goal`}
                checked={goal === g}
                onChange={() => save({ dailyGoal: g })}
              />
              <span>{g === 0 ? t('profile.dailyGoal.off') : g}</span>
              <span className="pb-seg__detail">
                {g === 0
                  ? t('b.parent.goal.none')
                  : g === 1
                    ? t('b.parent.goal.round')
                    : t('b.parent.goal.rounds')}
              </span>
            </label>
          ))}
        </Segmented>
      </div>

      <div className="pb-switches">
        <label className="pb-switch">
          <input
            type="checkbox"
            role="switch"
            checked={sounds}
            onChange={(e) => save({ sounds: e.target.checked })}
          />
          <span className="pb-switch__track" aria-hidden="true" />
          <span>{t('profile.sounds')}</span>
        </label>
        <label className="pb-switch">
          <input
            type="checkbox"
            role="switch"
            checked={s.allowLevelChange}
            onChange={(e) => save({ allowLevelChange: e.target.checked })}
          />
          <span className="pb-switch__track" aria-hidden="true" />
          <span>{t('profile.allowLevelChange')}</span>
        </label>
      </div>
    </section>
  );
}

function Segmented({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="pb-seg">
      <legend>{legend}</legend>
      <div className="pb-seg__row">{children}</div>
    </fieldset>
  );
}

/* ---------- The device, folded at the bottom ---------- */

function DeviceGroup({
  open,
  onToggle,
  onShow,
  sectionRef,
}: {
  open: boolean;
  onToggle: () => void;
  onShow: () => void;
  sectionRef: RefObject<HTMLElement | null>;
}) {
  const storageIssue = useApp((s) => s.storageIssue);
  const lastBackupAt = useApp((s) => s.data.meta.lastBackupAt);
  const hasProfiles = useApp((s) => s.data.profiles.length > 0);
  const bodyId = useId();
  // Something here wants a look: storage trouble, or an old backup.
  const attention =
    storageIssue !== null ||
    (hasProfiles && lastBackupAt !== null && Date.now() - lastBackupAt > BACKUP_STALE_MS);

  return (
    <section className="pb-device" ref={sectionRef} aria-labelledby="pb-device-title">
      <h2 className="pb-device__heading" id="pb-device-title">
        <button
          type="button"
          className="pb-device__toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
        >
          <span className="settings-card__icon">
            <Icon name="device" />
          </span>
          <span className="pb-device__text">
            <span className="pb-device__title">{t('b.parent.device.title')}</span>
            <span className="muted pb-device__summary">{t('b.parent.device.summary')}</span>
          </span>
          {attention ? (
            <span className="pb-device__flag">{t('b.parent.device.attention')}</span>
          ) : null}
          <span className="pb-chevron" aria-hidden="true" />
        </button>
      </h2>
      {/* Kept mounted while folded: a download or a chosen backup file survives. */}
      <div id={bodyId} className="settings-grid pb-device__body" hidden={!open}>
        <SyncSection />
        <BackupSection onShow={onShow} />
        <SecuritySection />
        <OfflineSection />
        <DeviceSection />
      </div>
    </section>
  );
}
