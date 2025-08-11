import { supabase } from "@/integrations/supabase/client";

/**
 * Try to synthesize speech using the user's cloned voice via Supabase edge function.
 * Returns the HTMLAudioElement if playback was started, otherwise null.
 */
export async function playClonedVoice(
  text: string,
  voiceId: string,
  callbacks: { onStart?: () => void; onEnd?: () => void } = {},
): Promise<HTMLAudioElement | null> {
  try {
    const { data, error } = await supabase.functions.invoke("tts-generate", {
      body: { text, voiceId },
    });
    if (!error && data?.audioBase64) {
      const src = `data:${data.contentType};base64,${data.audioBase64}`;
      const audio = new Audio(src);
      if (callbacks.onStart) audio.onplay = callbacks.onStart;
      if (callbacks.onEnd) {
        audio.onended = callbacks.onEnd;
        audio.onerror = callbacks.onEnd;
      }
      await audio.play();
      return audio;
    }
  } catch (e) {
    console.error("[voiceClone] tts-generate failed", e);
  }
  return null;
}
