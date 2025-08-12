import { create } from 'zustand';

export interface IntegrationsConfig {
  calendar: boolean;
  todo: boolean;
}

export interface AppSettings {
  voiceOutput: boolean;
  hypnosisMode: boolean;
  memoryRetention: number;
  integrations: IntegrationsConfig;
}

const STORAGE_KEY = 'app-settings';

const defaultSettings: AppSettings = {
  voiceOutput: true,
  hypnosisMode: false,
  memoryRetention: 30,
  integrations: { calendar: false, todo: false },
};

function loadSettings(): AppSettings {
  if (typeof localStorage === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      integrations: {
        ...defaultSettings.integrations,
        ...(parsed.integrations ?? {}),
      },
    };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(s: AppSettings) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore write errors
  }
}

const initial = loadSettings();

export const useAppSettings = create<AppSettings & {
  toggleVoiceOutput: () => void;
  toggleHypnosisMode: () => void;
  setMemoryRetention: (v: number) => void;
  toggleCalendarIntegration: () => void;
  toggleTodoIntegration: () => void;
}>((set, get) => ({
  ...initial,
  toggleVoiceOutput() {
    const next = { ...get(), voiceOutput: !get().voiceOutput };
    saveSettings(next);
    set(next);
  },
  toggleHypnosisMode() {
    const next = { ...get(), hypnosisMode: !get().hypnosisMode };
    saveSettings(next);
    set(next);
  },
  setMemoryRetention(v: number) {
    const next = { ...get(), memoryRetention: v };
    saveSettings(next);
    set(next);
  },
  toggleCalendarIntegration() {
    const next = {
      ...get(),
      integrations: {
        ...get().integrations,
        calendar: !get().integrations.calendar,
      },
    };
    saveSettings(next);
    set(next);
  },
  toggleTodoIntegration() {
    const next = {
      ...get(),
      integrations: {
        ...get().integrations,
        todo: !get().integrations.todo,
      },
    };
    saveSettings(next);
    set(next);
  },
}));

export function initSettings() {
  useAppSettings.getState();
}
