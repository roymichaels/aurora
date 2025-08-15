import { bus } from '@/utils/bus';
import { useVoiceStore } from '@/state/voice';

export const startListening = () => {
  bus.emit('voice/listen:start', {});
};

export const stopListening = () => {
  bus.emit('voice/listen:stop', {});
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
