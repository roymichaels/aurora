import { create } from 'zustand';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  roadmap_id: string;
  status: string;
  position: number | null;
};

type TaskState = {
  currentTask: Task | null;
  setCurrentTask: (task: Task | null) => void;
};

export const useCurrentTask = create<TaskState>((set) => ({
  currentTask: null,
  setCurrentTask: (task) => set({ currentTask: task }),
}));
