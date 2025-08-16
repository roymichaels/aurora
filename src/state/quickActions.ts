import { registerQuickAction } from "@/components/live/QuickActionsBar";
import { useUIStore } from "@/state/ui";

registerQuickAction({
  id: "tasks",
  label: "Tasks",
  onTrigger: () => useUIStore.getState().openModal("tasks"),
});

registerQuickAction({
  id: "goals",
  label: "Goals",
  onTrigger: () => useUIStore.getState().openModal("goals"),
});

registerQuickAction({
  id: "analytics",
  label: "Analytics",
  onTrigger: () => useUIStore.getState().openModal("analytics"),
});

registerQuickAction({
  id: "settings",
  label: "Settings",
  onTrigger: () => useUIStore.getState().openModal("settings"),
});

export {}; // ensure this module is treated as a module
