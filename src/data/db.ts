import Dexie, { type Table } from "dexie";

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
  xp: number;
  streak: number;
  lastCheckIn?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Represents a gamification achievement earned by the user.
 */
export interface Achievement {
  id: string;
  name: string;
  description?: string | null;
  earned_at: string;
  created_at: string;
  updated_at: string;
}

export class AuroraDB extends Dexie {
  tasks!: Table<Task, string>;
  stats!: Table<Stat, string>;
  achievements!: Table<Achievement, string>;

  constructor() {
    super("aurora");
    this.version(1).stores({
      tasks: "&id,updated_at",
      stats: "&id",
      achievements: "&id,earned_at",
    });
  }
}

export const db = new AuroraDB();
