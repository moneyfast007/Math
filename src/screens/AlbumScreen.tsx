import { useEffect, useState } from 'react';
import { setReplayTopic } from '@/app/replay';
import { navigate } from '@/app/router';
import { stickersEarned, worldsFor } from '@/engine/journey';
import { t, type TranslationKey } from '@/i18n';
import { compose } from '@/lang/compose';
import { medalsFor, STARS_PER_MEDAL, totalStars } from '@/state/progress';
import { useActiveProfile, useApp } from '@/state/store';
import { ageBandForGrade, applyAgeBand, type Grade } from '@/ui/ageBand';
import { BrandMark } from '@/ui/BrandMark';
import { Plusi } from '@/ui/Plusi';
import { PlusiPicker } from '@/ui/PlusiPicker';
import { CompanionArt, companionFor, sceneStyleForGrade } from '@/ui/scenes/companions';
import { applyPlusiColor } from '@/ui/plusiColor';
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
  const [painting, setPainting] = useState(false);

  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
    else {
      applyAgeBand(ageBandForGrade(profile.grade));
      applyPlusiColor(profile.plusiColor);
    }
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
      <BrandMark />
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

      <button
        type="button"
        className="btn btn--secondary btn--small album__plusi"
        onClick={() => setPainting(true)}
      >
        <Plusi size={28} decorative />
        {t('plusiColor.open')}
      </button>
      {painting ? <PlusiPicker profile={profile} onClose={() => setPainting(false)} /> : null}

      <section className="card album__status">
        <Plusi mood={earned > 0 ? 'cheering' : 'happy'} size={56} decorative />
        <p className="album__line">{line}</p>
        <SpeakerButton text={spoken.text} parts={spoken.parts} />
      </section>

      <StarMedals stars={totalStars(progress)} />

      <Friends worlds={worlds} grade={profile.grade} />

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

/**
 * "החברים שלי": a friend for every world of her grade, joining when the world is
 * finished. Friends not drawn yet say "soon"; ones still to earn show as shadows.
 */
function Friends({ worlds, grade }: { worlds: ReturnType<typeof worldsFor>; grade: Grade }) {
  const style = sceneStyleForGrade(grade);
  return (
    <section className="card friends" aria-labelledby="friends-title">
      <h2 id="friends-title" className="friends__title">
        {t('pals.title')}
      </h2>
      <p className="muted friends__intro">{t('pals.intro')}</p>
      <ul className="friends__row" role="list">
        {worlds.map((w) => {
          const friend = companionFor(style, w.index - 1);
          const name = friend ? t(`pals.${friend.id}`) : null;
          return (
            <li
              key={w.topic.id}
              className={
                friend && w.completed
                  ? 'friend friend--joined'
                  : friend
                    ? 'friend friend--locked'
                    : 'friend friend--soon'
              }
            >
              <span className="friend__art">
                {friend ? (
                  <CompanionArt id={friend.id} size="100%" />
                ) : (
                  <span aria-hidden="true">?</span>
                )}
              </span>
              <span className="friend__name">
                {friend && w.completed ? name : friend ? '?' : t('pals.soon')}
              </span>
              <span className="friend__when">{t('pals.lockedAt', { params: { n: w.index } })}</span>
            </li>
          );
        })}
      </ul>
    </section>
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

/**
 * The stars she collected (every station's best, every challenge's) and a medal for
 * every ten of them: a reward that comes often, between one world's sticker and the next.
 */
function StarMedals({ stars }: { stars: number }) {
  const medals = medalsFor(stars);
  const left = (medals + 1) * STARS_PER_MEDAL - stars;
  return (
    <section className="card medals" aria-labelledby="medals-title">
      <div className="medals__head">
        <h2 id="medals-title" className="medals__title">
          {t('medals.title')}
        </h2>
        <span className="medals__stars">
          <MedalStar className="medals__star" />
          {stars === 1 ? t('medals.starsOne') : t('medals.stars', { params: { count: stars } })}
        </span>
      </div>
      <ul className="medals__row" role="list">
        {Array.from({ length: medals }, (_, i) => (
          <li key={i} className="medal medal--earned">
            <Medal label={t('medals.label', { params: { n: (i + 1) * STARS_PER_MEDAL } })} />
            <span className="medal__n" aria-hidden="true">
              {(i + 1) * STARS_PER_MEDAL}
            </span>
          </li>
        ))}
        <li className="medal medal--next">
          <span className="medal__empty" aria-hidden="true">
            <MedalStar className="medal__ghost" />
          </span>
          <span className="medal__n">
            {left === 1 ? t('medals.nextOne') : t('medals.next', { params: { n: left } })}
          </span>
        </li>
      </ul>
    </section>
  );
}

function MedalStar({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.3l-5.8 3.1 1.2-6.5L2.6 9.4l6.5-.8z" />
    </svg>
  );
}

/** A gold medal on two ribbons, a white star in its middle. */
function Medal({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 100" className="medal__art" role="img" aria-label={label}>
      <path d="M30 4h16l10 34H40z" fill="#5b63d6" />
      <path d="M70 4H54L44 38h16z" fill="#e8793a" />
      <circle cx="50" cy="62" r="32" fill="#f2b632" />
      <circle cx="50" cy="62" r="25" fill="#f7cb55" />
      <path
        d="M50 44l5.3 11 12.1 1.5-8.9 8.3 2.3 12L50 71l-10.8 5.8 2.3-12-8.9-8.3 12.1-1.5z"
        fill="#ffffff"
      />
    </svg>
  );
}
