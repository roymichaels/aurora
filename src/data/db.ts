import Dexie, { type Table } from 'dexie';

export interface Task {
  id: string;
  roadmap_id: string;
  title: string;
  description?: string | null;
  status: string;
  due_at?: string | null;
  completed_at?: string | null;
  position?: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Stat {
  id: string;
  level: number;
  total_xp: number;
  streak_count: number;
  last_active_date?: string | null;
  created_at: string;
  updated_at: string;
}

export class AuroraDB extends Dexie {
  tasks!: Table<Task, string>;
  stats!: Table<Stat, string>;

  constructor() {
    super('aurora');
    this.version(1).stores({
      tasks: '&id,updated_at',
      stats: '&id',
    });
  }
}

export const db = new AuroraDB();

