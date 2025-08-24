import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTonSession } from "@/hooks/useTonSession";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "@/hooks/use-toast";
import { useRoadmapProgress } from "@/hooks/useRoadmapProgress";
import { scheduleTaskTriggers } from "@/lib/triggers";
import { requirePro } from "@/state/featureFlags";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  roadmap_id: string;
  status: string;
  position: number | null;
};

export default function TasksManager({ roadmapId }: { roadmapId: string }) {
  const { user } = useTonSession();
  if (!requirePro()) {
    return (
      <div className="p-4 text-center space-y-2">
        <p className="text-sm text-muted-foreground">Task management is a Pro feature.</p>
        <Button onClick={() => (window.location.href = '/plan')}>Upgrade</Button>
      </div>
    );
  }
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState<string>("");
  const busy = useMemo(()=> loading, [loading]);
  const [showComposer, setShowComposer] = useLocalStorage<boolean>(`tasks.composer.${roadmapId}`, false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDue, setEditDue] = useState<string>("");
  const { percent } = useRoadmapProgress(user?.id ?? null, roadmapId);

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, description, due_at, roadmap_id, status, position, created_at")
      .eq("user_id", user.id)
      .eq("roadmap_id", roadmapId)
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as any[] as Task[];
    // Ensure sequential positions if missing
    let needsUpdate = false;
    const normalized = list.map((t, idx) => {
      if (t.position == null) { needsUpdate = true; return { ...t, position: (idx+1) }; }
      return t;
    });
    setTasks(normalized);
    scheduleTaskTriggers(normalized, { email: user?.email ?? undefined });
    if (needsUpdate) {
      // Persist positions
      await Promise.all(normalized.map((t) => supabase.from("tasks").update({ position: t.position }).eq("id", t.id)));
    }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user, roadmapId]);

  const formatLocalInput = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth()+1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${y}-${m}-${day}T${h}:${min}`;
  };

  const startEdit = (t: Task) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDue(t.due_at ? formatLocalInput(t.due_at) : "");
  };

  const saveEdit = async () => {
    if (!user || !editingId) return;
    const title = editTitle.trim();
    const due_at = editDue ? new Date(editDue).toISOString() : null;
    const { error } = await supabase.from("tasks").update({ title, due_at }).eq("id", editingId).eq("user_id", user.id);
    if (error) console.error(error);
    setEditingId(null);
    await fetchTasks();
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const addTask = async () => {
    if (!user) { toast({ title: "Sign in required", description: "Connect Supabase to add tasks." }); return; }
    if (!title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      roadmap_id: roadmapId,
      title: title.trim(),
      description: description.trim() || null,
      due_at: due ? new Date(due).toISOString() : null,
      status: "todo",
      position: (tasks.length ? (tasks[tasks.length-1].position ?? tasks.length) + 1 : 1),
    });
    if (error) { console.error(error); toast({ title: "Error", description: "Could not add task." }); }
    else { setTitle(""); setDescription(""); setDue(""); toast({ title: "Task added", description: "Keep building your roadmap." }); }
    await fetchTasks();
  };

  const updateStatus = async (taskId: string, status: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    const update: any = { status };
    if (status === "done") update.completed_at = now; else update.completed_at = null;
    const { error } = await supabase.from("tasks").update(update).eq("id", taskId).eq("user_id", user.id);
    if (error) console.error(error);
    await fetchTasks();
  };

  const renameTask = async (taskId: string) => {
    const t = tasks.find(t=> t.id===taskId); if (!t) return;
    const next = window.prompt("Rename task", t.title);
    if (next && next.trim() && next.trim() !== t.title) {
      const { error } = await supabase.from("tasks").update({ title: next.trim() }).eq("id", taskId);
      if (error) console.error(error);
      await fetchTasks();
    }
  };

  const removeTask = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) console.error(error);
    await fetchTasks();
  };

  const move = async (taskId: string, dir: -1 | 1) => {
    const idx = tasks.findIndex(t=> t.id===taskId); if (idx<0) return;
    const otherIdx = idx + dir; if (otherIdx < 0 || otherIdx >= tasks.length) return;
    const a = tasks[idx]; const b = tasks[otherIdx];
    const aPos = a.position ?? idx+1; const bPos = b.position ?? otherIdx+1;
    // swap
    const { error: e1 } = await supabase.from("tasks").update({ position: bPos }).eq("id", a.id);
    const { error: e2 } = await supabase.from("tasks").update({ position: aPos }).eq("id", b.id);
    if (e1) console.error(e1); if (e2) console.error(e2);
    await fetchTasks();
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Tasks</div>
          <div className="text-xs text-muted-foreground">{Math.round(percent)}%</div>
        </div>
        <Button variant="soft" onClick={()=> setShowComposer(v=> !v)}>
          {showComposer ? "Close" : "+ New Task"}
        </Button>
      </div>
      {/* Inline composer (collapsed by default) */}
      {showComposer && (
        <div className="rounded-lg border border-border p-3 grid gap-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Task title" value={title} onChange={(e)=> setTitle(e.target.value)} className="h-10" />
            <Input type="datetime-local" value={due} onChange={(e)=> setDue(e.target.value)} className="h-10" />
          </div>
          <Textarea placeholder="Description (optional)" value={description} onChange={(e)=> setDescription(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=> { setShowComposer(false); setTitle(""); setDescription(""); setDue(""); }}>Cancel</Button>
            <Button onClick={async ()=> { await addTask(); setShowComposer(false); }}>Add</Button>
          </div>
        </div>
      )}

      <div className="grid gap-2">
        {tasks.length === 0 && <div className="text-sm text-muted-foreground">No tasks yet.</div>}
        {tasks.map((t, idx)=> (
          <div key={t.id} className="rounded-lg border border-border p-2 grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {editingId === t.id ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input value={editTitle} onChange={(e)=> setEditTitle(e.target.value)} placeholder="Task title" className="h-9" />
                    <Input type="datetime-local" value={editDue} onChange={(e)=> setEditDue(e.target.value)} className="h-9" />
                  </div>
                ) : (
                  <div>
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    {t.due_at && <div className="text-xs text-muted-foreground">Due: {new Date(t.due_at).toLocaleString()}</div>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={()=> move(t.id, -1)} disabled={idx===0}>Up</Button>
                <Button size="sm" variant="outline" onClick={()=> move(t.id, 1)} disabled={idx===tasks.length-1}>Down</Button>
                {editingId === t.id ? (
                  <>
                    <Button size="sm" variant="secondary" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={()=> startEdit(t)}>Edit</Button>
                )}
                <Button size="sm" variant="destructive" onClick={()=> removeTask(t.id)}>Delete</Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Status</div>
              <Select value={t.status} onValueChange={(v)=> updateStatus(t.id, v)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="doing">Doing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {t.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{t.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
