import { HomeScreen } from '@/screens/HomeScreen';
import { InstallGuideScreen } from '@/screens/InstallGuideScreen';
import { PlaygroundScreen } from '@/screens/PlaygroundScreen';
import { useRoute } from './router';

export function App() {
  const route = useRoute();
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'install':
      return <InstallGuideScreen />;
    case 'playground':
      return <PlaygroundScreen />;
  }
}
