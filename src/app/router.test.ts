import { describe, expect, it } from 'vitest';
import { pathForRoute, routeFromPath } from './router';

describe('router', () => {
  it('maps known paths, tolerating trailing slashes', () => {
    expect(routeFromPath('/')).toEqual({ name: 'home' });
    expect(routeFromPath('/install')).toEqual({ name: 'install' });
    expect(routeFromPath('/install/')).toEqual({ name: 'install' });
    expect(routeFromPath('/playground')).toEqual({ name: 'playground' });
  });

  it('falls back to home for unknown paths', () => {
    expect(routeFromPath('/nope')).toEqual({ name: 'home' });
  });

  it('round-trips', () => {
    for (const name of ['home', 'install', 'playground'] as const) {
      expect(routeFromPath(pathForRoute({ name }))).toEqual({ name });
    }
  });
});
