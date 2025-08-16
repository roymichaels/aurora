import { useCallback } from 'react';
import { useVoiceStore } from '@/state/voice';

/**
 * Hook to manage voice input mode (push-to-talk vs toggle).
 */
export function useVoiceMode() {
  const listenMode = useVoiceStore((s) => s.listenMode);
  const setListenMode = useVoiceStore((s) => s.setListenMode);

  const toggleMode = useCallback(() => {
    setListenMode(listenMode === 'push-to-talk' ? 'toggle' : 'push-to-talk');
  }, [listenMode, setListenMode]);

  return {
    mode: listenMode,
    setMode: setListenMode,
    toggleMode,
  };
}
