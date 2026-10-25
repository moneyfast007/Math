import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { companionFor, sceneStyleForGrade } from './companions';
import { SceneStrip } from './SceneStrip';

describe('<SceneStrip>', () => {
  it('is the round progress bar, and counts the lit steps (not the shown answers)', () => {
    render(
      <SceneStrip
        kind="village"
        total={10}
        marks={[true, false, true]}
        quiet
        done={3}
        label="תרגיל 4 מתוך 10"
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'תרגיל 4 מתוך 10' });
    expect(bar).toHaveAttribute('aria-valuenow', '3');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
    expect(bar).toHaveAttribute('data-lit', '2');
    expect(bar).toHaveClass('scene-strip--village', 'scene-strip--quiet');
  });

  it('the rocket for the older ones', () => {
    render(<SceneStrip kind="rocket" total={6} marks={[]} quiet={false} done={0} label="x" />);
    expect(screen.getByRole('progressbar')).toHaveClass('scene-strip--rocket');
  });
});

describe('the friends', () => {
  it('a scene style by grade, and a friend drawn for the first world of each', () => {
    expect(sceneStyleForGrade(0)).toBe('young');
    expect(sceneStyleForGrade(2)).toBe('young');
    expect(sceneStyleForGrade(3)).toBe('older');
    expect(companionFor('young', 0)?.id).toBe('spark');
    expect(companionFor('older', 0)?.id).toBe('cosmo');
    expect(companionFor('young', 5)).toBeNull();
  });
});
