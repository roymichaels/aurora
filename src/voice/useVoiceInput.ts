import { useState, useEffect, useCallback } from 'react';
import { useVoiceStore } from '@/state/voice';
import { bus } from '@/utils/bus';
import { voiceService } from '@/voice/voiceService';

export function useVoiceInput() {
  const mode = useVoiceStore((s) => s.inputMode);
  const isListening = useVoiceStore((s) => s.isListening);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const handler = ({ text }: { text: string }) => setTranscript(text);
    const off = bus.on('voice/listen:transcript', handler);
    return () => {
      off();
      voiceService.stopListening();
      voiceService.cancel();
    };
  }, []);

  const start = useCallback(() => {
    void voiceService.startListening();
  }, []);

  const stop = useCallback(() => {
    voiceService.stopListening();
  }, []);

  const toggle = useCallback(() => {
    if (useVoiceStore.getState().isListening) voiceService.stopListening();
    else void voiceService.startListening();
  }, []);

  const handlePress = useCallback(() => {
    if (mode === 'push-to-talk') start();
    else toggle();
  }, [mode, start, toggle]);

  const handleRelease = useCallback(() => {
    if (mode === 'push-to-talk') stop();
  }, [mode, stop]);

  return {
    transcript,
    isListening,
    startListening: handlePress,
    stopListening: handleRelease,
    cleanup: stop,
  } as const;
}

