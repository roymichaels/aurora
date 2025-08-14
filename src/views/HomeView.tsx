import { Button } from "@/components/ui/button";
import { useViewNav } from "@/state/view";
import { Target, Waves, StickyNote, Mic, Pencil, type LucideIcon } from "lucide-react";
import type { ViewId } from "@/views/registry";
import React from "react";

function ProgressRing({ value }: { value: number }) {
  return (
    <div className="relative w-16 h-16">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(hsl(var(--primary)) ${value}%, hsl(var(--muted)/0.2) ${value}% 100%)`,
        }}
      />
      <div className="absolute inset-1 rounded-full bg-background/80 flex items-center justify-center text-sm font-medium">
        {value}%
      </div>
    </div>
  );
}

export default function HomeView() {
  const open = useViewNav();

  const mission = {
    title: "Ship Aurora MVP",
    description: "Finish core features and polish",
  };
  const nextCommitment = "Write Home view components";
  const progress = 42;
  const changes = [
    { id: 1, text: "Logged a voice note", time: "2h ago" },
    { id: 2, text: "Completed focus session", time: "Yesterday" },
  ];

  const pods: { id: ViewId; label: string; icon: LucideIcon }[] = [
    { id: "focus", label: "Focus", icon: Target },
    { id: "hypno", label: "Hypno", icon: Waves },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "voice", label: "Voice", icon: Mic },
  ];

  return (
    <div className="min-h-svh bg-slate-950 text-foreground px-4 py-6 space-y-6">
      {/* Mission card */}
      <div className="glass-panel rounded-xl p-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">{mission.title}</h2>
          <p className="text-sm opacity-80 leading-relaxed">{mission.description}</p>
        </div>
        <Button size="sm" variant="secondary" className="shrink-0" aria-label="Edit mission">
          <Pencil className="w-4 h-4" />
        </Button>
      </div>

      {/* Today bar */}
      <div className="glass-panel rounded-xl p-6 flex items-center gap-4">
        <ProgressRing value={progress} />
        <div className="flex-1">
          <div className="text-sm opacity-80">Next:</div>
          <div className="font-medium">{nextCommitment}</div>
        </div>
        <Button onClick={() => open("focus")}>Start Focus</Button>
      </div>

      {/* Quick pods */}
      <div className="flex gap-4">
        {pods.map((p) => (
          <button
            key={p.id}
            onClick={() => open(p.id)}
            className="flex-1 glass-panel rounded-xl p-4 flex flex-col items-center gap-2 hover-scale"
          >
            <p.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Recent changes */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="font-medium mb-4">Recent Changes</h3>
        <ul className="space-y-3 text-sm">
          {changes.map((c) => (
            <li key={c.id} className="flex items-center justify-between">
              <span>{c.text}</span>
              <span className="opacity-50 text-xs">{c.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

