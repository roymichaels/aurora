import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GoalsList from "@/components/goals/GoalsList";
import GoalForm from "@/components/goals/GoalForm";
import { useQuickActionModals } from "@/state/quickActions";

export default function GoalsModal() {
  const { goalsOpen, setGoalsOpen } = useQuickActionModals();

  return (
    <Dialog open={goalsOpen} onOpenChange={setGoalsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Goals</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <GoalForm />
          <GoalsList />
        </div>
      </DialogContent>
    </Dialog>
  );
}

