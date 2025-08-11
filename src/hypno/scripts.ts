import { playHypno, type PlaybackHandle } from "./tts";

/**
 * Ensure the user has opted in and is in a comfortable state
 * before running any hypnosis-related script.
 */
function ensureOptInAndComfort(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const key = "hypno.optIn";
    const storage = window.localStorage;
    if (storage.getItem(key) !== "yes") {
      const consent = window.confirm(
        "These hypnosis scripts are optional. Do you consent to continue?"
      );
      if (!consent) return false;
      storage.setItem(key, "yes");
    }

    const comfortable = window.confirm(
      "Are you in a comfortable, safe place and ready to proceed?"
    );
    return comfortable;
  } catch {
    return false;
  }
}

async function runScript(text: string): Promise<PlaybackHandle | null> {
  if (!ensureOptInAndComfort()) return null;
  return playHypno(text, () => {});
}

export async function runMicroInduction(
  text: string
): Promise<PlaybackHandle | null> {
  return runScript(text);
}

export async function runVisualization(
  text: string
): Promise<PlaybackHandle | null> {
  return runScript(text);
}

export async function runAffirmation(
  text: string
): Promise<PlaybackHandle | null> {
  return runScript(text);
}

