import { create } from 'zustand';

interface FlagsState {
  hypnosisScripts: boolean;
  cloudRouting: boolean;
  voiceStorage: boolean;
  isPro: boolean;
  toggle: (key: keyof Omit<FlagsState, 'toggle' | 'setPro'>) => void;
  setPro: (value: boolean) => void;
}

const STORAGE_KEY = 'featureFlags';

export const useFeatureFlags = create<FlagsState>((set) => {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const initial = raw
    ? JSON.parse(raw)
    : { hypnosisScripts: false, cloudRouting: false, voiceStorage: false };
  return {
    ...initial,
    isPro: false,
    toggle: (key) =>
      set((state) => {
        const next = { ...state, [key]: !state[key] } as FlagsState;
        try {
          const { hypnosisScripts, cloudRouting, voiceStorage } = next;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ hypnosisScripts, cloudRouting, voiceStorage })
          );
        } catch {}
        return next;
      }),
    setPro: (value) => set({ isPro: value }),
  };
});

export function requirePro() {
  const { isPro } = useFeatureFlags.getState();
  if (!isPro) {
    window.location.href = '/plan';
  }
  return isPro;
}
