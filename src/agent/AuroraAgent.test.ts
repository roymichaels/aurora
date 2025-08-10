import { describe, it, expect, vi } from 'vitest';
import { AuroraAgent } from './AuroraAgent';

const startMock = vi.fn();
const stopMock = vi.fn();
const speakMock = vi.fn();

vi.mock('@/voice/voiceio', () => ({
  VoiceIO: vi.fn().mockImplementation(() => ({
    startPushToTalk: startMock,
    stopListening: stopMock,
    speak: speakMock,
  })),
}));

vi.mock('@/agent/tool-impl', () => ({ ToolImpl: {} }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: vi.fn() } } }));

describe('AuroraAgent', () => {
  it('handles push-to-talk and speech', () => {
    const events = { onListeningChange: vi.fn(), onResponse: vi.fn() };
    const agent = new AuroraAgent(events);

    agent.startPTT();
    expect(startMock).toHaveBeenCalled();
    expect(events.onListeningChange).toHaveBeenCalledWith(true);

    agent.say('hi');
    expect(speakMock).toHaveBeenCalledWith('hi');
    expect(events.onResponse).toHaveBeenCalledWith('hi');

    agent.stopPTT();
    expect(stopMock).toHaveBeenCalled();
    expect(events.onListeningChange).toHaveBeenCalledWith(false);
  });
});
