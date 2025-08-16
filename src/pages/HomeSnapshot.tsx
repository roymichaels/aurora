import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGameStore, selectMission, selectSetMissionTitle, selectSetMissionDescription, selectToday } from "@/game/store";
import { QuickPodsRow } from "@/components/quick/QuickPodsRow";
import StatBars from "@/game/hud/StatBars";
import { useProgressStore } from "@/state/progress";

export default function HomeSnapshot() {
  const mission = useGameStore(selectMission);
  const setMissionTitle = useGameStore(selectSetMissionTitle);
  const setMissionDescription = useGameStore(selectSetMissionDescription);
  const { nextCommitment } = useGameStore(selectToday);
  const addNote = useProgressStore((s) => s.addNote);
  const confidenceRep = useProgressStore((s) => s.confidenceRep);
  const completeTask = useProgressStore((s) => s.complete);

  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.random();
      if (r < 0.33) addNote({ text: "mock", ts: Date.now() });
      else if (r < 0.66) confidenceRep();
      else completeTask(`mock-${Date.now()}`);
    }, 4000);
    return () => clearInterval(t);
  }, [addNote, confidenceRep, completeTask]);

  return (
    <div className="min-h-svh bg-background text-foreground p-4 space-y-6">
      <StatBars />
      <div className="glass-panel rounded-xl p-6 space-y-4">
        <Input
          value={mission.title}
          onChange={(e) => setMissionTitle(e.target.value)}
          placeholder="Mission title"
        />
        <Textarea
          value={mission.description}
          onChange={(e) => setMissionDescription(e.target.value)}
          placeholder="Mission description"
          rows={3}
        />
      </div>

      <div className="glass-panel rounded-xl p-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm opacity-80">Next:</div>
          <div className="font-medium">{nextCommitment}</div>
        </div>
      </div>

      <QuickPodsRow />
    </div>
  );
}
