import { useVoiceStore } from "@/state/voice";
import { supabase } from "@/integrations/supabase/client";

export type VoiceCallbacks = {
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onError?: (err: any) => void;
};

export class VoiceIO {
  private recognition: SpeechRecognition | null = null;
  private utter: SpeechSynthesisUtterance | null = null;
  private audio: HTMLAudioElement | null = null;
  private callbacks: VoiceCallbacks;

  constructor(callbacks: VoiceCallbacks = {}) {
    this.callbacks = callbacks;
  }

  startPushToTalk() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.callbacks.onError?.(new Error('Web Speech API not available'));
      return;
    }
    this.recognition = new SR();
    this.recognition.lang = document.documentElement.lang || navigator.language || 'en-US';
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
      if (finalText) this.callbacks.onFinal?.(finalText.trim());
    };

    this.recognition.onerror = (e: any) => this.callbacks.onError?.(e);
    this.recognition.onend = () => {
      this.callbacks.onSpeakingChange?.(false);
      this.recognition = null;
    };

    try {
      this.recognition.start();
    } catch (e) {
      // starting while already started throws
    }
  }

  stopListening() {
    try { this.recognition?.stop(); } catch {}
    this.recognition = null;
  }

  async speak(text: string) {
    const voiceId = useVoiceStore.getState().voiceId;
    if (voiceId) {
      try {
        const { data, error } = await supabase.functions.invoke("tts-generate", {
          body: { text, voiceId },
        });
        if (!error && data?.audioBase64) {
          const src = `data:${data.contentType};base64,${data.audioBase64}`;
          const audio = new Audio(src);
          this.audio = audio;
          audio.onplay = () => {
            useVoiceStore.getState().setSpeaking(true);
            this.callbacks.onSpeakingChange?.(true);
          };
          const end = () => {
            useVoiceStore.getState().setSpeaking(false);
            this.callbacks.onSpeakingChange?.(false);
          };
          audio.onended = end;
          audio.onerror = (e) => {
            end();
            this.callbacks.onError?.(e);
          };
          await audio.play();
          return;
        }
      } catch (e) {
        this.callbacks.onError?.(e);
      }
    }

    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => {
      useVoiceStore.getState().setSpeaking(true);
      this.callbacks.onSpeakingChange?.(true);
    };
    const end = () => {
      useVoiceStore.getState().setSpeaking(false);
      this.callbacks.onSpeakingChange?.(false);
    };
    u.onend = end;
    u.onerror = end;
    speechSynthesis.speak(u);
    this.utter = u;
  }

  stopSpeaking() {
    try { this.audio?.pause(); } catch {}
    this.audio = null;
    try { window.speechSynthesis.cancel(); } catch {}
    useVoiceStore.getState().setSpeaking(false);
    this.callbacks.onSpeakingChange?.(false);
    this.utter = null;
  }
}
