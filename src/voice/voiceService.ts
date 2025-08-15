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
  private connections = new Set<RTCPeerConnection>();
  private streams = new Set<MediaStream>();
  private audios = new Set<HTMLAudioElement>();
  private enableHandler?: () => void;
  private beforeUnloadHandler?: () => void;
  private transcriptListeners = new Set<(text: string) => void>();
  private playbackBlockedListeners = new Set<(cb: (() => void) | null) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('aurora_voice_enabled') === '1';
      this.enableHandler = () => this.enable();
      if (!this.enabled) {
        window.addEventListener('pointerdown', this.enableHandler, { once: true });
        window.addEventListener('keydown', this.enableHandler, { once: true });
      }
      this.beforeUnloadHandler = () => this.destroy();
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
    }
  }

  onTranscript(cb: (text: string) => void) {
    this.transcriptListeners.add(cb);
    return () => this.transcriptListeners.delete(cb);
  }

  onPlaybackBlocked(cb: (callback: (() => void) | null) => void) {
    this.playbackBlockedListeners.add(cb);
    return () => this.playbackBlockedListeners.delete(cb);
  }

  private emitTranscript(text: string) {
    this.transcriptListeners.forEach((cb) => cb(text));
  }

  private emitPlaybackBlocked(callback: (() => void) | null) {
    this.playbackBlockedListeners.forEach((cb) => cb(callback));
  }

  enable() {
    this.enabled = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurora_voice_enabled', '1');
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.resume();
      } catch {
        /* ignore */
      }
    }
  }

  async startListening() {
    if (this.pc) return;
    const pc = new RTCPeerConnection();
    this.pc = pc;
    this.connections.add(pc);

    pc.ondatachannel = (e) => {
      this.channel = e.channel;
      e.channel.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.transcript) {
            useVoiceStore.getState().setThinking(false);
            this.emitTranscript(msg.transcript);
          }
          if (msg.audio) {
            const audio = new Audio('data:audio/wav;base64,' + msg.audio);
            this.audio = audio;
            this.audios.add(audio);
            audio.play().catch((err) => {
              if ((err as { name?: string } | undefined)?.name === 'NotAllowedError') {
                ttsAutoplayToast();
                this.blocked = () => {
                  audio.play().catch(() => {});
                };
                this.emitPlaybackBlocked(this.blocked);
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
      this.audios.add(audio);
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;
    this.streams.add(stream);
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
  }

  stopListening() {
    this.channel?.close();
    if (this.pc) {
      this.pc.getSenders().forEach((s) => s.track?.stop());
      this.pc.close();
      this.connections.delete(this.pc);
    }
    this.pc = null;
    this.channel = null;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.streams.delete(this.stream);
    }
    this.stream = null;
    useVoiceStore.getState().setListening(false);
    useVoiceStore.getState().setThinking(true);
  }

  async speak(text: string) {
    if (!text?.trim()) return;
    this.blocked = null;
    this.emitPlaybackBlocked(null);
    if (!this.enabled) {
      ttsAutoplayToast();
      const resume = () => {
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('keydown', resume);
        this.enable();
        void this.speak(text);
      };
      this.blocked = resume;
      this.emitPlaybackBlocked(this.blocked);
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
          'use the browser voice instead',
        );
        if (result !== 'pro') {
          current = 'browser-tts';
          store.setMode('browser-tts', false);
          ttsFallbackToast();
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
          this.audios.add(audio);
          if ((error as { name?: string } | undefined)?.name === 'NotAllowedError') {
            ttsAutoplayToast();
            this.blocked = () => {
              audio.play().catch(() => {});
            };
            this.emitPlaybackBlocked(this.blocked);
          }
          return;
        }
        const status = (error as { status?: number } | undefined)?.status;
        if (status === 401 || status === 429) {
          ttsFallbackToast();
          current = 'browser-tts';
          store.setMode('browser-tts', false);
          continue;
        }
        current = 'eleven-default';
        store.setMode('eleven-default', false);
        continue;
      }
      if (current === 'eleven-default') {
        const canAccess = (feature: string) => {
          if (feature === 'voice_features') {
            return useFeatureFlags.getState().isPro;
          }
          return true;
        };
        const result = await guardPremiumAction(
          canAccess,
          'voice_features',
          'voice_default',
          'use the browser voice instead',
        );
        if (result !== 'pro') {
          current = 'browser-tts';
          store.setMode('browser-tts', false);
          ttsFallbackToast();
          continue;
        }
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
          this.audios.add(audio);
          if ((error as { name?: string } | undefined)?.name === 'NotAllowedError') {
            ttsAutoplayToast();
            this.blocked = () => {
              audio.play().catch(() => {});
            };
            this.emitPlaybackBlocked(this.blocked);
          }
          return;
        }
        ttsFallbackToast();
        current = 'browser-tts';
        store.setMode('browser-tts', false);
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
          try {
            window.speechSynthesis.speak(utter);
          } catch (err) {
            if ((err as { name?: string } | undefined)?.name === 'NotAllowedError') {
              ttsAutoplayToast();
              this.blocked = () => {
                window.speechSynthesis.speak(utter);
              };
              this.emitPlaybackBlocked(this.blocked);
            }
            return;
          }
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
    this.channel = null;
    this.connections.forEach((pc) => {
      pc.getSenders().forEach((s) => s.track?.stop());
      pc.close();
    });
    this.connections.clear();
    this.pc = null;
    this.streams.forEach((s) => {
      s.getTracks().forEach((t) => t.stop());
    });
    this.streams.clear();
    this.stream = null;
    this.audios.forEach((a) => {
      a.pause();
      a.srcObject = null;
    });
    this.audios.clear();
    this.audio = null;
    if (this.utter) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
      this.utter = null;
    }
    this.blocked = null;
    this.emitPlaybackBlocked(null);
    useVoiceStore.getState().setListening(false);
    useVoiceStore.getState().setSpeaking(false);
  }

  destroy() {
    this.cancel();
    if (typeof window !== 'undefined') {
      if (this.enableHandler) {
        window.removeEventListener('pointerdown', this.enableHandler);
        window.removeEventListener('keydown', this.enableHandler);
        this.enableHandler = undefined;
      }
      if (this.beforeUnloadHandler) {
        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        this.beforeUnloadHandler = undefined;
      }
    }
  }

  resume() {
    if (this.blocked) {
      const cb = this.blocked;
      this.blocked = null;
      this.emitPlaybackBlocked(null);
      cb();
    }
  }

  getBlockedCallback() {
    return this.blocked;
  }
}

export const voiceService = new VoiceService();

