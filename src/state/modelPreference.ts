import { create } from 'zustand';

export type ModelPreference = 'auto' | 'local' | 'cloud';

interface ModelState {
  preference: ModelPreference;
  fallbackToCloud: boolean;
  setPreference: (p: ModelPreference) => void;
  setFallback: (f: boolean) => void;
}

const STORAGE_KEY = 'modelPreference';

export const useModelPreference = create<ModelState>((set): ModelState => {
  const raw =
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const initial: Pick<ModelState, 'preference' | 'fallbackToCloud'> = raw
    ? (JSON.parse(raw) as Pick<ModelState, 'preference' | 'fallbackToCloud'>)
    : { preference: 'auto', fallbackToCloud: true };

  return {
    ...initial,
    setPreference: (p: ModelPreference) =>
      set((state) => {
        const next: ModelState = { ...state, preference: p };
        try {
          const { preference, fallbackToCloud } = next;
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ preference, fallbackToCloud }),
          );
        } catch {}
        return next;
      }),
    setFallback: (f: boolean) =>
      set((state) => {
        const next: ModelState = { ...state, fallbackToCloud: f };
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
