import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { conversationService } from "@/services/conversation";
import { startListening, stopListening } from "@/voice/listenHelpers";
import { useVoiceStore } from "@/state/voice";

export default function AgentPanel() {
  const [state, setState] = useState(conversationService.getState());
  const listening = useVoiceStore((s) => s.isListening);
  const speaking = useVoiceStore((s) => s.isSpeaking);

  useEffect(() => conversationService.subscribe(setState), []);

  // Alt+Space toggles PTT
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        if (!listening) startListening(); else stopListening();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [listening]);

  const onHoldStart = () => startListening();
  const onHoldEnd = () => stopListening();

  const { messages } = state;

  return (
    <div className="max-w-3xl mx-auto grid gap-4">
      <section className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {listening ? 'Listening… (Alt+Space to stop)' : 'Idle (Alt+Space to talk)'}
            {speaking ? ' · Speaking' : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onMouseDown={onHoldStart}
              onMouseUp={onHoldEnd}
              onMouseLeave={onHoldEnd}
              onTouchStart={onHoldStart}
              onTouchEnd={onHoldEnd}
            >
              Hold to Talk
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.dispatchEvent(new CustomEvent('mos', { detail: { type: 'openAgent' } }))}
            >
              Open
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-2" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`glass-panel rounded-xl p-3 ${m.role === 'assistant' ? '' : ''}`}>
            <div className="text-[11px] text-muted-foreground mb-1">{m.role}</div>
            <div className="text-sm whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
      </div>
      <div aria-live="polite" className="sr-only">
        {messages.length > 0 ? messages[messages.length - 1].text : ""}
      </div>
    </div>
  );
}
