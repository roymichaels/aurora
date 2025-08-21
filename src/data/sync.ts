import { supabase } from '@/integrations/supabase/client';
import { db, type Task, type Stat } from './db';

async function upsertIfNewer<T extends { id: string; updated_at: string }>(
  table: string,
  row: T,
) {
  const { data: existing } = await supabase
    .from(table)
    .select('updated_at')
    .eq('id', row.id)
    .maybeSingle();
  if (!existing || new Date(row.updated_at) > new Date(existing.updated_at)) {
    await supabase.from(table).upsert(row);
  }
}

export async function pushToSupabase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return;

  const tasks = await db.tasks.toArray();
  for (const t of tasks) {
    await upsertIfNewer<Task>('tasks', t);
  }

  const stats = await db.stats.toArray();
  for (const s of stats) {
    await upsertIfNewer<Stat>('user_stats', s);
  }
}

export async function pullFromSupabase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return;

  const { data: remoteTasks } = await supabase.from('tasks').select('*');
  if (remoteTasks) {
    for (const t of remoteTasks as Task[]) {
      const local = await db.tasks.get(t.id);
      if (!local || new Date(t.updated_at) > new Date(local.updated_at)) {
        await db.tasks.put(t);
      }
    }
  }

  const { data: remoteStats } = await supabase.from('user_stats').select('*');
  if (remoteStats) {
    for (const s of remoteStats as Stat[]) {
      const local = await db.stats.get(s.id);
      if (!local || new Date(s.updated_at) > new Date(local.updated_at)) {
        await db.stats.put(s);
      }
    }
  }
}

