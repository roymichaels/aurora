import { useEffect, useRef, useState } from "react";
import { useProgressStore } from "@/state/progress";
import { useGameStore } from "@/game/store";
import { playHypno, type PlaybackHandle } from "@/hypno/tts";
import HypnoSphere from "@/components/effects/HypnoSphere";
import { awardXPRemote } from "@/integrations/supabase/gameSync";

type Props = { node: { id: string; label: string; script?: string; duration?: number }; onExit: () => void };

export default function HypnosisRunner({ node, onExit }: Props) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [ended, setEnded] = useState(false);
  const timerRef = useRef<number | null>(null);
  const playbackRef = useRef<PlaybackHandle | null>(null);
  const { awardXP, complete } = useProgressStore();

  const duration = Math.min(180, Math.max(60, node.duration ?? 90));
  const text = node.script ?? `Close your eyes. Breathe gently. With each breath, relax deeper. Your focus gets sharper and calmer. When you open your eyes, you will feel refreshed and ready.`;

  const start = async () => {
    if (playing) return;
    setPlaying(true);
    setEnded(false);

    playbackRef.current = await playHypno(text, handleEnd);

    const startedAt = performance.now();
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((performance.now() - startedAt) / 1000));
    }, 250);
  };

  const handleEnd = async () => {
    setPlaying(false);
    setEnded(true);
    timerRef.current && clearInterval(timerRef.current);

    // Award XP + streak
    const amount = 25;
    awardXP(amount, { activity: "hypnosis", nodeId: node.id });
    useGameStore.getState().awardXP(amount);
    useGameStore.getState().incStreak();
    complete(node.id);
  };

  const stopAll = () => {
    playbackRef.current?.stop();
    playbackRef.current = null;
    timerRef.current && clearInterval(timerRef.current);
  };

  const stop = () => {
    stopAll();
    handleEnd();
  };

  const pct = Math.min(100, Math.round((elapsed / duration) * 100));

  useEffect(() => {
    start();
    return () => stopAll();
  }, []);

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 grid place-items-center text-center">
      <div className="os-bg" />
      <div>
        <h1 className="text-2xl font-semibold mb-2">{node.label}</h1>
        <p className="opacity-80 mb-6">Guided hypnosis • {duration}s</p>

        <HypnoSphere className="mx-auto mb-6" size={256} />

        <div className="mb-6">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-[hsl(var(--primary))] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-sm mt-2 opacity-80">{elapsed}s / {duration}s</div>
        </div>

        {playing && !ended && (
          <button className="rounded-md px-4 py-2 bg-[hsl(var(--primary))] text-white/95 hover:opacity-90 transition" onClick={stop}>Stop & Wake</button>
        )}
        {ended && (
          <button className="rounded-md px-4 py-2 bg-[hsl(var(--primary))] text-white/95 hover:opacity-90 transition" onClick={onExit}>Done</button>
        )}
      </div>
    </main>
  );
}
