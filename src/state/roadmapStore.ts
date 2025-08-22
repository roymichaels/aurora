import { create } from "zustand";
import { db, type Task as DBTaskBase } from "@/data/db";

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
  addGoal: (goal: Goal) => Promise<void>;
  addSprint: (goalId: string, sprint: Sprint) => Promise<void>;
  addTask: (goalId: string, sprintId: string, task: Task) => Promise<void>;
  markTaskDone: (taskId: string) => Promise<void>;
}

interface DBTask extends DBTaskBase {
  goal_id: string;
  sprint_id: string;
  notes?: string | null;
  goal_title?: string;
  sprint_title?: string;
}

export const useRoadmapStore = create<RoadmapState>((set, get) => {
  return {
    goals: [],
    setGoals: (goals) => set({ goals }),
    addGoal: async (goal) => {
      set({ goals: [...get().goals, goal] });
      const now = new Date().toISOString();
      for (const sprint of goal.sprints) {
        for (const task of sprint.tasks) {
          const record: DBTask = {
            id: task.id,
            title: task.title,
            status: task.status,
            description: task.notes ?? null,
            goal_id: goal.id,
            sprint_id: sprint.id,
            notes: task.notes ?? null,
            goal_title: goal.title,
            sprint_title: sprint.title,
            roadmap_id: sprint.id,
            due_at: null,
            completed_at: task.status === "done" ? now : null,
            position: null,
            user_id: "local",
            created_at: now,
            updated_at: now,
          };
          await db.tasks.put(record);
        }
      }
    },
    addSprint: async (goalId, sprint) => {
      set({
        goals: get().goals.map((g) =>
          g.id === goalId ? { ...g, sprints: [...g.sprints, sprint] } : g
        ),
      });
      const now = new Date().toISOString();
      for (const task of sprint.tasks) {
        const record: DBTask = {
          id: task.id,
          title: task.title,
          status: task.status,
          description: task.notes ?? null,
          goal_id: goalId,
          sprint_id: sprint.id,
          notes: task.notes ?? null,
          goal_title: get().goals.find((g) => g.id === goalId)?.title,
          sprint_title: sprint.title,
          roadmap_id: sprint.id,
          due_at: null,
          completed_at: task.status === "done" ? now : null,
          position: null,
          user_id: "local",
          created_at: now,
          updated_at: now,
        };
        await db.tasks.put(record);
      }
    },
    addTask: async (goalId, sprintId, task) => {
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
      const now = new Date().toISOString();
      const goal = get().goals.find((g) => g.id === goalId);
      const sprint = goal?.sprints.find((s) => s.id === sprintId);
      const record: DBTask = {
        id: task.id,
        title: task.title,
        status: task.status,
        description: task.notes ?? null,
        goal_id: goalId,
        sprint_id: sprintId,
        notes: task.notes ?? null,
        goal_title: goal?.title,
        sprint_title: sprint?.title,
        roadmap_id: sprintId,
        due_at: null,
        completed_at: task.status === "done" ? now : null,
        position: null,
        user_id: "local",
        created_at: now,
        updated_at: now,
      };
      await db.tasks.put(record);
    },
    markTaskDone: async (taskId) => {
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
      const existing = (await db.tasks.get(taskId)) as DBTask | undefined;
      const now = new Date().toISOString();
      if (existing) {
        const record: DBTask = {
          ...existing,
          status: "done",
          completed_at: now,
          updated_at: now,
        };
        await db.tasks.put(record);
      }
    },
  };
});

function buildGoals(records: DBTask[]): Goal[] {
  const goalsMap = new Map<string, Goal>();
  records.forEach((r) => {
    const goalId = r.goal_id;
    const sprintId = r.sprint_id;
    if (!goalId || !sprintId) return;
    let goal = goalsMap.get(goalId);
    if (!goal) {
      goal = { id: goalId, title: r.goal_title ?? "", sprints: [] };
      goalsMap.set(goalId, goal);
    }
    let sprint = goal.sprints.find((s) => s.id === sprintId);
    if (!sprint) {
      sprint = { id: sprintId, title: r.sprint_title ?? "", tasks: [] };
      goal.sprints.push(sprint);
    }
    sprint.tasks.push({
      id: r.id,
      title: r.title,
      status: r.status as TaskStatus,
      notes: r.notes ?? r.description ?? undefined,
    });
  });
  return Array.from(goalsMap.values());
}

export function initializeRoadmapStore(records: DBTask[] = []) {
  useRoadmapStore.setState({ goals: buildGoals(records) });
}

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

export const flattenRoadmap = async (goals: Goal[]): Promise<Task[]> => {
  const records = (await db.tasks.toArray()) as unknown as DBTask[];
  const goalIds = new Set(goals.map((g) => g.id));
  return records
    .filter((r) => !r.goal_id || goalIds.has(r.goal_id))
    .map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status as TaskStatus,
      notes: r.notes ?? r.description ?? undefined,
    }));
};
