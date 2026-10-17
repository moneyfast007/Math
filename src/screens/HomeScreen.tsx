import { useEffect, useState } from 'react';
import { navigate } from '@/app/router';
import { t } from '@/i18n';
import { ParentGate } from '@/parent/ParentGate';
import { useApp } from '@/state/store';
import { applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { Plusi } from '@/ui/Plusi';
import { LongPressButton } from '@/ui/LongPressButton';

/**
 * Home: "who is playing today?". Each child taps her own card. The parent
 * entry needs a long press followed by the gate. On first run there is nothing
 * to protect, so setup starts directly.
 */
export function HomeScreen() {
  const profiles = useApp((s) => s.data.profiles);
  const hasPin = useApp((s) => s.data.parent.pin !== null);
  const verifyPin = useApp((s) => s.verifyPin);
  const selectProfile = useApp((s) => s.selectProfile);
  const unlockParent = useApp((s) => s.unlockParent);
  const lockParent = useApp((s) => s.lockParent);
  const [gateOpen, setGateOpen] = useState(false);

  // Coming back home always closes the parent area and resets the density.
  useEffect(() => {
    lockParent();
    selectProfile(null);
    applyAgeBand('middle');
  }, [lockParent, selectProfile]);

  const openParents = () => {
    unlockParent();
    navigate({ name: 'parents' });
  };

  if (profiles.length === 0) {
    return (
      <main className="screen" data-screen="home">
        <header className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <Plusi size={120} mood="cheering" decorative />
          <h1>{t('app.name')}</h1>
          <p className="muted">{t('app.tagline')}</p>
        </header>
        <section className="card stack" aria-labelledby="welcome">
          <h2 id="welcome">{t('home.firstRun.title')}</h2>
          <p>{t('home.firstRun.body')}</p>
          <div className="row">
            <button type="button" className="btn" onClick={openParents}>
              {t('home.firstRun.cta')}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate({ name: 'install' })}
            >
              {t('install.title')}
            </button>
          </div>
        </section>
      </main>
    );
  }

  const addressAs = profiles.every((p) => p.gender === 'f') ? 'f' : 'm';

  return (
    <main className="screen home" data-screen="home">
      <header className="home__header">
        <div className="brand" aria-hidden="true">
          <Plusi size={72} decorative />
          <span className="brand__name">{t('app.name')}</span>
        </div>
        <h1 className="home__title">{t('home.whoIsPlaying', { gender: addressAs })}</h1>
      </header>

      <ul className="profiles" role="list" style={{ listStyle: 'none', padding: 0 }}>
        {profiles.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className={`profile-card profile-card--c${i % 6}`}
              style={{ width: '100%' }}
              onClick={() => {
                selectProfile(p.id);
                navigate({ name: 'play' });
              }}
            >
              <Avatar id={p.avatar} size="lg" decorative />
              <span>{p.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <footer className="row" style={{ justifyContent: 'center', marginTop: 'auto' }}>
        <div className="parent-entry">
          <LongPressButton className="btn btn--ghost" onLongPress={() => setGateOpen(true)}>
            {t('home.parents')}
          </LongPressButton>
          <span className="muted" aria-hidden="true">
            {t('home.parentsHoldHint')}
          </span>
        </div>
      </footer>

      {gateOpen ? (
        <ParentGate
          hasPin={hasPin}
          verifyPin={verifyPin}
          onUnlock={() => {
            setGateOpen(false);
            openParents();
          }}
          onCancel={() => setGateOpen(false)}
        />
      ) : null}
    </main>
  );
}
