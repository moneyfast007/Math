import { ChildHomeScreen } from '@/screens/ChildHomeScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { InstallGuideScreen } from '@/screens/InstallGuideScreen';
import { ParentScreen } from '@/screens/ParentScreen';
import { PlaygroundScreen } from '@/screens/PlaygroundScreen';
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
      return <ChildHomeScreen />;
    case 'parents':
      return <ParentScreen />;
    case 'install':
      return <InstallGuideScreen />;
    case 'playground':
      return <PlaygroundScreen />;
  }
}
