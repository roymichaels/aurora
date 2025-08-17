import { scheduleTrigger, Trigger } from './triggers';

describe('triggers', () => {
  it('does not log to console when email delivery has no address', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const trigger: Trigger = {
      message: 'Test',
      schedule: new Date(Date.now() - 1000),
      delivery: 'email',
    };

    scheduleTrigger(trigger);

    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
