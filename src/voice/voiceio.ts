import { useVoiceStore } from '@/state/voice';
import { voiceService } from '@/voice/voiceService';
import { bus } from '@/utils/bus';

declare global {
  interface SpeechRecognition {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export type VoiceCallbacks = {
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onError?: (err: any) => void;
};

export class VoiceIO {
  private recognition: SpeechRecognition | null = null;
  private callbacks: VoiceCallbacks;

  constructor(callbacks: VoiceCallbacks = {}) {
    this.callbacks = callbacks;
    bus.on('voice/state:set', ({ state }) => {
      this.callbacks.onSpeakingChange?.(state === 'speaking');
    });
  }

  startPushToTalk() {
    const SR =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) {
      this.callbacks.onError?.(new Error('Web Speech API not available'));
      return;
    }
    this.recognition = new SR();
    const { locale } = useVoiceStore.getState();
    this.recognition.lang = locale;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim) this.callbacks.onPartial?.(interim);
      if (finalText) {
        useVoiceStore.getState().setThinking(false);
        this.callbacks.onFinal?.(finalText.trim());
      }
    };

    this.recognition.onerror = (e: any) => this.callbacks.onError?.(e);
    this.recognition.onend = () => {
      this.callbacks.onSpeakingChange?.(false);
      useVoiceStore.getState().setListening(false);
      bus.emit('sphere/state:set', { state: 'thinking' });
      bus.emit('voice/state:set', { state: 'thinking' });
      this.recognition = null;
    };

    try {
      this.recognition.start();
      useVoiceStore.getState().setListening(true);
      useVoiceStore.getState().setThinking(false);
    } catch {
      // ignore
    }
  }

  stopListening() {
    try { this.recognition?.stop(); } catch {}
    useVoiceStore.getState().setListening(false);
    this.recognition = null;
  }

  async speak(text: string) {
    await voiceService.speak(text);
  }

  stopSpeaking() {
    voiceService.cancel();
  }
}
