import { navigate } from '@/app/router';
import { t } from '@/i18n';

/**
 * Home. In phase 2 this becomes the profile picker ("מי משחקת היום?").
 * For now it is the shell: title, an empty-state message for parents, and the
 * two parent entry points (install guide, display check).
 */
export function HomeScreen() {
  return (
    <main className="screen" data-screen="home">
      <header className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <h1>{t('app.name')}</h1>
        <p className="muted">{t('app.tagline')}</p>
      </header>

      <section className="card stack" aria-labelledby="who">
        <h2 id="who">{t('home.whoIsPlaying')}</h2>
        <p className="muted">{t('home.noProfilesYet')}</p>
        <div className="row">
          <button type="button" className="btn" disabled>
            {t('home.addProfile')}
          </button>
        </div>
      </section>

      <footer className="row" style={{ justifyContent: 'center', marginTop: 'auto' }}>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => navigate({ name: 'install' })}
        >
          {t('install.title')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => navigate({ name: 'playground' })}
        >
          {t('playground.title')}
        </button>
      </footer>
    </main>
  );
}
