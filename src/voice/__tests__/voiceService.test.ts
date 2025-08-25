/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { useVoiceStore } from '@/state/voice';
import { guardPremiumAction } from '@/modules/payments/guard';
import { playClonedVoice } from '@/voice/voiceClone';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

let voiceService: typeof import('../voiceService').voiceService;

jest.mock('@/modules/payments/guard', () => ({
  guardPremiumAction: jest.fn<Promise<'pro' | 'free' | null>, []>(),
}));
jest.mock('@/voice/voiceClone', () => ({
  playClonedVoice: jest.fn<Promise<{ audio: any; error?: unknown }>, []>(),
}));
jest.mock('@/state/voice', () => {
  const { create } = require('zustand');
  const useVoiceStore = create((set: any) => ({
    isListening: false,
    isThinking: false,
    isSpeaking: false,
    mode: 'browser-tts',
    voiceId: null as string | null,
    setListening: (v: boolean) => set({ isListening: v }),
    setThinking: (v: boolean) => set({ isThinking: v }),
    setSpeaking: (v: boolean) => set({ isSpeaking: v }),
    setMode: (m: string, _persist = true) => set({ mode: m }),
    setVoiceId: (id: string | null) => set({ voiceId: id }),
  }));
  return { useVoiceStore };
});
jest.mock('@/state/featureFlags', () => ({
  useFeatureFlags: { getState: () => ({ isPro: false }) },
}));

class MockTrack {
  stop = jest.fn<void, []>();
}
class MockMediaStream {
  private tracks = [new MockTrack()];
  getTracks() {
    return this.tracks;
  }
}
class MockAudio {
  play = jest.fn<Promise<void>, []>().mockResolvedValue(undefined);
  pause = jest.fn<void, []>();
  srcObject: any = null;
}
class MockRTCPeerConnection {
  ondatachannel: any;
  ontrack: any;
  addTrack = jest.fn<void, []>();
  getSenders = jest.fn<{ track: MockTrack }[], []>(() => [{ track: new MockTrack() }]);
  createOffer = jest.fn<Promise<{ sdp: string; type: string }>, []>().mockResolvedValue({
    sdp: 'offer',
    type: 'offer',
  });
  setLocalDescription = jest.fn<void, []>();
  setRemoteDescription = jest.fn<void, []>();
  close = jest.fn<void, []>();
}

beforeAll(() => {
  const file = path.resolve(__dirname, '../voiceService.ts');
  const source = fs
    .readFileSync(file, 'utf8')
    .replace(/import.meta.env/g, 'process.env');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  });
  const m = { exports: {} as any };
  const func = new Function('require', 'module', 'exports', outputText);
  func(require, m, m.exports);
  voiceService = m.exports.voiceService;
});

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).Audio = jest.fn<MockAudio, []>(() => new MockAudio());
  (global as any).RTCPeerConnection = MockRTCPeerConnection as any;
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia: jest.fn<Promise<MockMediaStream>, []>().mockResolvedValue(new MockMediaStream()) },
    configurable: true,
  });
  (global as any).fetch = jest
    .fn<
      Promise<{ ok: boolean; json: () => Promise<{ sdp: string; type: string }> }>,
      []
    >()
    .mockResolvedValue({
      ok: true,
      json: async () => ({ sdp: 'answer', type: 'answer' }),
    });

  (window as any).speechSynthesis = {
    cancel: jest.fn<void, []>(),
    speak: jest.fn<void, []>(),
    getVoices: jest.fn<{ lang: string }[], []>(() => [{ lang: 'en-US' }]),
    resume: jest.fn<void, []>(),
  } as any;
  (global as any).SpeechSynthesisUtterance = class {
    text: string;
    onstart?: () => void;
    onend?: () => void;
    constructor(text: string) {
      this.text = text;
    }
  };

  const store = useVoiceStore.getState();
  store.setListening(false);
  store.setThinking(false);
  store.setSpeaking(false);
  store.setMode('browser-tts', false);
  store.setVoiceId(null);

  voiceService.enable();
});

afterEach(() => {
  jest.restoreAllMocks();
  voiceService.cancel();
});

describe('voiceService', () => {
  it('startListening updates store', async () => {
    await voiceService.startListening();
    const state = useVoiceStore.getState();
    expect(state.isListening).toBe(true);
    expect(state.isThinking).toBe(false);
  });

  it('stopListening updates store', async () => {
    await voiceService.startListening();
    voiceService.stopListening();
    const state = useVoiceStore.getState();
    expect(state.isListening).toBe(false);
    expect(state.isThinking).toBe(true);
  });

  it('speak handles autoplay blocking', async () => {
    let blocked: (() => void) | null = null;
    const off = voiceService.onPlaybackBlocked((cb) => {
      blocked = cb;
    });
    (guardPremiumAction as jest.Mock).mockResolvedValue('pro');
    useVoiceStore.getState().setMode('eleven-default', false);
    (playClonedVoice as jest.Mock).mockResolvedValue({
      audio: new (class extends MockAudio {
        play = jest.fn<Promise<void>, []>().mockRejectedValue({ name: 'NotAllowedError' });
      })(),
      error: { name: 'NotAllowedError' },
    });

    await voiceService.speak('hello');

    expect(typeof blocked).toBe('function');
    expect(typeof voiceService.getBlockedCallback()).toBe('function');
    off();
  });

  it('falls back when premium gating blocks cloned voice', async () => {
    useVoiceStore.getState().setMode('cloned', false);
    useVoiceStore.getState().setVoiceId('abc');
    (guardPremiumAction as jest.Mock).mockResolvedValue('free');
    (playClonedVoice as jest.Mock).mockResolvedValue({
      audio: new MockAudio(),
      error: null,
    });

    await voiceService.speak('hi');

    expect(guardPremiumAction).toHaveBeenCalled();
    expect(useVoiceStore.getState().mode).toBe('browser-tts');
    expect(playClonedVoice).not.toHaveBeenCalled();
  });

  it('cancel cleans up playback and state', () => {
    let blocked: (() => void) | null = () => {};
    const off = voiceService.onPlaybackBlocked((cb) => {
      blocked = cb;
    });
    const audio = new MockAudio();
    voiceService['audio'] = audio as any;
    const utter = new (SpeechSynthesisUtterance as any)('hi');
    voiceService['utter'] = utter as any;
    useVoiceStore.getState().setListening(true);
    useVoiceStore.getState().setSpeaking(true);
    const cancelSpy = jest.spyOn(window.speechSynthesis, 'cancel');

    voiceService.cancel();

    expect(cancelSpy).toHaveBeenCalled();
    const state = useVoiceStore.getState();
    expect(state.isListening).toBe(false);
    expect(state.isSpeaking).toBe(false);
    expect(voiceService.getBlockedCallback()).toBeNull();
    expect(blocked).toBeNull();
    off();
  });

  it('stopPlayback stops audio and resets speaking state', () => {
    let blocked: (() => void) | null = () => {};
    const off = voiceService.onPlaybackBlocked((cb) => {
      blocked = cb;
    });
    const audio = new MockAudio();
    voiceService['audio'] = audio as any;
    voiceService['audios'].add(audio as any);
    const utter = new (SpeechSynthesisUtterance as any)('hi');
    voiceService['utter'] = utter as any;
    useVoiceStore.getState().setSpeaking(true);
    const cancelSpy = jest.spyOn(window.speechSynthesis, 'cancel');

    voiceService.stopPlayback();

    expect(audio.pause).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
    expect(useVoiceStore.getState().isSpeaking).toBe(false);
    expect(blocked).toBeNull();
    off();
  });
});

