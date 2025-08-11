import { create } from "zustand";

const VOICE_ID_KEY = "aurora.voiceId";
const VOICE_SPEED_KEY = "aurora.voiceSpeed";
const VOICE_PITCH_KEY = "aurora.voicePitch";
const VOICE_EXPR_KEY = "aurora.voiceExpression";
const VOICE_EMOTION_KEY = "aurora.voiceEmotion";

type VoiceState = {
  isSpeaking: boolean;
  voiceId: string | null;
  speed: number;
  pitch: number;
  expression: number;
  emotion: string;
  setSpeaking: (v: boolean) => void;
  setVoiceId: (id: string | null) => void;
  setSpeed: (v: number) => void;
  setPitch: (v: number) => void;
  setExpression: (v: number) => void;
  setEmotion: (v: string) => void;
};

export const useVoiceStore = create<VoiceState>((set) => ({
  isSpeaking: false,
  voiceId:
    typeof window !== "undefined"
      ? window.localStorage.getItem(VOICE_ID_KEY)
      : null,
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
