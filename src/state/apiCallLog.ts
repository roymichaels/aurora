import { create } from 'zustand';

export interface ApiCallEntry {
  id: string;
  endpoint: string;
  reason: string;
  timestamp: string;
}

interface ApiCallLogState {
  log: ApiCallEntry[];
  add: (endpoint: string, reason: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'apiCallLog';

export const useApiCallLog = create<ApiCallLogState>((set) => {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  const initial: ApiCallEntry[] = raw ? JSON.parse(raw) : [];
  return {
    log: initial,
    add: (endpoint, reason) =>
      set((state) => {
        const entry: ApiCallEntry = {
          id: Math.random().toString(36).slice(2),
          endpoint,
          reason,
          timestamp: new Date().toISOString(),
        };
        const log = [...state.log, entry];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
        } catch {}
        return { log };
      }),
    clear: () =>
      set(() => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        return { log: [] };
      }),
  };
});
