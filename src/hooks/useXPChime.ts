import { useEffect } from "react";

export function useXPChime() {
  useEffect(() => {
    let ctx: AudioContext | null = null;

    const play = () => {
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
      } catch {
        // ignore
      }
    };

    const onSparkle = () => play();
    window.addEventListener("xp-sparkle" as any, onSparkle as any);
    return () => window.removeEventListener("xp-sparkle" as any, onSparkle as any);
  }, []);
}
