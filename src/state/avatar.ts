import { create } from "zustand";

const AVATAR_ENABLE_KEY = "aurora.avatar.enabled";
const AVATAR_COLOR_KEY = "aurora.avatar.color";

type AvatarState = {
  enabled: boolean;
  color: string;
  audio: HTMLAudioElement | null;
  sentiment: number;
  setEnabled: (v: boolean) => void;
  setColor: (c: string) => void;
  setAudio: (a: HTMLAudioElement | null) => void;
  setSentiment: (s: number) => void;
};

export const useAvatarStore = create<AvatarState>((set) => ({
  enabled:
    typeof window !== "undefined"
      ? localStorage.getItem(AVATAR_ENABLE_KEY) !== "false"
      : true,
  color:
    typeof window !== "undefined"
      ? localStorage.getItem(AVATAR_COLOR_KEY) || "#ffcc99"
      : "#ffcc99",
  audio: null,
  sentiment: 0,
  setEnabled: (v) => {
    try {
      localStorage.setItem(AVATAR_ENABLE_KEY, String(v));
    } catch {
      /* ignore */
    }
    set({ enabled: v });
  },
  setColor: (color) => {
    try {
      localStorage.setItem(AVATAR_COLOR_KEY, color);
    } catch {
      /* ignore */
    }
    set({ color });
  },
  setAudio: (audio) => set({ audio }),
  setSentiment: (sentiment) => set({ sentiment }),
}));

