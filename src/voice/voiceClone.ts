import { db } from "@/integrations/db";

async function cacheVoiceModel(voiceId: string) {
  if (typeof window === "undefined") return;
  const key = `aurora_voice_model_${voiceId}`;
  if (localStorage.getItem(key)) return;
  try {
    const { data } = await db.storage
      .from("voice-models")
      .download(`${voiceId}.bin`);
    if (data) {
      const base64 = await blobToBase64(data);
      localStorage.setItem(key, base64);
    }
  } catch {
    /* ignore caching errors */
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result?.toString() || "";
      resolve(res.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Try to synthesize speech using the user's cloned voice via a backend function.
 * Supports emotion, speed, pitch and expression parameters. Audio is cached for
 * offline reuse and the voice model is cached locally the first time it is used.
 * Returns an object with the HTMLAudioElement if playback was started. If the
 * request fails, `audio` will be null and `error` will contain any error
 * returned by the backend function.
 */
export async function playClonedVoice(
  text: string,
  voiceId: string,
  options: {
    emotion?: string;
    speed?: number;
    pitch?: number;
    expression?: number;
    onStart?: () => void;
    onEnd?: () => void;
  } = {},
  ): Promise<{ audio: HTMLAudioElement | null; error?: unknown }> {
  const { emotion, speed, pitch, expression, onStart, onEnd } = options;

  const cacheKey = `aurora_voice_cache:${voiceId}:${emotion || "neutral"}:${
    speed ?? 1
  }:${pitch ?? 1}:${expression ?? 1}:${text}`;

  try {
    await cacheVoiceModel(voiceId);

    const cachedSrc =
      typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cachedSrc) {
      const audio = new Audio(cachedSrc);
      if (onStart) audio.onplay = onStart;
      if (onEnd) {
        audio.onended = onEnd;
        audio.onerror = onEnd;
      }
      try {
        await audio.play();
        return { audio };
      } catch (err) {
        return { audio, error: err };
      }
    }

    const { data, error } = await db.functions.invoke("tts-generate", {
      body: { text, voiceId, emotion, speed, pitch, expression },
    });
    if (!error && data?.audioBase64) {
      const src = `data:${data.contentType};base64,${data.audioBase64}`;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(cacheKey, src);
        } catch {
          /* ignore */
        }
      }
      const audio = new Audio(src);
      if (onStart) audio.onplay = onStart;
      if (onEnd) {
        audio.onended = onEnd;
        audio.onerror = onEnd;
      }
      try {
        await audio.play();
        return { audio };
      } catch (err) {
        return { audio, error: err };
      }
    }
    if (error) {
      return { audio: null, error };
    }
  } catch (e) {
    console.error("[voiceClone] tts-generate failed", e);
    return { audio: null, error: e };
  }
  return { audio: null };
}
