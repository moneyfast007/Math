import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { startUpdates } from './app/updates';
import { speaker } from './audio/speaker';
import { appStore } from './state/store';
import { applyAgeBand } from './ui/ageBand';
import './ui/global.css';

// Until a profile is chosen, the middle band is the default density.
applyAgeBand('middle');

// Load saved profiles and progress from IndexedDB.
void appStore.getState().hydrate();

// The speaker looks for clips in the chosen child's grade list, fetched (a few
// tens of kilobytes) as soon as she is chosen, so her first tap plays at once.
let grade: number | null = null;
appStore.subscribe((state) => {
  const next = state.data.profiles.find((p) => p.id === state.activeProfileId)?.grade ?? null;
  if (next === grade) return;
  grade = next;
  speaker.setGrade(next);
  void speaker.clipsFor();
});

// Offline support; a new version is applied between screens, never mid-round.
startUpdates();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
