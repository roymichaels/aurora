import { Target, Waves, StickyNote, Mic, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import FocusRunner from "@/nodes/FocusRunner";
import { useHUDActions } from "@/game/hud/useHUDActions";
import { Button } from "@/components/ui/button";

const pods: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "focus", label: "Focus", icon: Target },
  { key: "hypno", label: "Hypno", icon: Waves },
  { key: "journal", label: "Journal", icon: StickyNote },
  { key: "voice", label: "Voice", icon: Mic },
];

export function QuickPodsRow() {
  const { run } = useHUDActions();
  const [focusOpen, setFocusOpen] = useState(false);

  const handle = (key: string) => {
    if (key === "focus") {
      setFocusOpen(true);
      return;
    }
    if (key === "hypno") {
      window.dispatchEvent(new CustomEvent("open-hypno-panel"));
      return;
    }
    if (key === "journal") {
      run("addNote");
      return;
    }
    if (key === "voice") {
      run("voiceNote");
      return;
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {pods.map((p) => (
          <Button
            key={p.key}
            type="button"
            onClick={() => handle(p.key)}
            className="glass-panel rounded-xl p-4 flex flex-col items-center gap-2 hover-scale"
          >
            <p.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{p.label}</span>
          </Button>
        ))}
      </div>

      <Dialog open={focusOpen} onOpenChange={setFocusOpen}>
        <DialogContent className="sm:max-w-md p-0" onEscapeKeyDown={() => setFocusOpen(false)}>
          {focusOpen && (
            <FocusRunner
              node={{ id: "quick-focus", label: "Focus Session", minutes: 25 }}
              onExit={() => setFocusOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default QuickPodsRow;
