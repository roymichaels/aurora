import { Target, Waves, StickyNote, Mic, type LucideIcon } from "lucide-react";
import { useHUDActions } from "@/game/hud/useHUDActions";
import type { QuickActionKey } from "@/game/hud/hud.data";

const pods: { action: QuickActionKey; label: string; icon: LucideIcon }[] = [
  { action: "startFocus", label: "Focus", icon: Target },
  { action: "startHypnosis", label: "Hypno", icon: Waves },
  { action: "addNote", label: "Notes", icon: StickyNote },
  { action: "voiceNote", label: "Voice", icon: Mic },
];

export function QuickPodsRow() {
  const { run } = useHUDActions();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {pods.map((p) => (
        <button
          key={p.action}
          onClick={() => run(p.action)}
          className="glass-panel rounded-xl p-4 flex flex-col items-center gap-2 hover-scale"
        >
          <p.icon className="w-6 h-6" />
          <span className="text-sm font-medium">{p.label}</span>
        </button>
      ))}
    </div>
  );
}

export default QuickPodsRow;
