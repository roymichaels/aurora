import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useCurrentTask, type Task } from '@/state/task';
import { FocusTimer } from './FocusTimer';
import { useViewNav } from '@/state/view';

type Roadmap = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  status: string;
};


export default function LiveFocusView() {
  const { user, initializing } = useSupabaseAuth();
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const setCurrentTaskStore = useCurrentTask((s) => s.setCurrentTask);

  useEffect(() => {
    setCurrentTaskStore(task);
  }, [task, setCurrentTaskStore]);

  // Load roadmaps, active roadmap, and focused task
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initializing) return;
      setLoading(true);

      if (!user) {
        setActiveRoadmap(null);
        setTask(null);
        setRoadmaps([]);
        setLoading(false);
        return;
      }

      // All roadmaps
      const { data: rms, error: rmsErr } = await supabase
        .from('roadmaps')
        .select('id, title, description, color, status')
        .eq('user_id', user.id)
        .order('position', { ascending: true, nullsFirst: true });
      if (rmsErr) {
        console.error(rmsErr);
      }
      const list = (rms ?? []) as Roadmap[];
      setRoadmaps(list);

      // Active roadmap
      const active = list.find((r) => r.status === 'active') ?? null;
      setActiveRoadmap(active);

      // Current focus
      const { data: cf, error: cfErr } = await supabase
        .from('current_focus')
        .select('task_id, started_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cfErr) console.error(cfErr);

      let currentTask: Task | null = null;
      if (cf?.task_id) {
        const { data: t, error: tErr } = await supabase
          .from('tasks')
          .select(
            'id, title, description, due_at, roadmap_id, status, position'
          )
          .eq('user_id', user.id)
          .eq('id', cf.task_id)
          .maybeSingle();
        if (!tErr && t) currentTask = t as Task;
      }

      // If no focus task, or it doesn't match an active roadmap, pick next one
      if (
        (!currentTask || (active && currentTask.roadmap_id !== active.id)) &&
        active
      ) {
        const { data: next, error: nextErr } = await supabase
          .from('tasks')
          .select(
            'id, title, description, due_at, roadmap_id, status, position'
          )
          .eq('user_id', user.id)
          .eq('roadmap_id', active.id)
          .eq('status', 'todo')
          .order('position', { ascending: true, nullsFirst: true })
          .order('due_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })
          .limit(1);
        if (nextErr) {
          console.error(nextErr);
        }
        currentTask = (next?.[0] as Task) ?? null;

        // Persist focus
        const { error: upErr } = await supabase.from('current_focus').upsert({
          user_id: user.id,
          task_id: currentTask ? currentTask.id : null,
          started_at: new Date().toISOString(),
        });
        if (upErr) console.error(upErr);
      }

      if (!cancelled) {
        setTask(currentTask);
        setLoading(false);
      }

      // Progress handled by useRoadmapProgress hook
    })();

    return () => {
      cancelled = true;
    };
  }, [user, initializing, reloadKey]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('live-sync')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'roadmaps' },
        (payload) => {
          if (
            (payload.new as any)?.user_id === user.id ||
            (payload.old as any)?.user_id === user.id
          ) {
            setReloadKey((k) => k + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'current_focus' },
        (payload) => {
          if (
            (payload.new as any)?.user_id === user.id ||
            (payload.old as any)?.user_id === user.id
          ) {
            setReloadKey((k) => k + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'current_focus' },
        (payload) => {
          if ((payload.new as any)?.user_id === user.id) {
            setReloadKey((k) => k + 1);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const open = useViewNav();
  return (
    <section className="w-full h-full flex flex-col items-center justify-center p-6 gap-6">
      <Button variant="ghost" className="self-start" onClick={() => open('home')}>
        Back
      </Button>
      <h2 className="text-xl font-semibold">
        {task ? task.title : 'No task selected'}
      </h2>
      <FocusTimer />
    </section>
  );
}
