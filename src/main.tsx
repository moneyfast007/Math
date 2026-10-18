import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { startUpdates } from './app/updates';
import { appStore } from './state/store';
import { applyAgeBand } from './ui/ageBand';
import './ui/global.css';

// Until a profile is chosen, the middle band is the default density.
applyAgeBand('middle');

// Load saved profiles and progress from IndexedDB.
void appStore.getState().hydrate();

// Offline support; a new version is applied between screens, never mid-round.
startUpdates();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
