import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app/App';
import { applyAgeBand } from './ui/ageBand';
import './ui/global.css';

// Until a profile is chosen (phase 2), the middle band is the default density.
applyAgeBand('middle');

// Offline support. Updates are applied on the next launch; we never interrupt a
// child mid-exercise with an "update available" prompt.
registerSW({ immediate: true });

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
