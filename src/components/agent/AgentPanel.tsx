import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuroraAgent } from "@/agent/AuroraAgent";
import { useToast } from "@/components/ui/use-toast";

export default function AgentPanel() {
  const { toast } = useToast();
  const agentRef = useRef<AuroraAgent | null>(null);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [partial, setPartial] = useState("");
  const [messages, setMessages] = useState<Array<{ role: 'user'|'assistant'; text: string }>>([]);

  useEffect(() => {
    const agent = new AuroraAgent({
      onPartial: setPartial,
      onFinal: (t) => setMessages((m) => [...m, { role: 'user', text: t }]),
      onResponse: (t) => setMessages((m) => [...m, { role: 'assistant', text: t }]),
      onListeningChange: setListening,
      onSpeakingChange: setSpeaking,
      onError: (e) => toast({ title: 'Voice error', description: e?.message || String(e) })
    });
    agentRef.current = agent;
    return () => { agentRef.current = null; };
  }, [toast]);

  // Alt+Space toggles PTT
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        if (!listening) agentRef.current?.startPTT(); else agentRef.current?.stopPTT();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [listening]);

  const onHoldStart = () => agentRef.current?.startPTT();
  const onHoldEnd = () => agentRef.current?.stopPTT();

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

      {partial && (
        <div className="glass-panel rounded-xl p-3 text-sm text-muted-foreground">{partial}</div>
      )}

      <div className="grid gap-2">
        {messages.map((m, i) => (
          <div key={i} className={`glass-panel rounded-xl p-3 ${m.role === 'assistant' ? '' : ''}`}>
            <div className="text-[11px] text-muted-foreground mb-1">{m.role}</div>
            <div className="text-sm whitespace-pre-wrap">{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
