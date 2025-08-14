import { create } from "zustand";
import { registerQuickAction } from "@/components/live/QuickActionsBar";

interface QuickActionModalsState {
  tasksOpen: boolean;
  goalsOpen: boolean;
  analyticsOpen: boolean;
  settingsOpen: boolean;
  tasksRoadmapId: string | null;
  setTasksOpen: (open: boolean) => void;
  openTasks: (roadmapId?: string) => void;
  setGoalsOpen: (open: boolean) => void;
  openGoals: () => void;
  setAnalyticsOpen: (open: boolean) => void;
  openAnalytics: () => void;
  setSettingsOpen: (open: boolean) => void;
  openSettings: () => void;
}

export const useQuickActionModals = create<QuickActionModalsState>((set) => ({
  tasksOpen: false,
  goalsOpen: false,
  analyticsOpen: false,
  settingsOpen: false,
  tasksRoadmapId: null,
  setTasksOpen: (open) => set({ tasksOpen: open }),
  openTasks: (roadmapId) => set({ tasksOpen: true, tasksRoadmapId: roadmapId ?? null }),
  setGoalsOpen: (open) => set({ goalsOpen: open }),
  openGoals: () => set({ goalsOpen: true }),
  setAnalyticsOpen: (open) => set({ analyticsOpen: open }),
  openAnalytics: () => set({ analyticsOpen: true }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  openSettings: () => set({ settingsOpen: true }),
}));

registerQuickAction({
  id: "tasks",
  label: "Tasks",
  onTrigger: () => useQuickActionModals.getState().openTasks(),
});
registerQuickAction({
  id: "goals",
  label: "Goals",
  onTrigger: () => useQuickActionModals.getState().openGoals(),
});
registerQuickAction({
  id: "analytics",
  label: "Analytics",
  onTrigger: () => useQuickActionModals.getState().openAnalytics(),
});
registerQuickAction({
  id: "settings",
  label: "Settings",
  onTrigger: () => useQuickActionModals.getState().openSettings(),
});

