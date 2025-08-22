import Dexie, { Table } from 'dexie';

export type TaskStatus = "todo" | "doing" | "done";

export interface TaskRecord {
  id: string;
  title: string;
  status: TaskStatus;
  notes?: string;
  goalId: string;
  goalTitle: string;
  sprintId: string;
  sprintTitle: string;
}

class RoadmapDB extends Dexie {
  tasks!: Table<TaskRecord, string>;

  constructor() {
    super('aurora');
    this.version(1).stores({
      tasks: 'id, goalId, sprintId, status'
    });
  }
}

export const db = new RoadmapDB();
