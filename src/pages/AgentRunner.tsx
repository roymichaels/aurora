import { useEffect, useState } from "react";
import { conversationService } from "@/services/conversation";
import { startListening, stopListening } from "@/voice/listenHelpers";
import { useVoiceStore } from "@/state/voice";

export default function AgentRunner() {
  const listening = useVoiceStore((s) => s.isListening);
  const [state, setState] = useState(conversationService.getState());

  useEffect(() => conversationService.subscribe(setState), []);

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 max-w-[760px] mx-auto">
      <div className="os-bg" />
      <h1 className="text-2xl font-semibold mb-2">Aurora Agent</h1>
      <p className="opacity-80 mb-6">Push-to-talk and simple tools</p>

      <div className="rounded-lg border border-white/10 p-4 bg-white/5">
        <div className="flex items-center gap-3 mb-3">
          <button className="btn" onClick={startListening} aria-pressed={listening}>
            🎤 {listening ? 'Listening…' : 'Push-to-talk'}
          </button>
          {listening && <button className="btn" onClick={stopListening}>Stop</button>}
        </div>
        <div className="mt-3 space-y-2">
          {state.messages.map((m, i) => (
            <p key={i} className="text-sm">
              {m.role === 'assistant' ? 'Aurora: ' : 'You: '}{m.content}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
