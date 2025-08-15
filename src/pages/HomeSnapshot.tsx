import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useGameStore } from "@/game/store";
import { QuickPodsRow } from "@/components/quick/QuickPodsRow";

export default function HomeSnapshot() {
  const mission = useGameStore((s) => s.mission);
  const setMissionTitle = useGameStore((s) => s.setMissionTitle);
  const setMissionDescription = useGameStore((s) => s.setMissionDescription);
  const nextCommitment = useGameStore((s) => s.today.nextCommitment);

  return (
    <div className="min-h-svh bg-background text-foreground p-4 space-y-6">
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
