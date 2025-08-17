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
import { supabase } from "@/integrations/supabase/client";

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
  onClick: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let roadmapId: string | undefined;

    if (user) {
      const { data } = await supabase
        .from("roadmaps")
        .select("id, status")
        .eq("user_id", user.id)
        .order("position", { ascending: true, nullsFirst: true });

      if (data) {
        type Roadmap = { id: string; status: string };
        const list = data as Roadmap[];
        const active = list.find((r) => r.status === "active");
        roadmapId = active?.id ?? list[0]?.id;
      }
    }

    useUIStore.getState().openModal("tasks", { roadmapId });
  },
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
