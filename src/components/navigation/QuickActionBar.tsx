import { Mic } from "lucide-react";
import { useUIStore } from "@/state/ui";

const actions = [
  {
    id: "voice",
    label: "Voice",
    icon: Mic,
    onClick: () => useUIStore.getState().openModal("voice"),
  },
];

export function QuickActionBar() {
  if (!actions.length) return null;
  return (
    <div className="flex items-center gap-2">
      {actions.map(({ id, label, icon: Icon, onClick }) => (
        <button
          key={id}
          onClick={onClick}
          className="p-2 rounded-md hover:bg-accent"
          aria-label={label}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
