import { create } from "zustand";

type VoiceState = {
  isSpeaking: boolean;
  setSpeaking: (v: boolean) => void;
};

export const useVoiceStore = create<VoiceState>((set) => ({
  isSpeaking: false,
  setSpeaking: (v) => set({ isSpeaking: v }),
}));
