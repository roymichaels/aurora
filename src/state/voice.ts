import { create } from "zustand";
import { bus } from "@/utils/bus";

const VOICE_ID_KEY = "aurora.voiceId";
const VOICE_SPEED_KEY = "aurora.voiceSpeed";
const VOICE_PITCH_KEY = "aurora.voicePitch";
const VOICE_EXPR_KEY = "aurora.voiceExpression";
const VOICE_EMOTION_KEY = "aurora.voiceEmotion";
const VOICE_MODE_KEY = "aurora.voiceMode";
const VOICE_LOCALE_KEY = "aurora.voiceLocale";

type VoiceMode =
  | "cloned"
  | "eleven-default"
  | "browser-tts"
  | "local-tts"
  | "off";

type VoiceState = {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  voiceId: string | null;
  mode: VoiceMode;
  locale: string;
  speed: number;
  pitch: number;
  expression: number;
  emotion: string;
  setListening: (v: boolean) => void;
  setThinking: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  setVoiceId: (id: string | null) => void;
  setMode: (m: VoiceMode) => void;
  setLocale: (l: string) => void;
  setSpeed: (v: number) => void;
  setPitch: (v: number) => void;
  setExpression: (v: number) => void;
  setEmotion: (v: string) => void;
};

export const useVoiceStore = create<VoiceState>((set) => {
  bus.on('voice/state:set', ({ state }) => {
    set({ isThinking: state === 'thinking', isSpeaking: state === 'speaking' });
  });
  return {
  isListening: false,
  isThinking: false,
  isSpeaking: false,
  voiceId:
    typeof window !== "undefined"
      ? window.localStorage.getItem(VOICE_ID_KEY)
      : null,
  mode:
    typeof window !== "undefined"
      ? ((window.localStorage.getItem(VOICE_MODE_KEY) as VoiceMode) ||
          (import.meta.env.VITE_ELEVEN_API_KEY ? "eleven-default" : "browser-tts"))
      : "browser-tts",
  locale:
    typeof window !== "undefined"
      ? window.localStorage.getItem(VOICE_LOCALE_KEY) || navigator.language || "en-US"
      : "en-US",
  speed:
    typeof window !== "undefined"
      ? Number(window.localStorage.getItem(VOICE_SPEED_KEY) || 1)
      : 1,
  pitch:
    typeof window !== "undefined"
      ? Number(window.localStorage.getItem(VOICE_PITCH_KEY) || 1)
      : 1,
  expression:
    typeof window !== "undefined"
      ? Number(window.localStorage.getItem(VOICE_EXPR_KEY) || 1)
      : 1,
  emotion:
    typeof window !== "undefined"
      ? window.localStorage.getItem(VOICE_EMOTION_KEY) || "neutral"
      : "neutral",
  setListening: (v) => set({ isListening: v }),
  setThinking: (v) => set({ isThinking: v }),
  setSpeaking: (v) => set({ isSpeaking: v }),
  setVoiceId: (id) => {
    try {
      if (id) window.localStorage.setItem(VOICE_ID_KEY, id);
      else window.localStorage.removeItem(VOICE_ID_KEY);
    } catch {
      /* ignore storage errors */
    }
    set({ voiceId: id });
  },
  setMode: (mode, persist = true) => {
    if (persist) {
      try {
        window.localStorage.setItem(VOICE_MODE_KEY, mode);
      } catch {
        /* ignore */
      }
    }
    set({ mode });
  },
  setLocale: (locale) => {
    try {
      window.localStorage.setItem(VOICE_LOCALE_KEY, locale);
    } catch {
      /* ignore */
    }
    set({ locale });
  },
  setSpeed: (speed) => {
    try {
      window.localStorage.setItem(VOICE_SPEED_KEY, String(speed));
    } catch {
      /* ignore */
    }
    set({ speed });
  },
  setPitch: (pitch) => {
    try {
      window.localStorage.setItem(VOICE_PITCH_KEY, String(pitch));
    } catch {
      /* ignore */
    }
    set({ pitch });
  },
  setExpression: (expression) => {
    try {
      window.localStorage.setItem(VOICE_EXPR_KEY, String(expression));
    } catch {
      /* ignore */
    }
    set({ expression });
  },
  setEmotion: (emotion) => {
    try {
      window.localStorage.setItem(VOICE_EMOTION_KEY, emotion);
    } catch {
      /* ignore */
    }
    set({ emotion });
  },
}));
