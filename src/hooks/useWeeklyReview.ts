import { useEffect } from "react";
import { supabase } from "@/integrations/db";
import { useTonSession } from "./useTonSession";

/**
 * Weekly review hook
 * - Updates KPI records once per week
 * - Stores the next sprint id for quick access
 */
export default function useWeeklyReview(missionId: string | null) {
  const { user } = useTonSession();

  useEffect(() => {
    if (!user || !missionId) return;
    const key = `mission.${missionId}.lastReview`;
    const last = localStorage.getItem(key);
    const now = new Date();
    if (last) {
      const diff = now.getTime() - new Date(last).getTime();
      if (diff < 7 * 24 * 60 * 60 * 1000) return;
    }
    const run = async () => {
      try {
        // touch KPI records so updated_at reflects review
        await supabase
          .from("kpis")
          .update({ updated_at: now.toISOString() })
          .eq("mission_id", missionId);

        // prefetch the next sprint for surface
        const { data: next } = await supabase
          .from("sprints")
          .select("id, start_date")
          .eq("mission_id", missionId)
          .gt("start_date", now.toISOString().slice(0, 10))
          .order("start_date", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (next) {
          localStorage.setItem(`mission.${missionId}.nextSprint`, next.id);
        }
      } finally {
        localStorage.setItem(key, now.toISOString());
      }
    };
    run();
  }, [user, missionId]);
}

