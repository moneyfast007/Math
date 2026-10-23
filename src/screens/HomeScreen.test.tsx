import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '@/i18n';
import { takeParentTab } from '@/parent/tab';
import type { Profile } from '@/state/schema';
import { appStore } from '@/state/store';
import { makeData, makeProfile } from '@/state/testData';
import { HomeScreen } from './HomeScreen';
import { whoIsPlayingTitle } from './homeTitle';

function onDevice(profiles: Profile[]) {
  act(() => {
    appStore.setState({ status: 'ready', data: makeData({ profiles }), parentUnlockedAt: null });
  });
}

/** Pretends the system asks for reduced motion (jsdom has no matchMedia). */
function reducedMotion(on: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: on
      ? (query: string) => ({ matches: query.includes('reduce'), media: query })
      : undefined,
  });
}

describe('whoIsPlayingTitle', () => {
  it('speaks to all girls, all boys, or both alike', () => {
    expect(whoIsPlayingTitle(['f', 'f'])).toBe('מי משחקת היום?');
    expect(whoIsPlayingTitle(['m'])).toBe('מי משחק היום?');
    expect(whoIsPlayingTitle(['f', 'm'])).toBe('מי רוצה לשחק היום?');
  });
});

describe('<HomeScreen> welcome (no profiles yet)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    onDevice([]);
  });
  afterEach(() => {
    reducedMotion(false);
    vi.useRealTimers();
  });

  it('types the greeting out, then Plusi cheers', () => {
    vi.useFakeTimers();
    const { container } = render(<HomeScreen />);
    const bubble = container.querySelector('.welcome__bubble');
    const typed = () => container.querySelector('.welcome__typed')?.firstChild?.textContent;
    expect(bubble).toHaveAttribute('data-typing');
    // The whole text is there from the start (the rest hidden): nothing jumps, and a
    // screen reader reads it all at once.
    expect(container.querySelector('.welcome__greeting .visually-hidden')).toHaveTextContent(
      t('welcome.greeting'),
    );
    expect(container.querySelector('.welcome__typed')).toHaveAttribute('aria-hidden', 'true');
    // The first word is there from the first paint: the bubble is never empty.
    expect(typed()).toBe('היי,');
    expect(container.querySelector('.welcome__rest')).toHaveTextContent(
      t('welcome.greeting').slice('היי,'.length).trim(),
    );

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect((typed() ?? '').length).toBeGreaterThan('היי,'.length);
    expect(t('welcome.greeting').startsWith(typed() ?? '')).toBe(true);

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(bubble).not.toHaveAttribute('data-typing');
    expect(container.querySelector('.welcome__rest')).toBeEmptyDOMElement();
    expect(container.querySelector('svg[data-mood="cheering"]')).not.toBeNull();
  });

  it('with reduced motion, shows the whole greeting at once', () => {
    reducedMotion(true);
    const { container } = render(<HomeScreen />);
    expect(container.querySelector('.welcome__bubble')).not.toHaveAttribute('data-typing');
    expect(container.querySelector('.welcome__rest')).toBeEmptyDOMElement();
  });

  it('reads the greeting only when asked, and it has no digits', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('button', { name: t('action.listen') })).toBeInTheDocument();
    expect(t('welcome.greeting')).not.toMatch(/\d/);
  });

  it('one main action creates the first profile; restoring opens the settings', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('פלוסי');
    fireEvent.click(screen.getByRole('button', { name: 'יצירת פרופיל ראשון' }));
    expect(window.location.pathname).toBe('/parents');
    expect(appStore.getState().isParentUnlocked()).toBe(true);
    expect(takeParentTab()).toBeNull();

    window.history.replaceState(null, '', '/');
    fireEvent.click(screen.getByRole('button', { name: /התחברות או שחזור/ }));
    expect(window.location.pathname).toBe('/parents');
    expect(takeParentTab()).toBe('settings');
  });
});

describe('<HomeScreen> child picker', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'));
  afterEach(() => vi.useRealTimers());

  it('asks girls and boys alike, and shows each child a card', () => {
    onDevice([
      makeProfile({ id: 'a', name: 'נועה', gender: 'f' }),
      makeProfile({ id: 'b', name: 'איתי', gender: 'm', avatar: 'lion' }),
    ]);
    render(<HomeScreen />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('מי רוצה לשחק היום?');
    fireEvent.click(screen.getByRole('button', { name: 'איתי' }));
    expect(window.location.pathname).toBe('/play');
    expect(appStore.getState().activeProfileId).toBe('b');
  });

  it('labels the parents entry and says how to open it', () => {
    vi.useFakeTimers();
    onDevice([makeProfile()]);
    render(<HomeScreen />);
    const entry = screen.getByRole('button', { name: 'אזור הורים' });
    expect(entry).toHaveAccessibleDescription('לחיצה ארוכה לכניסה');
    // A tap does nothing; holding opens the gate.
    fireEvent.click(entry);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.pointerDown(entry);
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByRole('dialog', { name: 'כניסת הורים' })).toBeInTheDocument();
  });
});
