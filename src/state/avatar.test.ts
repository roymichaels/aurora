import { useAvatarStore } from './avatar';

describe('useAvatarStore', () => {
  it('handles mood changes', () => {
    const store = useAvatarStore.getState();
    expect(store.mood).toBe('neutral');
    store.setMood('focused');
    expect(useAvatarStore.getState().mood).toBe('focused');
  });

  it('tracks milestones and streaks', () => {
    const store = useAvatarStore.getState();
    expect(store.milestone).toBe('none');
    store.setMilestone('goal');
    expect(useAvatarStore.getState().milestone).toBe('goal');
    expect(store.streak).toBe(0);
    store.setStreak(3);
    expect(useAvatarStore.getState().streak).toBe(3);
  });
});
