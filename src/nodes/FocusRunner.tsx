import { useEffect, useRef, useState } from "react";
import { useProgressStore } from "@/state/progress";
import { awardXPRemote } from "@/integrations/supabase/gameSync";

type Props = { node: { id: string; label: string; minutes?: number; induction?: number }; onExit: () => void };

export default function FocusRunner({ node, onExit }: Props) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState((node.minutes ?? 25) * 60);
  const [ended, setEnded] = useState(false);
  const intRef = useRef<number | null>(null);
  const { awardXP, complete } = useProgressStore();

  useEffect(() => () => intRef.current && clearInterval(intRef.current), []);

  const start = () => {
    if (running) return;
    setRunning(true);
    const startAt = performance.now();
    intRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          end();
        }
        return next;
      });
    }, 1000);
  };

  const pause = () => {
    setRunning(false);
    intRef.current && clearInterval(intRef.current);
  };

  const end = async () => {
    pause();
    setEnded(true);
    awardXP(40, { activity: "focus", nodeId: node.id });
    await awardXPRemote("focus", 40, { nodeId: node.id }).catch(() => {});
    complete(node.id);
  };

  const mins = Math.floor(remaining / 60).toString().padStart(2, "0");
  const secs = Math.floor(remaining % 60).toString().padStart(2, "0");

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 grid place-items-center text-center">
      <div className="os-bg" />
      <div>
        <h1 className="text-2xl font-semibold mb-2">{node.label}</h1>
        <p className="opacity-80 mb-6">Deep focus timer</p>

        <div className="text-6xl font-mono tracking-widest mb-6">{mins}:{secs}</div>

        {!running && !ended && (
          <div className="flex gap-3 justify-center">
            <button className="rounded-md px-4 py-2 bg-[hsl(var(--primary))] text-white/95 hover:opacity-90 transition" onClick={start}>Start</button>
            <button className="rounded-md px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 transition" onClick={() => setRemaining(45 * 60)}>Set 45m</button>
          </div>
        )}
        {running && (
          <div className="flex gap-3 justify-center">
            <button className="rounded-md px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 transition" onClick={pause}>Pause</button>
            <button className="rounded-md px-4 py-2 bg-[hsl(var(--primary))] text-white/95 hover:opacity-90 transition" onClick={end}>End</button>
          </div>
        )}
        {ended && (
          <button className="rounded-md px-4 py-2 bg-[hsl(var(--primary))] text-white/95 hover:opacity-90 transition" onClick={onExit}>Done</button>
        )}
      </div>
    </main>
  );
}
