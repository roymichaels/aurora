import { useVoiceStore } from '@/state/voice';
import { voiceService } from '@/voice/voiceService';

export const startListening = () => {
  void voiceService.startListening();
};

export const stopListening = () => {
  voiceService.stopListening();
};

export const toggleListening = () => {
  const { isListening } = useVoiceStore.getState();
  if (isListening) stopListening();
  else startListening();
};

export const handleListenPressStart = () => {
  if (useVoiceStore.getState().listenMode === 'push-to-talk') {
    startListening();
  }
};

export const handleListenPressEnd = () => {
  if (useVoiceStore.getState().listenMode === 'push-to-talk') {
    stopListening();
  }
};

export const handleListenClick = () => {
  if (useVoiceStore.getState().listenMode === 'toggle') {
    toggleListening();
  }
};
