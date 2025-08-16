import { ListTodo, Target, ChartBar, Settings as SettingsIcon } from "lucide-react";
import { registerQuickAction } from "@/components/navigation/quickActions";
import { useUIStore } from "@/state/ui";

const uiStore = useUIStore.getState();

registerQuickAction({
  id: "tasks",
  label: "Tasks",
  icon: ListTodo,
  onClick: () => uiStore.openModal("tasks"),
});

registerQuickAction({
  id: "goals",
  label: "Goals",
  icon: Target,
  onClick: () => uiStore.openModal("goals"),
});

registerQuickAction({
  id: "analytics",
  label: "Analytics",
  icon: ChartBar,
  onClick: () => uiStore.openModal("analytics"),
});

registerQuickAction({
  id: "settings",
  label: "Settings",
  icon: SettingsIcon,
  onClick: () => uiStore.openModal("settings"),
});

export {}; // ensure this module is treated as a module
