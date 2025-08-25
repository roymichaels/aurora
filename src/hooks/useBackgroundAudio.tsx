
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/db";
import { useTonSession } from "@/hooks/useTonSession";
import { toast } from "@/hooks/use-toast";
import logger from "@/lib/logger";

/**
 * Simple background audio controller that:
 * - Loads user_audio_settings for the logged-in user
 * - Lets you pick a sound from public.sounds and persists selection/play/volume
 * - Plays in the background via a shared HTMLAudioElement instance within the page
 *
 * This is intentionally lightweight (no React Query provider needed).
 */

type Sound = {
  id: string;
  title: string;
  category: string | null;
  audio_url: string;
};

export function useBackgroundAudio() {
  const { user } = useTonSession();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [availableSounds, setAvailableSounds] = useState<Sound[]>([]);
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [volume, setVolume] = useState(1);

  // Create the audio element once
  if (!audioRef.current) {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 1;
  }

  // Load library of sounds (public)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("sounds")
        .select("id, title, category, audio_url")
        .order("title", { ascending: true });
      if (error) {
        console.error("Failed to load sounds:", error);
      } else if (mounted) {
        setAvailableSounds((data ?? []) as Sound[]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load user settings and hydrate audio element
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!user) {
        setSelectedSound(null);
        setIsPlaying(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_audio_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Load user_audio_settings error:", error);
        setLoading(false);
        return;
      }

      // If no row, create a default row
      if (!data) {
        const { error: insErr } = await supabase.from("user_audio_settings").insert({
          user_id: user.id,
          is_playing: false,
          loop: true,
          volume: 1,
        });
        if (insErr) console.error("Insert default user_audio_settings error:", insErr);
        setLoading(false);
        return;
      }

      if (cancelled) return;

      setIsPlaying(!!data.is_playing);
      setLoop(!!data.loop);
      setVolume(Number(data.volume ?? 1));

      const soundId = data.background_sound_id as string | null;
      if (soundId) {
        const sound = availableSounds.find((s) => s.id === soundId);
        if (sound) {
          setSelectedSound(sound);
          const el = audioRef.current!;
          if (el.src !== sound.audio_url) el.src = sound.audio_url;
          el.loop = !!data.loop;
          el.volume = Number(data.volume ?? 1);
          if (data.is_playing) {
            try {
              await el.play();
            } catch (e) {
              logger.warn("Autoplay blocked. User gesture required to start audio.", e);
            }
          }
        }
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, availableSounds]);

  const persist = async (patch: Partial<{ background_sound_id: string | null; is_playing: boolean; loop: boolean; volume: number }>) => {
    if (!user) return; // In-memory only if not logged in
    const { error } = await supabase
      .from("user_audio_settings")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
    if (error) console.error("Persist user_audio_settings error:", error);
  };

  const pickSound = async (sound: Sound) => {
    setSelectedSound(sound);
    const el = audioRef.current!;
    if (el.src !== sound.audio_url) el.src = sound.audio_url;
    await persist({ background_sound_id: sound.id });
  };

  const play = async () => {
    const el = audioRef.current!;
    if (!selectedSound) {
      toast({ title: "Pick a sound first", description: "Choose an ambience to play in the background." });
      return;
    }
    try {
      await el.play();
      setIsPlaying(true);
      await persist({ is_playing: true });
    } catch (e) {
      logger.warn("Play failed:", e);
    }
  };

  const pause = async () => {
    const el = audioRef.current!;
    el.pause();
    setIsPlaying(false);
    await persist({ is_playing: false });
  };

  const setLooping = async (v: boolean) => {
    const el = audioRef.current!;
    el.loop = v;
    setLoop(v);
    await persist({ loop: v });
  };

  const changeVolume = async (v: number) => {
    const vol = Math.min(1, Math.max(0, v));
    const el = audioRef.current!;
    el.volume = vol;
    setVolume(vol);
    await persist({ volume: vol });
  };

  return useMemo(
    () => ({
      loading,
      availableSounds,
      selectedSound,
      isPlaying,
      loop,
      volume,
      pickSound,
      play,
      pause,
      setLooping,
      setVolume: changeVolume,
    }),
    [loading, availableSounds, selectedSound, isPlaying, loop, volume]
  );
}
