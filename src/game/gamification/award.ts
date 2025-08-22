import { useGamificationStore } from './store';

export type AwardArgs = {
  xp?: number;
  achievement?: string;
};

export function award({ xp = 0, achievement }: AwardArgs) {
  if (xp > 0) {
    useGamificationStore.getState().addXp(xp);
    useGamificationStore.getState().persistStats();
  }
  if (achievement) {
    console.debug('achievement unlocked', achievement);
  }
}
