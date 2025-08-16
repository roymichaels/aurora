import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TasksManager from "@/components/control/TasksManager";
import { useUIStore } from "@/state/ui";

export default function TasksModal() {
  const tasksRoadmapId = useUIStore((s) => s.tasksRoadmapId);
  return (
    <>
      <DialogHeader>
        <DialogTitle>Tasks</DialogTitle>
      </DialogHeader>
      {tasksRoadmapId ? (
        <TasksManager roadmapId={tasksRoadmapId} />
      ) : (
        <div className="text-sm text-muted-foreground">No roadmap selected.</div>
      )}
    </>
  );
}

