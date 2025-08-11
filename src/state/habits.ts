import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, startOfWeek, addDays, addWeeks } from "date-fns";

export type Habit = {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  completions: Record<string, boolean>;
};

type HabitState = {
  habits: Habit[];
  setHabits: (
    list: { id: string; title: string; frequency: "daily" | "weekly" }[]
  ) => void;
  toggleHabit: (id: string, date?: Date) => void;
};

const keyFor = (habit: Habit, date: Date) =>
  habit.frequency === "daily"
    ? format(date, "yyyy-MM-dd")
    : format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      setHabits: (list) =>
        set((state) => {
          const map = state.habits.reduce<Record<string, Habit>>((acc, h) => {
            acc[h.id] = h;
            return acc;
          }, {});
          const habits = list.map((h) =>
            map[h.id]
              ? { ...map[h.id], title: h.title, frequency: h.frequency }
              : { ...h, completions: {} }
          );
          return { habits };
        }),
      toggleHabit: (id, date = new Date()) =>
        set((state) => {
          const habit = state.habits.find((h) => h.id === id);
          if (!habit) return state;
          const key = keyFor(habit, date);
          const completions = { ...habit.completions };
          if (completions[key]) delete completions[key];
          else completions[key] = true;
          const habits = state.habits.map((h) =>
            h.id === id ? { ...h, completions } : h
          );
          return { habits };
        }),
    }),
    { name: "aurora-habits" }
  )
);

export const isCompleted = (habit: Habit, date = new Date()) =>
  !!habit.completions[keyFor(habit, date)];

export const getStreak = (habit: Habit) => {
  let streak = 0;
  let current = new Date();
  while (habit.completions[keyFor(habit, current)]) {
    streak++;
    current =
      habit.frequency === "daily"
        ? addDays(current, -1)
        : addWeeks(current, -1);
  }
  return streak;
};
