import { create } from "zustand";
import { awardXPRemote, upsertQuest, logEvent } from "@/integrations/db";
import { db } from "@/integrations/db";
import { getTonUser } from "@/integrations/auth";
import logger from "@/lib/logger";

export type Stats = { hp: number; mp: number; xp: number; level: number; streak: number };
export type ScheduleItem = { time: string; title: string };
export type GameState = {
  pos: { x: number; y: number };
  stats: Stats;
  mood: "Calm" | "Focused" | "Confident" | "Stressed" | "Tired";
  quests: Record<string, boolean>;
  mission: { title: string; description: string };
  today: { nextCommitment: string; schedule: ScheduleItem[] };
  setPos: (x: number, y: number) => void;
  setMood: (m: GameState["mood"]) => void;
  awardXP: (amount: number) => void;
  completeQuest: (id: string) => void;
  incStreak: () => void;
  resetDaily: () => void;
  setStats: (s: Partial<Stats>) => void;
  setMission: (m: GameState["mission"]) => void;
  setMissionTitle: (title: string) => void;
  setMissionDescription: (description: string) => void;
  setToday: (t: Partial<GameState["today"]>) => void;
  fetchStats: () => Promise<void>;
};

const defaults: GameState = {
  pos: { x: 160, y: 820 },
  stats: { hp: 78, mp: 62, xp: 35, level: 7, streak: 1 },
  mood: "Focused",
  quests: {},
  mission: { title: "", description: "" },
  today: { nextCommitment: "Focus session at 2 PM", schedule: [] },
  setPos() {},
  setMood() {},
  awardXP() {},
  completeQuest() {},
  incStreak() {},
  resetDaily() {},
  setStats() {},
  setMission() {},
  setMissionTitle() {},
  setMissionDescription() {},
  setToday() {},
  fetchStats: async () => {},
};

export const useGameStore = create<GameState>((set, get) => {
  let init = defaults;
  try {
    const raw = localStorage.getItem("mos.store");
    if (raw) init = { ...defaults, ...JSON.parse(raw) };
    const m = localStorage.getItem("mood.last");
    if (m) init.mood = (m || "Focused").charAt(0).toUpperCase() + (m || "Focused").slice(1).toLowerCase() as GameState["mood"]; // normalize
  } catch {}

  const persist = (partial: Partial<GameState>) => {
    set(partial as any);
    try {
      const next = { ...get(), ...partial } as GameState;
      localStorage.setItem("mos.store", JSON.stringify(next));
    } catch {}
  };

  return {
    ...init,
    fetchStats: async () => {
      const user = await getTonUser();
      if (!user) return;
      const { data: stats } = await db
        .from("user_stats")
        .select("total_xp, streak_count")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!stats) return;
      const total = stats.total_xp ?? 0;
      const xp = total % 100;
      const level = Math.floor(total / 100) + 1;
      const patch: Partial<Stats> = { xp, level };
      if (typeof stats.streak_count === "number") patch.streak = stats.streak_count;
      persist({ stats: { ...get().stats, ...patch } });
    },
    setPos: (x, y) => persist({ pos: { x, y } }),
    setMood: (m) => persist({ mood: m }),
    awardXP: (amount) => {
      const s = get().stats;
      const total = s.xp + amount;
      const addLevels = Math.floor(total / 100);
      const xp = total % 100;
      const level = s.level + addLevels;
      persist({ stats: { ...s, xp, level } });
      // Sparkle + light haptics
      try { if (navigator.vibrate) navigator.vibrate(12); } catch {}
      window.dispatchEvent(new CustomEvent("xp-sparkle", { detail: { amount } }));
      // Server sync (if signed-in)
      awardXPRemote("client_award", amount, { source: "store" })
        .then((res) => {
          const rows = Array.isArray(res) ? res : res ? [res as any] : [];
          const serverTotal = rows[0]?.total_xp;
          const serverStreak = rows[0]?.streak_count;
          if (typeof serverTotal === "number") {
            const newXp = serverTotal % 100;
            const newLevel = Math.floor(serverTotal / 100) + 1;
            const cur = get().stats;
            persist({ stats: { ...cur, xp: newXp, level: newLevel, streak: typeof serverStreak === "number" ? serverStreak : cur.streak } });
          }
        })
        .catch((e) => console.error("[store] awardXPRemote failed", e));
      // Analytics
      logEvent("xp_awarded", { amount }).catch((e) => logger.warn("[store] logEvent xp_awarded failed", e));
    },
    completeQuest: (id) => {
      persist({ quests: { ...get().quests, [id]: true } });
      // Server quest upsert (if signed-in)
      upsertQuest(id, true).catch((e) => console.error("[store] upsertQuest failed", e));
      // Analytics
      logEvent("quest_complete", { id }).catch((e) => logger.warn("[store] logEvent quest_complete failed", e));
    },
    incStreak: () => {
      const s = get().stats;
      persist({ stats: { ...s, streak: s.streak + 1 } });
    },
    resetDaily: () => persist({ quests: {} }),
    setStats: (s) => {
      const cur = get().stats;
      persist({ stats: { ...cur, ...s } });
    },
    setMission: (mission) => persist({ mission }),
    setMissionTitle: (title) => {
      const m = get().mission;
      persist({ mission: { ...m, title } });
    },
    setMissionDescription: (description) => {
      const m = get().mission;
      persist({ mission: { ...m, description } });
    },
    setToday: (t) => persist({ today: { ...get().today, ...t } }),
  };
});

export const selectMission = (s: GameState) => s.mission;
export const selectSetMission = (s: GameState) => s.setMission;
export const selectSetMissionTitle = (s: GameState) => s.setMissionTitle;
export const selectSetMissionDescription = (s: GameState) => s.setMissionDescription;
export const selectToday = (s: GameState) => s.today;
export const selectSetToday = (s: GameState) => s.setToday;

if (typeof window !== "undefined") {
  window.addEventListener("xp-total-update", (e: any) => {
    const total = e.detail?.total_xp;
    if (typeof total === "number") {
      const streak = e.detail?.streak;
      const xp = total % 100;
      const level = Math.floor(total / 100) + 1;
      const patch: Partial<Stats> = { xp, level };
      if (typeof streak === "number") patch.streak = streak;
      useGameStore.getState().setStats(patch);
    }
    // Also refresh from server for accuracy
    useGameStore.getState().fetchStats().catch(() => {});
  });
}
