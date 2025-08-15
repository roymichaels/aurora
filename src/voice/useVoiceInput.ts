import { useState, useEffect, useCallback } from 'react';
import { useVoiceStore } from '@/state/voice';
import { voiceService } from '@/voice/voiceService';
import { bus } from '@/utils/bus';

export function useVoiceInput() {
  const listenMode = useVoiceStore((s) => s.listenMode);
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

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const handleListen = useCallback(() => {
    if (listenMode === 'toggle') {
      toggleListening();
    } else {
      startListening();
    }
  }, [listenMode, toggleListening, startListening]);

  const handleListenEnd = useCallback(() => {
    if (listenMode === 'push-to-talk') {
      stopListening();
    }
  }, [listenMode, stopListening]);

  useEffect(() => {
    return () => {
      voiceService.cancel();
    };
  }, []);

  const cleanup = useCallback(() => {
    voiceService.cancel();
  }, []);

  return {
    startListening,
    stopListening,
    handleListen,
    handleListenEnd,
    transcript,
    isListening,
    listenMode,
    mode: listenMode,
    cleanup,
  };
}
