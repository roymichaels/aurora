import { useMemo } from "react";
import { flattenRoadmap, useRoadmapStore } from "@/state/roadmapStore";

export function useRoadmapProgress(_userId?: string | null, _roadmapId?: string | null) {
  const goals = useRoadmapStore((s) => s.goals);
  return useMemo(() => {
    const items = flattenRoadmap(goals);
    const total = items.length || 1;
    const done = items.filter((t) => t.status === "done").length;
    const currentIndex = items.findIndex((t) => t.status !== "done");
    const percent = Math.round((done / total) * 100);
    return { items, currentIndex, percent } as const;
  }, [goals]);
}
