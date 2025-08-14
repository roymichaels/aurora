import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceStore } from "@/state/voice";
import { playClonedVoice } from "./voiceClone";
import { ttsFallbackToast } from "@/voice/ttsFallbackToast";
import { ttsAutoplayToast } from "@/voice/ttsAutoplayToast";
import { useSubscription } from "@/modules/payments/hooks/useSubscription";
import { guardPremiumAction } from "@/modules/payments/guard";

function fire(type: string, detail: boolean) {
  window.dispatchEvent(new CustomEvent(type, { detail }));
  const store = useVoiceStore.getState();
  if (type === "voice-listening") store.setListening(detail);
  if (type === "voice-processing") store.setThinking(detail);
}

const ELEVENLABS_DEFAULT_VOICE_ID =
  import.meta.env.VITE_ELEVENLABS_DEFAULT_VOICE_ID ||
  "21m00Tcm4TlvDq8ikWAM"; // Rachel (stock voice)

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem("aurora_voice_enabled") === "1";
  });
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState<(() => void) | null>(null);
  const { voiceId, speed, pitch, expression, emotion, mode, setMode } =

    useVoiceStore((s) => ({
      voiceId: s.voiceId,
      speed: s.speed,
      pitch: s.pitch,
      expression: s.expression,
      emotion: s.emotion,
      mode: s.mode,
      setMode: s.setMode,

    }));
  const { canAccessFeature } = useSubscription();

  // Allow enabling via first user gesture (click/keydown) OR explicit call
  useEffect(() => {
    if (enabled) return;
    const prime = () => {
      setEnabled(true);
      localStorage.setItem("aurora_voice_enabled", "1");
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.resume();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("keydown", prime, { once: true });
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
  }, [enabled]);

  const enable = useCallback(() => {
    setEnabled(true);
    localStorage.setItem("aurora_voice_enabled", "1");
    try {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.resume();
    } catch {
      /* ignore */
    }
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text?.trim()) return;
      setBlocked(null);
      if (!enabled) {
        ttsAutoplayToast();
        const resume = () => {
          enable();
          void speak(text);
        };
        window.addEventListener("pointerdown", resume, { once: true });
        window.addEventListener("keydown", resume, { once: true });
        return;
      }
      fire('voice-processing', true);

      let current = mode;
      const locale = navigator.language;

      while (current && current !== "off") {
        if (current === "cloned") {
          const result = await guardPremiumAction(
            canAccessFeature,
            "voice_features",
            "voice_clone",
            "use the default voice instead",
          );
          if (result === null) {
            fire('voice-processing', false);
            return;
          }
          if (result === 'free') {
            current = "eleven-default";
            setMode("eleven-default", false);
            continue;
          }
          if (!voiceId) {
            current = "eleven-default";
            setMode("eleven-default", false);
            continue;
          }
          const { audio, error } = await playClonedVoice(text, voiceId, {
            emotion,
            speed,
            pitch,
            expression,
            onStart: () => {
              fire('voice-processing', false);
              setIsSpeaking(true);
            },
            onEnd: () => setIsSpeaking(false),
          });
          if (audio) {
            audioRef.current = audio;
            if ((error as { name?: string } | undefined)?.name === "NotAllowedError") {
              fire('voice-processing', false);
              ttsAutoplayToast();
              setBlocked(() => () => {
                audio.play().catch(() => {});
              });
            }
            return;
          }
          const status = (error as { status?: number } | undefined)?.status;
          if (status === 401 || status === 429) ttsFallbackToast();
          current = "eleven-default";
          setMode("eleven-default", false);
          continue;
        }
        if (current === "eleven-default") {
          const { audio, error } = await playClonedVoice(
            text,
            ELEVENLABS_DEFAULT_VOICE_ID,
            {
              emotion,
              speed,
              pitch,
              expression,
              onStart: () => {
                fire('voice-processing', false);
                setIsSpeaking(true);
              },
              onEnd: () => setIsSpeaking(false),
            },
          );
          if (audio) {
            audioRef.current = audio;
            if ((error as { name?: string } | undefined)?.name === "NotAllowedError") {
              fire('voice-processing', false);
              ttsAutoplayToast();
              setBlocked(() => () => {
                audio.play().catch(() => {});
              });
            }
            return;
          }
          current = "browser-tts";
          setMode("browser-tts", false);
          ttsFallbackToast();
          continue;
        }
        if (current === "browser-tts") {
          try {
            window.speechSynthesis.cancel();
            let voices = window.speechSynthesis.getVoices();
            if (!voices.length) {
              await new Promise((r) => setTimeout(r, 250));
              voices = window.speechSynthesis.getVoices();
            }
            const v = voices.find(
              (vo) =>
                vo.lang === locale ||
                vo.lang.startsWith(locale.split("-")[0]),
            );
            if (!v) {
              current = "off";
              setMode("off", false);
              continue;
            }
            const u = new SpeechSynthesisUtterance(text);
            utterRef.current = u;
            u.voice = v;
            u.rate = speed;
            u.pitch = pitch;
            u.onstart = () => {
              fire('voice-processing', false);
              setIsSpeaking(true);
            };
            u.onend = () => setIsSpeaking(false);
            u.onerror = () => setIsSpeaking(false);
            try {
              window.speechSynthesis.speak(u);
            } catch (err) {
              fire('voice-processing', false);
              if ((err as { name?: string } | undefined)?.name === "NotAllowedError") {
                ttsAutoplayToast();
                setBlocked(() => () => {
                  window.speechSynthesis.speak(u);
                });
              }
              return;
            }
            return;
          } catch {
            current = "off";
            setMode("off", false);
            continue;
          }
        }
        if (current === "local-tts") {
          current = "off";
          setMode("off", false);
          continue;
        }
      }
      fire('voice-processing', false);
    },
    [enabled, mode, voiceId, emotion, speed, pitch, expression, setMode, enable, canAccessFeature],

  );

  const cancel = useCallback(() => {
    try { audioRef.current?.pause(); } catch { /* ignore */ }
    audioRef.current = null;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setBlocked(null);
    setIsSpeaking(false);
  }, []);

  const resume = useCallback(() => {
    if (blocked) {
      blocked();
      setBlocked(null);
    }
  }, [blocked]);

  return { speak, cancel, isSpeaking, enabled, enable, blocked: !!blocked, resume };
}

