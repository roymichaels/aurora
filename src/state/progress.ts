import { create } from "zustand";
import { persist } from "zustand/middleware";

type Note = { text: string; ts: number; mood?: string };

type ProgressState = {
  xp: number;
  level: number;
  streak: number;
  unlocked: Set<string>;
  completed: Record<string, boolean>;
  notes: Note[];
  awardXP: (amount: number, meta?: any) => void;
  complete: (id: string) => void;
  unlock: (id: string) => void;
  addNote: (note: Note) => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      unlocked: new Set<string>(["hypno-calm-60", "focus-25", "browser-notion"]),
      completed: {},
      notes: [],
      awardXP: (amount) => set((s) => {
        const total = s.xp + Math.max(0, amount);
        const level = 1 + Math.floor(total / 100);
        return { xp: total, level };
      }),
      complete: (id) => set((s) => ({ completed: { ...s.completed, [id]: true } })),
      unlock: (id) => set((s) => ({ unlocked: new Set<string>([...s.unlocked, id]) })),
      addNote: (note) =>
        set((s) => {
          const last = s.notes[s.notes.length - 1];
          let streak = s.streak;
          const lastDay = last ? new Date(last.ts).toDateString() : null;
          const today = new Date().toDateString();
          if (lastDay !== today) streak += 1;
          return { notes: [...s.notes, note], streak };
        }),
    }),
    {
      name: "aurora-progress",
      partialize: (s) => ({ xp: s.xp, level: s.level, streak: s.streak, completed: s.completed, notes: s.notes, unlocked: Array.from(s.unlocked) }),
      version: 1,
      migrate: (p: any) => {
        if (!p?.state) return p;
        const st = p.state;
        st.unlocked = new Set<string>(st.unlocked || []);
        return p;
      },
    }
  )
);
