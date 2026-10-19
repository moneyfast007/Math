import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { replayTopic } from '@/app/replay';
import { t } from '@/i18n';
import { emptyProgress, emptyTopicStats, type Profile, type ProfileProgress } from '@/state/schema';
import { appStore } from '@/state/store';
import { makeData, makeProfile } from '@/state/testData';
import { layoutStations, pathThrough } from './journeyLayout';
import { JourneyScreen } from './JourneyScreen';
import { WorldsScreen } from './WorldsScreen';
import { Plusi } from '@/ui/Plusi';
import { Sticker } from '@/ui/Sticker';
import { stickerForWorld } from '@/ui/stickers';

describe('journey map layout', () => {
  it('snakes bottom-up, right-to-left first, inside a 100-wide map', () => {
    const { points, height } = layoutStations(11, 3);
    expect(points).toHaveLength(11);
    for (const p of points) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(100);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(height);
    }
    // First station at the bottom right; the row above runs the other way.
    expect(points[0]?.x).toBeGreaterThan(points[1]?.x ?? 0);
    expect(points[0]?.y).toBeGreaterThan(points[3]?.y ?? 0);
    expect(points[3]?.x).toBeLessThan(points[4]?.x ?? 0);
  });

  it('draws one path segment per hop', () => {
    const d = pathThrough([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ]);
    expect(d).toBe('M1 2 L3 4');
    expect(pathThrough([])).toBe('');
  });
});

describe('<Plusi>', () => {
  it('names its mood for assistive tech unless decorative', () => {
    render(<Plusi mood="cheering" />);
    expect(screen.getByRole('img', { name: 'פלוסי חוגג' })).toBeInTheDocument();
  });

  it('never shows a sad face: every mood is one of four', () => {
    const { container } = render(
      <>
        <Plusi mood="happy" decorative />
        <Plusi mood="thinking" decorative />
        <Plusi mood="calm" decorative />
      </>,
    );
    expect(container.querySelectorAll('svg[data-mood]')).toHaveLength(3);
  });
});

describe('stickers', () => {
  it('are fixed per world and cycle past the drawings', () => {
    expect(stickerForWorld(1)).toBe('balloon');
    expect(stickerForWorld(2)).toBe('boat');
    expect(stickerForWorld(7)).toBe('balloon');
    render(<Sticker id="boat" />);
    expect(screen.getByRole('img', { name: 'סירה' })).toBeInTheDocument();
  });
});

/** Puts one child on the device and makes her the one playing. */
function playAs(profile: Profile, progress: ProfileProgress = emptyProgress()) {
  act(() => {
    appStore.setState({
      status: 'ready',
      data: makeData({ profiles: [profile], progress: { [profile.id]: progress } }),
      activeProfileId: profile.id,
    });
  });
}

const profileNow = () => appStore.getState().data.profiles[0];

/** Grade 1 with world 1 (add-sub-20) finished. */
function firstWorldDone(): ProfileProgress {
  const p = emptyProgress();
  p.topics['add-sub-20'] = { ...emptyTopicStats(10), completedLevels: [10], reviewPassed: true };
  return p;
}

describe('<JourneyScreen> first-time explainer and the way to all worlds', () => {
  beforeEach(() => window.history.replaceState(null, '', '/play'));

  it('explains the journey once per child, without blocking the start button', () => {
    playAs(makeProfile({ grade: 2, gender: 'f' }));
    const { unmount } = render(<JourneyScreen />);
    const card = screen.getByRole('region', { name: 'ברוכה הבאה למסע!' });
    expect(within(card).getAllByRole('listitem')).toHaveLength(3);
    expect(within(card).getByText(/הכוכב: סיום העולם/)).toBeInTheDocument();
    expect(within(card).getByText(/"כל העולמות"/)).toBeInTheDocument();
    // Not a dialog: the big button is right there.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'יאללה, מתחילים!' })).toBeEnabled();
    // Remembered as soon as it was shown.
    expect(profileNow()?.journeyIntroSeenAt).toEqual(expect.any(Number));

    fireEvent.click(within(card).getByRole('button', { name: 'הבנתי!' }));
    expect(screen.queryByRole('region', { name: 'ברוכה הבאה למסע!' })).toBeNull();
    unmount();

    // The next visit goes straight to the journey.
    render(<JourneyScreen />);
    expect(screen.queryByRole('region', { name: 'ברוכה הבאה למסע!' })).toBeNull();
  });

  it('addresses a boy as a boy', () => {
    playAs(makeProfile({ grade: 3, gender: 'm' }));
    render(<JourneyScreen />);
    expect(screen.getByRole('region', { name: 'ברוך הבא למסע!' })).toBeInTheDocument();
  });

  it('a labelled "כל העולמות" button opens the map of worlds, in every age band', () => {
    for (const grade of [0, 2, 5] as const) {
      playAs(makeProfile({ grade, journeyIntroSeenAt: 1 }));
      const { unmount } = render(<JourneyScreen />);
      fireEvent.click(screen.getByRole('button', { name: 'כל העולמות' }));
      expect(window.location.pathname).toBe('/worlds');
      unmount();
      window.history.replaceState(null, '', '/play');
    }
  });
});

describe('<WorldsScreen>', () => {
  it('lists the worlds in order: done (play again), current, and locked with the reason', () => {
    playAs(makeProfile({ grade: 1, journeyIntroSeenAt: 1 }), firstWorldDone());
    render(<WorldsScreen />);
    const list = screen.getByRole('list', { name: 'העולמות לפי הסדר' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => within(r).getByRole('heading').textContent)).toEqual([
      `עולם 1 · ${t('topic.addSub20')}`,
      `עולם 2 · ${t('topic.numbers100')}`,
      expect.stringMatching(/^עולם 3 · /),
      expect.stringMatching(/^עולם 4 · /),
    ]);
    const [done, current, third, fourth] = rows as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];

    expect(within(done).getByText('הושלם')).toBeInTheDocument();
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(within(current).getByText('כאן עכשיו')).toBeInTheDocument();
    expect(within(current).getByText(/^\d+ מתוך \d+ תחנות$/)).toBeInTheDocument();
    expect(
      within(third).getByText(`נפתח אחרי שמסיימים את "${t('topic.numbers100')}"`),
    ).toBeInTheDocument();
    expect(within(fourth).getByText(/^נפתח אחרי שמסיימים את "/)).toBeInTheDocument();
    // Nothing to press in a locked world: the order of the worlds stays.
    expect(within(third).queryByRole('button')).toBeNull();
    expect(within(fourth).queryByRole('button')).toBeNull();

    fireEvent.click(
      within(done).getByRole('button', { name: `לתרגל שוב: ${t('topic.addSub20')}` }),
    );
    expect(replayTopic()).toBe('add-sub-20');
    expect(window.location.pathname).toBe('/practice/again');
  });

  it('the current world leads back to the journey', () => {
    playAs(makeProfile({ grade: 1, journeyIntroSeenAt: 1 }));
    render(<WorldsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'להמשיך במסע' }));
    expect(window.location.pathname).toBe('/play');
  });

  it('"איך זה עובד?" opens the explainer again', () => {
    playAs(makeProfile({ grade: 0, journeyIntroSeenAt: 1 }));
    render(<WorldsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'איך זה עובד?' }));
    const dialog = screen.getByRole('dialog', { name: 'איך זה עובד?' });
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(3);
    fireEvent.click(within(dialog).getByRole('button', { name: 'הבנתי!' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
