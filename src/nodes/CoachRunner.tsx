import { useEffect, useState } from "react";
import { AuroraAgent } from "@/agent/AuroraAgent";

type Props = { node: { id: string; label: string }; onExit: () => void };

export default function CoachRunner({ node, onExit }: Props) {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [final, setFinal] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);

  useEffect(() => {
    const agent = new AuroraAgent({
      onListeningChange: setListening,
      onPartial: (t: string) => setPartial(t),
      onFinal: (t: string) => setFinal((arr) => [...arr, t]),
      onResponse: (t: string) => setResponses((arr) => [...arr, t]),
    });
    (window as any).__coachAgent = agent;
    return () => {
      try { agent.stopPTT(); } catch {}
    };
  }, []);

  const start = () => (window as any).__coachAgent?.startPTT();
  const stop = () => (window as any).__coachAgent?.stopPTT();

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 max-w-[760px] mx-auto">
      <div className="os-bg" />
      <h1 className="text-2xl font-semibold mb-2">{node.label}</h1>
      <p className="opacity-80 mb-6">Tell me what you’re working on. I’ll tailor your next steps.</p>

      <div className="rounded-lg border border-white/10 p-4 bg-white/5">
        <div className="flex items-center gap-3 mb-3">
          <button className="btn" onClick={start} aria-pressed={listening}>🎤 {listening ? 'Listening…' : 'Push-to-talk'}</button>
          {listening && <button className="btn" onClick={stop}>Stop</button>}
        </div>
        {partial && <p className="text-sm opacity-80">{partial}</p>}
        <div className="mt-3 space-y-2">
          {final.map((t, i) => <p key={i} className="text-sm">You: {t}</p>)}
          {responses.map((t, i) => <p key={`r-${i}`} className="text-sm opacity-90">Aurora: {t}</p>)}
        </div>
      </div>

      <div className="mt-6">
        <button className="btn" onClick={onExit}>Back</button>
      </div>
    </main>
  );
}
