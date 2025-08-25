import { supabase } from '@/integrations/db';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  roadmap_id: string;
  status: string;
  position: number | null;
};

// Ensure exactly one active roadmap for a user by pausing others then activating the desired one.
export async function setActiveRoadmap(userId: string, roadmapId: string) {
  // Pause all other active roadmaps for the user
  await supabase
    .from('roadmaps')
    .update({ status: 'paused' })
    .eq('user_id', userId)
    .neq('id', roadmapId)
    .eq('status', 'active');

  // Activate the requested roadmap
  const { error } = await supabase
    .from('roadmaps')
    .update({ status: 'active' })
    .eq('user_id', userId)
    .eq('id', roadmapId);

  if (error) throw error;
}

// Fetch the next pending task for the given roadmap
export async function fetchNextTask(userId: string, roadmapId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, due_at, roadmap_id, status, position')
    .eq('user_id', userId)
    .eq('roadmap_id', roadmapId)
    .eq('status', 'todo')
    .order('position', { ascending: true, nullsFirst: true })
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return (data?.[0] as Task) ?? null;
}
