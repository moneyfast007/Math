import { AlbumScreen } from '@/screens/AlbumScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { InfoScreen } from '@/screens/InfoScreen';
import { InstallGuideScreen } from '@/screens/InstallGuideScreen';
import { JourneyScreen } from '@/screens/JourneyScreen';
import { ParentScreen } from '@/screens/ParentScreen';
import { PlaygroundScreen } from '@/screens/PlaygroundScreen';
import { PracticeScreen } from '@/screens/PracticeScreen';
import { useApp } from '@/state/store';
import { useRoute } from './router';

export function App() {
  const route = useRoute();
  const ready = useApp((s) => s.status === 'ready');

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
