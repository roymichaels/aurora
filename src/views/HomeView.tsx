import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { useGameStore } from "@/game/store";

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
  const progress = useGameStore((s) => s.stats.xp);
  const mission = useGameStore((s) => s.mission);
  const setMissionTitle = useGameStore((s) => s.setMissionTitle);
  const setMissionDescription = useGameStore((s) => s.setMissionDescription);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mission);

  const nextCommitment = "Write Home view components";
  const changes = [
    { id: 1, text: "Logged a voice note", time: "2h ago" },
    { id: 2, text: "Completed focus session", time: "Yesterday" },
  ];

  const handleSave = () => {
    setMissionTitle(draft.title);
    setMissionDescription(draft.description);
    setEditing(false);
  };

  return (
    <>
      <div className="min-h-svh bg-slate-950 text-foreground px-4 py-6 space-y-6">
        <div className="flex justify-center">
          <AuroraSphere />
        </div>
        {/* Mission card */}
        <div className="glass-panel rounded-xl p-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            {editing ? (
              <>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  onBlur={() => setMissionTitle(draft.title)}
                  placeholder="Mission title"
                  className="mb-2"
                />
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  onBlur={() => setMissionDescription(draft.description)}
                  placeholder="Mission description"
                  rows={3}
                />
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-1">{mission.title}</h2>
                <p className="text-sm opacity-80 leading-relaxed">{mission.description}</p>
              </>
            )}
          </div>
          {editing ? (
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={handleSave}
            >
              Save
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              aria-label="Edit mission"
              onClick={() => {
                setDraft(mission);
                setEditing(true);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Today bar */}
        <div className="glass-panel rounded-xl p-6 flex items-center gap-4">
          <ProgressRing value={progress} />
          <div className="flex-1">
            <div className="text-sm opacity-80">Next:</div>
            <div className="font-medium">{nextCommitment}</div>
          </div>
        </div>

        {/* Quick pods */}
        {/* Quick actions moved to /app/actions */}

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

    </>
  );
}

