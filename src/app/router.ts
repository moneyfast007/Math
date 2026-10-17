import { useEffect, useState } from 'react';

/**
 * A deliberately tiny client-side router. The app has a handful of screens and
 * no deep links worth a routing library. Routes are plain paths; the hosting
 * serves index.html for any unknown path (wrangler.json: single-page-application).
 */
export type RouteName =
  | 'home'
  | 'play'
  | 'practice'
  | 'review'
  | 'album'
  | 'parents'
  | 'install'
  | 'playground';
export type Route = { name: RouteName };

const PATHS: Record<RouteName, string> = {
  home: '/',
  play: '/play',
  practice: '/practice',
  review: '/practice/review',
  album: '/album',
  parents: '/parents',
  install: '/install',
  playground: '/playground',
};

export const ROUTE_NAMES = Object.keys(PATHS) as RouteName[];

export function routeFromPath(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const entry = (Object.entries(PATHS) as [RouteName, string][]).find(([, p]) => p === clean);
  return entry ? { name: entry[0] } : { name: 'home' };
}

export function pathForRoute(route: Route): string {
  return PATHS[route.name];
}

export function navigate(route: Route, options: { replace?: boolean } = {}): void {
  const path = pathForRoute(route);
  if (options.replace) window.history.replaceState(null, '', path);
  else window.history.pushState(null, '', path);
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
