
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useGameStore, type Stats } from "@/game/store";

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const setStats = useGameStore(s => s.setStats);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setInitializing(false);
    });

      return () => {
        subscription.unsubscribe();
      };
    }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_stats")
      .select("total_xp, streak_count")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const total = data.total_xp ?? 0;
        const xp = total % 100;
        const level = Math.floor(total / 100) + 1;
        const patch: Partial<Stats> = { xp, level };
        if (typeof data.streak_count === "number") patch.streak = data.streak_count;
        setStats(patch);
      })
      .catch(() => {});
  }, [user, setStats]);

  return { session, user, initializing };
}
