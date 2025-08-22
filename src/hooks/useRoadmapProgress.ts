import { useEffect, useMemo, useState } from "react";
import { flattenRoadmap, useRoadmapStore, type Task } from "@/state/roadmapStore";

export function useRoadmapProgress(_userId?: string | null, _roadmapId?: string | null) {
  const goals = useRoadmapStore((s) => s.goals);
  const [items, setItems] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const tasks = await flattenRoadmap(goals);
      if (!cancelled) setItems(tasks);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [goals]);

  return useMemo(() => {
    const total = items.length || 1;
    const done = items.filter((t) => t.status === "done").length;
    const currentIndex = items.findIndex((t) => t.status !== "done");
    const percent = Math.round((done / total) * 100);
    return { items, currentIndex, percent } as const;
  }, [items]);
}
