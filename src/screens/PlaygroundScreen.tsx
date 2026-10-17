import { useState } from 'react';
import { navigate } from '@/app/router';
import { t } from '@/i18n';
import { displayBinary, spokenQuestion } from '@/lang/spoken';
import { AGE_BANDS, applyAgeBand, type AgeBand } from '@/ui/ageBand';
import { MathExpr } from '@/ui/MathExpr';

const BAND_LABEL: Record<AgeBand, 'playground.band.young' | 'playground.band.middle' | 'playground.band.older'> = {
  young: 'playground.band.young',
  middle: 'playground.band.middle',
  older: 'playground.band.older',
};

/**
 * A temporary screen for checking the foundations on a real iPad: RTL layout
 * with LTR arithmetic, the three age bands, and the spoken form of an exercise.
 * It is removed once the exercise engine (phase 3) exists.
 */
export function PlaygroundScreen() {
  const [band, setBand] = useState<AgeBand>('middle');
  const choose = (b: AgeBand) => {
    setBand(b);
    applyAgeBand(b);
  };

  return (
    <main className="screen" data-screen="playground">
      <header className="screen__header">
        <h1>{t('playground.title')}</h1>
        <button type="button" className="btn btn--secondary" onClick={() => navigate({ name: 'home' })}>
          {t('action.back')}
        </button>
      </header>

      <section className="stack">
        <span className="muted">{t('playground.ageBand')}</span>
        <div className="segmented" role="group" aria-label={t('playground.ageBand')}>
          {AGE_BANDS.map((b) => (
            <button
              key={b}
              type="button"
              className="segmented__item"
              aria-pressed={band === b}
              onClick={() => choose(b)}
            >
              {t(BAND_LABEL[b])}
            </button>
          ))}
        </div>
      </section>

      <section className="card stack">
        <MathExpr block label={spokenQuestion(3, '+', 5)}>
          {displayBinary(3, '+', 5)}
        </MathExpr>
        <p>
          {t('playground.expressionLabel')} <MathExpr>{displayBinary(12, '÷', 3)}</MathExpr>{' '}
          <MathExpr>{displayBinary(9, '-', 4, 5)}</MathExpr>
        </p>
        <p className="muted">
          {t('playground.spokenLabel')} {spokenQuestion(12, '÷', 3)}
        </p>
      </section>

      <section className="row">
        <button type="button" className="btn">
          {t('action.check')}
        </button>
        <button type="button" className="btn btn--secondary">
          {t('action.hint')}
        </button>
        <button type="button" className="btn btn--ghost">
          {t('action.tryAgain', { gender: 'f' })}
        </button>
      </section>
    </main>
  );
}
