import { AuroraAgent } from "@/agent/AuroraAgent";
import { useEffect, useState } from "react";

export default function AgentRunner() {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState("");
  const [final, setFinal] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);

  useEffect(() => {
    const agent = new AuroraAgent({
      onListeningChange: setListening,
      onPartial: setPartial,
      onFinal: (t: string) => setFinal((a) => [...a, t]),
      onResponse: (t: string) => setResponses((a) => [...a, t]),
    });
    window.__agent = agent;
    return () => {
      try { agent.stopPTT(); } catch {}
    };
  }, []);

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 max-w-[760px] mx-auto">
      <div className="os-bg" />
      <h1 className="text-2xl font-semibold mb-2">Aurora Agent</h1>
      <p className="opacity-80 mb-6">Push-to-talk and simple tools</p>

      <div className="rounded-lg border border-white/10 p-4 bg-white/5">
        <div className="flex items-center gap-3 mb-3">
          <button className="btn" onClick={() => window.__agent?.startPTT()} aria-pressed={listening}>🎤 {listening ? 'Listening…' : 'Push-to-talk'}</button>
          {listening && <button className="btn" onClick={() => window.__agent?.stopPTT()}>Stop</button>}
        </div>
        {partial && <p className="text-sm opacity-80">{partial}</p>}
        <div className="mt-3 space-y-2">
          {final.map((t, i) => <p key={i} className="text-sm">You: {t}</p>)}
          {responses.map((t, i) => <p key={`r-${i}`} className="text-sm opacity-90">Aurora: {t}</p>)}
        </div>
      </div>
    </main>
  );
}
