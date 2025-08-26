import './polyfills/randomUUID';
import { TonConnect } from '@tonconnect/sdk';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/hud-fixes.css';
import { registerSW } from 'virtual:pwa-register';
import { initSettings } from './state/settings';
import { preloadLocalModels } from './models/preload';
import './state/quickActions';
import { db } from './data/db';
import { initializeGamificationStore } from './game/gamification/store';
import { initializeRoadmapStore } from './state/roadmapStore';
import { getDataKey } from './state/keyManager';

export const connector = new TonConnect({
  manifestUrl: `${location.origin}/tonconnect-manifest.json`,
});

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

async function bootstrap() {
  initSettings();
  preloadLocalModels().catch(() => {});

  const key = getDataKey();
  if (key) {
    try {
      await db.open();
      const [tasks, stats] = await Promise.all([
        db.tasks.toArray(),
        db.stats.get('local'),
      ]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initializeRoadmapStore(tasks as any);
      initializeGamificationStore(stats ?? undefined);
    } catch (err) {
      console.warn('Dexie unavailable', err);
      initializeRoadmapStore([]);
      initializeGamificationStore();
    }
  } else {
    initializeRoadmapStore([]);
    initializeGamificationStore();
  }

  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

void bootstrap();
