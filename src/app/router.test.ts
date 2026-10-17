import { describe, expect, it } from 'vitest';
import { pathForRoute, ROUTE_NAMES, routeFromPath } from './router';

describe('router', () => {
  it('maps known paths, tolerating trailing slashes', () => {
    expect(routeFromPath('/')).toEqual({ name: 'home' });
    expect(routeFromPath('/install')).toEqual({ name: 'install' });
    expect(routeFromPath('/install/')).toEqual({ name: 'install' });
    expect(routeFromPath('/parents')).toEqual({ name: 'parents' });
    expect(routeFromPath('/play')).toEqual({ name: 'play' });
  });

  it('falls back to home for unknown paths', () => {
    expect(routeFromPath('/nope')).toEqual({ name: 'home' });
  });

  it('round-trips every route', () => {
    for (const name of ROUTE_NAMES) {
      expect(routeFromPath(pathForRoute({ name }))).toEqual({ name });
    }
  });
});
