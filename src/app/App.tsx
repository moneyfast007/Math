import { uiVariant } from './uiVariant';
import { HomeC } from '@/screens/variants/HomeC';
import { AlbumScreen } from '@/screens/AlbumScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { JourneyScreen } from '@/screens/JourneyScreen';
import { PracticeScreen } from '@/screens/PracticeScreen';
import { WorldsScreen } from '@/screens/WorldsScreen';
import { lazy, Suspense, useEffect } from 'react';

/*
 * What a child needs is in the first file; the rest comes in its own file when
 * it is opened (the service worker keeps them all for offline use): the parents'
 * area, the legal pages, the install guide, the playground and the older designs.
 */
const ParentScreen = lazy(() =>
  import('@/screens/ParentScreen').then((m) => ({ default: m.ParentScreen })),
);
const ParentAreaB = lazy(() =>
  import('@/screens/variants/ParentAreaB').then((m) => ({ default: m.ParentAreaB })),
);
const ParentAreaC = lazy(() =>
  import('@/screens/variants/ParentAreaC').then((m) => ({ default: m.ParentAreaC })),
);
const HomeB = lazy(() => import('@/screens/variants/HomeB').then((m) => ({ default: m.HomeB })));
const InfoScreen = lazy(() =>
  import('@/screens/InfoScreen').then((m) => ({ default: m.InfoScreen })),
);
const InstallGuideScreen = lazy(() =>
  import('@/screens/InstallGuideScreen').then((m) => ({ default: m.InstallGuideScreen })),
);
const PlaygroundScreen = lazy(() =>
  import('@/screens/PlaygroundScreen').then((m) => ({ default: m.PlaygroundScreen })),
);
import { t } from '@/i18n';
import { useApp } from '@/state/store';
import { useRoute, type RouteName } from './router';

/** Each screen names itself in the browser tab (WCAG 2.4.2). */
const TITLES = {
  home: 'pageTitle.home',
  play: 'pageTitle.play',
  practice: 'pageTitle.practice',
  review: 'pageTitle.practice',
  replay: 'pageTitle.practice',
  daily: 'pageTitle.practice',
  worldMix: 'pageTitle.practice',
  album: 'pageTitle.album',
  worlds: 'pageTitle.worlds',
  parents: 'pageTitle.parents',
  install: 'pageTitle.install',
  info: 'pageTitle.info',
  playground: 'pageTitle.playground',
} as const satisfies Record<RouteName, string>;

export function App() {
  const route = useRoute();
  const ready = useApp((s) => s.status === 'ready');
  useEffect(() => {
    document.title = t(TITLES[route.name]);
  }, [route.name]);

  // Stored data loads in a few milliseconds; render nothing rather than flash an empty home.
  if (!ready) return <main className="screen" aria-busy="true" />;
  return (
    <Suspense fallback={<main className="screen" aria-busy="true" />}>
      <Screen name={route.name} />
    </Suspense>
  );
}

function Screen({ name }: { name: RouteName }) {
  const variant = uiVariant();
  switch (name) {
    case 'home':
      // The entry screen's design: the current one, or B or C to compare (?ui=b).
      return variant === 'b' ? <HomeB /> : variant === 'c' ? <HomeC /> : <HomeScreen />;
    case 'play':
      return <JourneyScreen />;
    case 'practice':
      return <PracticeScreen mode="level" />;
    case 'review':
      return <PracticeScreen mode="review" />;
    case 'replay':
      return <PracticeScreen mode="replay" />;
    case 'daily':
      return <PracticeScreen mode="daily" />;
    case 'worldMix':
      return <PracticeScreen mode="worldMix" />;
    case 'album':
      return <AlbumScreen />;
    case 'worlds':
      return <WorldsScreen />;
    case 'parents':
      return (
        <ParentScreen
          area={variant === 'b' ? ParentAreaB : variant === 'c' ? ParentAreaC : undefined}
        />
      );
    case 'install':
      return <InstallGuideScreen />;
    case 'info':
      return <InfoScreen />;
    case 'playground':
      return <PlaygroundScreen />;
  }
}
