import { create } from "zustand";
import { db, TaskRecord, TaskStatus } from "@/data/db";
import { nanoid } from "nanoid";

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
  addTask: (
    goalId: string,
    sprintId: string,
    task: Task,
    persist?: boolean
  ) => void;
  markTaskDone: (taskId: string) => void;
}

export const useRoadmapStore = create<RoadmapState>((set, get) => {
  async function load() {
    const records = await db.tasks.toArray();
    const goalsMap = new Map<string, Goal>();
    records.forEach(({ goalId, goalTitle, sprintId, sprintTitle, ...task }) => {
      let goal = goalsMap.get(goalId);
      if (!goal) {
        goal = { id: goalId, title: goalTitle, sprints: [] };
        goalsMap.set(goalId, goal);
      }
      let sprint = goal.sprints.find((s) => s.id === sprintId);
      if (!sprint) {
        sprint = { id: sprintId, title: sprintTitle, tasks: [] };
        goal.sprints.push(sprint);
      }
      sprint.tasks.push(task);
    });
    set({ goals: Array.from(goalsMap.values()) });
  }

  void load();

  return {
    goals: [],
    setGoals: (goals) => {
      set({ goals });
    },
    addGoal: (goal) => {
      set({ goals: [...get().goals, goal] });
    },
    addSprint: (goalId, sprint) => {
      set({
        goals: get().goals.map((g) =>
          g.id === goalId ? { ...g, sprints: [...g.sprints, sprint] } : g
        ),
      });
    },
    addTask: (goalId, sprintId, task, persist = true) => {
      set({
        goals: get().goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                sprints: g.sprints.map((s) =>
                  s.id === sprintId ? { ...s, tasks: [...s.tasks, task] } : s
                ),
              }
            : g
        ),
      });
      if (persist) {
        const goal = get().goals.find((g) => g.id === goalId);
        const sprint = goal?.sprints.find((s) => s.id === sprintId);
        void db.tasks.put({
          ...task,
          goalId,
          goalTitle: goal?.title ?? "",
          sprintId,
          sprintTitle: sprint?.title ?? "",
        });
      }
    },
    markTaskDone: (taskId) => {
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
      });
      void db.tasks.update(taskId, { status: "done" });
    },
  };
});

export const flattenRoadmap = async (): Promise<TaskRecord[]> => {
  return await db.tasks.toArray();
};

export async function createTask(goalId: string, sprintId: string, title: string) {
  const task: Task = { id: `task-${nanoid()}`, title, status: "todo" };
  const state = useRoadmapStore.getState();
  const goal = state.goals.find((g) => g.id === goalId);
  const sprint = goal?.sprints.find((s) => s.id === sprintId);
  await db.tasks.put({
    ...task,
    goalId,
    goalTitle: goal?.title ?? "",
    sprintId,
    sprintTitle: sprint?.title ?? "",
  });
  state.addTask(goalId, sprintId, task, false);
  return task;
}

