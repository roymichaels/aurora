import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { useTonSession } from "@/hooks/useTonSession";
import { supabase } from "@/integrations/db";

interface HeroCardProps {
  taskTitle: string | null;
}

export default function HeroCard({ taskTitle }: HeroCardProps) {
  const { user } = useTonSession();
  const [xp, setXp] = useState(0);
  const [mood, setMood] = useState<string | null>(null);

  useEffect(() => {
    try {
      const m = localStorage.getItem("mood.last");
      if (m) setMood(m.toLowerCase());
    } catch {}
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) { setXp(0); return; }
      const { data, error } = await supabase
        .from("user_stats")
        .select("total_xp")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mounted) return;
      if (!error && data) setXp((data as any).total_xp || 0);
    })();
    return () => { mounted = false; };
  }, [user]);

  const level = useMemo(() => Math.floor(xp / 100) + 1, [xp]);
  const name = useMemo(() => {
    if (!user?.email) return "there";
    const [before] = user.email.split("@");
    return before.charAt(0).toUpperCase() + before.slice(1);
  }, [user]);

  const greet = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const moodClass = mood === "calm" ? "calm" : mood === "confident" ? "confident" : mood === "focused" ? "focused" : "";

  return (
    <section className={`hero-ambient ${moodClass} rounded-2xl elev smooth p-6 sm:p-8 min-h-[50vh] sm:min-h-[56vh] flex items-center justify-center text-center`}>
      <div className="max-w-2xl w-full grid place-items-center gap-4">
        <div className="inline-flex items-center gap-2">
          <Flame className="w-6 h-6 text-destructive flame-flicker" aria-hidden="true" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Level</span>
          <span className="text-xl font-semibold tabular-nums">{level}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">
          {greet}, {name} — ready to focus?
        </h2>
        <p className="text-sm text-muted-foreground">Todays Intent</p>
        <p className="text-xl sm:text-2xl liquid-text font-semibold line-clamp-2">
          {taskTitle || "Pick your next small win."}
        </p>
      </div>
    </section>
  );
}
