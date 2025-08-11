import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that determines whether a KPI should be updated this week
 * and provides a function to record a new value. When a value is
 * recorded a corresponding fact is written for review history.
 */
export function useWeeklyKpiEntry(
  userId: string | null,
  missionId: string | null,
  kpiId: string | null
) {
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    async function check() {
      if (!userId || !kpiId) return;
      const { data, error } = await supabase
        .from("kpi_records")
        .select("recorded_at")
        .eq("user_id", userId)
        .eq("kpi_id", kpiId)
        .order("recorded_at", { ascending: false })
        .limit(1);
      if (error) {
        console.error(error);
        return;
      }
      const last = data && data[0] ? new Date(data[0].recorded_at) : null;
      if (!last) {
        setShouldPrompt(true);
      } else {
        const diff = Date.now() - last.getTime();
        setShouldPrompt(diff > 7 * 24 * 60 * 60 * 1000);
      }
    }
    check();
  }, [userId, kpiId]);

  const record = async (value: number, source: string) => {
    if (!userId || !missionId || !kpiId) return;
    const { error } = await supabase.from("kpi_records").insert({
      user_id: userId,
      mission_id: missionId,
      kpi_id: kpiId,
      value,
      source,
    });
    if (error) {
      console.error(error);
      return;
    }
    setShouldPrompt(false);
    const { error: factErr } = await supabase.from("facts").insert({
      user_id: userId,
      task_id: null,
      content: `Recorded KPI ${kpiId} = ${value}`,
    });
    if (factErr) console.error(factErr);
  };

  return { shouldPrompt, record } as const;
}
