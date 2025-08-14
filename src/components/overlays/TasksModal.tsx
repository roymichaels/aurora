import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TasksManager from "@/components/control/TasksManager";
import { useQuickActionModals } from "@/state/quickActions";

export default function TasksModal() {
  const { tasksOpen, setTasksOpen, tasksRoadmapId } = useQuickActionModals();

  return (
    <Dialog open={tasksOpen} onOpenChange={setTasksOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tasks</DialogTitle>
        </DialogHeader>
        {tasksRoadmapId ? (
          <TasksManager roadmapId={tasksRoadmapId} />
        ) : (
          <div className="text-sm text-muted-foreground">No roadmap selected.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}

