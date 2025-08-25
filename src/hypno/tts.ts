import { db } from "@/integrations/db";
import { toast } from "@/hooks/use-toast";
import { useVoiceStore } from "@/state/voice";

export type PlaybackHandle = {
  stop: () => void;
};

/**
 * Play hypnosis text using high quality audio when available.
 * Falls back to the Web Speech API if the backend function fails.
 */
export async function playHypno(
  text: string,
  onEnd: () => void,
  onError?: (err: unknown) => void
): Promise<PlaybackHandle | null> {
  const { voiceId, mode, locale } = useVoiceStore.getState();
  if (mode === "off") {
    onEnd();
    return null;
  }
  // Try ElevenLabs via backend function
  try {
    const { data, error } = await db.functions.invoke("tts-generate", {
      body: { text, voiceId: mode === "cloned" ? voiceId : undefined },
    });
    if (mode !== "browser-tts" && !error && data?.audioBase64) {
      const src = `data:${data.contentType};base64,${data.audioBase64}`;
      const audio = new Audio(src);
      audio.onended = onEnd;

      const stop = () => {
        audio.pause();
        audio.currentTime = 0;
      };

      const playPromise = audio.play();
      playPromise.catch((err) => {
        console.error("[hypno] playback failed", err);
        stop();
        onError?.(err);
        toast({ title: "Playback failed", description: "Unable to start hypnosis audio." });
        onEnd();
      });
      return { stop };
    }
  } catch (e) {
    console.error("[hypno] tts-generate failed", e);
  }

  // Fallback to Web Speech API
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.lang = locale;
    utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
    return {
      stop: () => {
        try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      },
    };
  }

  // If no TTS available, immediately end
  onEnd();
  return null;
}
