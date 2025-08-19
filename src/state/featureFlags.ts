import { create } from 'zustand';

interface FlagsState {
  hypnosisScripts: boolean;
  cloudRouting: boolean;
  voiceStorage: boolean;
  appShell: boolean;
  isPro: boolean;
  toggle: (key: keyof Omit<FlagsState, 'toggle' | 'setPro'>) => void;
  setPro: (value: boolean) => void;
}

const STORAGE_KEY = 'featureFlags';
const PRO_KEY = 'aurora:isPro';

export const useFeatureFlags = create<FlagsState>((set) => {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const persistedPro = typeof window !== 'undefined' ? localStorage.getItem(PRO_KEY) : null;
  const base = {
    hypnosisScripts: false,
    cloudRouting: false,
    voiceStorage: false,
    appShell: true,
    isPro: false,
  };
  const initial = raw ? { ...base, ...JSON.parse(raw) } : base;
  if (persistedPro === '1') initial.isPro = true;
  return {
    ...initial,
    toggle: (key) =>
      set((state) => {
        const next = { ...state, [key]: !state[key] } as FlagsState;
        try {
          const { hypnosisScripts, cloudRouting, voiceStorage, appShell, isPro } = next;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ hypnosisScripts, cloudRouting, voiceStorage, appShell, isPro })
          );
          if (key === 'isPro') {
            localStorage.setItem(PRO_KEY, next.isPro ? '1' : '0');
          }
        } catch {}
        return next;
      }),
    setPro: (value) =>
      set((state) => {
        const next = { ...state, isPro: value } as FlagsState;
        try {
          const { hypnosisScripts, cloudRouting, voiceStorage, appShell, isPro } = next;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ hypnosisScripts, cloudRouting, voiceStorage, appShell, isPro })
          );
          localStorage.setItem(PRO_KEY, value ? '1' : '0');
        } catch {}
        return next;
      }),
  };
});

export function requirePro() {
  const { isPro } = useFeatureFlags.getState();
  if (!isPro) {
    window.location.href = '/plan';
  }
  return isPro;
}
