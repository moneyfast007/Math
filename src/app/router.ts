import { useEffect, useState } from 'react';

/**
 * A deliberately tiny client-side router. The app has a handful of screens and
 * no deep links worth a routing library. Routes are plain paths so Cloudflare's
 * `/* → index.html` rewrite serves them.
 */
export type Route = { name: 'home' } | { name: 'install' } | { name: 'playground' };

const PATHS: Record<Route['name'], string> = {
  home: '/',
  install: '/install',
  playground: '/playground',
};

export function routeFromPath(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const entry = (Object.entries(PATHS) as [Route['name'], string][]).find(([, p]) => p === clean);
  return entry ? { name: entry[0] } : { name: 'home' };
}

export function pathForRoute(route: Route): string {
  return PATHS[route.name];
}

export function navigate(route: Route): void {
  window.history.pushState(null, '', pathForRoute(route));
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));
  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return route;
}
