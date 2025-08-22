
import { nanoid } from 'nanoid';
import { db } from '@/data/db';
import { useGamificationStore } from './store';

export type AwardArgs = {
  xp?: number;
  achievement?: string;
};

async function logAchievement(achievement: string) {
  const timestamp = new Date().toISOString();
  await db.achievements.add({
    id: nanoid(),
    name: achievement,
    earned_at: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  });
}

export function award({ xp = 0, achievement }: AwardArgs) {
  if (xp > 0) {
    useGamificationStore.getState().addXp(xp);
    void useGamificationStore.getState().persistStats();
  }
  if (achievement) {
    void logAchievement(achievement);
  }
}
