import { useMemo } from "react";
import { useProgressStore } from "@/state/progress";

type Props = { node: { id: string; label: string }; onExit: () => void };

export default function AnalyzeRunner({ node, onExit }: Props) {
  const { notes } = useProgressStore();
  const summary = useMemo(() => {
    const txt = notes.slice(-5).map((n) => n.text).join("\n");
    if (!txt) return "No recent notes yet. Try capturing a quick thought.";
    const lines = txt.split(/\n+/).filter(Boolean);
    const top = lines.slice(0, 3).map((l, i) => `• ${l}`).join("\n");
    return `Recent highlights:\n${top}\n\nNext: focus on the most actionable item.`;
  }, [notes]);

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 max-w-[760px] mx-auto">
      <div className="os-bg" />
      <h1 className="text-2xl font-semibold mb-2">{node.label}</h1>
      <p className="opacity-80 mb-6">Lightweight AI analysis (stub)</p>

      <pre className="whitespace-pre-wrap rounded-lg p-4 bg-white/5 border border-white/10">{summary}</pre>

      <div className="mt-6 flex gap-3">
        <button className="btn" onClick={() => onExit()}>Back</button>
        <button className="btn" onClick={() => location.assign('/app/node/focus-25')}>Start a 25m Focus</button>
      </div>
    </main>
  );
}
