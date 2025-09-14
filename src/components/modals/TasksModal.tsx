import { useEffect, useState } from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TasksManager from "@/components/control/TasksManager";
import { useUIStore } from "@/state/ui";
import { useNearSession } from "@/hooks/useNearSession";
import { db } from "@/integrations/db";

export default function TasksModal() {
  const tasksRoadmapId = useUIStore((s) => s.tasksRoadmapId);
  const { user } = useNearSession();
  const [defaultId, setDefaultId] = useState<string | null>(null);

  useEffect(() => {
    if (tasksRoadmapId || !user) return;
    let cancelled = false;
    (async () => {
      const { data } = await db
        .from("roadmaps")
        .select("id, status")
        .eq("user_id", user.id)
        .order("position", { ascending: true, nullsFirst: true });
      if (!cancelled && data) {
        type Roadmap = { id: string; status: string };
        const list = data as Roadmap[];
        const active = list.find((r) => r.status === "active");
        setDefaultId(active?.id ?? list[0]?.id ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tasksRoadmapId, user]);

  const roadmapId = tasksRoadmapId ?? defaultId;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tasks</DialogTitle>
      </DialogHeader>
      {roadmapId ? (
        <TasksManager roadmapId={roadmapId} />
      ) : (
        <div className="text-sm text-muted-foreground">No roadmap selected.</div>
      )}
    </>
  );
}

