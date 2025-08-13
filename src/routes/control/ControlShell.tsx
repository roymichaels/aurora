import RoadmapsManager from "@/components/control/RoadmapsManager";
import { FloatingAssistant } from "@/components/live/FloatingAssistant";
import { useCurrentTask } from "@/state/task";

export default function ControlShell() {
  const currentTask = useCurrentTask((s) => s.currentTask);
  return (
    <div className="p-6">
      <RoadmapsManager />
      <FloatingAssistant task={currentTask} onUpdated={() => {}} />
    </div>
  );
}
