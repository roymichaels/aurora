import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { MoodCheck } from "./MoodCheck";

interface Props {
  visible: boolean;
  onComplete: () => void;
}

type Task = { id: string; title: string };

export default function DailyKickoff({ visible, onComplete }: Props) {
  const { user } = useSupabaseAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    (async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("tasks")
        .select("id,title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!mounted) return;
      if (!error) setTasks((data ?? []) as Task[]);
    })();
    return () => { mounted = false; };
  }, [visible, user]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const name = useMemo(() => {
    const email = user?.email;
    if (!email) return "there";
    const first = email.split("@")[0].split(/[._-]/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }, [user]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 glass-panel rounded-xl p-6 w-full max-w-lg space-y-4 elev animate-fade-in">
        <header>
          <h1 className="text-xl font-semibold">{greeting}, {name} — what’s today’s focus?</h1>
        </header>
        <section className="space-y-2">
          <label className="text-sm text-muted-foreground">Select a task or goal</label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder={tasks.length ? "Choose an item" : "No recent tasks found"} />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
        <section>
          <MoodCheck />
        </section>
        <footer className="flex justify-end pt-2">
          <Button
            onClick={() => {
              try {
                const today = new Date().toISOString().slice(0, 10);
                localStorage.setItem("kickoff.last", today);
              } catch {}
              onComplete();
            }}
          >
            Start Day
          </Button>
        </footer>
      </div>
    </div>
  );
}
