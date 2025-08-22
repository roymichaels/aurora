import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db, type Task as DBTask } from "@/data/db";

export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  notes?: string;
}

export interface Sprint {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Goal {
  id: string;
  title: string;
  sprints: Sprint[];
}

interface RoadmapState {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  addSprint: (goalId: string, sprint: Sprint) => void;
  addTask: (goalId: string, sprintId: string, task: Task) => void;
  markTaskDone: (taskId: string) => void;
}

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set, get) => ({
      goals: [],
      setGoals: (goals) => set({ goals }),
      addGoal: (goal) => set({ goals: [...get().goals, goal] }),
      addSprint: (goalId, sprint) =>
        set({
          goals: get().goals.map((g) =>
            g.id === goalId ? { ...g, sprints: [...g.sprints, sprint] } : g
          ),
        }),
      addTask: (goalId, sprintId, task) =>
        set({
          goals: get().goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  sprints: g.sprints.map((s) =>
                    s.id === sprintId
                      ? { ...s, tasks: [...s.tasks, task] }
                      : s
                  ),
                }
              : g
          ),
        }),
      markTaskDone: (taskId) =>
        set({
          goals: get().goals.map((g) => ({
            ...g,
            sprints: g.sprints.map((s) => ({
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === taskId ? { ...t, status: "done" } : t
              ),
            })),
          })),
        }),
    }),
    {
      name: "aurora-roadmap",
    }
  )
);

export async function createTask(
  goalId: string,
  sprintId: string,
  task: Task
) {
  const now = new Date().toISOString();
  const dbTask: DBTask = {
    id: task.id,
    roadmap_id: goalId,
    title: task.title,
    description: task.notes ?? null,
    status: task.status,
    user_id: "local",
    created_at: now,
    updated_at: now,
  };
  await db.tasks.put(dbTask);
  useRoadmapStore.getState().addTask(goalId, sprintId, task);
}

export const flattenRoadmap = (goals: Goal[]): Task[] => {
  const tasks: Task[] = [];
  goals.forEach((g) =>
    g.sprints.forEach((s) => {
      tasks.push(...s.tasks);
    })
  );
  return tasks;
};
