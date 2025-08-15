import { useCallback, useEffect, useState } from 'react';
import { useVoiceStore } from '@/state/voice';
import { voiceService } from '@/voice/voiceService';

export function useTextToSpeech() {
  const isSpeaking = useVoiceStore((s) => s.isSpeaking);
  const [blocked, setBlocked] = useState<(() => void) | null>(null);

  useEffect(() => {
    setBlocked(voiceService.getBlockedCallback());
    const off = voiceService.onPlaybackBlocked(setBlocked);
    return off;
  }, []);

  const speak = useCallback((text: string) => {
    void voiceService.speak(text);
  }, []);

  const cancel = useCallback(() => {
    voiceService.cancel();
  }, []);

  const resume = useCallback(() => {
    voiceService.resume();
  }, []);

  return { speak, cancel, isSpeaking, blocked: !!blocked, resume };
}
