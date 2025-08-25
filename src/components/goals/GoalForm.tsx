
import { useState } from "react";
import { db } from "@/integrations/db";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useTonSession } from "@/hooks/useTonSession";

export default function GoalForm() {
  const { user } = useTonSession();
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [nextAction, setNextAction] = useState("");

  const onSave = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save goals." });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title is required", description: "Please enter a goal title." });
      return;
    }

    const { error } = await db.from("goals").insert({
      user_id: user.id,
      title,
      why: why || null,
      next_action: nextAction || null,
      status: "active",
    });

    if (error) {
      toast({ title: "Could not save goal", description: error.message });
      return;
    }

    setTitle("");
    setWhy("");
    setNextAction("");
    toast({ title: "Goal saved", description: "Your goal was saved to Supabase." });
  };

  return (
    <form className="grid gap-3">
      <div className="grid gap-2">
        <label htmlFor="title" className="text-sm">Goal Title</label>
        <input
          id="title"
          className="glass-panel rounded-md px-3 py-2 outline-none"
          placeholder="e.g., Deep Focus Sprint"
          value={title}
          onChange={(e)=> setTitle(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="why" className="text-sm">Why</label>
        <textarea
          id="why"
          className="glass-panel rounded-md px-3 py-2 outline-none"
          placeholder="Motivation in one sentence"
          value={why}
          onChange={(e)=> setWhy(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="next" className="text-sm">Next Action</label>
        <input
          id="next"
          className="glass-panel rounded-md px-3 py-2 outline-none"
          placeholder="Smallest next step"
          value={nextAction}
          onChange={(e)=> setNextAction(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" onClick={onSave}>Save</Button>
      </div>
      {!user && (
        <p className="text-xs text-muted-foreground">
          Sign in to enable cloud save and sync.
        </p>
      )}
    </form>
  );
}
