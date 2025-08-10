import { useEffect } from "react";
import { useProgressStore } from "@/state/progress";
import { EvolvingSphere } from "@/components/avatar/EvolvingSphere";

type Props = { node: { id: string; label: string }; onExit: () => void };

export default function RewardRunner({ node, onExit }: Props) {
  const { xp, level, awardXP, complete } = useProgressStore();

  useEffect(() => {
    awardXP(20, { activity: "reward", nodeId: node.id });
    complete(node.id);
  }, [awardXP, complete, node.id]);

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 grid place-items-center text-center">
      <div className="os-bg" />
      <div>
        <h1 className="text-2xl font-semibold mb-2">{node.label}</h1>
        <p className="opacity-80 mb-6">You earned +20 XP</p>
        <EvolvingSphere size={128} level={level} xpPct={(xp % 100)} mood="confident" />
        <div className="mt-6">
          <button className="btn" onClick={onExit}>Back</button>
        </div>
      </div>
    </main>
  );
}
