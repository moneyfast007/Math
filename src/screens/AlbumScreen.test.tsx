import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { emptyProgress, emptyTopicStats } from '@/state/schema';
import { appStore } from '@/state/store';
import { makeData, makeProfile } from '@/state/testData';
import { AlbumScreen } from './AlbumScreen';

describe('<AlbumScreen>', () => {
  it('shows earned stickers, and empty slots that invite the next one', () => {
    const profile = makeProfile({ grade: 1 });
    const progress = emptyProgress();
    progress.topics['add-sub-20'] = {
      ...emptyTopicStats(10),
      completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      reviewPassed: true,
    };
    act(() => {
      appStore.setState({
        status: 'ready',
        data: makeData({ profiles: [profile], progress: { [profile.id]: progress } }),
        activeProfileId: profile.id,
      });
    });
    const { container } = render(<AlbumScreen />);

    // World 1 is done: its sticker plays the world again.
    expect(screen.getByRole('button', { name: /^לתרגל שוב: / })).toBeInTheDocument();
    // The others are closed slots, named for assistive tech, with no numbers drawn in them.
    const locked = screen.getAllByRole('img', { name: /^מדבקה סגורה: / });
    expect(locked.length).toBeGreaterThan(1);
    for (const slot of locked) expect(slot.textContent).not.toMatch(/\d/);
    // Only the next world's slot is marked.
    const next = container.querySelectorAll('.sticker-card--next');
    expect(next).toHaveLength(1);
    expect(next[0]).toHaveTextContent('המדבקה הבאה');
    expect(next[0]).toHaveTextContent(/^.*עולם 2 · /);
    expect(screen.getByRole('button', { name: 'חזרה למסע' })).toBeInTheDocument();
  });
});
