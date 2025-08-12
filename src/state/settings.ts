import { create } from 'zustand';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../../settings/config.json');

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

function loadSettings(): AppSettings {
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      voiceOutput: true,
      hypnosisMode: false,
      memoryRetention: 30,
      integrations: { calendar: false, todo: false, ...(parsed.integrations || {}) },
      ...parsed,
    };
  } catch {
    return {
      voiceOutput: true,
      hypnosisMode: false,
      memoryRetention: 30,
      integrations: { calendar: false, todo: false },
    };
  }
}

function saveSettings(s: AppSettings) {
  writeFileSync(configPath, JSON.stringify(s, null, 2));
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
