import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProgressStore } from "@/state/progress";

export default function AnalyticsModal() {
  const { xp, level, streak, notes } = useProgressStore();
  return (
    <>
      <DialogHeader>
        <DialogTitle>Analytics</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 text-sm">
        <div>XP: {xp}</div>
        <div>Level: {level}</div>
        <div>Streak: {streak}</div>
        <div>Notes recorded: {notes.length}</div>
      </div>
    </>
  );
}

