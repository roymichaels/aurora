import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GoalsList from "@/components/goals/GoalsList";
import GoalForm from "@/components/goals/GoalForm";

export default function GoalsModal() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Goals</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <GoalForm />
        <GoalsList />
      </div>
    </>
  );
}

