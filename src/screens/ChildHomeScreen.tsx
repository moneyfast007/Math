import { useEffect } from 'react';
import { navigate } from '@/app/router';
import { makeT } from '@/i18n';
import { useActiveProfile } from '@/state/store';
import { ageBandForGrade, applyAgeBand } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';

/**
 * The child's own home. In phase 3 this lists the topics to practice; for now
 * it greets her and confirms the profile works (age band, gendered address).
 */
export function ChildHomeScreen() {
  const profile = useActiveProfile();

  useEffect(() => {
    if (!profile) navigate({ name: 'home' }, { replace: true });
    else applyAgeBand(ageBandForGrade(profile.grade));
  }, [profile]);

  if (!profile) return null;
  const tc = makeT(profile.gender);

  return (
    <main className="screen" data-screen="play">
      <header className="screen__header">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => navigate({ name: 'home' })}
        >
          {tc('child.switch')}
        </button>
      </header>
      <section className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <Avatar id={profile.avatar} size="lg" decorative />
        <h1>{tc('child.hello', { name: profile.name })}</h1>
        <p>{tc('child.ready')}</p>
        <p className="muted">{tc('child.comingSoon')}</p>
      </section>
    </main>
  );
}
