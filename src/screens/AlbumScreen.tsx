import { useEffect } from 'react';
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

/** One sticker per completed world; the rest are shown as numbered, closed slots. */
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
          className="btn btn--secondary"
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
              className={w.completed ? 'sticker-card sticker-card--earned' : 'sticker-card'}
            >
              {w.completed ? (
                <Sticker id={id} />
              ) : (
                <div
                  className="sticker-card__slot"
                  role="img"
                  aria-label={t('album.sticker.locked', { params: { name: stickerLabel(id) } })}
                >
                  {w.index}
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
