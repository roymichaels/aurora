import { useEffect, useState } from "react";
import { conversationService } from "@/services/conversation";
import { startListening, stopListening } from "@/voice/listenHelpers";
import { useVoiceStore } from "@/state/voice";

type Props = { node: { id: string; label: string }; onExit: () => void };

export default function CoachRunner({ node, onExit }: Props) {
  const listening = useVoiceStore((s) => s.isListening);
  const [state, setState] = useState(conversationService.getState());

  useEffect(() => conversationService.subscribe(setState), []);

  const start = () => startListening();
  const stop = () => stopListening();

  return (
    <main className="relative min-h-svh px-4 pt-10 pb-28 max-w-[760px] mx-auto">
      <div className="os-bg" />
      <h1 className="text-2xl font-semibold mb-2">{node.label}</h1>
      <p className="opacity-80 mb-6">Tell me what you’re working on. I’ll tailor your next steps.</p>

      <div className="rounded-lg border border-white/10 p-4 bg-white/5">
        <div className="flex items-center gap-3 mb-3">
          <button className="btn" onClick={start} aria-pressed={listening}>
            🎤 {listening ? 'Listening…' : 'Push-to-talk'}
          </button>
          {listening && <button className="btn" onClick={stop}>Stop</button>}
        </div>
        <div className="mt-3 space-y-2">
          {state.messages.map((m, i) => (
            <p key={i} className="text-sm">
              {m.role === 'assistant' ? 'Aurora: ' : 'You: '}{m.content}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <button className="btn" onClick={onExit}>Back</button>
      </div>
    </main>
  );
}
