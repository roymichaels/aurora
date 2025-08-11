import type { RoadmapNode } from "@/data/roadmap";
import { Lock } from "lucide-react";

type Props = {
  node: RoadmapNode;
  completed?: boolean;
  unlocked?: boolean;
  onClick?: () => void;
};

export function NodeCard({ node, completed, unlocked, onClick }: Props) {
  const disabled = node.locked && !unlocked;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-full text-left p-4 rounded-xl border transition-all smooth",
        "bg-white/5 border-white/10 hover:bg-white/8",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:translate-y-[-2px]",
      ].join(" ")}
      aria-label={disabled ? "Locked node" : `Open ${node.label}`}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--panel))] border border-white/10">
          {iconFor(node.type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{node.label}</div>
          <div className="text-xs opacity-70 truncate">{node.subtitle ?? node.type}</div>
        </div>
        {completed ? (
          <span className="chip">Done</span>
        ) : disabled ? (
          <Lock className="w-4 h-4 opacity-80" />
        ) : (
          <span className="text-xs opacity-80">Start</span>
        )}
      </div>
    </button>
  );
}

function iconFor(t: RoadmapNode["type"]) {
  switch (t) {
    case "hypnosis":
      return <span>🌀</span>;
    case "focus":
      return <span>⏱️</span>;
    case "browser":
      return <span>🌐</span>;
    case "coach":
      return <span>🎧</span>;
    case "note":
      return <span>📝</span>;
    case "reward":
      return <span>🎁</span>;
    default:
      return <span>•</span>;
  }
}
