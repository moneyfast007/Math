import { registerSW } from 'virtual:pwa-register';
import { routeFromPath, type RouteName } from './router';

/**
 * Offline support and updates. A new version is downloaded in the background
 * and applied by itself (a quick reload) the moment it cannot interrupt
 * anything: on the home screen, the journey or the album, with no dialog open.
 * Never mid-round and never in the parents' area, where a form may be half
 * filled. Without this, an iPhone that never fully closes the tab stays on
 * an old version forever.
 */

const SAFE_ROUTES: ReadonlySet<RouteName> = new Set(['home', 'play', 'album', 'install']);
const CHECK_EVERY_MS = 30 * 60 * 1000;

function safeToReload(): boolean {
  return (
    SAFE_ROUTES.has(routeFromPath(window.location.pathname).name) &&
    document.querySelector('[role="dialog"]') === null
  );
}

export function startUpdates(): void {
  let waiting = false;

  const apply = () => {
    if (waiting && safeToReload()) {
      waiting = false;
      void updateSW(true);
    }
  };

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      waiting = true;
      apply();
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update().catch(() => undefined);
      };
      // A phone app resumed from the background does not look for updates by itself.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.setInterval(check, CHECK_EVERY_MS);
    },
  });

  // Each screen change is a chance to apply a waiting update (navigate() fires popstate).
  window.addEventListener('popstate', () => window.setTimeout(apply, 0));
}
