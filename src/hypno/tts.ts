import { supabase } from "@/integrations/supabase/client";

export type PlaybackHandle = {
  stop: () => void;
};

/**
 * Play hypnosis text using high quality audio when available.
 * Falls back to the Web Speech API if the Supabase function fails.
 */
export async function playHypno(text: string, onEnd: () => void): Promise<PlaybackHandle | null> {
  // Try ElevenLabs via Supabase function
  try {
    const { data, error } = await supabase.functions.invoke("tts-generate", {
      body: { text },
    });
    if (!error && data?.audioBase64) {
      const src = `data:${data.contentType};base64,${data.audioBase64}`;
      const audio = new Audio(src);
      audio.onended = onEnd;
      await audio.play();
      return {
        stop: () => {
          audio.pause();
          audio.currentTime = 0;
        },
      };
    }
  } catch (e) {
    console.error("[hypno] tts-generate failed", e);
  }

  // Fallback to Web Speech API
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try { window.speechSynthesis.cancel(); } catch {}
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
    return {
      stop: () => {
        try { window.speechSynthesis.cancel(); } catch {}
      },
    };
  }

  // If no TTS available, immediately end
  onEnd();
  return null;
}
