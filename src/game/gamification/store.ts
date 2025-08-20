import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { levelForXp } from './model';

export type GamificationState = {
  xp: number;
  level: number;
  streak: number;
  lastCheckIn: string | null;
  addXp: (amount: number) => void;
  checkIn: () => void;
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      lastCheckIn: null,
      addXp: (amount) =>
        set((state) => {
          const xp = state.xp + Math.max(0, amount);
          const level = levelForXp(xp);
          return { xp, level };
        }),
      checkIn: () =>
        set((state) => {
          const today = new Date().toDateString();
          if (state.lastCheckIn === today) return {} as any;
          const streak = state.streak + 1;
          return { streak, lastCheckIn: today };
        }),
    }),
    {
      name: 'gamification',
      partialize: (s) => ({
        xp: s.xp,
        level: s.level,
        streak: s.streak,
        lastCheckIn: s.lastCheckIn,
      }),
    }
  )
);
