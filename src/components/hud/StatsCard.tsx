import { useGamificationStore } from '@/game/gamification/store';

export default function StatsCard() {
  const { xp, level, streak } = useGamificationStore();
  return (
    <div className="glass-panel rounded-xl p-4 text-sm">
      <div>Level: {level}</div>
      <div>XP: {xp}</div>
      <div>Streak: {streak}</div>
    </div>
  );
}
