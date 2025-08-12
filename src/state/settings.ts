import { create } from 'zustand';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(__dirname, '../../settings/config.json');

export interface AppSettings {
  voiceOutput: boolean;
  hypnosisMode: boolean;
  memoryRetention: number;
}

function loadSettings(): AppSettings {
  try {
    const raw = readFileSync(configPath, 'utf-8');
    return JSON.parse(raw) as AppSettings;
  } catch {
    return { voiceOutput: true, hypnosisMode: false, memoryRetention: 30 };
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
}));

export function initSettings() {
  useAppSettings.getState();
}
