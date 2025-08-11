import { UserProfile } from "@/data/profile";
import { MasterPlan, Goal, Task, createGoal } from "./masterPlan";

// Utility to generate unique ids without external deps
function uid(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function parseList(value?: string): string[] {
  return value ? value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];
}

function diffLists(oldList: string[], newList: string[]) {
  const added = newList.filter((n) => !oldList.includes(n));
  const removed = oldList.filter((o) => !newList.includes(o));
  return { added, removed };
}

export interface ProfileDiff {
  goals: { added: string[]; removed: string[] };
  habits: { added: string[]; removed: string[] };
}

export function diffUserProfile(oldProfile: UserProfile, newProfile: UserProfile): ProfileDiff {
  const oldGoals = parseList(oldProfile.goals);
  const newGoals = parseList(newProfile.goals);
  const oldHabits = parseList(oldProfile.habits);
  const newHabits = parseList(newProfile.habits);
  return {
    goals: diffLists(oldGoals, newGoals),
    habits: diffLists(oldHabits, newHabits),
  };
}

function generateGoalStructure(name: string): Goal {
  return createGoal(
    name,
    [`${name} annual milestone`],
    [`${name} quarterly milestone`],
    [
      {
        id: uid(),
        title: `Daily progress for ${name}`,
        frequency: "daily",
      },
    ],
    [
      {
        id: uid(),
        title: `Weekly review of ${name}`,
        frequency: "weekly",
      },
    ],
  );
}

function generateHabitTask(title: string): Task {
  return { id: uid(), title, frequency: "daily" };
}

export function updatePlan(
  oldProfile: UserProfile,
  newProfile: UserProfile,
  plan: MasterPlan,
): MasterPlan {
  const diff = diffUserProfile(oldProfile, newProfile);

  const snapshot = JSON.parse(JSON.stringify({ ...plan, plan_versions: undefined })) as MasterPlan;
  const versions = plan.plan_versions ? [...plan.plan_versions, snapshot] : [snapshot];

  const goals = plan.goals.filter((g) => !diff.goals.removed.includes(g.name));
  for (const g of diff.goals.added) {
    goals.push(generateGoalStructure(g));
  }

  const habits = (plan.habits ?? []).filter((h) => !diff.habits.removed.includes(h.title));
  for (const h of diff.habits.added) {
    habits.push(generateHabitTask(h));
  }

  return { goals, habits, plan_versions: versions };
}

