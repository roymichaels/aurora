import { useState, useEffect, useCallback } from 'react';
import { useVoiceStore } from '@/state/voice';
import { bus } from '@/utils/bus';
import { voiceService } from '@/voice/voiceService';
import { useVoiceMode } from '@/voice/useVoiceMode';

export function useVoiceInput() {
  const { mode } = useVoiceMode();
  const isListening = useVoiceStore((s) => s.isListening);
  const isThinking = useVoiceStore((s) => s.isThinking);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const off = voiceService.onTranscript(setTranscript);
    return off;
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
    if (mode === 'toggle') {
      toggleListening();
    } else {
      startListening();
    }
  }, [mode, toggleListening, startListening]);

  const handleListenEnd = useCallback(() => {
    if (mode === 'push-to-talk') {
      stopListening();
    }
  }, [mode, stopListening]);

  useEffect(() => {
    if (isThinking) {
      bus.emit('sphere/state:set', { state: 'thinking' });
    }
  }, [isThinking]);

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
    mode,
    cleanup,
  };
}
