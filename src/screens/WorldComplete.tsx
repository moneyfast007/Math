import { useEffect, useMemo } from 'react';
import { navigate } from '@/app/router';
import type { World } from '@/engine/journey';
import { t, type TranslationKey } from '@/i18n';
import { gradeLabel } from '@/i18n/labels';
import type { Profile } from '@/state/schema';
import { playFanfare } from '@/ui/fanfare';
import { Plusi } from '@/ui/Plusi';
import { SpeakerButton } from '@/ui/SpeakerButton';
import { Sticker } from '@/ui/Sticker';
import { stickerForWorld } from '@/ui/stickers';
import { prefersReducedMotion } from '@/ui/useTypewriter';

const CONFETTI_COLORS = ['#e8a33d', '#2f8f83', '#5b62d6', '#e0675a', '#7cc47f', '#f2c94c'];

/**
 * The end of a world: a celebration of its own, not the end of one more round.
 * Confetti, Plusi jumping, the new sticker arriving big, a short tune; then one
 * way on (the next world) and a small way to the album. With reduced motion:
 * no confetti and no movement, only the sticker and the words.
 */
export function WorldComplete({
  profile,
  world,
  next,
  spoken,
}: {
  profile: Profile;
  world: World;
  /** The world this one opens, if the grade has one. */
  next: World | null;
  /** What the speaker reads (a recorded sentence). */
  spoken: string;
}) {
  const still = useMemo(prefersReducedMotion, []);
  useEffect(() => playFanfare(), []);
  const pieces = useMemo(
    () =>
      still
        ? []
        : Array.from({ length: 70 }, (_, i) => ({
            left: (i * 37) % 100,
            delay: (i % 14) * 0.15,
            duration: 2.4 + ((i * 7) % 10) / 10,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            turn: (i * 53) % 360,
          })),
    [still],
  );

  return (
    <main className="screen practice celebrate" data-screen="world-complete">
      {pieces.length > 0 ? (
        <div className="celebrate__confetti" aria-hidden="true">
          {pieces.map((p, i) => (
            <span
              key={i}
              style={{
                left: `${p.left}%`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                rotate: `${p.turn}deg`,
              }}
            />
          ))}
        </div>
      ) : null}

      <section className="celebrate__body">
        <div className="celebrate__plusi">
          <Plusi mood="cheering" size={96} decorative />
        </div>
        <button
          type="button"
          className="celebrate__sticker"
          aria-label={t('celebrate.stickerOpen')}
          onClick={() => navigate({ name: 'album' })}
        >
          <Sticker id={stickerForWorld(world.index)} size="100%" />
        </button>
        <h1 className="celebrate__title">
          {next
            ? t('celebrate.title', { params: { n: world.index } })
            : t('celebrate.lastTitle', { params: { grade: gradeLabel(profile.grade) } })}
        </h1>
        {next ? (
          <p className="celebrate__next">
            {t('celebrate.next', {
              params: { n: next.index, name: t(next.topic.labelKey as TranslationKey) },
            })}
          </p>
        ) : null}
        <div className="celebrate__say">
          <SpeakerButton text={spoken} />
          <span>{spoken}</span>
        </div>
        <div className="stack celebrate__actions">
          {next ? (
            <button
              type="button"
              className="btn btn--hero"
              onClick={() => navigate({ name: 'play' })}
            >
              {t('celebrate.toNext')}
            </button>
          ) : null}
          <button
            type="button"
            className={next ? 'btn btn--ghost btn--small' : 'btn btn--hero'}
            onClick={() => navigate({ name: 'album' })}
          >
            {t('celebrate.toAlbum')}
          </button>
        </div>
      </section>
    </main>
  );
}
