
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useBackgroundAudio } from "@/hooks/useBackgroundAudio";
import { toast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import { useVoiceStore } from "@/state/voice";

type Segment = { key: string; text: string };

export default function HypnosisLauncher() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { volume, setVolume, isPlaying } = useBackgroundAudio();
  const originalVolumeRef = useRef<number | null>(null);

  // Simple, short MVP scripts. We can swap to SSML templates later.
  const segments: Segment[] = useMemo(() => [
    { key: "induction", text: "Find a comfortable position. Breathe in... and out. With each breath, you feel more centered and calm." },
    { key: "deepener", text: "Now count down from five to one. With each number, drift deeper. Five... Four... Three... Two... One." },
    { key: "installation", text: "Imagine entering your Mind World. You feel focused, motivated, and clear. You will take one simple action today." },
    { key: "reorientation", text: "Now gently return. Count up from one to five. One... Two... Three... Four... Five. Eyes open, alert, and refreshed." },
  ], []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const duckOn = async () => {
    if (originalVolumeRef.current === null) {
      originalVolumeRef.current = volume;
    }
    // duck ambience if it is playing
    if (isPlaying) {
      await setVolume(Math.max(0, Math.min(1, volume * 0.4)));
    }
  };

  const duckOff = async () => {
    if (originalVolumeRef.current !== null) {
      await setVolume(originalVolumeRef.current);
      originalVolumeRef.current = null;
    }
  };

    const fetchAudioDataUrl = async (text: string): Promise<string> => {
      logger.debug("[Hypnosis] Requesting TTS for", text.slice(0, 40), "...");
      const voiceId = useVoiceStore.getState().voiceId;
      const { data, error } = await supabase.functions.invoke("tts-generate", {
        body: { text, voiceId },
      });
    if (error) {
      console.error("TTS invoke error:", error);
      throw new Error(error.message || "TTS call failed");
    }
    const { audioBase64, contentType } = data as { audioBase64: string; contentType: string };
    const mime = contentType || "audio/mpeg";
    return `data:${mime};base64,${audioBase64}`;
  };

  const playDataUrl = async (dataUrl: string): Promise<void> => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    audioRef.current = new Audio(dataUrl);
    const el = audioRef.current;
    await el.play();
    await new Promise<void>((resolve) => {
      el.onended = () => resolve();
      el.onerror = () => resolve();
    });
  };

  const startSession = async () => {
    if (running) return;
    setCancelled(false);
    setRunning(true);
    setStep(0);

    try {
      await duckOn();

      for (let i = 0; i < segments.length; i++) {
        if (cancelled) break;
        setStep(i + 1);
        const url = await fetchAudioDataUrl(segments[i].text);
        if (cancelled) break;
        await playDataUrl(url);
      }

      toast({ title: "Session complete", description: "Great work. You can run it again anytime." });
    } catch (e) {
      logger.warn("Hypnosis session error:", e);
      toast({ title: "Playback issue", description: "Please try again in a moment." });
    } finally {
      await duckOff();
      setRunning(false);
      setStep(0);
    }
  };

  const stopSession = () => {
    setCancelled(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    duckOff();
    setRunning(false);
    setStep(0);
  };

  const progress = Math.round((step / segments.length) * 100);

  return (
    <section className="glass-panel rounded-xl p-4 elev smooth">
      <header className="flex items-center justify-between">
        <h3 className="font-semibold">Guided Focus Session</h3>
        <span className="text-xs text-muted-foreground">Beta</span>
      </header>

      <p className="text-sm text-muted-foreground mt-2">
        A short 4-part session: Induction → Deepener → Installation → Reorientation.
      </p>

      <div className="mt-4 flex items-center gap-2">
        {!running ? (
          <Button size="sm" onClick={startSession} className="hover-scale">Begin Session</Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={stopSession}>Stop</Button>
        )}
        <div className="text-xs text-muted-foreground">
          {running ? `Playing ${step}/${segments.length}` : "Ready"}
        </div>
      </div>

      <div className="mt-3">
        <Progress value={progress} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Ambience ducking: on</div>
        <div>Voice: Pro (Aria)</div>
      </div>
    </section>
  );
}
