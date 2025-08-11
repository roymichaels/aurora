import { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CurrentFocusCard } from './CurrentFocusCard';
import { QuickActionsBar } from './QuickActionsBar';
import HeroCard from './HeroCard';
import { MoodCarousel } from './MoodCarousel';
import ActionDock from './ActionDock';
import PreviewCards from './PreviewCards';

import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { PanelHeaderUnified } from '@/components/layout/PanelHeaderUnified';
import QuickAddTaskFAB from '@/components/tasks/QuickAddTaskFAB';
import { StreakBadge } from '@/components/live/StreakBadge';
import { setActiveRoadmap, fetchNextTask } from '@/modules/roadmaps';

type Roadmap = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  status: string;
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

export default function LiveFocusView({
  onManageRoadmaps,
}: {
  onManageRoadmaps?: () => void;
}) {
  const { user, initializing } = useSupabaseAuth();
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const { percent, refresh: refreshProgress } = useRoadmapProgress(
    user?.id ?? null,
    activeRoadmap?.id ?? null
  );
  const [reloadKey, setReloadKey] = useState(0);

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

  const switchActive = async (roadmapId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Connect Supabase to manage roadmaps.',
      });
      return;
    }
    try {
      await setActiveRoadmap(user.id, roadmapId);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Could not activate roadmap.' });
      return;
    }
    toast({ title: 'Activated', description: 'Roadmap set as live.' });
    // Reload minimal state
    const newActive = roadmaps.find((r) => r.id === roadmapId) ?? null;
    if (newActive) newActive.status = 'active';
    setActiveRoadmap(newActive);
    // Force pick next task for new roadmap
    if (newActive) {
      const nextTask = await fetchNextTask(user.id, newActive.id);
      setTask(nextTask);
      await supabase.from('current_focus').upsert({
        user_id: user.id,
        task_id: nextTask ? nextTask.id : null,
        started_at: new Date().toISOString(),
      });
    }
  };

  const handleAdvance = async () => {
    if (!user || !activeRoadmap) { setTask(null); return; }
    const nextTask = await fetchNextTask(user.id, activeRoadmap.id);
    setTask(nextTask);
    await supabase.from('current_focus').upsert({
      user_id: user.id,
      task_id: nextTask ? nextTask.id : null,
      started_at: new Date().toISOString(),
    });
    toast({
      title: nextTask ? 'Great job!' : 'Well done',
      description: nextTask ? `Next up: ${nextTask.title}` : 'No more tasks in this roadmap.',
    });
    refreshProgress();
  };

  return (
    <section className="w-full h-full flex flex-col">
      <PanelHeaderUnified
        title="Live"
        subtitle="Focus on one thing, right now."
        actions={
          <>
            <StreakBadge />
            <select
              className="text-sm bg-background border border-border rounded px-3 py-2"
              value={activeRoadmap?.id ?? ''}
              onChange={(e) => switchActive(e.target.value)}
            >
              <option value="" disabled>
                Select roadmap…
              </option>
              {roadmaps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} {r.status === 'active' ? '•' : ''}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => {
                if (onManageRoadmaps) onManageRoadmaps();
                else
                  toast({
                    title: 'Roadmaps',
                    description:
                      'Manage your roadmaps and tasks in the Control panel for now.',
                  });
              }}
            >
              Manage
            </Button>
          </>
        }
      />

      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 p-6 max-w-3xl mx-auto w-full">
        {!user && !initializing && (
          <div className="glass-panel rounded-xl p-6 text-center">
            <div className="text-sm text-muted-foreground">
              Sign in to enable Live Focus, background sound, and quick capture.
            </div>
          </div>
        )}

        <HeroCard taskTitle={task?.title ?? null} />

        <div
          key={task?.id ?? 'none'}
          className="animate-in fade-in-50 duration-300"
        >
          <CurrentFocusCard
            activeRoadmap={activeRoadmap}
            task={task}
            progressPercent={percent}
            onAdvance={handleAdvance}
          />
        </div>

        <QuickActionsBar currentTask={task} />

        <MoodCarousel />
        <PreviewCards progressPercent={percent} />
      </main>
      <ActionDock
        onStart={() =>
          toast({
            title: 'Focus Session',
            description: 'Starting focus mode soon.',
          })
        }
      />
    </section>
  );
}
