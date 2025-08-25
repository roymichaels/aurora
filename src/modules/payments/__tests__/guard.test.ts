import { jest } from '@jest/globals';
import { guardPremiumAction } from '../guard';
import { logEvent } from '@/integrations/db';

jest.mock('@/integrations/db', () => ({
  logEvent: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

describe('guardPremiumAction', () => {
  const originalConfirm = global.confirm;
  afterEach(() => {
    global.confirm = originalConfirm;
    (logEvent as jest.Mock).mockClear();
  });

  it('allows pro users without prompting', async () => {
    const result = await guardPremiumAction(() => true, 'voice_features', 'voice_clone', 'use default voice');
    expect(result).toBe('pro');
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('prompts and logs when feature is unavailable', async () => {
    global.confirm = jest.fn<() => boolean>(() => true);
    const result = await guardPremiumAction(() => false, 'voice_features', 'voice_clone', 'use default voice');
    expect(result).toBe('free');
    expect(logEvent).toHaveBeenCalledWith('pro_action_upsell', { action: 'voice_clone' });
  });

  it('returns null when user cancels', async () => {
    global.confirm = jest.fn<() => boolean>(() => false);
    const result = await guardPremiumAction(() => false, 'voice_features', 'voice_clone', 'use default voice');
    expect(result).toBeNull();
    expect(logEvent).toHaveBeenCalledWith('pro_action_upsell', { action: 'voice_clone' });
  });

  it('executes free alternative after confirmation', async () => {
    global.confirm = jest.fn<() => boolean>(() => true);
    const result = await guardPremiumAction(() => false, 'voice_features', 'voice_clone', 'use default voice');
    const alternative = jest.fn<() => void>();
    if (result === 'free') {
      alternative();
    }
    expect(alternative).toHaveBeenCalled();
  });
});

