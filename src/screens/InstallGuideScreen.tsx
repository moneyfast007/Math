import { navigate } from '@/app/router';
import { t } from '@/i18n';
import { isStandalone } from '@/pwa/standalone';

/**
 * Parent-facing instructions for adding the app to the home screen.
 * iOS never prompts on its own, so this screen is the install flow there.
 */
export function InstallGuideScreen() {
  const installed = isStandalone();
  // Back to where the guide was opened from: the welcome, or the parent area.
  const back = () => {
    if (window.history.length > 1) window.history.back();
    else navigate({ name: 'home' });
  };
  return (
    <main className="screen" data-screen="install">
      <header className="screen__header">
        <h1>{t('install.title')}</h1>
        <button type="button" className="btn btn--secondary" onClick={back}>
          {t('action.back')}
        </button>
      </header>

      {installed ? (
        <section className="card">
          <p>{t('install.alreadyInstalled')}</p>
        </section>
      ) : (
        <>
          <p className="install__why">{t('install.why')}</p>

          <section className="card stack" aria-labelledby="ios">
            <h2 id="ios">{t('install.ios.title')}</h2>
            <ol className="steps">
              <li>{t('install.ios.step1')}</li>
              <li>{t('install.ios.step2')}</li>
              <li>{t('install.ios.step3')}</li>
              <li>{t('install.ios.step4')}</li>
            </ol>
          </section>

          <section className="card stack" aria-labelledby="android">
            <h2 id="android">{t('install.android.title')}</h2>
            <ol className="steps">
              <li>{t('install.android.step1')}</li>
            </ol>
          </section>

          <section className="card stack" aria-labelledby="desktop">
            <h2 id="desktop">{t('install.desktop.title')}</h2>
            <ol className="steps">
              <li>{t('install.desktop.step1')}</li>
            </ol>
          </section>
        </>
      )}

      <p className="muted">{t('install.safariNote')}</p>
    </main>
  );
}
