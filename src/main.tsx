import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import './styles/hud-fixes.css'
import { registerSW } from 'virtual:pwa-register';
import { initSettings } from './state/settings';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

initSettings();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
