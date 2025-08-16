import { create } from "zustand";
import { persist } from "zustand/middleware";

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

const calcXP = (cur: number, amount: number) => {
  const total = cur + Math.max(0, amount);
  const level = 1 + Math.floor(total / 100);
  return { xp: total, level };
};

type Note = { text: string; ts: number; mood?: string };

type ProgressState = {
  hp: number;
  mp: number;
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
  confidenceRep: () => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      hp: 100,
      mp: 100,
      xp: 0,
      level: 1,
      streak: 0,
      unlocked: new Set<string>(["hypno-calm-60", "focus-25", "browser-notion"]),
      completed: {},
      notes: [],
      awardXP: (amount) =>
        set((s) => {
          const { xp, level } = calcXP(s.xp, amount);
          return { xp, level };
        }),
      complete: (id) =>
        set((s) => {
          const { xp, level } = calcXP(s.xp, 10);
          return {
            completed: { ...s.completed, [id]: true },
            xp,
            level,
            hp: clamp(s.hp + 2),
            mp: clamp(s.mp + 2),
          };
        }),
      unlock: (id) => set((s) => ({ unlocked: new Set<string>([...s.unlocked, id]) })),
      addNote: (note) =>
        set((s) => {
          const last = s.notes[s.notes.length - 1];
          let streak = s.streak;
          const lastDay = last ? new Date(last.ts).toDateString() : null;
          const today = new Date().toDateString();
          if (lastDay !== today) streak += 1;
          const { xp, level } = calcXP(s.xp, 5);
          return {
            notes: [...s.notes, note],
            streak,
            xp,
            level,
            hp: clamp(s.hp + 1),
            mp: clamp(s.mp + 2),
          };
        }),
      confidenceRep: () =>
        set((s) => {
          const { xp, level } = calcXP(s.xp, 3);
          return {
            xp,
            level,
            hp: clamp(s.hp + 1),
            mp: clamp(s.mp + 3),
          };
        }),
    }),
    {
      name: "aurora-progress",
      partialize: (s) => ({ hp: s.hp, mp: s.mp, xp: s.xp, level: s.level, streak: s.streak, completed: s.completed, notes: s.notes, unlocked: Array.from(s.unlocked) }),
      version: 1,
      migrate: (p: any) => {
        if (!p?.state) return p;
        const st = p.state;
        st.unlocked = new Set<string>(st.unlocked || []);
        if (typeof st.hp !== "number") st.hp = 100;
        if (typeof st.mp !== "number") st.mp = 100;
        return p;
      },
    }
  )
);
