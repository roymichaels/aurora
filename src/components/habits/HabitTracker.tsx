import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useHabitStore, Habit, isCompleted, getStreak } from "@/state/habits";

export default function HabitTracker() {
  const { habits, toggleHabit } = useHabitStore();
  const daily = habits.filter((h) => h.frequency === "daily");
  const weekly = habits.filter((h) => h.frequency === "weekly");

  const renderHabit = (habit: Habit) => {
    const done = isCompleted(habit);
    const streak = getStreak(habit);
    return (
      <motion.button
        key={habit.id}
        whileTap={{ scale: 0.95 }}
        onClick={() => toggleHabit(habit.id)}
        className={`flex items-center w-full p-2 rounded-md border border-border text-left mb-2 transition-colors ${
          done ? "bg-green-500 text-white" : "bg-background"
        }`}
      >
        <span>{habit.title}</span>
        <span className="ml-auto flex items-center gap-1 text-sm">
          <span>🔥 {streak}</span>
          {done && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check className="w-4 h-4" />
            </motion.span>
          )}
        </span>
      </motion.button>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Daily Habits</h3>
        {daily.length === 0 && (
          <p className="text-sm text-muted-foreground">No daily habits.</p>
        )}
        {daily.map(renderHabit)}
      </div>
      <div>
        <h3 className="font-medium mb-2">Weekly Habits</h3>
        {weekly.length === 0 && (
          <p className="text-sm text-muted-foreground">No weekly habits.</p>
        )}
        {weekly.map(renderHabit)}
      </div>
    </div>
  );
}
