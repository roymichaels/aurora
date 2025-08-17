import {
  ListTodo,
  Target,
  ChartBar,
  Settings as SettingsIcon,
  BookOpen,
  Radio,
} from "lucide-react";
import { registerQuickAction } from "@/components/navigation/quickActions";
import { useUIStore } from "@/state/ui";

registerQuickAction({
  id: "journal",
  label: "Journal",
  icon: BookOpen,
  onClick: () => useUIStore.getState().openModal("journal"),
});

registerQuickAction({
  id: "live",
  label: "Live",
  icon: Radio,
  onClick: () => useUIStore.getState().openModal("live"),
});

registerQuickAction({
  id: "tasks",
  label: "Tasks",
  icon: ListTodo,
  onClick: () => useUIStore.getState().openModal("tasks"),
});

registerQuickAction({
  id: "goals",
  label: "Goals",
  icon: Target,
  onClick: () => useUIStore.getState().openModal("goals"),
});

registerQuickAction({
  id: "analytics",
  label: "Analytics",
  icon: ChartBar,
  onClick: () => useUIStore.getState().openModal("analytics"),
});

registerQuickAction({
  id: "settings",
  label: "Settings",
  icon: SettingsIcon,
  onClick: () => useUIStore.getState().openModal("settings"),
});

export {}; // ensure this module is treated as a module
