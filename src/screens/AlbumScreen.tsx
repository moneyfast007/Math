import { useEffect } from 'react';
import { setReplayTopic } from '@/app/replay';
import { navigate } from '@/app/router';
import { stickersEarned, worldsFor } from '@/engine/journey';
import { t, type TranslationKey } from '@/i18n';
import { compose } from '@/lang/compose';
import { useActiveProfile, useApp } from '@/state/store';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { Plusi } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { Sticker } from '@/ui/Sticker';
import { stickerForWorld, stickerLabel } from '@/ui/stickers';

/**
 * One sticker per completed world; the rest are empty sticker slots waiting to
 * be filled (the next one to earn is marked).
 * Touching a sticker plays that world again (a mixed round, like its review).
 */
export function AlbumScreen() {
  const profile = useActiveProfile();
  const progress = useApp((s) => (profile ? s.data.progress[profile.id] : undefined));

  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
    else applyAgeBand(ageBandForGrade(profile.grade));
  }, [profile]);
  if (!profile) return null;

  const worlds = worldsFor(profile.grade, progress);
  const earned = stickersEarned(worlds);
  // The first world not finished yet: its slot invites the next sticker.
  const nextIndex = worlds.find((w) => !w.completed)?.index ?? null;
  const total = worlds.length;
  const line =
    earned === 0
      ? t('album.count.none')
      : earned === total
        ? t('album.count.all')
        : t('album.count', { params: { earned, total } });
  // Read aloud with the numbers as words, assembled from clips (the screen keeps digits).
  const spoken =
    earned > 0 && earned < total
      ? compose(t('album.count'), {
          earned: { n: earned, gender: 'f' },
          total: { n: total, gender: 'f' },
        })
      : { text: line, parts: [line] };

  return (
    <main className="screen album" data-screen="album">
      <header className="screen__header">
        <div>
          <h1>{t('album.title', { params: { name: profile.name } })}</h1>
          <p className="muted">{t('album.intro')}</p>
        </div>
        <button
          type="button"
          className="btn btn--secondary album__back"
          onClick={() => navigate({ name: 'play' })}
        >
          {t('album.back')}
        </button>
      </header>

      <section className="card album__status">
        <Plusi mood={earned > 0 ? 'cheering' : 'happy'} size={56} decorative />
        <p className="album__line">{line}</p>
        <SpeakerButton text={spoken.text} parts={spoken.parts} />
      </section>

      <ul className="album__grid" aria-label={t('journey.album')}>
        {worlds.map((w) => {
          const id = stickerForWorld(w.index);
          const name = t(w.topic.labelKey as TranslationKey);
          return (
            <li
              key={w.topic.id}
              className={
                w.completed
                  ? 'sticker-card sticker-card--earned'
                  : w.index === nextIndex
                    ? 'sticker-card sticker-card--next'
                    : 'sticker-card'
              }
            >
              {w.completed ? (
                <button
                  type="button"
                  className="sticker-card__play"
                  aria-label={t('album.replay.label', { params: { name } })}
                  onClick={() => {
                    setReplayTopic(w.topic.id);
                    navigate({ name: 'replay' });
                  }}
                >
                  <Sticker id={id} />
                  <span className="sticker-card__again" aria-hidden="true">
                    {t('album.replay')}
                  </span>
                </button>
              ) : (
                <div
                  className="sticker-card__slot"
                  role="img"
                  aria-label={t('album.sticker.locked', { params: { name: stickerLabel(id) } })}
                >
                  <EmptySlot />
                  {w.index === nextIndex ? (
                    <span className="sticker-card__next" aria-hidden="true">
                      {t('stickerSlot.next')}
                    </span>
                  ) : null}
                </div>
              )}
              <span className="sticker-card__name">
                {t('journey.world', { params: { index: w.index, name } })}
              </span>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

/** An empty place for a sticker: a dashed outline with a little sparkle, nothing to press. */
function EmptySlot() {
  return (
    <svg viewBox="0 0 100 100" className="sticker-card__empty" aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="44" className="sticker-card__ring" />
      <path d="M50 30l5 13 13 5-13 5-5 13-5-13-13-5 13-5z" className="sticker-card__spark" />
      <circle cx="70" cy="30" r="3.5" className="sticker-card__dot" />
      <circle cx="31" cy="69" r="2.5" className="sticker-card__dot" />
    </svg>
  );
}
