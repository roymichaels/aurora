import { useEffect, useState } from "react";
import { useGameStore } from "@/game/store";

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const awardXP = useGameStore(s => s.awardXP);
  const setMood = useGameStore(s => s.setMood);

  useEffect(() => {
    try {
      const flag = localStorage.getItem('mos.onboarded');
      if (!flag) setOpen(true);
    } catch {}
  }, []);

  const complete = (mood: 'Calm'|'Focused'|'Confident'|'Stressed'|'Tired') => {
    setMood(mood);
    awardXP(5);
    try { localStorage.setItem('mos.onboarded', '1'); } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-end md:place-items-center" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="glass-panel rounded-t-2xl md:rounded-2xl w-full md:w-[520px] p-5 elev">
        <h3 className="text-lg font-semibold">Welcome to MindWorld</h3>
        <p className="text-sm text-muted-foreground mt-1">Pick your starting vibe. You’ll earn 5 XP.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(['Calm','Focused','Confident','Stressed','Tired'] as const).map(m=> (
            <button key={m} className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/15" onClick={()=>complete(m)}>{m}</button>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">You can change mood anytime.</div>
      </div>
    </div>
  );
}
