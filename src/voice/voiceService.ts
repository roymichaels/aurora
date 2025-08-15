import { bus } from '@/utils/bus';
import { useVoiceStore } from '@/state/voice';
import { useFeatureFlags } from '@/state/featureFlags';
import { guardPremiumAction } from '@/modules/payments/guard';
import { playClonedVoice } from '@/voice/voiceClone';
import { ttsFallbackToast } from '@/voice/ttsFallbackToast';
import { ttsAutoplayToast } from '@/voice/ttsAutoplayToast';

const ELEVENLABS_DEFAULT_VOICE_ID =
  import.meta.env.VITE_ELEVENLABS_DEFAULT_VOICE_ID ||
  '21m00Tcm4TlvDq8ikWAM';

class VoiceService {
  private pc: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private stream: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private utter: SpeechSynthesisUtterance | null = null;
  private blocked: (() => void) | null = null;
  private enabled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('aurora_voice_enabled') === '1';
      const enable = () => {
        this.enabled = true;
        localStorage.setItem('aurora_voice_enabled', '1');
        try {
          window.speechSynthesis.getVoices();
          window.speechSynthesis.resume();
        } catch {
          /* ignore */
        }
      };
      if (!this.enabled) {
        window.addEventListener('pointerdown', enable, { once: true });
        window.addEventListener('keydown', enable, { once: true });
      }
      window.addEventListener('beforeunload', () => this.cancel());
    }
  }

  async startListening() {
    if (this.pc) return;
    const pc = new RTCPeerConnection();
    this.pc = pc;

    pc.ondatachannel = (e) => {
      this.channel = e.channel;
      e.channel.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.transcript) {
            useVoiceStore.getState().setThinking(false);
            bus.emit('voice/transcript', { text: msg.transcript });
          }
          if (msg.audio) {
            const audio = new Audio('data:audio/wav;base64,' + msg.audio);
            this.audio = audio;
            audio.play().catch((err) => {
              if ((err as { name?: string } | undefined)?.name === 'NotAllowedError') {
                ttsAutoplayToast();
                this.blocked = () => {
                  audio.play().catch(() => {});
                };
              }
            });
          }
        } catch {
          /* ignore */
        }
      };
    };

    pc.ontrack = (ev) => {
      const audio = new Audio();
      audio.srcObject = ev.streams[0];
      audio.play().catch(() => {});
      this.audio = audio;
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const res = await fetch('/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
    });
    const answer = await res.json();
    await pc.setRemoteDescription(answer);
    useVoiceStore.getState().setListening(true);
    useVoiceStore.getState().setThinking(false);
    bus.emit('voice/listen:start', {});
  }

  stopListening() {
    this.channel?.close();
    this.pc?.getSenders().forEach((s) => s.track?.stop());
    this.pc?.close();
    this.pc = null;
    this.channel = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    useVoiceStore.getState().setListening(false);
    useVoiceStore.getState().setThinking(true);
    bus.emit('voice/listen:stop', {});
  }

  async speak(text: string) {
    if (!text?.trim()) return;
    this.blocked = null;
    if (!this.enabled) {
      ttsAutoplayToast();
      const resume = () => {
        this.enabled = true;
        localStorage.setItem('aurora_voice_enabled', '1');
        void this.speak(text);
      };
      window.addEventListener('pointerdown', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
      return;
    }

    bus.emit('sphere/state:set', { state: 'thinking' });
    bus.emit('voice/state:set', { state: 'thinking' });

    const store = useVoiceStore.getState();
    let current = store.mode;
    const locale = navigator.language;
    const { voiceId, speed, pitch, expression, emotion } = store;

    while (current && current !== 'off') {
      if (current === 'cloned') {
        const canAccess = (feature: string) => {
          if (feature === 'voice_features') {
            return useFeatureFlags.getState().isPro;
          }
          return true;
        };
        const result = await guardPremiumAction(
          canAccess,
          'voice_features',
          'voice_clone',
          'use the default voice instead',
        );
        if (result === null) {
          bus.emit('sphere/state:set', { state: 'thinking' });
          bus.emit('voice/state:set', { state: 'thinking' });
          return;
        }
        if (result === 'free') {
          current = 'eleven-default';
          store.setMode('eleven-default', false);
          continue;
        }
        if (!voiceId) {
          current = 'eleven-default';
          store.setMode('eleven-default', false);
          continue;
        }
        const { audio, error } = await playClonedVoice(text, voiceId, {
          emotion,
          speed,
          pitch,
          expression,
          onStart: () => {
            useVoiceStore.getState().setSpeaking(true);
            bus.emit('sphere/state:set', { state: 'speaking' });
            bus.emit('voice/state:set', { state: 'speaking' });
          },
          onEnd: () => {
            useVoiceStore.getState().setSpeaking(false);
            bus.emit('sphere/state:set', { state: 'thinking' });
            bus.emit('voice/state:set', { state: 'thinking' });
          },
        });
        if (audio) {
          this.audio = audio;
          if ((error as { name?: string } | undefined)?.name === 'NotAllowedError') {
            ttsAutoplayToast();
            this.blocked = () => {
              audio.play().catch(() => {});
            };
          }
          return;
        }
        const status = (error as { status?: number } | undefined)?.status;
        if (status === 401 || status === 429) ttsFallbackToast();
        current = 'eleven-default';
        store.setMode('eleven-default', false);
        continue;
      }
      if (current === 'eleven-default') {
        const { audio, error } = await playClonedVoice(
          text,
          ELEVENLABS_DEFAULT_VOICE_ID,
          {
            emotion,
            speed,
            pitch,
            expression,
            onStart: () => {
              useVoiceStore.getState().setSpeaking(true);
              bus.emit('sphere/state:set', { state: 'speaking' });
              bus.emit('voice/state:set', { state: 'speaking' });
            },
            onEnd: () => {
              useVoiceStore.getState().setSpeaking(false);
              bus.emit('sphere/state:set', { state: 'thinking' });
              bus.emit('voice/state:set', { state: 'thinking' });
            },
          },
        );
        if (audio) {
          this.audio = audio;
          if ((error as { name?: string } | undefined)?.name === 'NotAllowedError') {
            ttsAutoplayToast();
            this.blocked = () => {
              audio.play().catch(() => {});
            };
          }
          return;
        }
        current = 'browser-tts';
        store.setMode('browser-tts', false);
        ttsFallbackToast();
        continue;
      }
      if (current === 'browser-tts') {
        try {
          window.speechSynthesis.cancel();
          let voices = window.speechSynthesis.getVoices();
          if (!voices.length) {
            await new Promise((r) => setTimeout(r, 250));
            voices = window.speechSynthesis.getVoices();
          }
          const v = voices.find(
            (vo) => vo.lang === locale || vo.lang.startsWith(locale.split('-')[0]),
          );
          if (!v) {
            current = 'off';
            store.setMode('off', false);
            continue;
          }
          const utter = new SpeechSynthesisUtterance(text);
          utter.voice = v;
          utter.onstart = () => {
            useVoiceStore.getState().setSpeaking(true);
            bus.emit('sphere/state:set', { state: 'speaking' });
            bus.emit('voice/state:set', { state: 'speaking' });
          };
          utter.onend = () => {
            useVoiceStore.getState().setSpeaking(false);
            bus.emit('sphere/state:set', { state: 'thinking' });
            bus.emit('voice/state:set', { state: 'thinking' });
          };
          this.utter = utter;
          window.speechSynthesis.speak(utter);
          return;
        } catch {
          current = 'off';
          store.setMode('off', false);
          continue;
        }
      }
    }
    bus.emit('sphere/state:set', { state: 'thinking' });
    bus.emit('voice/state:set', { state: 'thinking' });
  }

  cancel() {
    this.channel?.close();
    this.pc?.getSenders().forEach((s) => s.track?.stop());
    this.pc?.close();
    this.pc = null;
    this.channel = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.srcObject = null;
      this.audio = null;
    }
    if (this.utter) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
      this.utter = null;
    }
    this.blocked = null;
    useVoiceStore.getState().setListening(false);
    useVoiceStore.getState().setSpeaking(false);
  }

  getBlockedCallback() {
    return this.blocked;
  }
}

export const voiceService = new VoiceService();

