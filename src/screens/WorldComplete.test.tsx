import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { worldsFor } from '@/engine/journey';
import { makeProfile } from '@/state/testData';
import { WorldComplete } from './WorldComplete';

function reducedMotion(on: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: on
      ? (query: string) => ({ matches: query.includes('reduce'), media: query })
      : undefined,
  });
}

describe('<WorldComplete>', () => {
  afterEach(() => reducedMotion(false));
  const worlds = worldsFor(2, undefined);
  const at = (i: number) => {
    const w = worlds.at(i);
    if (!w) throw new Error(`no world ${i}`);
    return w;
  };
  const profile = makeProfile({ grade: 2 });

  it('celebrates the world, names the one it opens, and leads on to it', () => {
    window.history.replaceState(null, '', '/practice');
    const { container } = render(
      <WorldComplete profile={profile} world={at(0)} next={at(1)} spoken="יש!" />,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('סיימת את עולם 1!');
    expect(screen.getByText(/^עולם 2: .* נפתח!$/)).toBeInTheDocument();
    expect(container.querySelectorAll('.confetti span').length).toBeGreaterThan(0);
    // One big way on; the album is a small link (and the sticker opens it too).
    expect(screen.queryByRole('button', { name: 'עוד סבב' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'לעולם הבא' }));
    expect(window.location.pathname).toBe('/play');
    fireEvent.click(screen.getByRole('button', { name: /המדבקה החדשה שלך/ }));
    expect(window.location.pathname).toBe('/album');
  });

  it('after the grade’s last world: all worlds done, the album is the way on', () => {
    render(<WorldComplete profile={profile} world={at(-1)} next={null} spoken="יש!" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'סיימת את כל העולמות של כיתה ב׳!',
    );
    expect(screen.queryByRole('button', { name: 'לעולם הבא' })).toBeNull();
    expect(screen.getByRole('button', { name: 'לאלבום' })).toHaveClass('btn--hero');
  });

  it('with reduced motion there is no confetti', () => {
    reducedMotion(true);
    const { container } = render(
      <WorldComplete profile={profile} world={at(0)} next={at(1)} spoken="יש!" />,
    );
    expect(container.querySelector('.confetti')).toBeNull();
  });
});
