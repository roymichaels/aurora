import { useEffect, useState } from 'react';
import { voiceService } from '@/voice/voiceService';
import { bus } from '@/utils/bus';
import { cn } from '@/lib/utils';

interface PillState {
  message: string;
  action?: (() => void) | null;
}

/**
 * Small pill notification for TTS events like autoplay blocking or voice fallback.
 */
export function TTSPill() {
  const [state, setState] = useState<PillState | null>(null);

  useEffect(() => {
    const offBlocked = voiceService.onPlaybackBlocked((cb) => {
      if (cb) {
        setState({ message: 'Tap to play my response.', action: cb });
      } else {
        setState(null);
      }
    });
    const offMsg = bus.on('tts/pill', ({ message, action }) => {
      setState({ message, action });
    });
    return () => {
      offBlocked();
      offMsg();
    };
  }, []);

  if (!state) return null;

  return (
    <button
      onClick={() => {
        state.action?.();
        setState(null);
      }}
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow',
        'animate-pulse'
      )}
    >
      {state.message}
    </button>
  );
}
