import { supabase } from '@/integrations/supabase/client';
import { db, type Task, type Stat } from './db';

type RemoteStat = Omit<Stat, 'lastCheckIn'> & { last_check_in?: string | null };

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
  if (!supabaseUrl || !supabaseAnonKey) return Promise.resolve();

  const tasks = await db.tasks.toArray();
  for (const t of tasks) {
    await upsertIfNewer<Task>('tasks', t);
  }

  const stats = await db.stats.toArray();
  for (const s of stats) {
    const { lastCheckIn, ...rest } = s;
    const remoteStat: RemoteStat = { ...rest, last_check_in: lastCheckIn };
    await upsertIfNewer<RemoteStat>('user_stats', remoteStat);
  }
}

export async function pullFromSupabase() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return Promise.resolve();

  const { data: remoteTasks } = await supabase.from('tasks').select('*');
  if (remoteTasks) {
    for (const t of remoteTasks as Task[]) {
      const local = await db.tasks.get(t.id);
      if (!local || new Date(t.updated_at) > new Date(local.updated_at)) {
        await db.tasks.put(t);
      }
    }
  }

  const { data: remoteStats } = await supabase
    .from('user_stats')
    .select('*');
  if (remoteStats) {
    for (const r of remoteStats as RemoteStat[]) {
      const { last_check_in, ...rest } = r;
      const stat: Stat = { ...rest, lastCheckIn: last_check_in };
      const local = await db.stats.get(stat.id);
      if (!local || new Date(stat.updated_at) > new Date(local.updated_at)) {
        await db.stats.put(stat);
      }
    }
  }
}

