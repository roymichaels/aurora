import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { db } from "@/integrations/db";
import { useTonSession } from "@/hooks/useTonSession";
import { awardXPRemote } from "@/integrations/db";
import { award } from "@/game/gamification/award";
import { useState } from "react";
import { StickyNote } from "lucide-react";

type Roadmap = {
  id: string;
  title: string;
  color: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  roadmap_id: string;
  status: string;
  position: number | null;
};

export function CurrentFocusCard({
  activeRoadmap,
  task,
  progressPercent = 0,
  onAdvance,
}: {
  activeRoadmap: Roadmap | null;
  task: Task | null;
  progressPercent?: number;
  onAdvance: () => void;
}) {
  const { user } = useTonSession();
  const [busy, setBusy] = useState(false);

  const markDoneAndAdvance = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Connect Supabase to track your progress." });
      return;
    }
    if (!task) return;

    setBusy(true);
    const now = new Date().toISOString();

    // 1) mark current task done
    const { error: updErr } = await db
      .from("tasks")
      .update({ status: "done", completed_at: now })
      .eq("id", task.id)
      .eq("user_id", user.id);
    if (updErr) {
      console.error(updErr);
      setBusy(false);
      return;
    }

    navigator.vibrate?.(10);

    // Award XP for task completion and update streak
    try {
      await awardXPRemote("task_complete", 10, { task_id: task.id });
      award({ xp: 10 });
    } catch (e) { console.error(e); }

    onAdvance();
    setBusy(false);
  };

  

  return (
    <div className="glass-panel rounded-xl p-5 elev focus-glow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">
            {activeRoadmap ? "Current Focus" : "No active roadmap"}
          </div>
          <h2 className="text-xl font-semibold mt-1">
            {task ? task.title : activeRoadmap ? "No task selected" : "Choose an active roadmap"}
          </h2>
          {activeRoadmap && (
            <div className="mt-1 text-xs inline-flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: activeRoadmap.color ?? "hsl(var(--primary))" }}
              />
              <span className="text-muted-foreground">{activeRoadmap.title}</span>
              <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
            </div>
          )}
          {task?.due_at && (
            <div className="mt-1 text-xs text-muted-foreground">Due: {new Date(task.due_at).toLocaleString()}</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Add note"
            onClick={() => toast({ title: "Quick note", description: "Use Notes below to capture a thought." })}
          >
            <StickyNote className="w-4 h-4" />
          </Button>
          <Button variant="secondary" disabled={!task || busy} onClick={markDoneAndAdvance}>
            {busy ? "Updating..." : task ? "Done" : "No Task"}
          </Button>
        </div>
      </div>
      {task?.description && (
        <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{task.description}</p>
      )}
    </div>
  );
}

