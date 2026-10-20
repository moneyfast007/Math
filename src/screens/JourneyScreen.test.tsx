import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { replayTopic } from '@/app/replay';
import { activeWorld } from '@/engine/journey';
import { t } from '@/i18n';
import { emptyProgress, emptyTopicStats, type Profile, type ProfileProgress } from '@/state/schema';
import { appStore } from '@/state/store';
import { dayKey } from '@/state/streak';
import { makeData, makeProfile } from '@/state/testData';
import { fitStations, layoutStations, pathThrough } from './journeyLayout';
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

  it('spreads or closes up the rows to fill the height it is given, within limits', () => {
    const natural = layoutStations(11, 3);
    const tall = layoutStations(11, 3, 120);
    const short = layoutStations(11, 3, 80);
    expect(tall.height).toBeGreaterThan(natural.height);
    expect(tall.height).toBeLessThanOrEqual(120);
    expect(short.height).toBeLessThan(natural.height);
    expect(short.height).toBeCloseTo(80);
    // Never squeezed past the point where the stations would touch.
    expect(layoutStations(11, 3, 10).height).toBeGreaterThan(10);
  });

  it('fits a phone box: inside it, and more stations per row when the box is wide and short', () => {
    const phone = fitStations(11, { width: 328, height: 300 }, false);
    expect(phone.width).toBeLessThanOrEqual(328);
    expect((phone.width * phone.height) / 100).toBeLessThanOrEqual(300 + 0.01);
    expect(phone.points).toHaveLength(11);
    expect(phone.cell).toBeGreaterThan(60);

    const sideways = fitStations(11, { width: 460, height: 260 }, false);
    expect(sideways.perRow).toBeGreaterThan(3);
    expect((sideways.width * sideways.height) / 100).toBeLessThanOrEqual(260 + 0.01);

    // A tablet's map stops growing at its usual width.
    expect(fitStations(11, { width: 1000, height: 2000 }, true).width).toBeLessThanOrEqual(680);
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
  p.topics['add-sub-20'] = {
    ...emptyTopicStats(10),
    completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    reviewPassed: true,
  };
  return p;
}

describe('<JourneyScreen> first-time explainer and the way to all worlds', () => {
  beforeEach(() => window.history.replaceState(null, '', '/play'));

  it('explains the journey once per child, without blocking the start button', () => {
    playAs(makeProfile({ grade: 2, gender: 'f' }));
    const { unmount } = render(<JourneyScreen />);
    const card = screen.getByRole('region', { name: 'ברוכה הבאה למסע!' });
    expect(within(card).getAllByRole('listitem')).toHaveLength(3);
    expect(within(card).getByText(/הכוכב: אתגר הסיום/)).toBeInTheDocument();
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

describe('<JourneyScreen> header and world row', () => {
  beforeEach(() => window.history.replaceState(null, '', '/play'));

  it('counts the level stations only: "תחנה 1 מתוך" the world\'s real number of stations', () => {
    playAs(makeProfile({ grade: 2, journeyIntroSeenAt: 1 }));
    render(<JourneyScreen />);
    const stations = activeWorld(2, emptyProgress())?.stations.length ?? 0;
    expect(stations).toBeGreaterThan(0);
    expect(screen.getByText(`תחנה 1 מתוך ${stations}`)).toBeInTheDocument();
    // The world's name and "כל העולמות" share one row.
    const row = screen
      .getByRole('heading', { level: 2, name: /^עולם 1 · / })
      .closest<HTMLElement>('.journey__world');
    if (!row) throw new Error('the world row is missing');
    expect(within(row).getByRole('button', { name: 'כל העולמות' })).toBeInTheDocument();
  });

  it('once every station is done, names the final challenge and what it opens', () => {
    const p = emptyProgress();
    p.topics['add-sub-20'] = {
      ...emptyTopicStats(10),
      completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };
    playAs(makeProfile({ grade: 1, journeyIntroSeenAt: 1 }), p);
    render(<JourneyScreen />);
    expect(screen.getByText('נשאר אתגר אחד ועולם 2 נפתח')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'אתגר הסיום' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'יאללה, לאתגר הסיום!' })).toBeInTheDocument();
    expect(screen.getByText('מצליחים, ועולם 2 נפתח ⭐')).toBeInTheDocument();
  });

  it('shows the streak from the first day only', () => {
    playAs(makeProfile({ journeyIntroSeenAt: 1 }));
    const { unmount } = render(<JourneyScreen />);
    expect(screen.queryByRole('img', { name: /רצף/ })).toBeNull();
    unmount();

    const p = emptyProgress();
    p.streak = { count: 3, lastDay: dayKey(Date.now()) };
    playAs(makeProfile({ journeyIntroSeenAt: 1 }), p);
    render(<JourneyScreen />);
    expect(screen.getByRole('img', { name: '3 ימים ברצף' })).toBeInTheDocument();
  });

  it('labels the album and the switch with a word, keeping their names', () => {
    playAs(makeProfile({ journeyIntroSeenAt: 1 }));
    render(<JourneyScreen />);
    const album = screen.getByRole('button', { name: 'האלבום' });
    const who = screen.getByRole('button', { name: 'מי משחק?' });
    expect(album).toHaveTextContent('מדבקות');
    expect(who).toHaveTextContent('ילדים');
    fireEvent.click(album);
    expect(window.location.pathname).toBe('/album');
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

describe('<JourneyScreen> Plusi on the map', () => {
  it('is a button: a tap tickles him (he cheers for a moment) and nothing else happens', () => {
    vi.useFakeTimers();
    playAs(makeProfile({ journeyIntroSeenAt: 1 }));
    render(<JourneyScreen />);
    const plusi = screen.getByRole('button', { name: /פלוסי/ });
    expect(plusi.querySelector('.plusi--happy')).not.toBeNull();
    fireEvent.click(plusi);
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(plusi).toHaveAttribute('data-tickled');
    expect(plusi.querySelector('.plusi--cheering')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(plusi).not.toHaveAttribute('data-tickled');
    expect(window.location.pathname).toBe('/play');
    vi.useRealTimers();
  });
});
