import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceStore } from "@/state/voice";
import { playClonedVoice } from "./voiceClone";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem("aurora_voice_enabled") === "1";
  });
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { voiceId, speed, pitch, expression, emotion } = useVoiceStore((s) => ({
    voiceId: s.voiceId,
    speed: s.speed,
    pitch: s.pitch,
    expression: s.expression,
    emotion: s.emotion,
  }));

  // Allow enabling via first user gesture (click/keydown) OR explicit call
  useEffect(() => {
    if (enabled) return;
    const prime = () => {
      setEnabled(true);
      localStorage.setItem("aurora_voice_enabled", "1");
      try {
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

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || !text?.trim()) return; // <- gate prevents NotAllowedError
      // Try cloned voice via Supabase when a voiceId is configured
      if (voiceId) {
        const audio = await playClonedVoice(text, voiceId, {
          emotion,
          speed,
          pitch,
          expression,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
        if (audio) {
          audioRef.current = audio;
          return;
        }
      }

      // Fallback to Web Speech API
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        utterRef.current = u;
        u.rate = speed;
        u.pitch = pitch;
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
      } catch {
        setIsSpeaking(false);
      }
    },
    [enabled, voiceId, speed, pitch, expression, emotion],
  );

  const cancel = useCallback(() => {
    try { audioRef.current?.pause(); } catch { /* ignore */ }
    audioRef.current = null;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    setIsSpeaking(false);
  }, []);

  const enable = useCallback(() => {
    setEnabled(true);
    localStorage.setItem("aurora_voice_enabled", "1");
    try {
      window.speechSynthesis.resume();
    } catch {
      /* ignore */
    }
  }, []);

  return { speak, cancel, isSpeaking, enabled, enable };
}

