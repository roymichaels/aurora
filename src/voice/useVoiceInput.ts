import { useState, useEffect, useCallback } from 'react';
import { useVoiceStore } from '@/state/voice';
import { voiceService } from '@/voice/voiceService';
import { bus } from '@/utils/bus';

export function useVoiceInput() {
  const mode = useVoiceStore((s) => s.inputMode);
  const isListening = useVoiceStore((s) => s.isListening);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const off = bus.on('voice/transcript', ({ text }) => {
      setTranscript(text);
    });
    return () => {
      off();
    };
  }, []);

  const startListening = useCallback(() => {
    void voiceService.startListening();
  }, []);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
  }, []);

  useEffect(() => {
    return () => {
      voiceService.cancel();
    };
  }, []);

  const cleanup = useCallback(() => {
    voiceService.cancel();
  }, []);

  return { startListening, stopListening, transcript, isListening, mode, cleanup };
}
