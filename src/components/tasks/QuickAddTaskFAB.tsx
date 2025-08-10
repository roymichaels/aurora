import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface Props {
  roadmapId: string | null;
  onCreated?: () => void;
}

// Minimal quick-add with title, due date, and priority.
// Priority is prefixed to the title for now (e.g., "[High] Title") to avoid schema changes.
export default function QuickAddTaskFAB({ roadmapId, onCreated }: Props) {
  const { user } = useSupabaseAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [saving, setSaving] = useState(false);

  const disabled = useMemo(() => !user || !roadmapId, [user, roadmapId]);

  const getNextPosition = async (): Promise<number> => {
    // Find the max position for this roadmap and user; default to 0
    const { data, error } = await supabase
      .from("tasks")
      .select("position")
      .eq("user_id", user!.id)
      .eq("roadmap_id", roadmapId!)
      .order("position", { ascending: false, nullsFirst: false })
      .limit(1);
    if (error) { console.error(error); return 0; }
    const pos = (data?.[0]?.position as number | null | undefined) ?? 0;
    return (pos || 0) + 1;
  };

  const onSubmit = async () => {
    if (!user) { toast({ title: "Sign in required", description: "Connect Supabase to add tasks." }); return; }
    if (!roadmapId) { toast({ title: "Select a roadmap", description: "Pick an active roadmap first." }); return; }
    const t = title.trim();
    if (!t) return;

    setSaving(true);
    try {
      const position = await getNextPosition();
      const prefix = priority === "high" ? "[High] " : priority === "low" ? "[Low] " : "";
      const finalTitle = `${prefix}${t}`;
      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        roadmap_id: roadmapId,
        title: finalTitle,
        description: null,
        due_at: due ? new Date(due).toISOString() : null,
        status: "todo",
        position,
      });
      if (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not add task." });
      } else {
        toast({ title: "Task added", description: "Your new task was created." });
        setOpen(false);
        setTitle("");
        setDue("");
        setPriority("medium");
        onCreated?.();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Floating Action Button - positioned above chat widget and safe areas */}
      <button
        type="button"
        aria-label="New Task"
        onClick={() => {
          if (disabled) {
            toast({ title: "Unavailable", description: !user ? "Sign in to add tasks." : "Select a roadmap first." });
            return;
          }
          setOpen(true);
        }}
        className="fixed right-4 rounded-full glass-panel elev smooth hover-scale focus:outline-none focus:ring-2 focus:ring-ring"
        style={{
          zIndex: 'var(--z-modal)',
          bottom: `calc(env(safe-area-inset-bottom) + var(--compass-bottom, 12px) + var(--compass-size, 72px) + var(--gap, 12px) + var(--bubble-size, 56px) + var(--gap, 12px))`,
          width: 56,
          height: 56,
        }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick add task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="h-10"
              />
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={onSubmit} disabled={saving || !title.trim()}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
