import React, { useEffect } from 'react';
import { AvatarSphere } from './AvatarSphere';
import { useAvatarStore, type AvatarMood } from '@/state/avatar';

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

export const Neutral = () => <MoodStory mood="neutral" />;
export const Focused = () => <MoodStory mood="focused" />;
export const Relaxed = () => <MoodStory mood="relaxed" />;
