import { nanoid } from 'nanoid';
import { db } from '@/data/db';
import { useGamificationStore } from './store';

export type AwardArgs = {
  xp?: number;
  achievement?: string;
};

function logAchievement(achievement: string) {
  db.achievements.add({
    id: nanoid(),
    name: achievement,
    earned_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export function award({ xp = 0, achievement }: AwardArgs) {
  if (xp > 0) {
    useGamificationStore.getState().addXp(xp);
    void useGamificationStore.getState().persistStats();
  }
  if (achievement) {
    logAchievement(achievement);
  }
}
