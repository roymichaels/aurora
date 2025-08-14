import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Volume2 } from "lucide-react";
import { useChat } from "@/state/chat";
import { useTextToSpeech } from "@/voice/useTextToSpeech";

export function AnchoredChatBar() {
  const { send, sending, messages } = useChat();
  const { speak } = useTextToSpeech();

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec: SpeechRecognition = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = (e.results as any)?.[0]?.[0]?.transcript as string;
      if (transcript) handleSend(transcript);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) rec.stop();
    else {
      setListening(true);
      rec.start();
    }
  };

  const handleSend = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    await send(text);
    setInput("");
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  const playLast = () => {
    if (lastAssistant) speak(lastAssistant.content);
  };

  return (
    <div
      className="fixed left-3 right-3"
      style={{
        bottom: `calc(var(--hud-h) + var(--dock-h) + var(--hud-gap) + env(safe-area-inset-bottom))`,
        zIndex: "var(--z-hud)",
      }}
    >
      <div className="pointer-events-auto glass-panel rounded-2xl p-2 elev flex items-center gap-2">
        <Button
          size="icon"
          variant={listening ? "secondary" : "ghost"}
          onClick={toggleListening}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
        >
          <Mic className="w-4 h-4" />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Ask anything…"
          aria-label="Message input"
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
        {lastAssistant && (
          <button
            type="button"
            onClick={playLast}
            className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center gap-1"
          >
            <Volume2 className="w-3 h-3" />
            Play
          </button>
        )}
      </div>
    </div>
  );
}
