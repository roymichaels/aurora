import { Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTonSession } from "@/hooks/useTonSession";
import { supabase } from "@/integrations/supabase/client";

export function StreakBadge() {
  const { user } = useTonSession();
  const [streak, setStreak] = useState<number>(0);
  const [spark, setSpark] = useState(false);
  const prev = useRef(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) { setStreak(0); return; }
      const { data, error } = await supabase
        .from("user_stats")
        .select("streak_count")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mounted) return;
      if (!error && data) setStreak((data as any).streak_count || 0);
    })();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    if (streak > prev.current) {
      setSpark(true);
      setTimeout(() => setSpark(false), 900);
    }
    prev.current = streak;
  }, [streak]);

  if (!user) return null;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-sm${spark ? ' sparkle' : ''}`}>
      <Flame className="w-4 h-4 text-destructive" />
      <span className="font-medium tabular-nums">{streak}</span>
    </div>
  );
}
