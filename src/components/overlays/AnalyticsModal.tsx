import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuickActionModals } from "@/state/quickActions";
import { useProgressStore } from "@/state/progress";

export default function AnalyticsModal() {
  const { analyticsOpen, setAnalyticsOpen } = useQuickActionModals();
  const { xp, level, streak, notes } = useProgressStore();

  return (
    <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Analytics</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div>XP: {xp}</div>
          <div>Level: {level}</div>
          <div>Streak: {streak}</div>
          <div>Notes recorded: {notes.length}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

