import { useAvatarStore } from './avatar';

describe('useAvatarStore', () => {
  it('handles mood changes', () => {
    const store = useAvatarStore.getState();
    expect(store.mood).toBe('neutral');
    store.setMood('focused');
    expect(useAvatarStore.getState().mood).toBe('focused');
  });
});
