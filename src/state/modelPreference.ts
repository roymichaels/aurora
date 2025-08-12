import { create } from 'zustand';

export type ModelPreference = 'auto' | 'local' | 'cloud';

interface ModelState {
  preference: ModelPreference;
  fallbackToCloud: boolean;
  setPreference: (p: ModelPreference) => void;
  setFallback: (f: boolean) => void;
}

const STORAGE_KEY = 'modelPreference';

export const useModelPreference = create<ModelState>((set) => {
  const raw =
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const initial = raw
    ? (JSON.parse(raw) as { preference: ModelPreference; fallbackToCloud: boolean })
    : { preference: 'auto', fallbackToCloud: true };
  return {
    ...initial,
    setPreference: (p) =>
      set((state) => {
        const next = { ...state, preference: p } as ModelState;
        try {
          const { preference, fallbackToCloud } = next;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ preference, fallbackToCloud }),
          );
        } catch {}
        return next;
      }),
    setFallback: (f) =>
      set((state) => {
        const next = { ...state, fallbackToCloud: f } as ModelState;
        try {
          const { preference, fallbackToCloud } = next;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ preference, fallbackToCloud }),
          );
        } catch {}
        return next;
      }),
  };
});
