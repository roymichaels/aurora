import { create } from 'zustand';

interface FlagsState {
  hypnosisScripts: boolean;
  cloudRouting: boolean;
  voiceStorage: boolean;
  toggle: (key: keyof Omit<FlagsState, 'toggle'>) => void;
}

const STORAGE_KEY = 'featureFlags';

export const useFeatureFlags = create<FlagsState>((set) => {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const initial = raw
    ? JSON.parse(raw)
    : { hypnosisScripts: false, cloudRouting: false, voiceStorage: false };
  return {
    ...initial,
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
  };
});
