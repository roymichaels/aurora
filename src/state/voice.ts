import { create } from 'zustand';
import { bus } from '@/utils/bus';

const VOICE_ID_KEY = 'aurora.voiceId';
const VOICE_SPEED_KEY = 'aurora.voiceSpeed';
const VOICE_PITCH_KEY = 'aurora.voicePitch';
const VOICE_EXPR_KEY = 'aurora.voiceExpression';
const VOICE_EMOTION_KEY = 'aurora.voiceEmotion';
const VOICE_MODE_KEY = 'aurora.voiceMode';
const VOICE_LOCALE_KEY = 'aurora.voiceLocale';
const VOICE_LISTEN_MODE_KEY = 'aurora.voiceListenMode';

type VoiceMode =
  | 'cloned'
  | 'eleven-default'
  | 'browser-tts'
  | 'local-tts'
  | 'off';

type ListenMode = 'push-to-talk' | 'toggle';

type VoiceState = {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  voiceId: string | null;
  mode: VoiceMode;
  locale: string;
  speed: number;
  pitch: number;
  expression: number;
  emotion: string;
  listenMode: ListenMode;
  setListening: (v: boolean) => void;
  setThinking: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  setVoiceId: (id: string | null) => void;
  setMode: (m: VoiceMode, persist?: boolean) => void; // <- align with impl
  setLocale: (l: string) => void;
  setSpeed: (v: number) => void;
  setPitch: (v: number) => void;
  setExpression: (v: number) => void;
  setEmotion: (v: string) => void;
  setListenMode: (m: ListenMode) => void;
};

export const useVoiceStore = create<VoiceState>((set) => {
  bus.on('voice/state:set', ({ state }) => {
    set({
      isThinking: state === 'thinking',
      isSpeaking: state === 'speaking',
    });
  });

  bus.on('voice/listen:start', () => {
    set({ isListening: true });
  });
  bus.on('voice/listen:stop', () => {
    set({ isListening: false });
  });

  const hasWindow = typeof window !== 'undefined';
  const ls = hasWindow ? window.localStorage : null;

  return {
    isListening: false,
    isThinking: false,
    isSpeaking: false,
    voiceId: hasWindow ? ls!.getItem(VOICE_ID_KEY) : null,
    mode: hasWindow
      ? (ls!.getItem(VOICE_MODE_KEY) as VoiceMode) ||
        (import.meta.env.VITE_ELEVEN_API_KEY ? 'eleven-default' : 'browser-tts')
      : 'browser-tts',
    locale: hasWindow
      ? ls!.getItem(VOICE_LOCALE_KEY) || navigator.language || 'en-US'
      : 'en-US',
    speed: hasWindow ? Number(ls!.getItem(VOICE_SPEED_KEY) || 1) : 1,
    pitch: hasWindow ? Number(ls!.getItem(VOICE_PITCH_KEY) || 1) : 1,
    expression: hasWindow ? Number(ls!.getItem(VOICE_EXPR_KEY) || 1) : 1,
    emotion: hasWindow
      ? ls!.getItem(VOICE_EMOTION_KEY) || 'neutral'
      : 'neutral',
    listenMode: hasWindow
      ? ((ls!.getItem(VOICE_LISTEN_MODE_KEY) as ListenMode) || 'push-to-talk')
      : 'push-to-talk',

    setListening: (v) => set({ isListening: v }),
    setThinking: (v) => set({ isThinking: v }),
    setSpeaking: (v) => set({ isSpeaking: v }),

    setVoiceId: (id) => {
      try {
        if (id) ls?.setItem(VOICE_ID_KEY, id);
        else ls?.removeItem(VOICE_ID_KEY);
      } catch {
        /* empty */
      }
      set({ voiceId: id });
    },

    setMode: (mode, persist = true) => {
      if (persist) {
        try {
          ls?.setItem(VOICE_MODE_KEY, mode);
        } catch {
          /* empty */
        }
      }
      set({ mode });
    },

    setLocale: (locale) => {
      try {
        ls?.setItem(VOICE_LOCALE_KEY, locale);
      } catch {
        /* empty */
      }
      set({ locale });
    },

    setSpeed: (speed) => {
      try {
        ls?.setItem(VOICE_SPEED_KEY, String(speed));
      } catch {
        /* empty */
      }
      set({ speed });
    },

    setPitch: (pitch) => {
      try {
        ls?.setItem(VOICE_PITCH_KEY, String(pitch));
      } catch {
        /* empty */
      }
      set({ pitch });
    },

    setExpression: (expression) => {
      try {
        ls?.setItem(VOICE_EXPR_KEY, String(expression));
      } catch {
        /* empty */
      }
      set({ expression });
    },

    setEmotion: (emotion) => {
      try {
        ls?.setItem(VOICE_EMOTION_KEY, emotion);
      } catch {
        /* empty */
      }
      set({ emotion });
    },

    setListenMode: (listenMode) => {
      try {
        ls?.setItem(VOICE_LISTEN_MODE_KEY, listenMode);
      } catch {
        /* empty */
      }
      set({ listenMode });
    }, // <- no extra comma after the last property
  };
});
