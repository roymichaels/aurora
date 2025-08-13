import React, { useEffect } from 'react';
import { AvatarSphere } from './AvatarSphere';
import {
  useAvatarStore,
  type AvatarMood,
  type AvatarMilestone,
} from '@/state/avatar';

export default {
  title: 'Avatar/AvatarSphere',
  component: AvatarSphere,
};

function MoodStory({ mood }: { mood: AvatarMood }) {
  const setMood = useAvatarStore((s) => s.setMood);
  useEffect(() => {
    setMood(mood);
  }, [mood, setMood]);
  return <AvatarSphere />;
}

function MilestoneStory({
  milestone,
  streak = 0,
}: {
  milestone: AvatarMilestone;
  streak?: number;
}) {
  const setMilestone = useAvatarStore((s) => s.setMilestone);
  const setStreak = useAvatarStore((s) => s.setStreak);
  useEffect(() => {
    setMilestone(milestone);
    setStreak(streak);
  }, [milestone, streak, setMilestone, setStreak]);
  return <AvatarSphere />;
}

export const Neutral = () => <MoodStory mood="neutral" />;
export const Focused = () => <MoodStory mood="focused" />;
export const Relaxed = () => <MoodStory mood="relaxed" />;
export const GoalCompleted = () => <MilestoneStory milestone="goal" />;
export const StreakAchieved = () => (
  <MilestoneStory milestone="streak" streak={5} />
);
