import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { requestParentTab } from '@/parent/tab';
import { emptyProgress, emptyTopicStats, type Profile, type ProfileProgress } from '@/state/schema';
import { appStore } from '@/state/store';
import { makeData, makeProfile } from '@/state/testData';
import { ParentScreen } from './ParentScreen';

/** Noa (grade 2) practiced a little and finds it hard; Itai has not started. */
function noaProgress(): ProfileProgress {
  const p = emptyProgress();
  p.topics['add-sub-100'] = {
    ...emptyTopicStats(3),
    attempts: 10,
    correct: 8,
    lastPracticedAt: 1_760_000_000_000,
    recent: [false, false, true, false, false, true],
    mistakes: { wrongOperation: 2 },
    completedLevels: [1, 2],
  };
  return p;
}

function openParentArea(profiles: Profile[], progress: Record<string, ProfileProgress> = {}) {
  act(() => {
    appStore.setState({
      status: 'ready',
      data: makeData({ profiles, progress }),
      parentUnlockedAt: Date.now(),
    });
  });
  return render(<ParentScreen />);
}

const family = () =>
  openParentArea(
    [
      makeProfile({ id: 'a', name: 'נועה', grade: 2, gender: 'f' }),
      makeProfile({ id: 'b', name: 'איתי', grade: 4, gender: 'm', avatar: 'lion' }),
    ],
    { a: noaProgress() },
  );

describe('<ParentScreen> sections', () => {
  beforeEach(() => window.history.replaceState(null, '', '/parents'));

  it('opens on the children: a card each, with the world, the station and what to strengthen', () => {
    family();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'ילדים' })).toHaveAttribute('aria-selected', 'true');
    const noa = screen.getByRole('article', { name: 'נועה' });
    expect(noa).toHaveTextContent('כיתה ב׳');
    expect(noa).toHaveTextContent(/עולם 1 · /);
    expect(noa).toHaveTextContent(/עכשיו: תחנה 3 · /);
    expect(noa).toHaveTextContent(/נושאים לחיזוק:/);
    expect(within(noa).getByRole('button', { name: /עריכה/ })).toBeInTheDocument();
    const itai = screen.getByRole('article', { name: 'איתי' });
    expect(itai).toHaveTextContent('עדיין לא תרגל.');
    expect(screen.getByRole('button', { name: /הוספת ילד או ילדה/ })).toBeEnabled();
    // The other sections are there, but hidden.
    expect(screen.queryByRole('button', { name: 'שמירת גיבוי' })).toBeNull();
  });

  it('shows the progress per child in its own section, keeping every detail', () => {
    family();
    fireEvent.click(screen.getByRole('tab', { name: 'התקדמות' }));
    expect(screen.getByRole('tab', { name: 'התקדמות' })).toHaveAttribute('aria-selected', 'true');
    const noa = screen.getByRole('article', { name: 'נועה' });
    expect(noa).toHaveTextContent('תרגלה נושא אחד');
    expect(noa).toHaveTextContent('10 תרגילים');
    expect(noa).toHaveTextContent('8 נכון בניסיון הראשון');
    expect(noa).toHaveTextContent('2 טעויות');
    // A percentage only once there are enough exercises behind it.
    expect(noa).not.toHaveTextContent('הצלחה:');
    expect(noa).toHaveTextContent('פעולה לא נכונה');
    expect(noa).toHaveTextContent('התקדמות במסע');
    expect(screen.queryByRole('button', { name: /הוספת ילד או ילדה/ })).toBeNull();
  });

  it('moves between sections with the arrow keys (left is next in Hebrew)', () => {
    family();
    const children = screen.getByRole('tab', { name: 'ילדים' });
    fireEvent.keyDown(children, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'התקדמות' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(children, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'הגדרות' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'הגדרות' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'שמירת גיבוי' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'סנכרון בין מכשירים' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'נעילת אזור ההורים' })).toBeInTheDocument();
  });

  it('has one way out', () => {
    family();
    const exits = screen.getAllByRole('button', { name: 'סיימתי, למסך הבית' });
    expect(exits).toHaveLength(1);
    fireEvent.click(exits[0] as HTMLElement);
    expect(window.location.pathname).toBe('/');
    expect(appStore.getState().isParentUnlocked()).toBe(false);
  });

  it('on first run, invites to add a child, or to connect or restore in the settings', () => {
    openParentArea([]);
    expect(screen.getByRole('heading', { name: 'עוד אין כאן ילדים' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /לסנכרון ולשחזור/ }));
    expect(screen.getByRole('tab', { name: 'הגדרות' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'חיבור למשפחה קיימת' })).toBeInTheDocument();
  });

  it('opens on the section another screen asked for', () => {
    requestParentTab('settings');
    openParentArea([]);
    expect(screen.getByRole('tab', { name: 'הגדרות' })).toHaveAttribute('aria-selected', 'true');
  });
});
