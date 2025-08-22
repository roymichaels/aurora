import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, type Stat } from '@/data/db';
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
    (set, get) => {
      const updateStats = (
        updater: (state: GamificationState) => Partial<GamificationState>
      ) =>

        set((state) => {
          const partial = updater(state);
          const xp = partial.xp ?? state.xp;
          const level = levelForXp(xp);
          const lastCheckIn = partial.lastCheckIn ?? state.lastCheckIn;
          let streak = state.streak;
          if (partial.lastCheckIn && partial.lastCheckIn !== state.lastCheckIn) {
            streak = state.streak + 1;
          }
          return { xp, level, streak, lastCheckIn };
        });

      return {
        xp: 0,
        level: 1,
        streak: 0,
        lastCheckIn: null,
        addXp: (amount) => {
          updateStats((state) => ({
            xp: state.xp + Math.max(0, amount),
          }));
          get().persistStats();
        },
        checkIn: () => {
          updateStats((state) => {
            const today = new Date().toDateString();
            if (state.lastCheckIn === today) return {} as any;
            return { lastCheckIn: today };
          });
          get().persistStats();
        },
        persistStats: async () => {
          const { xp, level, streak, lastCheckIn } = get();
          const now = new Date().toISOString();
          await db.stats.put({
            id: 'local',
            xp,
            level,
            streak,
            lastCheckIn,
            created_at: now,
            updated_at: now,
          });
        },
      };
    },

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

export function initializeGamificationStore(stat?: Stat) {
  useGamificationStore.setState({
    xp: stat?.xp ?? 0,
    level: levelForXp(stat?.xp ?? 0),
    streak: stat?.streak ?? 0,
    lastCheckIn: stat?.lastCheckIn ?? null,
  });
}
