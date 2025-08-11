import { create } from "zustand";

const VOICE_ID_KEY = "aurora.voiceId";

type VoiceState = {
  isSpeaking: boolean;
  voiceId: string | null;
  setSpeaking: (v: boolean) => void;
  setVoiceId: (id: string | null) => void;
};

export const useVoiceStore = create<VoiceState>((set) => ({
  isSpeaking: false,
  voiceId:
    typeof window !== "undefined"
      ? window.localStorage.getItem(VOICE_ID_KEY)
      : null,
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
}));
