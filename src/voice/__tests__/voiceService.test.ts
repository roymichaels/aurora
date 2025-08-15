/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { useVoiceStore } from '@/state/voice';
import { bus } from '@/utils/bus';
import { guardPremiumAction } from '@/modules/payments/guard';
import { playClonedVoice } from '@/voice/voiceClone';
import { ttsAutoplayToast } from '@/voice/ttsAutoplayToast';
import { ttsFallbackToast } from '@/voice/ttsFallbackToast';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

let voiceService: typeof import('../voiceService').voiceService;

jest.mock('@/modules/payments/guard', () => ({
  guardPremiumAction: jest.fn(),
}));
jest.mock('@/voice/voiceClone', () => ({
  playClonedVoice: jest.fn(),
}));
jest.mock('@/voice/ttsAutoplayToast', () => ({
  ttsAutoplayToast: jest.fn(),
}));
jest.mock('@/voice/ttsFallbackToast', () => ({
  ttsFallbackToast: jest.fn(),
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
  stop = jest.fn();
}
class MockMediaStream {
  private tracks = [new MockTrack()];
  getTracks() {
    return this.tracks;
  }
}
class MockAudio {
  play = jest.fn().mockResolvedValue(undefined);
  pause = jest.fn();
  srcObject: any = null;
}
class MockRTCPeerConnection {
  ondatachannel: any;
  ontrack: any;
  addTrack = jest.fn();
  getSenders = jest.fn(() => [{ track: new MockTrack() }]);
  createOffer = jest.fn().mockResolvedValue({ sdp: 'offer', type: 'offer' });
  setLocalDescription = jest.fn();
  setRemoteDescription = jest.fn();
  close = jest.fn();
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
  (global as any).Audio = jest.fn(() => new MockAudio());
  (global as any).RTCPeerConnection = MockRTCPeerConnection as any;
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: { getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream()) },
    configurable: true,
  });
  (global as any).fetch = jest
    .fn()
    .mockResolvedValue({ json: async () => ({ sdp: 'answer', type: 'answer' }) });

  (window as any).speechSynthesis = {
    cancel: jest.fn(),
    speak: jest.fn(),
    getVoices: jest.fn(() => [{ lang: 'en-US' }]),
    resume: jest.fn(),
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
  it('startListening emits event and updates store', async () => {
    const emitSpy = jest.spyOn(bus, 'emit');
    await voiceService.startListening();
    expect(emitSpy).toHaveBeenCalledWith('voice/listen:start', {});
    const state = useVoiceStore.getState();
    expect(state.isListening).toBe(true);
    expect(state.isThinking).toBe(false);
  });

  it('stopListening emits event and updates store', async () => {
    await voiceService.startListening();
    const emitSpy = jest.spyOn(bus, 'emit');
    emitSpy.mockClear();
    voiceService.stopListening();
    expect(emitSpy).toHaveBeenCalledWith('voice/listen:stop', {});
    const state = useVoiceStore.getState();
    expect(state.isListening).toBe(false);
    expect(state.isThinking).toBe(true);
  });

  it('speak handles autoplay blocking', async () => {
    const emitSpy = jest.spyOn(bus, 'emit');
    useVoiceStore.getState().setMode('eleven-default', false);
    (playClonedVoice as jest.Mock).mockResolvedValue({
      audio: new (class extends MockAudio {
        play = jest.fn().mockRejectedValue({ name: 'NotAllowedError' });
      })(),
      error: { name: 'NotAllowedError' },
    });

    await voiceService.speak('hello');

    expect(ttsAutoplayToast).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('voice/playback:blocked', {
      callback: expect.any(Function),
    });
    expect(typeof voiceService.getBlockedCallback()).toBe('function');
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
    expect(useVoiceStore.getState().mode).toBe('eleven-default');
    expect(playClonedVoice).toHaveBeenCalledWith(
      'hi',
      '21m00Tcm4TlvDq8ikWAM',
      expect.any(Object),
    );
  });

  it('cancel cleans up playback and state', () => {
    const emitSpy = jest.spyOn(bus, 'emit');
    const audio = new MockAudio();
    voiceService['audio'] = audio as any;
    const utter = new (SpeechSynthesisUtterance as any)('hi');
    voiceService['utter'] = utter as any;
    useVoiceStore.getState().setListening(true);
    useVoiceStore.getState().setSpeaking(true);
    const cancelSpy = jest.spyOn(window.speechSynthesis, 'cancel');

    voiceService.cancel();

    expect(audio.pause).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('voice/playback:blocked', {
      callback: null,
    });
    const state = useVoiceStore.getState();
    expect(state.isListening).toBe(false);
    expect(state.isSpeaking).toBe(false);
    expect(voiceService.getBlockedCallback()).toBeNull();
  });
});

