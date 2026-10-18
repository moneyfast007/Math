import { AlbumScreen } from '@/screens/AlbumScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { InfoScreen } from '@/screens/InfoScreen';
import { InstallGuideScreen } from '@/screens/InstallGuideScreen';
import { JourneyScreen } from '@/screens/JourneyScreen';
import { ParentScreen } from '@/screens/ParentScreen';
import { PlaygroundScreen } from '@/screens/PlaygroundScreen';
import { PracticeScreen } from '@/screens/PracticeScreen';
import { useEffect } from 'react';
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
  album: 'pageTitle.album',
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

  switch (route.name) {
    case 'home':
      return <HomeScreen />;
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
    case 'album':
      return <AlbumScreen />;
    case 'parents':
      return <ParentScreen />;
    case 'install':
      return <InstallGuideScreen />;
    case 'info':
      return <InfoScreen />;
    case 'playground':
      return <PlaygroundScreen />;
  }
}
