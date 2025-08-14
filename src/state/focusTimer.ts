import { create } from 'zustand';

export type TimerMode = 'pomodoro' | 'free';

interface TimerState {
  mode: TimerMode;
  duration: number; // ms
  remaining: number; // ms
  running: boolean;
  interval?: number;
  progress: number; // 0-100
  start: (mode?: TimerMode) => void;
  pause: () => void;
  resume: () => void;
  toggleMode: () => void;
}

const POMODORO_MS = 25 * 60 * 1000;

export const useFocusTimer = create<TimerState>((set, get) => ({
  mode: 'pomodoro',
  duration: POMODORO_MS,
  remaining: POMODORO_MS,
  running: false,
  progress: 0,
  start: (m) => {
    const mode = m ?? get().mode;
    const dur = mode === 'pomodoro' ? POMODORO_MS : 0;
    const rem = dur;
    const tick = () => {
      set((s) => {
        if (!s.running) return s;
        const next = s.remaining - 1000;
        if (next <= 0) {
          clearInterval(get().interval);
          return { ...s, remaining: 0, running: false, interval: undefined, progress: 100 };
        }
        return { ...s, remaining: next, progress: s.duration ? ((s.duration - next) / s.duration) * 100 : 0 };
      });
    };
    const id = window.setInterval(tick, 1000);
    set({ mode, duration: dur, remaining: rem, running: true, interval: id, progress: 0 });
  },
  pause: () => {
    const id = get().interval;
    if (id) clearInterval(id);
    set({ running: false, interval: undefined });
  },
  resume: () => {
    if (get().running || get().remaining <= 0) return;
    const tick = () => {
      set((s) => {
        if (!s.running) return s;
        const next = s.remaining - 1000;
        if (next <= 0) {
          clearInterval(get().interval);
          return { ...s, remaining: 0, running: false, interval: undefined, progress: 100 };
        }
        return { ...s, remaining: next, progress: s.duration ? ((s.duration - next) / s.duration) * 100 : 0 };
      });
    };
    const id = window.setInterval(tick, 1000);
    set({ running: true, interval: id });
  },
  toggleMode: () => {
    const next = get().mode === 'pomodoro' ? 'free' : 'pomodoro';
    get().pause();
    const dur = next === 'pomodoro' ? POMODORO_MS : 0;
    set({ mode: next, duration: dur, remaining: dur, progress: 0 });
  },
}));

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
