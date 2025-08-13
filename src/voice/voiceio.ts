import { useVoiceStore } from "@/state/voice";
import { supabase } from "@/integrations/supabase/client";
import { useAvatarStore } from "@/state/avatar";
import { playClonedVoice } from "./voiceClone";
import { ttsFallbackToast } from "@/voice/ttsFallbackToast";

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
    const state = useVoiceStore.getState();
    let { voiceId, mode, locale, speed, pitch, expression, emotion } = state;
    let success = false;

    const onStart = () => {

      useVoiceStore.getState().setSpeaking(true);
      this.callbacks.onSpeakingChange?.(true);
    };
    const onEnd = () => {
      useVoiceStore.getState().setSpeaking(false);
      this.callbacks.onSpeakingChange?.(false);
      useAvatarStore.getState().setAudio(null);
      useAvatarStore.getState().setSentiment(0);
    };

    const tryCloned = async () => {
      if (!voiceId) return false;
      const audio = await playClonedVoice(text, voiceId, {
        emotion,
        speed,
        pitch,
        expression,
        onStart,
        onEnd,
      });
      if (audio) {
        this.audio = audio;
        useAvatarStore.getState().setAudio(audio);
        return true;
      }
      return false;
    };

    const tryEleven = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("tts-generate", {
          body: { text, emotion, speed, pitch, expression },
        });
        if (!error && data?.audioBase64) {
          const src = `data:${data.contentType};base64,${data.audioBase64}`;
          const audio = new Audio(src);
          this.audio = audio;
          useAvatarStore.getState().setAudio(audio);
          audio.onplay = onStart;
          const end = () => {
            onEnd();
          };
          audio.onended = end;
          audio.onerror = (e) => {
            end();
            this.callbacks.onError?.(e);
          };
          await audio.play();
          return true;
        }
      } catch (e) {
        this.callbacks.onError?.(e);
      }
      return false;
    };

    const tryBrowser = () => {
      if (!("speechSynthesis" in window)) return false;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = locale;
      u.rate = speed;
      u.pitch = pitch;
      u.onstart = onStart;
      const end = () => {
        onEnd();
      };
      u.onend = end;
      u.onerror = (e) => {
        end();
        this.callbacks.onError?.(e);
      };
      speechSynthesis.speak(u);
      this.utter = u;
      return true;
    };

    let currentMode = mode;

    if (currentMode === "cloned") {
      success = await tryCloned();
      if (!success) {
        useVoiceStore.getState().setMode("eleven-default");
        currentMode = "eleven-default";
        if (voiceId) ttsFallbackToast();
      }
    }

    if (!success && currentMode === "eleven-default") {
      success = await tryEleven();
      if (!success) {
        useVoiceStore.getState().setMode("browser-tts");
        currentMode = "browser-tts";
        ttsFallbackToast();
      }
    }

    if (!success) {
      tryBrowser();
    }
  }

  stopSpeaking() {
    try { this.audio?.pause(); } catch {}
    this.audio = null;
    useAvatarStore.getState().setAudio(null);
    useAvatarStore.getState().setSentiment(0);
    try { window.speechSynthesis.cancel(); } catch {}
    useVoiceStore.getState().setSpeaking(false);
    this.callbacks.onSpeakingChange?.(false);
    this.utter = null;
  }
}
