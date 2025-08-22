import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/data/db';
import { levelForXp } from './model';

export type GamificationState = {
  xp: number;
  level: number;
  streak: number;
  lastCheckIn: string | null;
  addXp: (amount: number) => void;
  checkIn: () => void;
  persistStats: () => Promise<void>;
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      lastCheckIn: null,
      addXp: (amount) => {
        set((state) => {
          const xp = state.xp + Math.max(0, amount);
          const level = levelForXp(xp);
          return { xp, level };
        });
        get().persistStats();
      },
      checkIn: () => {
        let updated = false;
        set((state) => {
          const today = new Date().toDateString();
          if (state.lastCheckIn === today) return {} as any;
          updated = true;
          const streak = state.streak + 1;
          return { streak, lastCheckIn: today };
        });
        if (updated) get().persistStats();
      },
      persistStats: async () => {
        const { xp, level, streak } = get();
        const now = new Date().toISOString();
        await db.stats.put({
          id: 'local',
          level,
          total_xp: xp,
          streak_count: streak,
          last_active_date: now,
          created_at: now,
          updated_at: now,
        });
      },
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
