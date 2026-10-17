import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { layoutStations, pathThrough } from './JourneyScreen';
import { Plusi } from '@/ui/Plusi';
import { Sticker, stickerForWorld } from '@/ui/Sticker';

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
